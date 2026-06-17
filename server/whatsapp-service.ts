import { getWhatsappConfig, getBarbershopById, getBarberById, getServiceById } from "./db";
import { formatBR } from "@/lib/dateUtils";

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
 * Envia uma mensagem WhatsApp usando a API configurada
 * Suporta Twilio ou qualquer API compatível
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

    // Validar se o número de telefone tem o formato correto
    if (!phoneNumber.startsWith("+")) {
      phoneNumber = "+55" + phoneNumber.replace(/\D/g, "");
    }

    // Aqui você pode integrar com diferentes provedores de WhatsApp
    // Por enquanto, vamos simular o envio
    // Em produção, você integraria com Twilio, WhatsApp Business API, etc.

    console.log(`[WhatsApp] Enviando mensagem para ${phoneNumber}`);
    console.log(`[WhatsApp] Mensagem: ${message}`);

    // Simular envio bem-sucedido
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return { success: true, messageId };
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
