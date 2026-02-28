import "fastify";
import type { AuthUser } from "./domain-monitoring.js";

declare module "fastify" {

    interface FastifyRequest {
        auditData?: any; // Add a custom property to store audit data
        user?: AuthUser; // Auth claims from Firebase token
    }
}