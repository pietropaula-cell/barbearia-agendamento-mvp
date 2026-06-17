import axios from "axios";

export interface WhatsAppMessage {
  to: string;
  message: string;
  type?: "text" | "template";
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
}

/**
 * Serviço para integração com WhatsApp Business API
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/
 */
export class WhatsAppBusinessAPI {
  private phoneNumberId: string;
  private accessToken: string;
  private businessAccountId: string;
  private apiVersion = "v18.0";
  private baseUrl = "https://graph.instagram.com";

  constructor(config: WhatsAppConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.businessAccountId = config.businessAccountId;
  }

  /**
   * Enviar mensagem de texto simples
   */
  async sendTextMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const response = await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: this.formatPhoneNumber(to),
          type: "text",
          text: {
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error("[WhatsApp API Error]", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Enviar mensagem com template (para mensagens pré-aprovadas)
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateLanguage: string = "pt_BR",
    parameters?: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const components: any[] = [];

      if (parameters && Object.keys(parameters).length > 0) {
        const bodyParams = Object.values(parameters).map((value) => ({
          type: "text",
          text: value,
        }));

        components.push({
          type: "body",
          parameters: bodyParams,
        });
      }

      const response = await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          to: this.formatPhoneNumber(to),
          type: "template",
          template: {
            name: templateName,
            language: {
              code: templateLanguage,
            },
            ...(components.length > 0 && { components }),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error("[WhatsApp Template API Error]", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Testar conexão com a API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const phoneNumber = response.data.display_phone_number || "Desconhecido";
      return {
        success: true,
        message: `Conexão bem-sucedida! Número: ${phoneNumber}`,
      };
    } catch (error: any) {
      console.error("[WhatsApp Connection Test Error]", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.error?.message || "Falha ao conectar com WhatsApp API",
      };
    }
  }

  /**
   * Formatar número de telefone para o padrão WhatsApp (com código do país)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres especiais
    let cleaned = phone.replace(/\D/g, "");

    // Se não tiver código de país, assume Brasil (+55)
    if (!cleaned.startsWith("55") && cleaned.length === 11) {
      cleaned = "55" + cleaned;
    }

    return cleaned;
  }

  /**
   * Obter status de uma mensagem
   */
  async getMessageStatus(messageId: string): Promise<{ status?: string; error?: string }> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${messageId}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return {
        status: response.data.status,
      };
    } catch (error: any) {
      console.error("[WhatsApp Status Error]", error.response?.data || error.message);
      return {
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }
}

/**
 * Factory para criar instância do serviço
 */
export function createWhatsAppBusinessAPI(config: WhatsAppConfig): WhatsAppBusinessAPI {
  return new WhatsAppBusinessAPI(config);
}
