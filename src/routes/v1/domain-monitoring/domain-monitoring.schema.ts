import { Type, type Static } from "@sinclair/typebox";

export const ProjectParams = Type.Object({
  orgId:     Type.String(),
  projectId: Type.String(),
});

export const WatchlistParams = Type.Object({
  orgId:       Type.String(),
  projectId:   Type.String(),
  watchlistId: Type.String(),
});

export const CreateWatchlistBody = Type.Object({
  domain:               Type.String({ minLength: 1 }),
  label:                Type.Optional(Type.String()),
  intervalHours:        Type.Optional(Type.Number({ minimum: 1, maximum: 168, default: 24 })),
  candidateCount:       Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 100 })),
  similarityThreshold:  Type.Optional(Type.Number({ minimum: 0, maximum: 1, default: 0.8 })),
  tldStrategy:          Type.Optional(Type.Union([
    Type.Literal("SAME_TLD_ONLY"),
    Type.Literal("ALLOWLIST"),
    Type.Literal("MIXED"),
  ])),
  tldAllowlist:         Type.Optional(Type.Array(Type.String())),
  tldSuspicious:        Type.Optional(Type.Array(Type.String())),
});

export const AddCandidatesBody = Type.Object({
  domains: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});

export const UpdateWatchlistBody = Type.Object({
  label:               Type.Optional(Type.String()),
  active:              Type.Optional(Type.Boolean()),
  intervalHours:       Type.Optional(Type.Number({ minimum: 1, maximum: 168 })),
  similarityThreshold: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
});

export type TProjectParams      = Static<typeof ProjectParams>;
export type TWatchlistParams    = Static<typeof WatchlistParams>;
export type TCreateWatchlistBody = Static<typeof CreateWatchlistBody>;
export type TAddCandidatesBody  = Static<typeof AddCandidatesBody>;
export type TUpdateWatchlistBody = Static<typeof UpdateWatchlistBody>;