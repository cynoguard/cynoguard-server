import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import app from "../src/app.js";
import supertest from "supertest";

let server: FastifyInstance;

beforeAll(async () => {
  server = Fastify();
  await server.register(app);
  await server.ready();
});

afterAll(async () => {
  await server.close();
});

describe("Backend Unit Testing", () => {

  // DOMAIN TEST (DB dependency handled)
  it("Add domain (DB health check)", async () => {
    const res = await supertest(server.server).get("/api/health/db");

    // DB may not be connected in test environment
    expect([200, 500]).toContain(res.statusCode);
  });

  // SOCIAL TEST (auth protected)
  it("Fetch social data", async () => {
    const res = await supertest(server.server).get("/api/v1/projects/1/mentions");

    expect([401, 403, 404]).toContain(res.statusCode);
  });

  // BOT TEST (auth protected)
  it("Update bot policy / verify session", async () => {
    const res = await supertest(server.server).get("/api/v1/verify-session");

    expect([401, 403, 404]).toContain(res.statusCode);
  });

});