import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

export function WhatsAppConfigTab() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(60);
  const [isEditing, setIsEditing] = useState(false);

  const { data: config, isLoading } = trpc.whatsapp.getConfig.useQuery();

  const upsertMut = trpc.whatsapp.upsertConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração WhatsApp salva com sucesso!");
      setIsEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.whatsapp.deleteConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração WhatsApp removida!");
      setPhoneNumber("");
      setApiKey("");
      setEnabled(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const testMut = trpc.whatsapp.testConnection.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (config) {
      setPhoneNumber(config.phoneNumber);
      setApiKey(config.apiKey);
      setEnabled(config.enabled);
      setSendConfirmation(config.sendConfirmation);
      setSendReminder(config.sendReminder);
      setReminderMinutesBefore(config.reminderMinutesBefore);
    }
  }, [config]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !apiKey) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    upsertMut.mutate({
      phoneNumber,
      apiKey,
      enabled,
      sendConfirmation,
      sendReminder,
      reminderMinutesBefore,
    });
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja remover a configuração WhatsApp?")) {
      deleteMut.mutate(undefined);
    }
  };

  const handleTestConnection = () => {
    if (!phoneNumber || !apiKey) {
      toast.error("Preencha número de telefone e API key para testar");
      return;
    }
    testMut.mutate({ phoneNumber, apiKey });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card className="bg-card border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">WhatsApp Integrado</p>
              <p className="text-sm text-muted-foreground">
                {enabled ? "Ativo - Notificações habilitadas" : "Inativo - Configure para ativar"}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            enabled
              ? "bg-green-500/10 text-green-400 border border-green-500/40"
              : "bg-gray-500/10 text-gray-400 border border-gray-500/40"
          }`}>
            {enabled ? "Ativo" : "Inativo"}
          </div>
        </div>
      </Card>

      {/* Configuration Form */}
      {!isEditing && config ? (
        <Card className="bg-card border-border p-6">
          <div className="space-y-4 mb-6">
            <div>
              <Label className="text-muted-foreground text-sm">Número de Telefone</Label>
              <p className="text-foreground font-medium">{phoneNumber}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Chave API</Label>
              <p className="text-foreground font-medium">••••••••{apiKey.slice(-4)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Confirmação de Agendamento</Label>
                <p className="text-foreground font-medium">{sendConfirmation ? "Ativado" : "Desativado"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Lembrete</Label>
                <p className="text-foreground font-medium">
                  {sendReminder ? `${reminderMinutesBefore} minutos antes` : "Desativado"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-card border-border"
              onClick={handleTestConnection}
              disabled={testMut.isPending}
            >
              {testMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!testMut.isPending && <Send className="w-4 h-4 mr-2" />}
              Testar Conexão
            </Button>
            <Button
              variant="outline"
              className="bg-card border-border flex-1"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              className="bg-card border-border hover:border-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remover
            </Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <Card className="bg-card border-border p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-foreground mb-1.5 block">Número de Telefone WhatsApp *</Label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+55 11 98765-4321"
                  className="bg-background border-border"
                  required
                  disabled={upsertMut.isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Inclua o código do país (ex: +55 para Brasil)
                </p>
              </div>

              <div>
                <Label className="text-foreground mb-1.5 block">Chave API WhatsApp *</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Sua chave de API"
                  className="bg-background border-border"
                  required
                  disabled={upsertMut.isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenha sua chave em seu painel de controle do WhatsApp Business
                </p>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Ativar WhatsApp</Label>
                    <p className="text-xs text-muted-foreground">Habilitar notificações por WhatsApp</p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={setEnabled}
                    disabled={upsertMut.isPending}
                  />
                </div>

                {enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">Confirmação de Agendamento</Label>
                        <p className="text-xs text-muted-foreground">Enviar confirmação ao cliente</p>
                      </div>
                      <Switch
                        checked={sendConfirmation}
                        onCheckedChange={setSendConfirmation}
                        disabled={upsertMut.isPending}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">Lembrete Automático</Label>
                        <p className="text-xs text-muted-foreground">Enviar lembrete antes do agendamento</p>
                      </div>
                      <Switch
                        checked={sendReminder}
                        onCheckedChange={setSendReminder}
                        disabled={upsertMut.isPending}
                      />
                    </div>

                    {sendReminder && (
                      <div>
                        <Label className="text-foreground mb-1.5 block">Minutos Antes do Agendamento</Label>
                        <Input
                          type="number"
                          min="1"
                          max="1440"
                          value={reminderMinutesBefore}
                          onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                          className="bg-background border-border"
                          disabled={upsertMut.isPending}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-6 border-t border-border mt-6">
              {config && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-card border-border"
                    onClick={() => setIsEditing(false)}
                    disabled={upsertMut.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-card border-border"
                    onClick={handleTestConnection}
                    disabled={testMut.isPending}
                  >
                    {testMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {!testMut.isPending && <Send className="w-4 h-4 mr-2" />}
                    Testar
                  </Button>
                </>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={upsertMut.isPending}
              >
                {upsertMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {config ? "Atualizar" : "Configurar"} WhatsApp
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* Info Box */}
      <Card className="bg-primary/10 border border-primary/40 p-4">
        <p className="text-sm text-foreground">
          <strong>Como funciona:</strong> Quando um cliente faz um agendamento, ele receberá uma mensagem de confirmação no WhatsApp. 
          Se habilitado, também receberá um lembrete automático antes do horário marcado.
        </p>
      </Card>
    </div>
  );
}
