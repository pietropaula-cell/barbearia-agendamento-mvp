import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isBarbershopOpen, getBarbershopStatus, formatTime, getNextOpeningTime } from "./barbershopUtils";

describe("barbershopUtils", () => {
  beforeEach(() => {
    // Mock de Date para testes consistentes
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isBarbershopOpen", () => {
    it("deve retornar false se a barbearia estiver inativa", () => {
      const result = isBarbershopOpen("08:00", "18:00", false);
      expect(result).toBe(false);
    });

    it("deve retornar true se não houver horários configurados", () => {
      const result = isBarbershopOpen(undefined, undefined, true);
      expect(result).toBe(true);
    });

    it("deve retornar true se estiver dentro do horário de funcionamento", () => {
      // Simula 10:00
      vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0));
      const result = isBarbershopOpen("08:00", "18:00", true);
      expect(result).toBe(true);
    });

    it("deve retornar false se estiver fora do horário de funcionamento (antes)", () => {
      // Simula 07:00
      vi.setSystemTime(new Date(2024, 0, 1, 7, 0, 0));
      const result = isBarbershopOpen("08:00", "18:00", true);
      expect(result).toBe(false);
    });

    it("deve retornar false se estiver fora do horário de funcionamento (depois)", () => {
      // Simula 19:00
      vi.setSystemTime(new Date(2024, 0, 1, 19, 0, 0));
      const result = isBarbershopOpen("08:00", "18:00", true);
      expect(result).toBe(false);
    });

    it("deve retornar true no horário de abertura exato", () => {
      // Simula 08:00
      vi.setSystemTime(new Date(2024, 0, 1, 8, 0, 0));
      const result = isBarbershopOpen("08:00", "18:00", true);
      expect(result).toBe(true);
    });

    it("deve retornar false no horário de fechamento exato", () => {
      // Simula 18:00
      vi.setSystemTime(new Date(2024, 0, 1, 18, 0, 0));
      const result = isBarbershopOpen("08:00", "18:00", true);
      expect(result).toBe(false);
    });
  });

  describe("getBarbershopStatus", () => {
    it("deve retornar 'closed' e 'Fechado' se inativa", () => {
      const result = getBarbershopStatus("08:00", "18:00", false);
      expect(result).toEqual({ status: "closed", label: "Fechado" });
    });

    it("deve retornar 'open' e 'Aberto' se dentro do horário", () => {
      vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0));
      const result = getBarbershopStatus("08:00", "18:00", true);
      expect(result).toEqual({ status: "open", label: "Aberto" });
    });

    it("deve retornar 'closed' e 'Fechado' se fora do horário", () => {
      vi.setSystemTime(new Date(2024, 0, 1, 19, 0, 0));
      const result = getBarbershopStatus("08:00", "18:00", true);
      expect(result).toEqual({ status: "closed", label: "Fechado" });
    });
  });

  describe("formatTime", () => {
    it("deve retornar o horário formatado", () => {
      const result = formatTime("08:30");
      expect(result).toBe("08:30");
    });

    it("deve retornar '-' se undefined", () => {
      const result = formatTime(undefined);
      expect(result).toBe("-");
    });
  });

  describe("getNextOpeningTime", () => {
    it("deve retornar 'Sempre aberto' se sem horários", () => {
      const result = getNextOpeningTime(undefined, undefined);
      expect(result).toBe("Sempre aberto");
    });

    it("deve retornar horário de abertura se antes de abrir", () => {
      vi.setSystemTime(new Date(2024, 0, 1, 7, 0, 0));
      const result = getNextOpeningTime("08:00", "18:00");
      expect(result).toBe("Abre às 08:00");
    });

    it("deve retornar horário de fechamento se aberto", () => {
      vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0));
      const result = getNextOpeningTime("08:00", "18:00");
      expect(result).toBe("Fecha às 18:00");
    });

    it("deve retornar 'Abre amanhã' se depois de fechar", () => {
      vi.setSystemTime(new Date(2024, 0, 1, 19, 0, 0));
      const result = getNextOpeningTime("08:00", "18:00");
      expect(result).toBe("Abre amanhã às 08:00");
    });
  });
});
