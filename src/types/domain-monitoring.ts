// Domain Monitoring types

export interface RdapResult {
  registered: boolean | null;
  status?: string[];
  raw?: any;
}

export interface SuspiciousnessResult {
  isSuspicious: boolean;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

export interface CandidateGenerationResult {
  domain: string;
  tld: string;
  source: "GEMINI" | "ALGO" | "MANUAL";
  similarityScore: number;
}

export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
}
