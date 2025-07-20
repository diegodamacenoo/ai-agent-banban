"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdminRoutes = registerAdminRoutes;
const admin_routes_1 = require("./admin-routes");
const api_keys_1 = require("./api-keys");
async function registerAdminRoutes(server) {
    await server.register(admin_routes_1.adminRoutes);
    await server.register(api_keys_1.apiKeysAdminRoutes, { prefix: '/api-keys' });
}
//# sourceMappingURL=index.js.map