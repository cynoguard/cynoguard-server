export interface OnboardingRequest {
  userId: string;
  name: string;
  industry?: string;
}

export interface OnboardingResponse {
  organizationId: string;
  name: string;
  isOnboarded: boolean;
}