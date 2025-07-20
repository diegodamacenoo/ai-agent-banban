"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBanbanRoutes = registerBanbanRoutes;
const transfer_1 = require("./transfer");
async function registerBanbanRoutes(server) {
    server.register(transfer_1.transferRoutes, { prefix: '/banban' });
}
//# sourceMappingURL=index.js.map