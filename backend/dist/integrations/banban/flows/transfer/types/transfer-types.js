"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidTransferStatus = isValidTransferStatus;
function isValidTransferStatus(status) {
    const validStatuses = [
        'PEDIDO_TRANSFERENCIA_CRIADO',
        'MAPA_SEPARACAO_CRIADO',
        'AGUARDANDO_SEPARACAO_CD',
        'EM_SEPARACAO_CD',
        'SEPARACAO_CD_COM_DIVERGENCIA',
        'SEPARACAO_CD_SEM_DIVERGENCIA',
        'SEPARADO_PRE_DOCA',
        'EMBARCADO_CD',
        'TRANSFERENCIA_CDH_FATURADA',
        'AGUARDANDO_CONFERENCIA_LOJA',
        'EM_CONFERENCIA_LOJA',
        'CONFERENCIA_LOJA_COM_DIVERGENCIA',
        'CONFERENCIA_LOJA_SEM_DIVERGENCIA',
        'EFETIVADO_LOJA'
    ];
    return validStatuses.includes(status);
}
//# sourceMappingURL=transfer-types.js.map