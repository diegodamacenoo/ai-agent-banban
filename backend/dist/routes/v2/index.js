"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerV2Routes = registerV2Routes;
const auth_1 = require("./auth");
const error_handler_v2_1 = __importDefault(require("../../plugins/error-handler-v2"));
async function registerV2Routes(server) {
    await server.register(error_handler_v2_1.default);
    await server.register(auth_1.authRoutes, { prefix: '/auth' });
}
//# sourceMappingURL=index.js.map