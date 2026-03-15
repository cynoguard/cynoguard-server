import { Type, type Static } from "@sinclair/typebox";

export const OrgParams = Type.Object({
  orgId: Type.String(),
});

export const UserParams = Type.Object({
  orgId:  Type.String(),
  userId: Type.String(), // firebaseId
});

export const UpdateOrgBody = Type.Object({
  name:          Type.Optional(Type.String({ minLength: 2, maxLength: 100 })),
  industry:      Type.Optional(Type.String()),
  businessType:  Type.Optional(Type.String()),
  teamSize:      Type.Optional(Type.String()),
});

export const UpdateUserBody = Type.Object({
  firstName: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
  lastName:  Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
});

export type TOrgParams      = Static<typeof OrgParams>;
export type TUserParams     = Static<typeof UserParams>;
export type TUpdateOrgBody  = Static<typeof UpdateOrgBody>;
export type TUpdateUserBody = Static<typeof UpdateUserBody>;