import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { createFirebaseAccount } from "../../services/firebase.service.js";
import { createDbUser } from "../../services/user.service.js";
import { registerSchema, type RegisterBodyType } from "./auth.schema.js";


const authRoutes = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    
 // Register user with email and password 
 fastify.post<{Body: RegisterBodyType}>("/api/auth/register",{schema:registerSchema},async (request,reply) => {
    const { email, password, firstName="", lastName="", role }:RegisterBodyType = request.body;
    try {
        // Logic to register user
        const user = await createFirebaseAccount(email,password);

        if(user.uid == null){
            return reply.code(500).send({error: "Failed to create user in Firebase"})
        }
        await createDbUser(user.uid, email, firstName, lastName, role);
        return reply.code(201).send({
            id: user.uid,
            email: user.email,
            message: "User registered successfully"
        });
        
    } catch (error) {
        return reply.code(500).send({error: error})
    }
 });
}

export default authRoutes;