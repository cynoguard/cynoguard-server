import "fastify";

declare module "fastify" {

    interface FastifyRequest{
        auditData?:any; // Add a custom property to store audit data
        projectId?:any;
    }
}