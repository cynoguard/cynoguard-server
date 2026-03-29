import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getBotChallenge, updateStats } from "../../../services/bot-detection.service.js";
import { verifyJWT } from "../../../services/global.service.js";
import type { verifyChallengeBodyType, verifyHumanBodyType, verifyHumanResponseType } from "../../../types/bot-detection.js";

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

export const verifyHuman = async (
  request: FastifyRequest<{ Body: verifyHumanBodyType }>,
  reply: FastifyReply
) => {
  const signals: verifyHumanBodyType = request.body;
  const { cyno } = request;
  const rule        = cyno?.rule;
  const strictness  = rule?.strictness  ?? "balanced";
  const persistence = rule?.persistence ?? 48;
  const ruleSignals = rule?.signals     ?? {};

  try {
    // ── WHITELISTED — skip all detection ──────────────────
    if (cyno?.whitelisted) {
      const detectionId = uuidv4();

      const cookieToken = jwt.sign(
        {
          assessment:   "passed",
          whitelisted:  true,
          matchedEntry: cyno.matchedEntry?.name ?? "unknown",
          iat_ms:       Date.now(),
        },
        "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09",
        { expiresIn: `${persistence}h` }
      );

      // Still audit the whitelisted visit for dashboard visibility
      request.auditData = {
        id:               detectionId,
        projectId:        request.projectId,
        sessionId:        signals.sessionId ?? null,
        ipAddress:        request.ip,
        score:            100,
        action:           "allow",
        signals,
        isHuman:          true,
        timeToSolve:      0,
        challengeDataId:  null,
        challengeIssuedAt: null,
      };

      return reply.code(200).send({
        status:  "success",
        message: "detection completed",
        request_id: detectionId,
        version: "v1.0",
        data: {
          assessment: {
            score:      100,
            risk_level: "low",
            action:     "allow",
          },
          context: {
            ip:           request.ip,
            ua_fingerprint: signals.ua,
            timestamp:    new Date().toISOString(),
          },
          cookies: {
            token: cookieToken,
          },
          whitelisted:   true,
          matched_entry: cyno.matchedEntry?.name,
        },
      });
    }

    // ── SCORING ───────────────────────────────────────────
    let score = 100;

    // Only apply signal deductions if that signal is enabled in rule
    // (defaults to true if no rule configured)
    const useHeadless         = ruleSignals.headless         !== false;
    const useHardwareMismatch = ruleSignals.hardwareMismatch !== false;
    const useMouseAnalysis    = ruleSignals.mouseAnalysis    !== false;

    // TIER 1: Heuristics
    if (signals.webdriver)                          score -= 70;
    if (!signals.webgl || !signals.canvas)          score -= 30;
    if (useHardwareMismatch && signals.hardwareConcurrency < 2) score -= 20;
    if (useHeadless && signals.isHeadless)          score -= 20;
    // mouseAnalysis placeholder — wire up when mouse data collected
    // if (useMouseAnalysis && signals.linearMousePath) score -= 15;

    // Clamp to 0
    score = Math.max(0, score);

    const riskLevel = score < 30 ? "high" : score < 71 ? "medium" : "low";

    // ── ACTION THRESHOLDS based on strictness ─────────────
    //
    //  passive:     always allow, never challenge (log only)
    //  balanced:    challenge < 30, uncertain < 71  (existing behavior)
    //  aggressive:  challenge < 60, uncertain < 80
    //
    let actionStatus: "allow" | "challenge" | "uncertain";

    if (strictness === "passive") {
      // Log everything, interrupt nothing
      actionStatus = "allow";
    } else if (strictness === "aggressive") {
      if      (score < 20) actionStatus = "challenge";
      else if (score < 80) actionStatus = "uncertain";
      else                 actionStatus = "allow";
    } else {
      // balanced (default)
      if      (score < 30) actionStatus = "challenge";
      else if (score < 71) actionStatus = "uncertain";
      else                 actionStatus = "allow";
    }

    const detectionId       = uuidv4();
    let challengeDataId:    string | null = null;
    let challengeIssuedAt:  number | null = null;

    const response: verifyHumanResponseType = {
      status:  "success",
      message: "detection completed",
      request_id: detectionId,
      version: "v1.0",
      data: {
        assessment: {
          score,
          risk_level: riskLevel,
          action:     actionStatus,
        },
        context: {
          ip:             request.ip,
          ua_fingerprint: signals.ua,
          timestamp:      new Date().toISOString(),
        },
      },
    };

    if (actionStatus === "challenge" || actionStatus === "uncertain") {
      const challengeData   = await getBotChallenge();
      const valueArr        = challengeData?.value.split(" ") || [];
      const randomPosition  = Math.floor(Math.random() * valueArr.length) + 1;

      challengeIssuedAt = Date.now();

      const token = jwt.sign(
        {
          did:    detectionId,
          cid:    challengeData?.id,
          answer: valueArr[randomPosition - 1],
          iat_ms: challengeIssuedAt,
        },
        "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09",
        { expiresIn: "5m" }
      );

      challengeDataId = challengeData?.id || null;

      response.data.challenge = {
        context:   challengeData?.value || "",
        condition: randomPosition,
        token,
      };
    } else {
      // Allow — issue verified session cookie
      // Persistence comes from rule (hours → seconds for jwt expiresIn)
      response.data.cookies = {
        token: jwt.sign(
          { assessment: "passed", iat_ms: Date.now() },
          "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09",
          { expiresIn: `${persistence}h` }
        ),
      };
    }

    // ── AUDIT ─────────────────────────────────────────────
    request.auditData = {
      id:               detectionId,
      projectId:        request.projectId,
      sessionId:        signals.sessionId ?? null,
      ipAddress:        request.ip,
      score,
      action:           actionStatus,
      signals,
      isHuman:          actionStatus === "allow",
      timeToSolve:      0,
      challengeDataId,
      challengeIssuedAt,
    };

    return reply.code(200).send(response);

  } catch (error) {
    return reply.code(500).send({
      status:  "Internal Server Error",
      message: "",
      error: toErrorMessage(error),
    });
  }
};

