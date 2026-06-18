import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDateBR } from "@/lib/dateUtils";

interface BlockSlotModalProps {
  date: Date | null;
  hour: number | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date, startHour: number, endHour: number, notes?: string) => void;
  isLoading?: boolean;
}

export function BlockSlotModal({
  date,
  hour,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: BlockSlotModalProps) {
  const [endHour, setEndHour] = useState(hour ? hour + 1 : 10);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (hour !== null && isOpen) {
      setEndHour(hour + 1);
      setNotes("");
    }
  }, [hour, isOpen]);

  if (!date || hour === null) return null;

  const handleConfirm = () => {
    if (endHour <= hour) {
      alert("Horário de fim deve ser após o início");
      return;
    }
    onConfirm(date, hour, endHour, notes || undefined);
    setNotes("");
    setEndHour(hour + 1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-foreground">Bloquear Horário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data
            </Label>
            <div className="bg-background border border-border rounded-lg p-2 text-sm text-foreground">
              {formatDateBR(date)}
            </div>
          </div>

          {/* Horário de Início */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Início
            </Label>
            <div className="bg-background border border-border rounded-lg p-2 text-sm text-foreground">
              {String(hour).padStart(2, "0")}:00
            </div>
          </div>

          {/* Horário de Fim */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Fim
            </Label>
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground"
              disabled={isLoading}
            >
              {Array.from({ length: 20 - (hour || 0) }, (_, i) => hour! + i + 1).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground">
              Motivo (opcional)
            </Label>
            <Input
              id="notes"
              placeholder="Ex: Pausa para almoço, manutenção..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background border-border"
              disabled={isLoading}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 bg-card border-border"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Bloquear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
