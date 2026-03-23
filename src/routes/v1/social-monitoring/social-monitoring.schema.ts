// src/modules/social-monitoring/social-monitoring.schema.ts
// All TypeBox request/response schemas for the Social Monitoring module.

import { Type, type Static } from "@sinclair/typebox";

// ─── Shared Params ────────────────────────────────────────────────────────────

export const ProjectParams = Type.Object({
  projectId: Type.String(),
});

export const KeywordParams = Type.Object({
  projectId: Type.String(),
  keywordId: Type.String(),
});

export const MentionParams = Type.Object({
  projectId: Type.String(),
  mentionId: Type.String(),
});

// ─── Keywords ─────────────────────────────────────────────────────────────────

export const AddKeywordBody = Type.Object({
  keyword: Type.String({ minLength: 2, maxLength: 100 }),
});

export const ToggleKeywordBody = Type.Object({
  isActive: Type.Boolean(),
});

// ─── Mentions ─────────────────────────────────────────────────────────────────

export const MentionsQuerystring = Type.Object({
  page:      Type.Optional(Type.String()),
  limit:     Type.Optional(Type.String()),
  status:    Type.Optional(Type.String()),
  riskLevel: Type.Optional(Type.String()),
  sentiment: Type.Optional(Type.String()),
});

export const UpdateMentionBody = Type.Object({
  status: Type.Union([
    Type.Literal("VIEWED"),
    Type.Literal("DISMISSED"),
    Type.Literal("ARCHIVED"),
  ]),
});

// ─── Static types (used in route generics) ────────────────────────────────────

export type TProjectParams      = Static<typeof ProjectParams>;
export type TKeywordParams      = Static<typeof KeywordParams>;
export type TMentionParams      = Static<typeof MentionParams>;
export type TAddKeywordBody     = Static<typeof AddKeywordBody>;
export type TToggleKeywordBody  = Static<typeof ToggleKeywordBody>;
export type TMentionsQuerystring = Static<typeof MentionsQuerystring>;
export type TUpdateMentionBody  = Static<typeof UpdateMentionBody>;
