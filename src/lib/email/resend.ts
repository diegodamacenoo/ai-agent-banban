import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envia notificação de exportação de dados concluída
 */
export async function sendDataExportNotification(
  email: string,
  firstName: string,
  format: string,
  downloadToken: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@banban.com.br',
      to: email,
      subject: 'Sua exportação de dados está pronta',
      html: `
        <h2>Olá ${firstName},</h2>
        <p>Sua exportação de dados no formato ${format} está pronta para download.</p>
        <p>Para baixar seus dados, clique no link abaixo:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/v1/download/data-export/${downloadToken}">
          Baixar dados
        </a></p>
        <p>Este link expirará em 24 horas por motivos de segurança.</p>
        <p>Se você não solicitou esta exportação, por favor ignore este email.</p>
      `
    });

    return !error;
  } catch (error) {
    console.error('Erro ao enviar email de exportação:', error);
    return false;
  }
}

/**
 * Envia email de confirmação de exclusão de conta
 */
export async function sendAccountDeletionConfirmation(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@banban.com.br',
      to: email,
      subject: 'Confirme a exclusão da sua conta',
      html: `
        <h2>Olá ${firstName},</h2>
        <p>Recebemos sua solicitação para excluir sua conta.</p>
        <p>Para confirmar a exclusão, clique no link abaixo:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/v1/confirm-deletion/${verificationToken}">
          Confirmar exclusão da conta
        </a></p>
        <p>Este link expirará em 24 horas por motivos de segurança.</p>
        <p>Se você não solicitou a exclusão da sua conta, por favor ignore este email e altere sua senha imediatamente.</p>
      `
    });

    return !error;
  } catch (error) {
    console.error('Erro ao enviar email de confirmação de exclusão:', error);
    return false;
  }
}

/**
 * Envia notificação de cancelamento de exclusão de conta
 */
export async function sendDeletionCancelledNotification(
  email: string,
  firstName: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@banban.com.br',
      to: email,
      subject: 'Exclusão de conta cancelada',
      html: `
        <h2>Olá ${firstName},</h2>
        <p>A solicitação de exclusão da sua conta foi cancelada com sucesso.</p>
        <p>Sua conta permanecerá ativa e você pode continuar usando normalmente.</p>
        <p>Se você não solicitou este cancelamento, por favor entre em contato com nosso suporte imediatamente.</p>
      `
    });

    return !error;
  } catch (error) {
    console.error('Erro ao enviar email de cancelamento:', error);
    return false;
  }
}

/**
 * Envia email de convite para novo usuário
 */
export async function sendUserInvite(
  email: string,
  inviterName: string,
  organizationName: string,
  inviteToken: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@banban.com.br',
      to: email,
      subject: `Convite para se juntar à ${organizationName}`,
      html: `
        <h2>Olá!</h2>
        <p>${inviterName} convidou você para se juntar à ${organizationName} no BanBan.</p>
        <p>Para aceitar o convite e criar sua conta, clique no link abaixo:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?invite=${inviteToken}">
          Aceitar convite
        </a></p>
        <p>Este link expirará em 7 dias por motivos de segurança.</p>
        <p>Se você não esperava este convite, por favor ignore este email.</p>
      `
    });

    return !error;
  } catch (error) {
    console.error('Erro ao enviar email de convite:', error);
    return false;
  }
}

/**
 * Envia notificação de alerta de segurança
 */
export async function sendSecurityAlert(
  email: string,
  firstName: string,
  alertType: string,
  details: Record<string, any>
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'security@banban.com.br',
      to: email,
      subject: 'Alerta de Segurança - Ação Necessária',
      html: `
        <h2>Olá ${firstName},</h2>
        <p>Detectamos uma atividade que requer sua atenção:</p>
        <p><strong>${alertType}</strong></p>
        <p>Detalhes do alerta:</p>
        <ul>
          ${Object.entries(details).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}
        </ul>
        <p>Se você não reconhece esta atividade, por favor:</p>
        <ol>
          <li>Altere sua senha imediatamente</li>
          <li>Ative a autenticação de dois fatores se ainda não estiver ativa</li>
          <li>Entre em contato com nosso suporte</li>
        </ol>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/security">
          Verificar configurações de segurança
        </a></p>
      `
    });

    return !error;
  } catch (error) {
    console.error('Erro ao enviar alerta de segurança:', error);
    return false;
  }
}

/**
 * Envia notificação de alteração de email
 */
export async function sendEmailChangeNotification(
  oldEmail: string,
  newEmail: string,
  firstName: string,
  verificationToken: string
): Promise<boolean> {
  try {
    // Enviar para o email antigo
    const { error: error1 } = await resend.emails.send({
      from: 'no-reply@banban.com.br',
      to: oldEmail,
      subject: 'Alteração de email solicitada',
      html: `
        <h2>Olá ${firstName},</h2>
        <p>Uma solicitação para alterar o email da sua conta foi realizada.</p>
        <p>O novo email será: ${newEmail}</p>
        <p>Se você não solicitou esta alteração, por favor:</p>
        <ol>
          <li>Altere sua senha imediatamente</li>
          <li>Entre em contato com nosso suporte</li>
        </ol>
      `
    });

    // Enviar para o novo email
    const { error: error2 } = await resend.emails.send({
      from: 'no-reply@banban.com.br',
      to: newEmail,
      subject: 'Confirme seu novo email',
      html: `
        <h2>Olá ${firstName},</h2>
        <p>Para confirmar a alteração do seu email, clique no link abaixo:</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/v1/confirm-email/${verificationToken}">
          Confirmar novo email
        </a></p>
        <p>Este link expirará em 24 horas por motivos de segurança.</p>
        <p>Se você não solicitou esta alteração, por favor ignore este email.</p>
      `
    });

    return !error1 && !error2;
  } catch (error) {
    console.error('Erro ao enviar notificação de alteração de email:', error);
    return false;
  }
} 