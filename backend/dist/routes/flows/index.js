"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFlowRoutes = registerFlowRoutes;
const business_flows_1 = require("./business-flows");
async function registerFlowRoutes(server) {
    await server.register(business_flows_1.businessFlowRoutes);
}
//# sourceMappingURL=index.js.map