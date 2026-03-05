import { Type } from "@sinclair/typebox";
import { verifyChallengeBodySchema, verifyHumanBodySchema, verifyHumanResponseSchema } from "../../../types/bot-detection.js";
export const verifyHumanSchema = {
    summary: "Human Verification",
    description: "Verify if a user is a human or a bot",
    tags: ["Bot Detection"],
    body: verifyHumanBodySchema,
    response: {
        200: verifyHumanResponseSchema,
        500: Type.Object({
            status: Type.String(),
            message: Type.Optional(Type.String()),
            error: Type.String(),
        }),
        404: Type.Object({
            status: Type.String(),
            message: Type.Optional(Type.String()),
            error: Type.String(),
        }),
        401: Type.Object({
            status: Type.String(),
            message: Type.Optional(Type.String()),
            error: Type.String(),
        }),
    }
};
export const verifyChallengeSchema = {
    summary: "Challenge Verification",
    description: "Verify if a user has correctly answered a challenge",
    tags: ["Bot Detection"],
    headers: Type.Object({
        authorization: Type.String({ pattern: '^Bearer .+$' }),
    }),
    body: verifyChallengeBodySchema,
    response: {
        200: Type.Object({
            status: Type.String(),
            message: Type.String(),
            data: Type.Object({
                challenge_verified: Type.Boolean(),
                cookies: Type.Object({
                    token: Type.String(),
                })
            })
        }),
        500: Type.Object({
            status: Type.String(),
            message: Type.Optional(Type.String()),
            error: Type.String(),
        }),
        404: Type.Object({
            status: Type.String(),
            message: Type.Optional(Type.String()),
            error: Type.String(),
        }),
        401: Type.Object({
            status: Type.String(),
            message: Type.Optional(Type.String()),
            error: Type.String(),
            data: Type.Object({
                challenge: Type.Object({
                    retake_token: Type.String(),
                })
            })
        }),
    }
};
export const reTakeChallengeSchema = {
    summary: "Challenge Verification",
    description: "Verify if a user has correctly answered a challenge",
    tags: ["Bot Detection"],
    headers: Type.Object({
        authorization: Type.String({ pattern: '^Bearer .+$' }),
    }),
    body: verifyChallengeBodySchema,
    response: {
        200: Type.Object({
            status: Type.String(),
            message: Type.String(),
            data: Type.Object({
                challenge_verified: Type.Boolean(),
                cookies: Type.Object({
                    token: Type.String(),
                })
            })
        }),
        500: Type.Object({
            status: Type.String(),
            message: Type.Optional(Type.String()),
            error: Type.String(),
        }),
        404: Type.Object({
            status: Type.String(),
            message: Type.Optional(Type.String()),
            error: Type.String(),
        }),
        401: Type.Object({
            status: Type.String(),
            message: Type.Optional(Type.String()),
            error: Type.String(),
        }),
    }
};
