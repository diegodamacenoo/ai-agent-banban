"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerV1Routes = registerV1Routes;
const core_1 = require("./core");
const metrics_1 = require("./metrics");
const webhooks_1 = require("./webhooks");
async function registerV1Routes(server) {
    await server.register(core_1.coreV1Routes);
    await server.register(metrics_1.metricsRoutes);
    await server.register(webhooks_1.registerWebhookRoutes);
}
//# sourceMappingURL=index.js.map