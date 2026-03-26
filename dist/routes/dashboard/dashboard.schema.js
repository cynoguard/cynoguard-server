import { Type } from "@sinclair/typebox";
export const OrgParams = Type.Object({
    orgId: Type.String(),
});
export const ProjectParams = Type.Object({
    projectId: Type.String(),
});
