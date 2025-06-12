import { Resend } from 'resend';

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envia email de confirmação de exclusão de conta
 */
export async function sendAccountDeletionConfirmation(
  email: string,
  firstName: string,
  confirmationToken: string
): Promise<boolean> {
  try {
    const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/confirm-deletion/${confirmationToken}`;
    
    const emailData: EmailTemplate = {
      to: email,
      subject: 'Confirmação de Exclusão de Conta - AI Agent BanBan',
      html: generateDeletionConfirmationHTML(firstName, confirmationUrl),
      text: generateDeletionConfirmationText(firstName, confirmationUrl)
    };

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@aiagentbanban.com',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    if (error) {
      console.error('Erro ao enviar email de confirmação de exclusão:', error);
      return false;
    }

    console.log('Email de confirmação de exclusão enviado:', data?.id);
    return true;

  } catch (error) {
    console.error('Erro crítico no envio de email de exclusão:', error);
    return false;
  }
}

/**
 * Envia notificação de exportação de dados pronta
 */
export async function sendDataExportNotification(
  email: string,
  firstName: string,
  format: string,
  downloadToken: string
): Promise<boolean> {
  try {
    const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/download/data-export/${downloadToken}`;
    
    const emailData: EmailTemplate = {
      to: email,
      subject: 'Exportação de Dados Pronta - AI Agent BanBan',
      html: generateDataExportHTML(firstName, format, downloadUrl),
      text: generateDataExportText(firstName, format, downloadUrl)
    };

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@aiagentbanban.com',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    if (error) {
      console.error('Erro ao enviar notificação de exportação:', error);
      return false;
    }

    console.log('Notificação de exportação enviada:', data?.id);
    return true;

  } catch (error) {
    console.error('Erro crítico no envio de notificação de exportação:', error);
    return false;
  }
}

/**
 * Envia notificação de cancelamento de exclusão
 */
export async function sendDeletionCancelledNotification(
  email: string,
  firstName: string
): Promise<boolean> {
  try {
    const emailData: EmailTemplate = {
      to: email,
      subject: 'Exclusão de Conta Cancelada - AI Agent BanBan',
      html: generateDeletionCancelledHTML(firstName),
      text: generateDeletionCancelledText(firstName)
    };

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@aiagentbanban.com',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    if (error) {
      console.error('Erro ao enviar notificação de cancelamento:', error);
      return false;
    }

    console.log('Notificação de cancelamento enviada:', data?.id);
    return true;

  } catch (error) {
    console.error('Erro crítico no envio de notificação de cancelamento:', error);
    return false;
  }
}

// Templates HTML
function generateDeletionConfirmationHTML(firstName: string, confirmationUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmação de Exclusão de Conta</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; }
        .button { display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #b91c1c; }
        .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚠️ Confirmação de Exclusão de Conta</h1>
    </div>
    
    <div class="content">
        <p>Olá, <strong>${firstName}</strong>,</p>
        
        <p>Recebemos uma solicitação para excluir permanentemente sua conta no AI Agent BanBan.</p>
        
        <div class="warning">
            <strong>⚠️ ATENÇÃO:</strong> Esta ação é <strong>irreversível</strong>. Todos os seus dados serão excluídos permanentemente após 7 dias da confirmação.
        </div>
        
        <p>Se você realmente deseja prosseguir com a exclusão, clique no botão abaixo para confirmar:</p>
        
        <center>
            <a href="${confirmationUrl}" class="button">Confirmar Exclusão de Conta</a>
        </center>
        
        <p><strong>O que acontece após a confirmação:</strong></p>
        <ul>
            <li>Sua conta será agendada para exclusão em 7 dias</li>
            <li>Você receberá um email de confirmação</li>
            <li>Durante este período, você pode cancelar fazendo login novamente</li>
            <li>Após 7 dias, todos os dados serão excluídos permanentemente</li>
        </ul>
        
        <p><strong>Se você NÃO solicitou esta exclusão:</strong></p>
        <ul>
            <li>Não clique no link acima</li>
            <li>Altere sua senha imediatamente</li>
            <li>Entre em contato conosco em suporte@aiagentbanban.com</li>
        </ul>
        
        <p>Este link de confirmação expira em 24 horas por motivos de segurança.</p>
    </div>
    
    <div class="footer">
        <p>AI Agent BanBan - Sistema de Gestão de Agentes</p>
        <p>Se você não solicitou esta ação, ignore este email.</p>
        <p>© 2025 AI Agent BanBan. Todos os direitos reservados.</p>
    </div>
</body>
</html>
  `;
}

function generateDeletionConfirmationText(firstName: string, confirmationUrl: string): string {
  return `
Olá, ${firstName},

Recebemos uma solicitação para excluir permanentemente sua conta no AI Agent BanBan.

⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL. Todos os seus dados serão excluídos permanentemente após 7 dias da confirmação.

Se você realmente deseja prosseguir com a exclusão, acesse o link abaixo para confirmar:
${confirmationUrl}

O que acontece após a confirmação:
- Sua conta será agendada para exclusão em 7 dias
- Você receberá um email de confirmação
- Durante este período, você pode cancelar fazendo login novamente
- Após 7 dias, todos os dados serão excluídos permanentemente

Se você NÃO solicitou esta exclusão:
- Não acesse o link acima
- Altere sua senha imediatamente
- Entre em contato conosco em suporte@aiagentbanban.com

Este link de confirmação expira em 24 horas por motivos de segurança.

---
AI Agent BanBan - Sistema de Gestão de Agentes
Se você não solicitou esta ação, ignore este email.
© 2025 AI Agent BanBan. Todos os direitos reservados.
  `;
}

function generateDataExportHTML(firstName: string, format: string, downloadUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exportação de Dados Pronta</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; }
        .button { display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #047857; }
        .info { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Exportação de Dados Pronta</h1>
    </div>
    
    <div class="content">
        <p>Olá, <strong>${firstName}</strong>,</p>
        
        <p>Sua exportação de dados pessoais foi processada com sucesso e está pronta para download!</p>
        
        <div class="info">
            <strong>📦 Detalhes da Exportação:</strong><br>
            Formato: <strong>${format.toUpperCase()}</strong><br>
            Data de processamento: <strong>${new Date().toLocaleDateString('pt-BR')}</strong><br>
            Validade do link: <strong>30 dias</strong>
        </div>
        
        <p>Clique no botão abaixo para fazer o download do seu arquivo:</p>
        
        <center>
            <a href="${downloadUrl}" class="button">Download dos Meus Dados</a>
        </center>
        
        <p><strong>Informações importantes:</strong></p>
        <ul>
            <li>O arquivo contém todos os seus dados pessoais e atividades</li>
            <li>O link de download é válido por 30 dias</li>
            <li>Você pode baixar o arquivo até 5 vezes</li>
            <li>Por segurança, o link expira automaticamente</li>
        </ul>
        
        <p><strong>O que está incluído na exportação:</strong></p>
        <ul>
            <li>Dados pessoais (nome, email, perfil)</li>
            <li>Histórico de atividades (últimos 90 dias)</li>
            <li>Configurações e preferências</li>
            <li>Logs de auditoria</li>
        </ul>
        
        <p>Se você tiver alguma dúvida sobre seus dados, entre em contato conosco em suporte@aiagentbanban.com</p>
    </div>
    
    <div class="footer">
        <p>AI Agent BanBan - Sistema de Gestão de Agentes</p>
        <p>Esta exportação foi solicitada conforme o Artigo 20 do GDPR (Direito à portabilidade de dados).</p>
        <p>© 2025 AI Agent BanBan. Todos os direitos reservados.</p>
    </div>
</body>
</html>
  `;
}

