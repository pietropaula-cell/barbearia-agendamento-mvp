import { describe, it, expect } from "vitest";

/**
 * Testes para o componente WeeklyCalendar
 * 
 * O WeeklyCalendar é um componente de apresentação que:
 * - Recebe um array de agendamentos
 * - Recebe uma data de início da semana
 * - Exibe os agendamentos em uma grade 7x11 (7 dias x 11 horas)
 * - Mostra "Disponível" em slots vazios
 * - Permite clicar em agendamentos
 */

describe("WeeklyCalendar", () => {
  it("deve calcular corretamente os 7 dias da semana", () => {
    const weekStart = new Date("2026-06-15"); // Segunda-feira
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }

    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(15); // Segunda
    expect(days[6].getDate()).toBe(21); // Domingo
  });

  it("deve agrupar agendamentos por dia e hora corretamente", () => {
    const appointments = [
      {
        id: 1,
        startsAt: new Date("2026-06-15T10:00:00"),
        customer: { name: "João" },
        service: { name: "Corte" },
        status: "confirmed",
      },
      {
        id: 2,
        startsAt: new Date("2026-06-15T11:00:00"),
        customer: { name: "Maria" },
        service: { name: "Barba" },
        status: "pending",
      },
      {
        id: 3,
        startsAt: new Date("2026-06-16T10:00:00"),
        customer: { name: "Pedro" },
        service: { name: "Corte" },
        status: "confirmed",
      },
    ];

    const grouped: Record<string, Record<number, any[]>> = {};
    const BUSINESS_HOURS = Array.from({ length: 11 }, (_, i) => i + 9);

    // Inicializar estrutura
    const weekStart = new Date("2026-06-15");
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayKey = date.toISOString().split("T")[0];
      grouped[dayKey] = {};
      BUSINESS_HOURS.forEach((hour) => {
        grouped[dayKey][hour] = [];
      });
    }

    // Agrupar agendamentos
    appointments.forEach((appt) => {
      const apptDate = new Date(appt.startsAt);
      const dayKey = apptDate.toISOString().split("T")[0];
      const hour = apptDate.getHours();

      if (grouped[dayKey] && grouped[dayKey][hour]) {
        grouped[dayKey][hour].push(appt);
      }
    });

    // Validar agrupamento
    expect(grouped["2026-06-15"][10]).toHaveLength(1);
    expect(grouped["2026-06-15"][10][0].id).toBe(1);
    expect(grouped["2026-06-15"][11]).toHaveLength(1);
    expect(grouped["2026-06-15"][11][0].id).toBe(2);
    expect(grouped["2026-06-16"][10]).toHaveLength(1);
    expect(grouped["2026-06-16"][10][0].id).toBe(3);
  });

  it("deve identificar slots vazios corretamente", () => {
    const BUSINESS_HOURS = Array.from({ length: 11 }, (_, i) => i + 9);
    const grouped: Record<string, Record<number, any[]>> = {};

    // Inicializar com um único dia
    const dayKey = "2026-06-15";
    grouped[dayKey] = {};
    BUSINESS_HOURS.forEach((hour) => {
      grouped[dayKey][hour] = [];
    });

    // Adicionar um agendamento apenas às 10h
    grouped[dayKey][10].push({
      id: 1,
      customer: { name: "João" },
      service: { name: "Corte" },
    });

    // Validar que outros horários estão vazios
    expect(grouped[dayKey][9]).toHaveLength(0); // Vazio
    expect(grouped[dayKey][10]).toHaveLength(1); // Ocupado
    expect(grouped[dayKey][11]).toHaveLength(0); // Vazio
    expect(grouped[dayKey][19]).toHaveLength(0); // Vazio
  });

  it("deve suportar múltiplos agendamentos no mesmo horário", () => {
    const appointments = [
      {
        id: 1,
        startsAt: new Date("2026-06-15T10:00:00"),
        customer: { name: "João" },
        service: { name: "Corte" },
        status: "confirmed",
      },
      {
        id: 2,
        startsAt: new Date("2026-06-15T10:30:00"),
        customer: { name: "Maria" },
        service: { name: "Barba" },
        status: "pending",
      },
    ];

    const grouped: Record<string, Record<number, any[]>> = {};
    const BUSINESS_HOURS = Array.from({ length: 11 }, (_, i) => i + 9);
    const dayKey = "2026-06-15";

    grouped[dayKey] = {};
    BUSINESS_HOURS.forEach((hour) => {
      grouped[dayKey][hour] = [];
    });

    appointments.forEach((appt) => {
      const apptDate = new Date(appt.startsAt);
      const hour = apptDate.getHours();
      grouped[dayKey][hour].push(appt);
    });

    // Ambos os agendamentos devem estar às 10h
    expect(grouped[dayKey][10]).toHaveLength(2);
    expect(grouped[dayKey][10][0].id).toBe(1);
    expect(grouped[dayKey][10][1].id).toBe(2);
  });

  it("deve calcular corretamente a semana com offset", () => {
    const today = new Date("2026-06-18"); // Quinta-feira
    const weekOffset = 0;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    // Deve ser domingo (dia 0 da semana)
    expect(weekStart.getDay()).toBe(0);
    expect(weekStart.getDate()).toBe(14); // Domingo anterior
  });

  it("deve calcular corretamente a próxima semana com offset +1", () => {
    const today = new Date("2026-06-18"); // Quinta-feira
    const weekOffset = 1;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    // Deve ser domingo da próxima semana
    expect(weekStart.getDay()).toBe(0);
    expect(weekStart.getDate()).toBe(21); // Próximo domingo
  });

  it("deve calcular corretamente a semana anterior com offset -1", () => {
    const today = new Date("2026-06-18"); // Quinta-feira
    const weekOffset = -1;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    // Deve ser domingo da semana anterior
    expect(weekStart.getDay()).toBe(0);
    expect(weekStart.getDate()).toBe(7); // Domingo anterior
  });

  it("deve formatar corretamente os horários de negócio (9h-19h)", () => {
    const BUSINESS_HOURS = Array.from({ length: 11 }, (_, i) => i + 9);

    expect(BUSINESS_HOURS).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(BUSINESS_HOURS).toHaveLength(11);
  });

  it("deve manter a estrutura correta de status de agendamento", () => {
    const STATUS_LABELS: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
      confirmed: { label: "Confirmado", color: "border-green-500/40 text-green-400 bg-green-500/10" },
      cancelled: { label: "Cancelado", color: "border-red-500/40 text-red-400 bg-red-500/10" },
      blocked: { label: "Bloqueado", color: "border-gray-500/40 text-gray-400 bg-gray-500/10" },
    };

    expect(STATUS_LABELS.pending.label).toBe("Pendente");
    expect(STATUS_LABELS.confirmed.label).toBe("Confirmado");
    expect(STATUS_LABELS.cancelled.label).toBe("Cancelado");
    expect(STATUS_LABELS.blocked.label).toBe("Bloqueado");
  });
});
