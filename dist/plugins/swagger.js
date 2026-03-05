const swaggerOption = {
    openapi: {
        info: {
            title: 'My Fastify API',
            description: 'API documentation for my Fastify project',
            version: '1.0.0',
        },
        servers: [
            { url: 'http://localhost:4000', description: 'Development server' },
        ],
    }
};
const swaggerUiOptions = {
    routePrefix: '/docs', // The path where Swagger UI will be served
    exposeRoute: true, // Makes the documentation page available
};
export { swaggerOption, swaggerUiOptions };
