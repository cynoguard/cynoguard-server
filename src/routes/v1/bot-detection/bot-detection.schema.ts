import { Type } from "@sinclair/typebox";
import { verifyHumanBodySchema } from "../../../types/bot-detection.js";


export const verifyHumanSchema = {
    summary:"Human Verification",
    description:"Verify if a user is a human or a bot",
    tag:["Bot Detection"],
    body:verifyHumanBodySchema,
    response:{
        200:Type.Object({
            status:Type.String(),
            message:Type.String(),
            data:Type.Object({
               assessment: Type.Object({
                  score: Type.Number(),
                  risk_level: Type.String(),
                  action: Type.String(),
                  reasons: Type.Optional(Type.String()), 
               }),
                context:Type.Object({
                    ip: Type.String(),
                    ua_fingerprint: Type.String(),
                    timestamp:Type.String(),
                }),
            }),
        }),
        500:Type.Object({
            status:Type.String(),
            message:Type.Optional(Type.String()),
            error:Type.String(),
        }),
        404:Type.Object({
            status:Type.String(),
            message:Type.Optional(Type.String()),
            error:Type.String(),
        }),
        401:Type.Object({
            status:Type.String(),
            message:Type.Optional(Type.String()),
            error:Type.String(),
        }),
    }
}