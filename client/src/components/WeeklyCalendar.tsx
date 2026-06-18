import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { formatTimeBR } from "@/lib/dateUtils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
  confirmed: { label: "Confirmado", color: "border-green-500/40 text-green-400 bg-green-500/10" },
  cancelled: { label: "Cancelado", color: "border-red-500/40 text-red-400 bg-red-500/10" },
  blocked: { label: "Bloqueado", color: "border-gray-500/40 text-gray-400 bg-gray-500/10" },
};

const BUSINESS_HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9h até 19h

interface WeeklyCalendarProps {
  appointments: any[];
  weekStart: Date;
  onAppointmentClick?: (appointment: any) => void;
  onEmptySlotClick?: (date: Date, hour: number) => void;
}

export function WeeklyCalendar({ appointments, weekStart, onAppointmentClick, onEmptySlotClick }: WeeklyCalendarProps) {
  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      result.push(date);
    }
    return result;
  }, [weekStart]);

  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  // Agrupar agendamentos por dia e hora
  const appointmentsByDayAndHour = useMemo(() => {
    const grouped: Record<string, Record<number, any[]>> = {};
    
    days.forEach((day) => {
      const dayKey = day.toISOString().split("T")[0];
      grouped[dayKey] = {};
      BUSINESS_HOURS.forEach((hour) => {
        grouped[dayKey][hour] = [];
      });
    });

    appointments.forEach((appt) => {
      const apptDate = new Date(appt.startsAt);
      const dayKey = apptDate.toISOString().split("T")[0];
      const hour = apptDate.getHours();
      
      if (grouped[dayKey] && grouped[dayKey][hour]) {
        grouped[dayKey][hour].push(appt);
      }
    });

    return grouped;
  }, [appointments, days]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        {/* Header com dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map((day, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground uppercase">{dayNames[day.getDay()]}</p>
              <p className="text-sm font-semibold text-foreground">{day.getDate()}</p>
              <p className="text-xs text-muted-foreground">
                {day.toLocaleDateString("pt-BR", { month: "short" })}
              </p>
            </div>
          ))}
        </div>

        {/* Grid de horários */}
        <div className="space-y-2">
          {BUSINESS_HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-2 items-start">
              {/* Label da hora */}
              <div className="text-xs text-muted-foreground font-medium pt-2 pr-2 text-right">
                {String(hour).padStart(2, "0")}:00
              </div>

              {/* Colunas de dias */}
              {days.map((day, dayIdx) => {
                const dayKey = day.toISOString().split("T")[0];
                const appts = appointmentsByDayAndHour[dayKey]?.[hour] || [];

                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    className="bg-background border border-border/50 rounded-lg p-2 min-h-24 flex flex-col gap-1 cursor-pointer hover:border-border transition-colors"
                    onClick={() => {
                      if (appts.length === 0) {
                        onEmptySlotClick?.(day, hour);
                      }
                    }}
                  >
                    {appts.length > 0 ? (
                      appts.map((appt) => {
                        const st = STATUS_LABELS[appt.status] ?? STATUS_LABELS.pending;
                        return (
                          <div
                            key={appt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick?.(appt);
                            }}
                            className="bg-card border border-border rounded-lg p-2 cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <Badge variant="outline" className={`text-xs ${st.color} mb-1`}>
                              {st.label}
                            </Badge>
                            <p className="text-xs font-semibold text-foreground truncate">
                              {appt.customer?.name ?? "Cliente"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {appt.service?.name}
                            </p>
                            <p className="text-xs text-primary font-medium">
                              {formatTimeBR(new Date(appt.startsAt))}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-muted-foreground/50 flex items-center justify-center h-full">
                        Disponível
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
