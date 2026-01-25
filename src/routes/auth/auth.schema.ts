import { Type, type Static } from "@sinclair/typebox";


// Body Schema
export const RegisterBodySchema = Type.Object({
  email: Type.String({ format: "email" }),
  password:Type.String(),
  firstName: Type.Optional(Type.String()),
  lastName: Type.Optional(Type.String()),
  role: Type.Union([
    Type.Literal("SUPER_ADMIN"),
    Type.Literal("ADMIN"),
    Type.Literal("MEMBER"),
  ], { default: "MEMBER" }),
});

export type RegisterBodyType = Static<typeof RegisterBodySchema>

// The full Schema including tag for Swagger
export const registerSchema = {
  summary: 'Register a new member',
  description: 'Creates a new user in CynoGuard and links them to a Firebase UID',
  tags: ['Authentication'],
  body:RegisterBodySchema,
  response:{
    201:Type.Object({
      id: Type.String(),
      email: Type.String(),
      message: Type.String()
    }),
    500:Type.Object({
        error:Type.String(),
    }),
  }
}



