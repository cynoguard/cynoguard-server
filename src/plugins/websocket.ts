/**
 * WebSocket plugin — Socket.IO server integrated with Fastify.
 * Provides real-time notifications for domain monitoring alerts.
 */

import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer } from "socket.io";
import { verifyFirebaseToken } from "../services/firebase.service.js";
import { prisma } from "./prisma.js";

let io: SocketIOServer | null = null;

/**
 * Get the Socket.IO server instance.
 * Used by services to emit events.
 */
export function getSocketIo(): SocketIOServer | null {
    return io;
}

/**
 * Initialize Socket.IO and attach to Fastify's underlying HTTP server.
 */
export function setupWebSocket(fastify: FastifyInstance): void {
    const server = fastify.server; // Node.js http.Server

    io = new SocketIOServer(server, {
        cors: {
            origin: [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:3003",
            ],
            credentials: true,
        },
    });

    // Set up the /ws namespace
    const wsNamespace = io.of("/ws");

    wsNamespace.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token as string | undefined;
            if (!token) {
                return next(new Error("Authentication token required"));
            }

            const decoded = await verifyFirebaseToken(token);
            if (!decoded) {
                return next(new Error("Invalid authentication token"));
            }

            // Look up user + org membership
            const user = await prisma.user.findUnique({
                where: { firebaseId: decoded.uid },
            });

            if (!user) {
                return next(new Error("User not found"));
            }

            const membership = await prisma.organizationMember.findUnique({
                where: { userId: user.id },
            });

            // Attach user data to socket
            (socket as any).userId = user.id;
            (socket as any).tenantId = membership?.organizationId ?? null;
            (socket as any).email = user.email;

            next();
        } catch (error) {
            next(new Error("Authentication failed"));
        }
    });

    wsNamespace.on("connection", (socket) => {
        const userId = (socket as any).userId as string;
        console.log(`[WebSocket] User connected: ${userId}`);

        // Join user-specific room
        socket.join(`user:${userId}`);

        socket.on("disconnect", () => {
            console.log(`[WebSocket] User disconnected: ${userId}`);
        });
    });

    console.log("[WebSocket] Socket.IO server initialized on /ws namespace");
}
