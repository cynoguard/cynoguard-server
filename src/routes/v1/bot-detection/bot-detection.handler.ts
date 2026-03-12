import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getBotChallenge, updateStats } from "../../../services/bot-detection.service.js";
import { verifyJWT } from "../../../services/global.service.js";
import type { verifyChallengeBodyType, verifyHumanBodyType, verifyHumanResponseType } from "../../../types/bot-detection.js";

export const verifyHuman = async (
  request: FastifyRequest<{ Body: verifyHumanBodyType }>,
  reply: FastifyReply
) => {
  const signals: verifyHumanBodyType = request.body;

  try {
    let score = 100;

    // TIER 1: Heuristics
    if (signals.webdriver)                    score -= 70;
    if (!signals.webgl || !signals.canvas)    score -= 30;
    if (signals.hardwareConcurrency < 2)      score -= 20;
    if (signals.isHeadless)                   score -= 20; // was being collected but never scored

    // Clamp to 0
    score = Math.max(0, score);

    const riskLevel = score < 30 ? "high" : score < 71 ? "medium" : "low";

    let actionStatus = "allow";
    if (score < 30)       actionStatus = "challenge";
    else if (score < 71)  actionStatus = "uncertain";

    const detectionId = uuidv4();
    let challengeDataId: string | null = null;
    let challengeIssuedAt: number | null = null;

    const response: verifyHumanResponseType = {
      status: "success",
      message: "detection completed",
      request_id: detectionId,  // was empty string before — use detectionId
      version: "v1.0",
      data: {
        assessment: {
          score,
          risk_level: riskLevel,
          action: actionStatus,
        },
        context: {
          ip: request.ip,
          ua_fingerprint: signals.ua,
          timestamp: new Date().toISOString(),
        },
      },
    };

    if (actionStatus === "challenge" || actionStatus === "uncertain") {
      const challengeData = await getBotChallenge();
      const valueArr = challengeData?.value.split(" ") || [];
      const randomPosition = Math.floor(Math.random() * (valueArr.length)) + 1;

      // Embed issuedAt in token so handler can calculate timeToSolve on verify
      challengeIssuedAt = Date.now();
      const token = jwt.sign(
        {
          did: detectionId,
          cid: challengeData?.id,
          answer: valueArr[randomPosition - 1],
          iat_ms: challengeIssuedAt, // millisecond precision issued time
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "5m" }
      );

      challengeDataId = challengeData?.id || null;
      response.data.challenge = {
        context: challengeData?.value || "",
        condition: randomPosition,
        token,
      };
    } else {
      // Low risk — allow directly, set verified cookie
      response.data.cookies = {
        token: jwt.sign({ assessment: "passed" }, process.env.JWT_SECRET as string, { expiresIn: "3d" }),
      };
    }

    // Build auditData aligned with new Detection schema
    request.auditData = {
      id:          detectionId,
      projectId:   request.projectId,
      sessionId:   signals.sessionId ?? null, // client now sends cg_sid
      ipAddress:   request.ip,
      score,
      action:      actionStatus,
      signals,                               // full raw blob kept for ML
      isHuman:     riskLevel === "low",
      timeToSolve: 0,
      // challengeDataId passed so updateSessionData can write first ChallengeAttempt
      challengeDataId,
      challengeIssuedAt,
    };

    return reply.code(200).send(response);
  } catch (error) {
    return reply.code(500).send({ status: "Internal Server Error", message: "", error });
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

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as {
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
              process.env.JWT_SECRET as string,
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
          token: jwt.sign({ assessment: "passed" }, process.env.JWT_SECRET as string, { expiresIn: "3d" }),
        },
      },
    });
  } catch (error) {
    return reply.code(500).send({ status: "Internal Server Error", message: "", error });
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

        request.auditData  = {detectionId:decodedToken.did,challengeId:challengeData?.id || null};
        //  const cookieToken = jwt.sign({assessment:"passed"}, process.env.JWT_SECRET as string, {expiresIn:"3d"})

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as { did: string };

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
      process.env.JWT_SECRET as string,
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
    return reply.code(500).send({ status: "Internal Server Error", message: "", error });
  }
};


