/**
 * Calcula se uma barbearia está aberta ou fechada
 */
export function isBarbershopOpen(
  openingTime: string | undefined,
  closingTime: string | undefined,
  active: boolean = true
): boolean {
  if (!active) return false;
  if (!openingTime || !closingTime) return true; // Se não tiver horário configurado, assume aberto

  try {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    // Comparar horários como strings (formato HH:MM)
    return currentTime >= openingTime && currentTime < closingTime;
  } catch (error) {
    console.error("Erro ao calcular status da barbearia:", error);
    return true;
  }
}

/**
 * Verifica se há barbeiros disponíveis agora
 */
export function hasAvailableBarbers(
  barbers: Array<{ id: number; name: string; workingHours?: string }> | undefined
): boolean {
  if (!barbers || barbers.length === 0) return false;
  
  // Se não temos informação de horário dos barbeiros, assumir que estão disponíveis
  // (isso será verificado no backend ao agendar)
  return true;
}

/**
 * Retorna o status da barbearia como string
 * Se barbers for fornecido, verifica se há barbeiros disponíveis AGORA
 */
export function getBarbershopStatus(
  openingTime: string | undefined,
  closingTime: string | undefined,
  active: boolean = true,
  barbers?: Array<{ id: number; name: string; workingHours?: string }>
): { status: "open" | "closed"; label: string } {
  if (!active) {
    return { status: "closed", label: "Fechado" };
  }

  // Se não há barbeiros disponíveis agora, mostrar como sem barbeiros
  if (barbers !== undefined && !hasAvailableBarbers(barbers)) {
    return { status: "closed", label: "Sem barbeiros" };
  }

  const isOpen = isBarbershopOpen(openingTime, closingTime, active);
  return {
    status: isOpen ? "open" : "closed",
    label: isOpen ? "Aberto" : "Fechado",
  };
}

/**
 * Formata horário para exibição
 */
export function formatTime(time: string | undefined): string {
  if (!time) return "-";
  return time; // Já está em formato HH:MM
}

/**
 * Retorna próximo horário de abertura
 */
export function getNextOpeningTime(
  openingTime: string | undefined,
  closingTime: string | undefined
): string {
  if (!openingTime || !closingTime) return "Sempre aberto";

  try {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    if (currentTime < openingTime) {
      return `Abre às ${openingTime}`;
    } else if (currentTime >= closingTime) {
      return `Abre amanhã às ${openingTime}`;
    } else {
      return `Fecha às ${closingTime}`;
    }
  } catch (error) {
    console.error("Erro ao calcular próximo horário:", error);
    return "-";
  }
}
