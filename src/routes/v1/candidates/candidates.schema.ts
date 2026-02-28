import { Type } from "@sinclair/typebox";

// ─── Candidate Schemas ───────────────────────────────────────────

export const candidateItemSchema = Type.Object({
    id: Type.String(),
    domain: Type.String(),
    source: Type.String(),
    similarityScore: Type.Number(),
    tld: Type.String(),
    isActive: Type.Boolean(),
    rdapRegistered: Type.Union([Type.Boolean(), Type.Null()]),
    rdapCheckedAt: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
});

export const addCandidatesBodySchema = Type.Object({
    domains: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});

export const listCandidatesSchema = {
    summary: "List Candidates",
    description: "List all candidate domains for a watch domain",
    tags: ["Domain Monitoring"],
    params: Type.Object({
        watchDomainId: Type.String(),
    }),
    response: {
        200: Type.Object({ items: Type.Array(candidateItemSchema) }),
        401: Type.Object({ error: Type.String(), message: Type.String() }),
        404: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() }),
    },
};

export const addCandidatesSchema = {
    summary: "Add Manual Candidates",
    description: "Add candidate domains manually to a watch domain",
    tags: ["Domain Monitoring"],
    params: Type.Object({
        watchDomainId: Type.String(),
    }),
    body: addCandidatesBodySchema,
    response: {
        200: Type.Object({ added: Type.Number() }),
        401: Type.Object({ error: Type.String(), message: Type.String() }),
        404: Type.Object({ error: Type.String(), message: Type.String() }),
        500: Type.Object({ error: Type.String(), message: Type.String() }),
    },
};
