"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthRoutes = registerAuthRoutes;
const auth_routes_1 = require("./auth-routes");
const v2_1 = require("../../shared/errors/v2");
async function registerAuthRoutes(server) {
    v2_1.ErrorHandler.register(server);
    await server.register(auth_routes_1.authRoutes);
}
//# sourceMappingURL=index.js.map