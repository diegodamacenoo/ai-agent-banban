"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const v2_1 = require("../shared/errors/v2");
async function errorHandlerV2Plugin(fastify) {
    v2_1.ErrorHandler.register(fastify);
    fastify.decorate('catchAsync', v2_1.ErrorHandler.catchAsync);
    fastify.log.info('Error handler v2 plugin registered successfully');
}
exports.default = (0, fastify_plugin_1.default)(errorHandlerV2Plugin, {
    name: 'error-handler-v2',
    dependencies: ['@fastify/jwt']
});
//# sourceMappingURL=error-handler-v2.js.map