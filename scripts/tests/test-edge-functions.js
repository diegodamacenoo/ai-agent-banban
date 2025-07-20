import axios from 'axios';
import fs from 'fs/promises';

const baseUrl = 'https://bopytcghbmuywfltmwhk.supabase.co/functions/v1';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTA4NzUsImV4cCI6MjA2MTg4Njg3NX0.NTQzZanJrEipj_ylVohXFYSACY4M65zVDcux7eRUOXY';

async function testFlow(flowName, testDataPath) {
  try {
    console.log(`\nTestando ${flowName}...`);
    
    // Lê o arquivo de teste
    const testData = JSON.parse(
      await fs.readFile(testDataPath, 'utf8')
    );

    // Processa os testes do arquivo
    const tests = flowName === 'sales-flow' ? testData.tests : testData;
    
    for (const test of tests) {
      console.log(`\nExecutando teste: ${test.name}`);
      
      // Faz a requisição para a edge function
      const response = await axios.post(
        `${baseUrl}/webhook-${flowName}`,
        test.payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`
          }
        }
      );

      console.log(`✅ Status: ${response.status}`);
      console.log('Resposta:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error(`❌ Erro ao testar ${flowName}:`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Mensagem:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Erro na requisição:', error.message);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

const flows = {
  'inventory-flow': './inventory-flow/test-inventory-flow.json',
  'sales-flow': './sales-flow/test-sales-flow.json',
  'purchase-flow': './purchase-flow/test-purchase-flow.json',
  'transfer-flow': './transfer-flow/test-transfer-flow.json'
};

async function runTests() {
  for (const [flow, testFile] of Object.entries(flows)) {
    await testFlow(flow, testFile);
  }
}

runTests(); 