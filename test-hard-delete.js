// Teste da API de hard delete
async function testHardDelete() {
  try {
    const response = await fetch('http://localhost:3000/api/user-management/users/hard-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-id'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Erro:', error);
  }
}

testHardDelete(); 