
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Carrega o arquivo .env.local manualmente
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Erro: Arquivo .env.local não encontrado!');
  process.exit(1);
}

const envConfig = fs.readFileSync(envPath, 'utf-8')
  .split('\n')
  .filter(line => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/"/g, '');
    acc[key.trim()] = value.trim();
    return acc;
  }, {});

const accessToken = envConfig.SUPABASE_ACCESS_TOKEN;
const projectRef = envConfig.SUPABASE_PROJECT_REF;

if (!accessToken || !projectRef) {
  console.error('Erro: SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF devem ser definidos no .env.local');
  process.exit(1);
}

// Monta e executa o comando
const command = `npx mcp-server-supabase --access-token ${accessToken} --project-ref ${projectRef}`;

console.log(`Executando: ${command}`);

const child = exec(command);

child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  console.log(`Processo finalizado com código ${code}`);
});

