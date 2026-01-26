import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { createFirebaseAccount } from "../../services/firebase.service.js";
import { createDbUser } from "../../services/user.service.js";
import { registerSchema, type RegisterBodyType, loginSchema, type LoginBodyType } from "./auth.schema.js";
import { registerUserWorkflow, loginUserWorkflow } from "./auth.service.js"; // Importing workflows

const authRoutes = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    
    // 1. REGISTER ROUTE
    fastify.post<{ Body: RegisterBodyType }>(
        "/register", // Usually just "/register" if the prefix is set in app.ts
        { schema: registerSchema },
        async (request, reply) => {
            try {
                // It is best practice to use the Workflow we discussed earlier
                // but using your existing inline logic:
                const { email, password, firstName = "", lastName = "", role } = request.body;
                
                const user = await createFirebaseAccount(email, password);
                if (!user.uid) {
                    return reply.code(500).send({ error: "Failed to create user in Firebase" });
                }

                await createDbUser(user.uid, email, firstName, lastName, role);
                
                return reply.code(201).send({
                    id: user.uid,
                    email: user.email,
                    message: "User registered successfully"
                });
            } catch (error: any) {
                return reply.code(500).send({ error: error.message || error });
            }
        }
    );

    // 2. LOGIN ROUTE
    fastify.post<{ Body: LoginBodyType }>(
        "/login", 
        { schema: loginSchema }, 
        async (request, reply) => {
            try {
                const result = await loginUserWorkflow(request.body);

                return reply.status(200).send({
                    message: "Login successful",
                    user: result,
                });
            } catch (error: any) {
                return reply.status(401).send({
                    error: error.message || "Authentication failed",
                });
            }
        }
    );
};

export default authRoutes;