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
 * Gera URL de cancelamento de agendamento
 */
function getCancelUrl(appointmentId: number, baseUrl: string = ""): string {
  const url = baseUrl || "https://barbearia-agendamento.up.railway.app";
  return `${url}/cancelar/${appointmentId}`;
}

/**
 * Interface para dados de agendamento
 */
export interface AppointmentData {
  cliente: string;
  barbeiro: string;
  servico: string;
  valor: string;
  data: string;
  hora: string;
  endereco: string;
  linkMaps: string;
  linkCancelamento: string;
  barbearia: string;
}

/**
 * Coleta todos os dados necessários para substituir variáveis
 */
export async function getAppointmentData(
  appointmentId: number,
  barbershopId: number,
  barberId: number,
  serviceId: number,
  customerName: string,
  startsAt: Date,
  baseUrl?: string
): Promise<AppointmentData> {
  const barbershop = await getBarbershopById(barbershopId);
  const barber = await getBarberById(barberId);
  const service = await getServiceById(serviceId);

  if (!barbershop || !barber || !service) {
    throw new Error("Dados do agendamento não encontrados");
  }

  const formattedDate = formatBR(startsAt, "dd/MM/yyyy");
  const formattedTime = formatBR(startsAt, "HH:mm");
  const mapsUrl = barbershop.address ? getMapsUrl(barbershop.address) : "";
  const cancelUrl = getCancelUrl(appointmentId, baseUrl);

  return {
    cliente: customerName,
    barbeiro: barber.name,
    servico: service.name,
    valor: `R$ ${Number(service.price).toFixed(2)}`,
    data: formattedDate,
    hora: formattedTime,
    endereco: barbershop.address || "Endereço não informado",
    linkMaps: mapsUrl,
    linkCancelamento: cancelUrl,
    barbearia: barbershop.name,
  };
}

/**
 * Substitui variáveis dinâmicas em um template de mensagem
 */
export function replaceVariables(template: string, data: AppointmentData): string {
  let message = template;

  // Substituir todas as variáveis
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    message = message.replace(regex, value || "");
  });

  return message;
}

/**
 * Formata uma mensagem de confirmação de agendamento com link do Maps
 */
export async function formatConfirmationMessage(
  appointmentId: number,
  barbershopId: number,
  barberId: number,
  serviceId: number,
  customerName: string,
  startsAt: Date,
  endsAt: Date,
  customTemplate?: string
): Promise<string> {
  const data = await getAppointmentData(
    appointmentId,
    barbershopId,
    barberId,
    serviceId,
    customerName,
    startsAt
  );

  // Se houver um template customizado, usar ele
  if (customTemplate) {
    return replaceVariables(customTemplate, data);
  }

  // Template padrão
  let message = `Olá {cliente}! 👋\n\n`;
  message += `Seu agendamento foi confirmado! ✅\n\n`;
  message += `🏪 Barbearia: {barbearia}\n`;
  message += `💇 Barbeiro: {barbeiro}\n`;
  message += `✂️ Serviço: {servico}\n`;
  message += `📅 Data: {data}\n`;
  message += `⏰ Hora: {hora}\n`;
  message += `💰 Valor: {valor}\n\n`;
  message += `📍 Endereço: {endereco}\n`;
  message += `🗺️ Localização: {linkMaps}\n\n`;
  message += `❌ Cancelar: {linkCancelamento}\n\n`;
  message += `Até logo! 😊`;

  return replaceVariables(message, data);
}

/**
 * Formata uma mensagem de lembrete de agendamento com link do Maps
 */
export async function formatReminderMessage(
  appointmentId: number,
  barbershopId: number,
  barberId: number,
  serviceId: number,
  customerName: string,
  startsAt: Date,
  customTemplate?: string
): Promise<string> {
  const data = await getAppointmentData(
    appointmentId,
    barbershopId,
    barberId,
    serviceId,
    customerName,
    startsAt
  );

  // Se houver um template customizado, usar ele
  if (customTemplate) {
    return replaceVariables(customTemplate, data);
  }

  // Template padrão
  let message = `Olá {cliente}! ⏰\n\n`;
  message += `Lembrete: Seu agendamento é em 1 hora!\n\n`;
  message += `🏪 Barbearia: {barbearia}\n`;
  message += `💇 Barbeiro: {barbeiro}\n`;
  message += `✂️ Serviço: {servico}\n`;
  message += `📅 Data: {data}\n`;
  message += `⏰ Hora: {hora}\n\n`;
  message += `📍 Endereço: {endereco}\n`;
  message += `🗺️ Localização: {linkMaps}\n\n`;
  message += `Até logo! 😊`;

  return replaceVariables(message, data);
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
  appointmentId: number,
  barbershopId: number,
  barberId: number,
  serviceId: number,
  customerName: string,
  customerPhone: string,
  startsAt: Date,
  endsAt: Date
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getWhatsappConfig(barbershopId);
    const customTemplate = config?.confirmationMessage || undefined;

    const message = await formatConfirmationMessage(
      appointmentId,
      barbershopId,
      barberId,
      serviceId,
      customerName,
      startsAt,
      endsAt,
      customTemplate
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
  appointmentId: number,
  barbershopId: number,
  barberId: number,
  serviceId: number,
  customerName: string,
  customerPhone: string,
  startsAt: Date
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getWhatsappConfig(barbershopId);
    const customTemplate = config?.reminderMessage || undefined;

    const message = await formatReminderMessage(
      appointmentId,
      barbershopId,
      barberId,
      serviceId,
      customerName,
      startsAt,
      customTemplate
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
