import { Type } from "@sinclair/typebox";
import { verifyHumanBodySchema, verifyHumanResponseSchema } from "../../../types/bot-detection.js";


export const verifyHumanSchema = {
    summary:"Human Verification",
    description:"Verify if a user is a human or a bot",
    tag:["Bot Detection"],
    body:verifyHumanBodySchema,
    response:{
        200:verifyHumanResponseSchema,
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