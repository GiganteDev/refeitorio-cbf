import nodemailer from "nodemailer"
import { getEmailSettings } from "./db"
import { generateReport } from "./report-generator"
import { formatBrazilianDateTime, TIMEZONE } from "./timezone-config"

// Update the sendReportEmail function to handle PNG generation
export async function sendReportEmail(schedule: any) {
  try {
    // Obter configurações de e-mail
    const emailSettings = await getEmailSettings()

    if (!emailSettings) {
      throw new Error("Configurações de e-mail não encontradas")
    }

    // Criar transportador SMTP com opção para ignorar erros de certificado
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_secure === 1,
      // Sem autenticação conforme solicitado
      tls: {
        // Ignorar erros de certificado
        rejectUnauthorized: false,
      },
    })

    // Gerar relatório com a opção de incluir screenshot do dashboard
    const { attachments, summary } = await generateReport(schedule)

    // Log para debug
    console.log(`Generated ${attachments.length} attachments:`, attachments.map((a) => a.filename).join(", "))

    // Preparar destinatários
    const recipients = schedule.recipients.split(",").map((email: string) => email.trim())

    // Formatar data atual no timezone brasileiro
    const currentDate = formatBrazilianDateTime(new Date())

    // Enviar e-mail
    const info = await transporter.sendMail({
      from: emailSettings.from_email || "noreply@cbf-survey.com",
      to: recipients.join(", "),
      subject: `Relatório: ${schedule.name} - ${currentDate}`,
      html: `
        <h2>Relatório: ${schedule.name}</h2>
        <p>Data de geração: ${currentDate}</p>
        <p>Período: ${summary.period}</p>
        <p>Total de avaliações: ${summary.totalVotes}</p>
        <p>Índice de satisfação: ${summary.satisfactionIndex}%</p>
        <hr>
        <p>Este é um e-mail automático. Por favor, não responda.</p>
      `,
      attachments,
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao enviar e-mail",
    }
  }
}

export async function testEmailConnection(settings: any) {
  try {
    // Criar transportador SMTP com opção para ignorar erros de certificado
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure === 1,
      // Sem autenticação conforme solicitado
      tls: {
        // Ignorar erros de certificado
        rejectUnauthorized: false,
      },
    })

    // Verificar conexão
    await transporter.verify()

    return {
      success: true,
    }
  } catch (error) {
    console.error("Erro ao testar conexão SMTP:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao testar conexão SMTP",
    }
  }
}

export async function sendTestEmail(settings: any) {
  try {
    // Criar transportador SMTP com opção para ignorar erros de certificado
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_secure === 1,
      // Sem autenticação conforme solicitado
      tls: {
        // Ignorar erros de certificado
        rejectUnauthorized: false,
      },
    })

    // Formatar data atual no timezone brasileiro
    const currentDate = formatBrazilianDateTime(new Date())

    // Enviar e-mail de teste
    const info = await transporter.sendMail({
      from: settings.from_email || "noreply@cbf-survey.com",
      to: settings.test_email,
      subject: `Teste de configuração de e-mail - ${currentDate}`,
      html: `
        <h2>Teste de configuração de e-mail</h2>
        <p>Este é um e-mail de teste para verificar a configuração do servidor SMTP.</p>
        <p>Data e hora do envio: ${currentDate}</p>
        <p>Timezone configurado: ${TIMEZONE}</p>
        <hr>
        <p>Se você recebeu este e-mail, a configuração está funcionando corretamente!</p>
      `,
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Erro ao enviar e-mail de teste:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao enviar e-mail de teste",
    }
  }
}