export const verifyBotChallenge = async (request: FastifyRequest, reply: FastifyReply) => {
  const { answer } = request.body as verifyChallengeBodyType;
  const token = request.headers.authorization?.replace("Bearer ", "").trim();

  try {
    if (!token) {
      return reply.code(404).send({
        status: "Bad Request",
        message: "Missing or invalid token",
        error: "Token is missing or malformed",
      });
    }

    const decodedToken = jwt.verify(token, "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09") as {
      answer: string;
      cid: string;
      did: string;
      iat_ms: number;
    };

    // Calculate timeToSolve from when challenge was issued (embedded in token)
    const timeToSolve = decodedToken.iat_ms ? Date.now() - decodedToken.iat_ms : 0;

    if (decodedToken.answer !== answer) {
      await updateStats(decodedToken.cid, false, decodedToken.did, timeToSolve);
      return reply.code(401).send({
        status: "Bad Request",
        message: "Invalid challenge answer",
        error: "Challenge answer is incorrect",
        data: {
          challenge: {
            retake_token: jwt.sign(
              { did: decodedToken.did },
              "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09",
              { expiresIn: "5m" }
            ),
          },
        },
      });
    }

    await updateStats(decodedToken.cid, true, decodedToken.did, timeToSolve);
    return reply.code(200).send({
      status: "success",
      message: "Challenge verified",
      data: {
        challenge_verified: true,
        cookies: {
          token: jwt.sign({ assessment: "passed" }, "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09", { expiresIn: "3d" }),
        },
      },
    });
  } catch (error) {
    return reply.code(500).send({
      status: "Internal Server Error",
      message: "",
      error: toErrorMessage(error),
    });
  }
};

