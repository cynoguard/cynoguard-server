import "fastify";
import type { AuthUser } from "./domain-monitoring.js";

declare module "fastify" {

    interface CynoRuleContext {
        strictness: string;
        persistence: number;
        signals: Record<string, any>;
        whitelist: Array<{ name: string; type: string; value: string }>;
    }

    interface CynoRequestState {
        whitelisted: boolean;
        skipChallenge: boolean;
        rule: CynoRuleContext | null;
        matchedEntry: { name: string; type: string; value: string } | null;
    }

    interface FastifyRequest {
        auditData?: any; // Add a custom property to store audit data
        user?: AuthUser; // Auth claims from Firebase token
        projectId?: string;
        apiKeyId?: string;
        cyno?: CynoRequestState;
    }
}