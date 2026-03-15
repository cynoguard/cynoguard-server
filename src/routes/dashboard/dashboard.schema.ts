import { Type, type Static } from "@sinclair/typebox";

export const OrgParams = Type.Object({
  orgId: Type.String(),
});

export const ProjectParams = Type.Object({
  projectId: Type.String(),
});

export type TOrgParams     = Static<typeof OrgParams>;
export type TProjectParams = Static<typeof ProjectParams>;