import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

// Timezone padrão do Brasil (BRT = UTC-3)
const TZ = "America/Sao_Paulo";

/**
 * Formata uma data no timezone de São Paulo (BRT/BRST).
 * Usa o mesmo formato que date-fns.format mas corrige o offset UTC.
 */
export function formatBR(date: Date | string | number, fmt: string): string {
  return formatInTimeZone(new Date(date), TZ, fmt, { locale: ptBR });
}

/**
 * Retorna apenas a hora no formato HH:mm no timezone do Brasil.
 */
export function formatTimeBR(date: Date | string | number): string {
  return formatInTimeZone(new Date(date), TZ, "HH:mm");
}

/**
 * Retorna a data no formato dd/MM/yyyy no timezone do Brasil.
 */
export function formatDateBR(date: Date | string | number): string {
  return formatInTimeZone(new Date(date), TZ, "dd/MM/yyyy");
}

/**
 * Retorna data e hora no formato dd/MM/yyyy HH:mm no timezone do Brasil.
 */
export function formatDateTimeBR(date: Date | string | number): string {
  return formatInTimeZone(new Date(date), TZ, "dd/MM/yyyy HH:mm");
}

/**
 * Retorna data por extenso no formato "dd 'de' MMMM 'de' yyyy" no timezone do Brasil.
 */
export function formatDateLongBR(date: Date | string | number): string {
  return formatInTimeZone(new Date(date), TZ, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}
