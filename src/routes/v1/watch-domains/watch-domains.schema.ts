import { Type } from "@sinclair/typebox";

// ─── Watch Domain Schemas ────────────────────────────────────────

export const createWatchDomainBodySchema = Type.Object({
    domain: Type.String({ minLength: 1 }),
    label: Type.Optional(Type.String()),
    candidateCount: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 100 })),
    tldStrategy: Type.Optional(Type.Union([
        Type.Literal("SAME_TLD_ONLY"),
        Type.Literal("ALLOWLIST"),
        Type.Literal("MIXED"),
    ])),
    tldAllowlist: Type.Optional(Type.Array(Type.String())),
    tldSuspicious: Type.Optional(Type.Array(Type.String())),
    similarityThreshold: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
});

export const watchDomainResponseSchema = Type.Object({
    watchDomain: Type.Object({
        id: Type.String(),
        domain: Type.String(),
        label: Type.Union([Type.String(), Type.Null()]),
        status: Type.String(),
        tldStrategy: Type.String(),
        candidateCount: Type.Number(),
    }),
});

export const watchDomainListItemSchema = Type.Object({
    id: Type.String(),
    domain: Type.String(),
    label: Type.Union([Type.String(), Type.Null()]),
    status: Type.String(),
    tldStrategy: Type.String(),
    candidateCount: Type.Number(),
    unreadAlerts: Type.Number(),
    createdAt: Type.String({ format: "date-time" }),
});

export const createWatchDomainSchema = {
    summary: "Create Watch Domain",
    description: "Create a new watch domain and generate candidate typo domains",
    tags: ["Domain Monitoring"],
    body: createWatchDomainBodySchema,
    response: {
        201: watchDomainResponseSchema,
        400: Type.Object({ error: Type.String(), message: Type.String() }),
        401: Type.Object({ error: Type.String(), message: Type.String() }),
        409: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() }),
    },
};

export const listWatchDomainsSchema = {
    summary: "List Watch Domains",
    description: "List all watch domains for the authenticated user's tenant",
    tags: ["Domain Monitoring"],
    response: {
        200: Type.Array(watchDomainListItemSchema),
        401: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() }),
    },
};