export const verifyBotSessionToken = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.headers.authorization?.split(" ")[1];

  try {
    if (!token) {
      return reply.code(200).send({ status: "not-verified", message: "Session is not verified" });
    }

    const decodedToken = verifyJWT(token) as any;

    if (!decodedToken || decodedToken === "error" || decodedToken.assessment !== "passed") {
      return reply.code(401).send({ status: "token-not-valid", message: "Token is expired or not valid" });
    }

    return reply.code(200).send({ status: "session-verified", message: "Session verified" });
  } catch (error) {
    return reply.code(500).send({
      status: "Internal Server Error",
      message: "",
      error: toErrorMessage(error),
    });
  }
};

export const reTakeBotChallenge = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.headers.authorization?.replace("Bearer ", "").trim();

  try {
    if (!token) {
      return reply.code(404).send({
        status: "Bad Request",
        message: "Missing or invalid token",
        error: "Token is missing or malformed",
      });
    }

    const decodedToken = jwt.verify(token, "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09") as { did: string };

    const challengeData = await getBotChallenge();
    const valueArr = challengeData?.value.split(" ") || [];
    const randomPosition = Math.floor(Math.random() * valueArr.length) + 1;

    const issuedAt = Date.now();
    const challengeToken = jwt.sign(
      {
        did: decodedToken.did,           // carry did forward so verify can still resolve detectionId
        cid: challengeData?.id,
        answer: valueArr[randomPosition - 1],
        iat_ms: issuedAt,
      },
      "2cc08b7a5f4090a29c309dd9ee072cceaaef89e9e68f87ca64a79401083213bc0245d277d4785d02c4d21e6239fe7619a9485536641d83325f1676f413946d09",
      { expiresIn: "5m" }
    );

    // auditData used by onResponse hook to write ChallengeAttempt (issued, not yet answered)
    request.auditData = {
      detectionId: decodedToken.did,
      challengeId: challengeData?.id || null,
    };

    return reply.code(200).send({
      status: "success",
      message: "Sent a new challenge",
      data: {
        challenge: {
          context:   challengeData?.value || "",
          condition: randomPosition,
          token:     challengeToken,
        },
      },
    });
  } catch (error) {
    return reply.code(500).send({
      status: "Internal Server Error",
      message: "",
      error: toErrorMessage(error),
    });
  }
};





import type { FastifyInstance } from "fastify";
import { getOrgOverview, getProjectOverview } from "../../../services/dashboard.service.js";
import type { TOrgParams, TProjectParams } from "../../dashboard/dashboard.schema.js";


function userId(req: FastifyRequest): string {
  return (req as any).userId as string;
}

async function assertOrgMember(fastify: FastifyInstance, organizationId: string, uid: string) {
  const member = await fastify.prisma.organizationMember.findFirst({
    where: { organizationId, userId: uid },
  });
  return !!member;
}

async function assertProjectMember(fastify: FastifyInstance, projectId: string, uid: string) {
  const project = await fastify.prisma.project.findUnique({
    where:  { id: projectId },
    select: { organizationId: true },
  });
  if (!project) return false;
  return assertOrgMember(fastify, project.organizationId, uid);
}

export async function getOrgDashboard(
  fastify:  FastifyInstance,
  request:  FastifyRequest<{ Params: TOrgParams }>,
  reply:    FastifyReply
) {
  const { orgId } = request.params;
  if (!(await assertOrgMember(fastify, orgId, userId(request))))
    return reply.status(403).send({ error: "Forbidden" });

  const data = await getOrgOverview(fastify.prisma, orgId);
  return reply.send(data);
}

export async function getProjectDashboard(
  fastify:  FastifyInstance,
  request:  FastifyRequest<{ Params: TProjectParams }>,
  reply:    FastifyReply
) {
  const { projectId } = request.params as any;
  if (!(await assertProjectMember(fastify, projectId, userId(request))))
    return reply.status(403).send({ error: "Forbidden" });

  const data = await getProjectOverview(fastify.prisma, projectId);
  return reply.send(data);
}