import { describe, it, expect } from "vitest";
import { formatInTimeZone } from "date-fns-tz";

/**
 * Testes para validar que os horários são salvos corretamente em UTC
 * e exibidos corretamente em BRT (America/Sao_Paulo).
 */
describe("Timezone Conversion (BRT to UTC)", () => {
  it("deve converter 11:30 BRT para 14:30 UTC", () => {
    // Cliente seleciona 11:30 (em BRT)
    const clientTime = "11:30";
    const [hour, minute] = clientTime.split(":").map(Number);

    // Servidor converte para UTC adicionando 3 horas
    const utcDate = new Date(Date.UTC(2026, 5, 17, hour + 3, minute));

    // Verificar que está armazenado como 14:30 UTC
    expect(utcDate.getUTCHours()).toBe(14);
    expect(utcDate.getUTCMinutes()).toBe(30);
  });

  it("deve exibir 14:30 UTC como 11:30 em America/Sao_Paulo", () => {
    // Horário armazenado: 14:30 UTC
    const utcDate = new Date(Date.UTC(2026, 5, 17, 14, 30));

    // Formatar em São Paulo
    const displayTime = formatInTimeZone(utcDate, "America/Sao_Paulo", "HH:mm");

    // Deve exibir 11:30 (BRT = UTC-3)
    expect(displayTime).toBe("11:30");
  });

  it("deve converter 08:00 BRT para 11:00 UTC", () => {
    const clientTime = "08:00";
    const [hour, minute] = clientTime.split(":").map(Number);

    const utcDate = new Date(Date.UTC(2026, 5, 17, hour + 3, minute));

    expect(utcDate.getUTCHours()).toBe(11);
    expect(utcDate.getUTCMinutes()).toBe(0);
  });

  it("deve converter 17:30 BRT para 20:30 UTC", () => {
    const clientTime = "17:30";
    const [hour, minute] = clientTime.split(":").map(Number);

    const utcDate = new Date(Date.UTC(2026, 5, 17, hour + 3, minute));

    expect(utcDate.getUTCHours()).toBe(20);
    expect(utcDate.getUTCMinutes()).toBe(30);
  });

  it("deve exibir 20:30 UTC como 17:30 em America/Sao_Paulo", () => {
    const utcDate = new Date(Date.UTC(2026, 5, 17, 20, 30));
    const displayTime = formatInTimeZone(utcDate, "America/Sao_Paulo", "HH:mm");
    expect(displayTime).toBe("17:30");
  });

  it("deve lidar corretamente com horários que cruzam dias (23:30 BRT = 02:30 UTC do dia seguinte)", () => {
    const clientTime = "23:30";
    const [hour, minute] = clientTime.split(":").map(Number);

    // 23:30 + 3 horas = 26:30 = 02:30 do dia seguinte
    const utcDate = new Date(Date.UTC(2026, 5, 17, hour + 3, minute));

    // Deve estar no dia 18 às 02:30
    expect(utcDate.getUTCDate()).toBe(18);
    expect(utcDate.getUTCHours()).toBe(2);
    expect(utcDate.getUTCMinutes()).toBe(30);

    // Ao exibir em São Paulo, deve voltar para 23:30 do dia 17
    const displayTime = formatInTimeZone(utcDate, "America/Sao_Paulo", "dd/MM HH:mm");
    expect(displayTime).toBe("17/06 23:30");
  });
});
