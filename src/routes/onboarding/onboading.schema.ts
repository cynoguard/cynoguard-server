import { Type } from "@sinclair/typebox";

export const onboardingPostSchema = {
  summary: 'Create Organization',
  description: 'Creates an organization during user onboarding',
  tags: ['Onboarding'],
  body: Type.Object({
    name: Type.String({ description: 'Organization name' }),
    industry: Type.String({ description: 'Industry type' }),
  }),
  response: {
    201: Type.Object({
      status: Type.Boolean(),
      message: Type.String(),
      data: Type.Object({
        organizationId: Type.String(),
      })
    }),
  }
};

export type OnboardingBodyType = {
  name: string;
  industry: string;
};