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
 * Envia mensagem WhatsApp via Twilio
 */
export async function sendTwilioWhatsAppMessage(
  config: TwilioConfig,
  toPhoneNumber: string,
  message: string
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

    // Enviar mensagem
    const message_obj = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });

    console.log(`[Twilio] Mensagem enviada com sucesso. SID: ${message_obj.sid}`);
    return { success: true, messageId: message_obj.sid };
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
