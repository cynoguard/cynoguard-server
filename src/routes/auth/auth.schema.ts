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

// Login Body
export const LoginBodySchema = Type.Object({
  email: Type.String({ format: "email" }),
  password:Type.String(),   
});

export type LoginBodyType = Static<typeof LoginBodySchema>;

// Full Login Schema for Swagger
export const loginSchema = {
  summary: 'Login a member',
  description: 'Logs in a user and returns a JWT token',
  tags: ['Authentication'],
  body:LoginBodySchema,
  response:{
    200:Type.Object({
      uid: Type.String(),
      email: Type.String(),
      role: Type.String(),
      message: Type.String(),
    }),
    401:Type.Object({
        error:Type.String(),
    }),
  }
};  

// OAuth Login Body
export const SocialLoginSchema = Type.Object({
  token: Type.String(),   
});

export type SocialLoginType = Static<typeof SocialLoginSchema>;

// Full OAuth Login Schema for Swagger
export const socialLoginSchema = {
  summary: 'Social Login',
  description: 'Login or Register automatically using a Google/Github Firebase token',
  tags: ['Authentication'],
  body:SocialLoginSchema,
  response:{
    200:Type.Object({
      uid: Type.String(),
      email: Type.String(),
      role: Type.String(),
      message: Type.String(),
    }),
    401:Type.Object({
        error:Type.String(),
    }),
  }
};
