/**
 * Configuracao de Exemplo para Testes
 * IMPORTANTE: Copie este arquivo para test.config.js e preencha com suas configuracoes
 */

export const CONFIG = {
  // URL base para testes (substitua com sua URL)
  baseUrl: 'https://seu-projeto.supabase.co/functions/v1',
  
  // Token de autenticacao (substitua com seu token)
  webhookToken: 'seu_token_aqui',
  
  // Timeout para requisicoes (em ms)
  timeout: 30000,
  
  // Dados de exemplo para testes
  testData: {
    suppliers: [
      {
        external_id: 'SUPPLIER001',
        trade_name: 'Fornecedor Exemplo',
        legal_name: 'Fornecedor Exemplo Ltda',
        cnpj: '00.000.000/0000-00'
      }
    ],
    locations: [
      {
        external_id: 'LOC001',
        name: 'Local Exemplo',
        location_type: 'CD',
        address: 'Endereco Exemplo, 123'
      }
    ]
  }
}; 