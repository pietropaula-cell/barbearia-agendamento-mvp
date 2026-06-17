import twilio from "twilio";

/**
 * Interface para credenciais do Twilio
 */
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
}

/**
 * Cria cliente Twilio
 */
export function createTwilioClient(config: TwilioConfig) {
  return twilio(config.accountSid, config.authToken);
}

/**
 * Interface para envio de template
 */
export interface TwilioTemplateConfig extends TwilioConfig {
  contentSid?: string;
  contentVariables?: Record<string, string>;
}

/**
 * Envia mensagem WhatsApp via Twilio (suporta template e free-form)
 */
export async function sendTwilioWhatsAppMessage(
  config: TwilioConfig | TwilioTemplateConfig,
  toPhoneNumber: string,
  message?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validar credenciais
    if (!config.accountSid || !config.authToken || !config.whatsappNumber) {
      return {
        success: false,
        error: "Credenciais do Twilio não configuradas corretamente",
      };
    }

    // Formatar números para Twilio (adicionar whatsapp: prefix)
    const fromNumber = `whatsapp:${config.whatsappNumber}`;
    const toNumber = `whatsapp:${toPhoneNumber}`;

    // Criar cliente Twilio
    const client = createTwilioClient(config);

    // Verificar se é um template
    const templateConfig = config as TwilioTemplateConfig;
    if (templateConfig.contentSid) {
      // Enviar usando template
      const message_obj = await client.messages.create({
        contentSid: templateConfig.contentSid,
        contentVariables: JSON.stringify(templateConfig.contentVariables || {}),
        from: fromNumber,
        to: toNumber,
      });

      console.log(`[Twilio] Template enviado com sucesso. SID: ${message_obj.sid}`);
      return { success: true, messageId: message_obj.sid };
    } else {
      // Enviar como free-form (apenas na janela de 24 horas)
      if (!message) {
        return {
          success: false,
          error: "Mensagem ou template é obrigatório",
        };
      }

      const message_obj = await client.messages.create({
        body: message,
        from: fromNumber,
        to: toNumber,
      });

      console.log(`[Twilio] Mensagem enviada com sucesso. SID: ${message_obj.sid}`);
      return { success: true, messageId: message_obj.sid };
    }
  } catch (error) {
    console.error("[Twilio] Erro ao enviar mensagem:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Testa conexão com Twilio
 */
export async function testTwilioConnection(
  config: TwilioConfig
): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.accountSid || !config.authToken) {
      return {
        success: false,
        message: "Account SID e Auth Token são obrigatórios",
      };
    }

    const client = createTwilioClient(config);

    // Tentar buscar informações da conta
    const account = await client.api.accounts(config.accountSid).fetch();

    if (account) {
      return {
        success: true,
        message: `Conectado com sucesso! Conta: ${account.friendlyName}`,
      };
    }

    return {
      success: false,
      message: "Não foi possível conectar à conta Twilio",
    };
  } catch (error) {
    console.error("[Twilio] Erro ao testar conexão:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia mensagem de teste
 */
export async function sendTwilioTestMessage(
  config: TwilioConfig,
  toPhoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendTwilioWhatsAppMessage(config, toPhoneNumber, message);
}
