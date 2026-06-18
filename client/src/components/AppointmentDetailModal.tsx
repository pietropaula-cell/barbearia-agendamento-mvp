import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Scissors, DollarSign, X } from "lucide-react";
import { formatDateBR, formatTimeBR } from "@/lib/dateUtils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
  confirmed: { label: "Confirmado", color: "border-green-500/40 text-green-400 bg-green-500/10" },
  cancelled: { label: "Cancelado", color: "border-red-500/40 text-red-400 bg-red-500/10" },
  blocked: { label: "Bloqueado", color: "border-gray-500/40 text-gray-400 bg-gray-500/10" },
};

interface AppointmentDetailModalProps {
  appointment: any | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (appointmentId: number) => void;
  onCancel?: (appointmentId: number) => void;
  isLoading?: boolean;
}

export function AppointmentDetailModal({
  appointment,
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  isLoading = false,
}: AppointmentDetailModalProps) {
  if (!appointment) return null;

  const st = STATUS_LABELS[appointment.status] ?? STATUS_LABELS.pending;
  const startTime = new Date(appointment.startsAt);
  const endTime = new Date(appointment.endsAt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-foreground">Detalhes do Agendamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div>
            <Badge variant="outline" className={`text-xs ${st.color}`}>
              {st.label}
            </Badge>
          </div>

          {/* Cliente */}
          {appointment.status !== "blocked" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Cliente</span>
              </div>
              <p className="text-sm font-semibold text-foreground ml-6">
                {appointment.customer?.name ?? "N/A"}
              </p>
              {appointment.customer?.phone && (
                <p className="text-xs text-muted-foreground ml-6">
                  {appointment.customer.phone}
                </p>
              )}
            </div>
          )}

          {/* Serviço */}
          {appointment.status !== "blocked" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Serviço</span>
              </div>
              <p className="text-sm font-semibold text-foreground ml-6">
                {appointment.service?.name ?? "N/A"}
              </p>
            </div>
          )}

          {/* Barbeiro */}
          {appointment.barber && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Barbeiro</span>
              </div>
              <p className="text-sm font-semibold text-foreground ml-6">
                {appointment.barber.name}
              </p>
            </div>
          )}

          {/* Data */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Data</span>
            </div>
            <p className="text-sm font-semibold text-foreground ml-6">
              {formatDateBR(startTime)}
            </p>
          </div>

          {/* Horário */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Horário</span>
            </div>
            <p className="text-sm font-semibold text-foreground ml-6">
              {formatTimeBR(startTime)} — {formatTimeBR(endTime)}
            </p>
          </div>

          {/* Preço */}
          {appointment.service?.price && appointment.status !== "blocked" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Preço</span>
              </div>
              <p className="text-sm font-semibold text-primary ml-6">
                R$ {Number(appointment.service.price).toFixed(2)}
              </p>
            </div>
          )}

          {/* Motivo (para bloqueios) */}
          {appointment.status === "blocked" && appointment.notes && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Motivo</span>
              <p className="text-sm text-foreground ml-4 italic">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t border-border">
            {appointment.status === "pending" && (
              <Button
                className="flex-1"
                onClick={() => {
                  onConfirm?.(appointment.id);
                  onClose();
                }}
                disabled={isLoading}
              >
                Confirmar
              </Button>
            )}
            {appointment.status !== "cancelled" && appointment.status !== "blocked" && (
              <Button
                variant="outline"
                className="flex-1 bg-card border-border hover:border-destructive hover:text-destructive"
                onClick={() => {
                  onCancel?.(appointment.id);
                  onClose();
                }}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 bg-card border-border"
              onClick={onClose}
              disabled={isLoading}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
