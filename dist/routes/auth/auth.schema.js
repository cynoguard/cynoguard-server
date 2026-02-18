import { Type } from "@sinclair/typebox";
export const authenticateSchema = {
    summary: 'Authenticate User',
    description: 'Verifies Firebase token and syncs user with database',
    tags: ['Authentication'],
    headers: Type.Object({
        authorization: Type.String({ pattern: '^Bearer .+$' })
    }),
    body: Type.Object({
        // Only these are sent from the client
        firstName: Type.Optional(Type.String()),
        lastName: Type.Optional(Type.String()),
    }),
    response: {
        200: Type.Object({
            status: Type.String(),
            message: Type.String(),
            data: Type.Object({
                uid: Type.String(),
                email: Type.String(),
                role: Type.String(),
                first_name: Type.String(),
                last_name: Type.String(),
                is_onboarded: Type.Boolean(),
            })
        }),
        401: Type.Object({ error: Type.String(), message: Type.String() })
    }
};
