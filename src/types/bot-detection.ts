import { Type, type Static } from "@sinclair/typebox";


export const verifyHumanBodySchema = Type.Object({
  ua: Type.String(),
  webdriver: Type.Boolean(),
  languages: Type.Readonly(
    Type.Array(Type.String())
  ),
  platform: Type.String(),
  isHeadless: Type.Boolean(),
  hardwareConcurrency: Type.Number(),
  canvasFp: Type.String(),
  mem: Type.Number(),
  ts: Type.Number(),
  canvas: Type.Boolean(),
  webgl: Type.Boolean(),
  webglFp: Type.Optional(
    Type.Union([
      Type.String(),
      Type.Object({
        vendor: Type.Optional(Type.String()),
        render: Type.Optional(Type.String()),
      }),
    ])
  ),
});

export type verifyHumanBodyType = Static<typeof verifyHumanBodySchema>