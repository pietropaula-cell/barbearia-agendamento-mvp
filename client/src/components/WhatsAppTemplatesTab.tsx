import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function WhatsAppTemplatesTab() {
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: templates } = trpc.whatsapp.getMessageTemplates.useQuery();

  const updateMut = trpc.whatsapp.updateMessageTemplates.useMutation({
    onSuccess: () => {
      toast.success("Modelos de mensagem atualizados com sucesso!");
      setIsEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (templates) {
      setConfirmationMessage(templates.confirmationMessage || "");
      setReminderMessage(templates.reminderMessage || "");
    }
  }, [templates]);

  const handleSave = () => {
    if (!confirmationMessage || !reminderMessage) {
      toast.error("Preencha ambas as mensagens");
      return;
    }
    updateMut.mutate({
      confirmationMessage,
      reminderMessage,
    });
  };

  return (
    <div className="space-y-6">
      {!isEditing ? (
        <div className="space-y-4">
          <Card className="bg-card border-border p-6 space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">Mensagem de Confirmação</Label>
              <p className="text-foreground text-sm mt-2 p-3 bg-background rounded border border-border whitespace-pre-wrap">
                {confirmationMessage || "Nenhuma mensagem configurada"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Mensagem de Lembrete</Label>
              <p className="text-foreground text-sm mt-2 p-3 bg-background rounded border border-border whitespace-pre-wrap">
                {reminderMessage || "Nenhuma mensagem configurada"}
              </p>
            </div>
            <Button
              variant="outline"
              className="bg-card border-border w-full"
              onClick={() => setIsEditing(true)}
            >
              Editar Modelos
            </Button>
          </Card>
        </div>
      ) : (
        <Card className="bg-card border-border p-6 space-y-4">
          <div>
            <Label className="text-foreground mb-2 block">Mensagem de Confirmação *</Label>
            <textarea
              value={confirmationMessage}
              onChange={(e) => setConfirmationMessage(e.target.value)}
              className="w-full p-3 bg-background border border-border rounded text-foreground text-sm font-mono"
              rows={6}
              placeholder="Olá {cliente}! Seu agendamento foi confirmado..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Variáveis: {'{cliente}'}, {'{barbeiro}'}, {'{serviço}'}, {'{data}'}, {'{hora}'}, {'{valor}'}, {'{endereco}'}
            </p>
          </div>
          <div>
            <Label className="text-foreground mb-2 block">Mensagem de Lembrete *</Label>
            <textarea
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              className="w-full p-3 bg-background border border-border rounded text-foreground text-sm font-mono"
              rows={6}
              placeholder="Olá {cliente}! Lembrete: seu agendamento é em 1 hora..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Variáveis: {'{cliente}'}, {'{barbeiro}'}, {'{serviço}'}, {'{data}'}, {'{hora}'}, {'{endereco}'}
            </p>
          </div>
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="bg-card border-border flex-1"
              onClick={() => setIsEditing(false)}
              disabled={updateMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Modelos
            </Button>
          </div>
        </Card>
      )}

      <Card className="bg-primary/10 border border-primary/40 p-4">
        <p className="text-sm text-foreground">
          <strong>Variáveis disponíveis:</strong>
          <br />
          • {'{cliente}'} - Nome do cliente
          <br />
          • {'{barbeiro}'} - Nome do barbeiro
          <br />
          • {'{serviço}'} - Nome do serviço
          <br />
          • {'{data}'} - Data do agendamento
          <br />
          • {'{hora}'} - Hora do agendamento
          <br />
          • {'{valor}'} - Valor do serviço
          <br />
          • {'{endereco}'} - Endereço da barbearia
        </p>
      </Card>
    </div>
  );
}
