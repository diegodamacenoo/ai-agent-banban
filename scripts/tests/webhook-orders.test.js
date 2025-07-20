/**
 * Script de Teste - Webhook Orders
 * Versao segura sem dados sensiveis
 */

import https from 'https';
import fetch from 'node-fetch';
import { CONFIG } from './config/test.config.js';

// Constantes
const WEBHOOK_URL = `${CONFIG.baseUrl}/webhook-orders`;

/**
 * Funcao para fazer requisicoes HTTP
 */
async function makeRequest(url, options) {
  try {
    const response = await fetch(url, {
      ...options,
      timeout: CONFIG.timeout
    });
    const data = await response.json();
    return {
      status: response.status,
      success: response.ok,
      data: data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Cenario 1: Dados completos de produtos
 */
async function testCompleteProductData() {
  console.log('\n🧪 Teste 1: Dados Completos de Produtos');
  
  const payload = {
    event_type: 'product_sync',
    timestamp: new Date().toISOString(),
    data: {
      suppliers: CONFIG.testData.suppliers,
      locations: CONFIG.testData.locations,
      products: [
        {
          external_id: 'PROD001',
          product_name: 'Produto Teste',
          description: 'Descricao do produto teste',
          category: 'CATEGORIA_TESTE',
          sub_category: 'SUBCATEGORIA_TESTE',
          gtin: '0000000000001',
          unit_measure: 'UN',
          folder: 'PASTA_TESTE',
          type: 'TIPO_TESTE',
          gender: 'UNI',
          supplier_external_id: CONFIG.testData.suppliers[0].external_id,
          status: 'ATIVO'
        }
      ],
      product_variants: [
        {
          product_external_id: 'PROD001',
          external_id: 'VAR001',
          size: 'UNICO',
          color: 'PADRAO',
          gtin_variant: '0000000000002',
          sku: 'PROD001-UNICO-PADRAO'
        }
      ],
      product_pricing: [
        {
          variant_external_id: 'VAR001',
          price_type: 'BASE',
          price_value: 100.00,
          cost_price: 50.00,
          margin_percentage: 50.0,
          markup_percentage: 100.0,
          valid_from: new Date().toISOString().split('T')[0],
          change_reason: 'TESTE'
        }
      ]
    }
  };

  const result = await makeRequest(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.webhookToken}`
    },
    body: JSON.stringify(payload)
  });

  console.log(`Status: ${result.status}`);
  console.log(`Sucesso: ${result.success}`);
  if (result.data) {
    console.log('Resumo:', JSON.stringify(result.data.summary, null, 2));
    if (result.data.details?.errors && Object.keys(result.data.details.errors).length > 0) {
      console.log('Erros:', JSON.stringify(result.data.details.errors, null, 2));
    }
  }
}

/**
 * Teste de conectividade basica
 */
async function testConnectivity() {
  console.log('\n🔌 Testando conectividade com webhook...');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'GET',
      timeout: 5000
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Conectividade OK');
    return true;
  } catch (error) {
    console.error('Erro de conectividade:', error.message);
    return false;
  }
}

/**
 * Funcao principal
 */
async function main() {
  console.log('🚀 Iniciando testes de webhook...\n');
  
  if (!await testConnectivity()) {
    console.error('❌ Falha na conectividade. Abortando testes.');
    process.exit(1);
  }
  
  await testCompleteProductData();
}

// Executa os testes
main().catch(console.error); 