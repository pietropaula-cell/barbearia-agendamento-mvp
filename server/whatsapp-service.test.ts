import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  formatConfirmationMessage,
  formatReminderMessage,
  sendWhatsappMessage,
  sendConfirmationMessage,
  sendReminderMessage,
} from "./whatsapp-service";
import {
  createBarbershop,
  createBarber,
  createService,
  deleteBarbershop,
  deleteBarber,
  deleteService,
  upsertWhatsappConfig,
  deleteWhatsappConfig,
} from "./db";

describe("WhatsApp Service", () => {
  let barbershopId: number;
  let barberId: number;
  let serviceId: number;

  beforeAll(async () => {
    // Criar dados de teste
    barbershopId = await createBarbershop({
      name: "Barbearia Teste WhatsApp Service",
      slug: "barbearia-whatsapp-service-test",
      active: true,
      address: "Rua das Flores, 123, São Paulo, SP",
    });

    barberId = await createBarber({
      barbershopId,
      name: "João Barbeiro",
      active: true,
    });

    serviceId = await createService({
      barbershopId,
      name: "Corte de Cabelo",
      durationMin: 30,
      price: 50.0,
    });

    // Configurar WhatsApp
    await upsertWhatsappConfig({
      barbershopId,
      phoneNumber: "+5511987654321",
      apiKey: "test-api-key",
      enabled: true,
      sendConfirmation: true,
      sendReminder: true,
      reminderMinutesBefore: 60,
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await deleteWhatsappConfig(barbershopId);
    await deleteService(serviceId);
    await deleteBarber(barberId);
    await deleteBarbershop(barbershopId);
  });

  describe("formatConfirmationMessage", () => {
    it("should format confirmation message with maps link", async () => {
      const startsAt = new Date("2026-06-20T14:00:00Z");
      const endsAt = new Date("2026-06-20T14:30:00Z");

      const message = await formatConfirmationMessage(
        barbershopId,
        barberId,
        serviceId,
        "João Silva",
        startsAt,
        endsAt
      );

      expect(message).toContain("João Silva");
      expect(message).toContain("Barbearia Teste WhatsApp Service");
      expect(message).toContain("João Barbeiro");
      expect(message).toContain("Corte de Cabelo");
      expect(message).toContain("Rua das Flores, 123, São Paulo, SP");
      expect(message).toContain("https://www.google.com/maps/search/");
      expect(message).toContain("R$ 50.00");
    });

    it("should include formatted date and time", async () => {
      const startsAt = new Date("2026-06-20T14:00:00Z");
      const endsAt = new Date("2026-06-20T14:30:00Z");

      const message = await formatConfirmationMessage(
        barbershopId,
        barberId,
        serviceId,
        "Maria Santos",
        startsAt,
        endsAt
      );

      // A data deve estar formatada em português (dd/MM/yyyy)
      expect(message).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe("formatReminderMessage", () => {
    it("should format reminder message with maps link", async () => {
      const startsAt = new Date("2026-06-20T14:00:00Z");

      const message = await formatReminderMessage(
        barbershopId,
        barberId,
        serviceId,
        "João Silva",
        startsAt
      );

      expect(message).toContain("João Silva");
      expect(message).toContain("Lembrete");
      expect(message).toContain("Barbearia Teste WhatsApp Service");
      expect(message).toContain("João Barbeiro");
      expect(message).toContain("Corte de Cabelo");
      expect(message).toContain("Rua das Flores, 123, São Paulo, SP");
      expect(message).toContain("https://www.google.com/maps/search/");
    });
  });

  describe("sendWhatsappMessage", () => {
    it("should send message successfully", async () => {
      const result = await sendWhatsappMessage(
        barbershopId,
        "11987654321",
        "Teste de mensagem"
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("should handle disabled WhatsApp config", async () => {
      // Desabilitar WhatsApp
      await upsertWhatsappConfig({
        barbershopId,
        phoneNumber: "+5511987654321",
        apiKey: "test-api-key",
        enabled: false,
        sendConfirmation: true,
        sendReminder: true,
        reminderMinutesBefore: 60,
      });

      const result = await sendWhatsappMessage(
        barbershopId,
        "11987654321",
        "Teste de mensagem"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("não está configurado ou desabilitado");

      // Reabilitar para outros testes
      await upsertWhatsappConfig({
        barbershopId,
        phoneNumber: "+5511987654321",
        apiKey: "test-api-key",
        enabled: true,
        sendConfirmation: true,
        sendReminder: true,
        reminderMinutesBefore: 60,
      });
    });

    it("should format phone number with country code", async () => {
      // Este teste valida que o número é formatado corretamente
      const result = await sendWhatsappMessage(
        barbershopId,
        "11987654321", // Sem +55
        "Teste de mensagem"
      );

      expect(result.success).toBe(true);
    });
  });

  describe("sendConfirmationMessage", () => {
    it("should send confirmation message with all details", async () => {
      const startsAt = new Date("2026-06-20T14:00:00Z");
      const endsAt = new Date("2026-06-20T14:30:00Z");

      const result = await sendConfirmationMessage(
        barbershopId,
        barberId,
        serviceId,
        "João Silva",
        "11987654321",
        startsAt,
        endsAt
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe("sendReminderMessage", () => {
    it("should send reminder message with all details", async () => {
      const startsAt = new Date("2026-06-20T14:00:00Z");

      const result = await sendReminderMessage(
        barbershopId,
        barberId,
        serviceId,
        "João Silva",
        "11987654321",
        startsAt
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });
});
