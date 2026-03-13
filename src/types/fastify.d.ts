import "fastify";

declare module "fastify" {

    interface FastifyRequest{
        cyno: {
        whitelisted: boolean;
        skipChallenge: boolean;
        rule: {
            strictness:  string;   // "passive" | "balanced" | "aggressive"
            persistence: number;   // hours
            signals:     Record<string, boolean>;
            whitelist:   { name: string; type: string; value: string }[];
        } | null;
        matchedEntry: { name: string; type: string; value: string } | null;
        };
        auditData?:any; // Add a custom property to store audit data
        projectId?:any;
        apiKeyId?:any;
    }
}