function generateDataExportText(firstName: string, format: string, downloadUrl: string): string {
  return `
Olá, ${firstName},

Sua exportação de dados pessoais foi processada com sucesso e está pronta para download!

📦 Detalhes da Exportação:
Formato: ${format.toUpperCase()}
Data de processamento: ${new Date().toLocaleDateString('pt-BR')}
Validade do link: 30 dias

Acesse o link abaixo para fazer o download:
${downloadUrl}

Informações importantes:
- O arquivo contém todos os seus dados pessoais e atividades
- O link de download é válido por 30 dias
- Você pode baixar o arquivo até 5 vezes
- Por segurança, o link expira automaticamente

O que está incluído na exportação:
- Dados pessoais (nome, email, perfil)
- Histórico de atividades (últimos 90 dias)
- Configurações e preferências
- Logs de auditoria

Se você tiver alguma dúvida sobre seus dados, entre em contato conosco em suporte@aiagentbanban.com

---
AI Agent BanBan - Sistema de Gestão de Agentes
Esta exportação foi solicitada conforme o Artigo 20 do GDPR (Direito à portabilidade de dados).
© 2025 AI Agent BanBan. Todos os direitos reservados.
  `;
}

function generateDeletionCancelledHTML(firstName: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exclusão de Conta Cancelada</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0891b2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; }
        .success { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Exclusão de Conta Cancelada</h1>
    </div>
    
    <div class="content">
        <p>Olá, <strong>${firstName}</strong>,</p>
        
        <p>Sua solicitação de exclusão de conta foi <strong>cancelada com sucesso</strong>.</p>
        
        <div class="success">
            <strong>✅ Confirmação:</strong> Sua conta permanece ativa e todos os seus dados estão seguros.
        </div>
        
        <p>Esta ação foi realizada automaticamente quando você fez login em sua conta.</p>
        
        <p><strong>O que isso significa:</strong></p>
        <ul>
            <li>Sua conta continua totalmente funcional</li>
            <li>Todos os seus dados permanecem intactos</li>
            <li>Você pode continuar usando o sistema normalmente</li>
            <li>A solicitação de exclusão foi removida do sistema</li>
        </ul>
        
        <p>Se você mudar de ideia no futuro e desejar excluir sua conta novamente, poderá solicitar uma nova exclusão através das configurações da sua conta.</p>
        
        <p>Se você tem alguma dúvida ou precisa de ajuda, entre em contato conosco em suporte@aiagentbanban.com</p>
    </div>
    
    <div class="footer">
        <p>AI Agent BanBan - Sistema de Gestão de Agentes</p>
        <p>Obrigado por continuar conosco!</p>
        <p>© 2025 AI Agent BanBan. Todos os direitos reservados.</p>
    </div>
</body>
</html>
  `;
}

function generateDeletionCancelledText(firstName: string): string {
  return `
Olá, ${firstName},

Sua solicitação de exclusão de conta foi CANCELADA com sucesso.

✅ Confirmação: Sua conta permanece ativa e todos os seus dados estão seguros.

Esta ação foi realizada automaticamente quando você fez login em sua conta.

O que isso significa:
- Sua conta continua totalmente funcional
- Todos os seus dados permanecem intactos
- Você pode continuar usando o sistema normalmente
- A solicitação de exclusão foi removida do sistema

Se você mudar de ideia no futuro e desejar excluir sua conta novamente, poderá solicitar uma nova exclusão através das configurações da sua conta.

Se você tem alguma dúvida ou precisa de ajuda, entre em contato conosco em suporte@aiagentbanban.com

---
AI Agent BanBan - Sistema de Gestão de Agentes
Obrigado por continuar conosco!
© 2025 AI Agent BanBan. Todos os direitos reservados.
  `;
} 