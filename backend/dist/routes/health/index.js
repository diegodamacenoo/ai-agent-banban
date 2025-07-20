"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHealthRoutes = registerHealthRoutes;
const health_routes_1 = require("./health-routes");
async function registerHealthRoutes(server) {
    await server.register(health_routes_1.healthRoutes);
}
//# sourceMappingURL=index.js.map