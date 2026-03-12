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
  sessionId:Type.String(),
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


export const verifyHumanResponseSchema = Type.Object({
            status:Type.String(),
            message:Type.String(),
            request_id:Type.String(),
            version:Type.String(),
            data:Type.Object({
               assessment: Type.Object({
                  score: Type.Number(),
                  risk_level: Type.String(),
                  action: Type.String(),
                  reasons: Type.Optional(Type.String()), 
               }),
                context:Type.Object({
                    ip: Type.String(),
                    ua_fingerprint: Type.String(),
                    timestamp:Type.String(),
                }),
                challenge:Type.Optional(Type.Object({
                    condition:Type.Integer(),
                    token:Type.String(),
                    context:Type.String(),
                })),
                cookies:Type.Optional(Type.Object({
                  token: Type.Optional(Type.String()),
                })),
            }),
        });

export type verifyHumanResponseType = Static<typeof verifyHumanResponseSchema>



export const verifyChallengeBodySchema = Type.Object({
   answer:Type.String(),
});


export type verifyChallengeBodyType = Static<typeof verifyChallengeBodySchema>