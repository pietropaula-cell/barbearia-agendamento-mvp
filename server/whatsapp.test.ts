import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, upsertWhatsappConfig, getWhatsappConfig, deleteWhatsappConfig } from "./db";
import { createBarbershop } from "./db";

describe("WhatsApp Configuration", () => {
  let barbershopId: number;

  beforeAll(async () => {
    // Criar uma barbearia de teste
    barbershopId = await createBarbershop({
      name: "Barbearia Teste WhatsApp",
      slug: "barbearia-whatsapp-test",
      active: true,
    });
  });

  it("should create a new WhatsApp config", async () => {
    const config = await upsertWhatsappConfig({
      barbershopId,
      phoneNumber: "+5511987654321",
      apiKey: "test-api-key-123",
      enabled: true,
      sendConfirmation: true,
      sendReminder: true,
      reminderMinutesBefore: 60,
    });

    expect(config).toBeDefined();
    expect(config.phoneNumber).toBe("+5511987654321");
    expect(config.enabled).toBe(true);
    expect(config.sendConfirmation).toBe(true);
    expect(config.sendReminder).toBe(true);
    expect(config.reminderMinutesBefore).toBe(60);
  });

  it("should retrieve WhatsApp config", async () => {
    const config = await getWhatsappConfig(barbershopId);

    expect(config).toBeDefined();
    expect(config?.phoneNumber).toBe("+5511987654321");
    expect(config?.enabled).toBe(true);
  });

  it("should update existing WhatsApp config", async () => {
    const updatedConfig = await upsertWhatsappConfig({
      barbershopId,
      phoneNumber: "+5511999999999",
      apiKey: "new-api-key-456",
      enabled: false,
      sendConfirmation: false,
      sendReminder: false,
      reminderMinutesBefore: 30,
    });

    expect(updatedConfig.phoneNumber).toBe("+5511999999999");
    expect(updatedConfig.enabled).toBe(false);
    expect(updatedConfig.reminderMinutesBefore).toBe(30);
  });

  it("should delete WhatsApp config", async () => {
    await deleteWhatsappConfig(barbershopId);
    const config = await getWhatsappConfig(barbershopId);

    expect(config).toBeNull();
  });

  it("should return null for non-existent config", async () => {
    const config = await getWhatsappConfig(99999);
    expect(config).toBeNull();
  });
});
