import type { FastifyInstance } from "fastify";
import {
    getOrgSettings,
    getUserAccount,
    listOrgMembers,
    patchOrgSettings,
    patchUserAccount,
} from "./settings.handler.js";
import { OrgParams, UpdateOrgBody, UpdateUserBody, UserParams } from "./settings.schema.js";

export default async function settingsRoutes(fastify: FastifyInstance) {

  fastify.get(
    "/api/v1/orgs/:orgId/settings",
    { schema: { tags: ["Settings"], params: OrgParams } },
    (req, rep) => getOrgSettings(fastify, req as any, rep)
  );

  fastify.patch(
    "/api/v1/orgs/:orgId/settings",
    { schema: { tags: ["Settings"], params: OrgParams, body: UpdateOrgBody } },
    (req, rep) => patchOrgSettings(fastify, req as any, rep)
  );

  fastify.get(
    "/api/v1/orgs/:orgId/members",
    { schema: { tags: ["Settings"], params: OrgParams } },
    (req, rep) => listOrgMembers(fastify, req as any, rep)
  );

  fastify.get(
    "/api/v1/orgs/:orgId/users/:userId",
    { schema: { tags: ["Settings"], params: UserParams } },
    (req, rep) => getUserAccount(req as any, rep)
  );

  fastify.patch(
    "/api/v1/orgs/:orgId/users/:userId",
    { schema: { tags: ["Settings"], params: UserParams, body: UpdateUserBody } },
    (req, rep) => patchUserAccount(req as any, rep)
  );
}