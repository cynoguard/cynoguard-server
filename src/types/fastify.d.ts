import { UserRole } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    // This adds the 'user' property to the Request type globally
    user: {
      id: string;
      uid: string; // Firebase UID
      email: string;
      role: UserRole;
    };
  }
}