import { Type } from "@sinclair/typebox";

// ─── Alert Schemas ──────────────────────────────────────────────

export const alertItemSchema = Type.Object({
    id: Type.String(),
    watchDomainId: Type.String(),
    candidateDomainId: Type.String(),
    candidateDomain: Type.String(),
    severity: Type.String(),
    message: Type.String(),
    isRead: Type.Boolean(),
    createdAt: Type.String(),
});

export const markAlertBodySchema = Type.Object({
    isRead: Type.Boolean(),
});

export const listAlertsSchema = {
    summary: "List Alerts",
    description: "List alerts for the authenticated user",
    tags: ["Domain Monitoring"],
    querystring: Type.Object({
        unread: Type.Optional(Type.Boolean()),
        watchDomainId: Type.Optional(Type.String()),
    }),
    response: {
        200: Type.Object({ items: Type.Array(alertItemSchema) }),
        401: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() }),
    },
};

export const markAlertReadSchema = {
    summary: "Mark Alert Read",
    description: "Mark an alert as read",
    tags: ["Domain Monitoring"],
    params: Type.Object({
        id: Type.String(),
    }),
    body: markAlertBodySchema,
    response: {
        200: Type.Object({ ok: Type.Boolean() }),
        401: Type.Object({ error: Type.String(), message: Type.String() }),
        404: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() }),
    },
};
