import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppTemplatesTabProps {
  barbershopId: number | null;
}

export function WhatsAppTemplatesTab({ barbershopId }: WhatsAppTemplatesTabProps) {
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestResult, setShowTestResult] = useState(false);

  const { data: templates } = trpc.whatsapp.getMessageTemplates.useQuery(
    { barbershopId: barbershopId || 0 },
    { enabled: !!barbershopId }
  );

  const sendTestMut = trpc.whatsapp.sendTestMessages.useMutation({
    onSuccess: () => {
      toast.success("Mensagens de teste enviadas com sucesso para 48991447736!");
    },
    onError: (e) => toast.error(e.message),
  });

  const testMut = trpc.whatsapp.testTemplate.useMutation({
    onSuccess: (data) => {
      setTestResult(data);
      setShowTestResult(true);
      toast.success("Mensagem de teste formatada com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

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
    if (!barbershopId) {
      toast.error("Selecione uma barbearia");
      return;
    }
    if (!confirmationMessage || !reminderMessage) {
      toast.error("Preencha ambas as mensagens");
      return;
    }
    updateMut.mutate({
      barbershopId,
      confirmationMessage,
      reminderMessage,
    });
  };

  const handleTestMessage = (type: "confirmation" | "reminder") => {
    if (!barbershopId) {
      toast.error("Selecione uma barbearia");
      return;
    }
    const message = type === "confirmation" ? confirmationMessage : reminderMessage;
    if (!message) {
      toast.error("Preencha a mensagem antes de testar");
      return;
    }
    testMut.mutate({
      barbershopId,
      messageType: type,
      message,
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
              Variáveis: {'{cliente}'}, {'{barbeiro}'}, {'{serviço}'}, {'{data}'}, {'{hora}'}, {'{valor}'}, {'{endereco}'}, {'{linkMaps}'}, {'{linkCancelamento}'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="bg-card border-border mt-2"
              onClick={() => handleTestMessage("confirmation")}
              disabled={testMut.isPending || !confirmationMessage}
            >
              {testMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!testMut.isPending && <Send className="w-4 h-4 mr-2" />}
              Testar Mensagem
            </Button>
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
              Variáveis: {'{cliente}'}, {'{barbeiro}'}, {'{serviço}'}, {'{data}'}, {'{hora}'}, {'{endereco}'}, {'{linkMaps}'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="bg-card border-border mt-2"
              onClick={() => handleTestMessage("reminder")}
              disabled={testMut.isPending || !reminderMessage}
            >
              {testMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!testMut.isPending && <Send className="w-4 h-4 mr-2" />}
              Testar Mensagem
            </Button>
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
              variant="outline"
              className="bg-card border-border flex-1"
              onClick={() => sendTestMut.mutate({ confirmationMessage, reminderMessage })}
              disabled={sendTestMut.isPending || !confirmationMessage || !reminderMessage}
            >
              {sendTestMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!sendTestMut.isPending && <Send className="w-4 h-4 mr-2" />}
              Testar Envio
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

      {showTestResult && testResult && (
        <Card className="bg-primary/5 border border-primary/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Prévia da Mensagem de {testResult.messageType === "confirmation" ? "Confirmação" : "Lembrete"}
            </h3>
            <Button
              variant="outline"
              className="bg-card border-border"
              onClick={() => setShowTestResult(false)}
            >
              Fechar
            </Button>
          </div>
          <div className="bg-background border border-border rounded p-4 space-y-3">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {testResult.formattedMessage}
            </p>
          </div>
          <div className="bg-background border border-border rounded p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Dados de Exemplo Utilizados:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {Object.entries(testResult.exampleData).map(([key, value]) => (
                <div key={key}>
                  <span className="font-mono">{'{' + key + '}'}</span>: {String(value)}
                </div>
              ))}
            </div>
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
          • {'{barbearia}'} - Nome da barbearia
          <br />
          • {'{serviço}'} - Nome do serviço
          <br />
          • {'{valor}'} - Valor do serviço (ex: R$ 50,00)
          <br />
          • {'{data}'} - Data do agendamento (ex: 17/06/2026)
          <br />
          • {'{hora}'} - Hora do agendamento (ex: 14:30)
          <br />
          • {'{endereco}'} - Endereço da barbearia
          <br />
          • {'{linkMaps}'} - Link do Google Maps com o endereço
          <br />
          • {'{linkCancelamento}'} - Link para cancelar o agendamento
        </p>
      </Card>
    </div>
  );
}
