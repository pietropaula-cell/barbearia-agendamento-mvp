import { getWhatsappConfig, getBarbershopById, getBarberById, getServiceById } from "./db";
import { formatBR } from "@/lib/dateUtils";
import { createWhatsAppBusinessAPI } from "./whatsapp-business-api";

/**
 * Gera URL do Google Maps para um endereço
 */
function getMapsUrl(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/${encodedAddress}`;
}

/**
 * Formata uma mensagem de confirmação de agendamento com link do Maps
 */
export async function formatConfirmationMessage(
  barbershopId: number,
  barberId: number,
  serviceId: number,
  customerName: string,
  startsAt: Date,
  endsAt: Date
): Promise<string> {
  const barbershop = await getBarbershopById(barbershopId);
  const barber = await getBarberById(barberId);
  const service = await getServiceById(serviceId);

  if (!barbershop || !barber || !service) {
    throw new Error("Dados do agendamento não encontrados");
  }

  const formattedDate = formatBR(startsAt, "dd/MM/yyyy 'às' HH:mm");
  const mapsUrl = barbershop.address ? getMapsUrl(barbershop.address) : "";

  let message = `Olá ${customerName}! 👋\n\n`;
  message += `Seu agendamento foi confirmado! ✅\n\n`;
  message += `📍 Barbearia: ${barbershop.name}\n`;
  message += `💇 Barbeiro: ${barber.name}\n`;
  message += `✂️ Serviço: ${service.name}\n`;
  message += `📅 Data e Hora: ${formattedDate}\n`;
  message += `💰 Valor: R$ ${Number(service.price).toFixed(2)}\n\n`;

  if (mapsUrl) {
    message += `📍 Localização: ${mapsUrl}\n\n`;
  }

  if (barbershop.address) {
    message += `Endereço: ${barbershop.address}\n`;
  }

  message += `\nAté logo! 😊`;

  return message;
}

/**
 * Formata uma mensagem de lembrete de agendamento com link do Maps
 */
export async function formatReminderMessage(
  barbershopId: number,
  barberId: number,
  serviceId: number,
  customerName: string,
  startsAt: Date
): Promise<string> {
  const barbershop = await getBarbershopById(barbershopId);
  const barber = await getBarberById(barberId);
  const service = await getServiceById(serviceId);

  if (!barbershop || !barber || !service) {
    throw new Error("Dados do agendamento não encontrados");
  }

  const formattedDate = formatBR(startsAt, "dd/MM/yyyy 'às' HH:mm");
  const mapsUrl = barbershop.address ? getMapsUrl(barbershop.address) : "";

  let message = `Olá ${customerName}! ⏰\n\n`;
  message += `Lembrete: Seu agendamento é em 1 hora!\n\n`;
  message += `📍 Barbearia: ${barbershop.name}\n`;
  message += `💇 Barbeiro: ${barber.name}\n`;
  message += `✂️ Serviço: ${service.name}\n`;
  message += `📅 Data e Hora: ${formattedDate}\n\n`;

  if (mapsUrl) {
    message += `📍 Localização: ${mapsUrl}\n\n`;
  }

  if (barbershop.address) {
    message += `Endereço: ${barbershop.address}\n`;
  }

  message += `\nAté logo! 😊`;

  return message;
}

/**
 * Envia uma mensagem WhatsApp usando a WhatsApp Business API
 */
export async function sendWhatsappMessage(
  barbershopId: number,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getWhatsappConfig(barbershopId);

    if (!config || !config.enabled) {
      return { success: false, error: "WhatsApp não está configurado ou desabilitado" };
    }

    // Validar credenciais da WhatsApp Business API
    if (!config.phoneNumberId || !config.apiKey) {
      console.warn("[WhatsApp] Credenciais da WhatsApp Business API não configuradas");
      // Simular envio se credenciais não estiverem configuradas
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { success: true, messageId };
    }

    // Criar instância da API
    const whatsappAPI = createWhatsAppBusinessAPI({
      phoneNumberId: config.phoneNumberId,
      accessToken: config.apiKey,
      businessAccountId: "", // Não é necessário para envio de mensagens
    });

    // Enviar mensagem
    const result = await whatsappAPI.sendTextMessage(phoneNumber, message);

    if (result.success) {
      console.log(`[WhatsApp] Mensagem enviada com sucesso para ${phoneNumber}`);
      return { success: true, messageId: result.messageId };
    } else {
      console.error(`[WhatsApp] Erro ao enviar mensagem: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("[WhatsApp] Erro ao enviar mensagem:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia mensagem de confirmação de agendamento
 */
export async function sendConfirmationMessage(
  barbershopId: number,
  barberId: number,
  serviceId: number,
  customerName: string,
  customerPhone: string,
  startsAt: Date,
  endsAt: Date
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message = await formatConfirmationMessage(
      barbershopId,
      barberId,
      serviceId,
      customerName,
      startsAt,
      endsAt
    );

    return sendWhatsappMessage(barbershopId, customerPhone, message);
  } catch (error) {
    console.error("[WhatsApp] Erro ao enviar confirmação:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Envia mensagem de lembrete de agendamento
 */
export async function sendReminderMessage(
  barbershopId: number,
  barberId: number,
  serviceId: number,
  customerName: string,
  customerPhone: string,
  startsAt: Date
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message = await formatReminderMessage(
      barbershopId,
      barberId,
      serviceId,
      customerName,
      startsAt
    );

    return sendWhatsappMessage(barbershopId, customerPhone, message);
  } catch (error) {
    console.error("[WhatsApp] Erro ao enviar lembrete:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
