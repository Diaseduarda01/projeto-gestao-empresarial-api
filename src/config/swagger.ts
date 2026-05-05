export const swaggerDocument = {
  openapi: "3.0.0",
  info: { title: "Atendimentos API", version: "1.0.0" },
  servers: [{ url: "http://localhost:3333" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "senha"],
                properties: { email: { type: "string" }, senha: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "OK" }, "401": { description: "Credenciais inválidas" } },
      },
    },
    "/clientes": {
      get: { tags: ["Clientes"], responses: { "200": { description: "OK" } } },
      post: { tags: ["Clientes"], responses: { "201": { description: "Created" } } },
    },
    "/clientes/{id}": {
      get: { tags: ["Clientes"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] },
      put: { tags: ["Clientes"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] },
      delete: { tags: ["Clientes"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] },
    },
    "/funcionarios": {
      get: { tags: ["Funcionários"] },
      post: { tags: ["Funcionários"] },
    },
    "/servicos": { get: { tags: ["Serviços"] }, post: { tags: ["Serviços"] } },
    "/salas": { get: { tags: ["Salas"] }, post: { tags: ["Salas"] } },
    "/pedidos": { get: { tags: ["Pedidos"] }, post: { tags: ["Pedidos"] } },
    "/agendamentos": {
      get: { tags: ["Agendamentos"], parameters: [{ name: "data", in: "query", schema: { type: "string", example: "2026-05-10" } }] },
      post: { tags: ["Agendamentos"] },
    },
  },
};
