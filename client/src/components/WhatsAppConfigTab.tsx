import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MessageCircle, Send, Clock } from "lucide-react";
import { toast } from "sonner";

export function WhatsAppConfigTab() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [isEditingTemplates, setIsEditingTemplates] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestResult, setShowTestResult] = useState(false);

  const { data: config, isLoading } = trpc.whatsapp.getConfig.useQuery();
  const { data: templates } = trpc.whatsapp.getMessageTemplates.useQuery();

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

  const updateTemplatesMut = trpc.whatsapp.updateMessageTemplates.useMutation({
    onSuccess: () => {
      toast.success("Modelos de mensagem atualizados com sucesso!");
      setIsEditingTemplates(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const testTemplateMut = trpc.whatsapp.testTemplate.useMutation({
    onSuccess: (data) => {
      setTestResult(data);
      setShowTestResult(true);
      toast.success("Mensagem de teste formatada com sucesso!");
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
      setReminderHoursBefore(Math.round((config.reminderMinutesBefore || 60) / 60));
    }
  }, [config]);

  useEffect(() => {
    if (templates) {
      setConfirmationMessage(templates.confirmationMessage || "");
      setReminderMessage(templates.reminderMessage || "");
    }
  }, [templates]);

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
      reminderMinutesBefore: reminderHoursBefore * 60,
    });
  };

  const handleSaveTemplates = () => {
    if (!confirmationMessage || !reminderMessage) {
      toast.error("Preencha ambas as mensagens");
      return;
    }
    updateTemplatesMut.mutate({
      confirmationMessage,
      reminderMessage,
    });
  };

  const handleTestConnection = () => {
    if (!phoneNumber || !apiKey) {
      toast.error("Preencha número de telefone e API key para testar");
      return;
    }
    testMut.mutate({ phoneNumber, apiKey });
  };

  const handleTestMessage = (type: "confirmation" | "reminder") => {
    const message = type === "confirmation" ? confirmationMessage : reminderMessage;
    if (!message) {
      toast.error("Preencha a mensagem antes de testar");
      return;
    }
    testTemplateMut.mutate({
      messageType: type,
      message,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="config" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="config">Configuração</TabsTrigger>
        <TabsTrigger value="templates">Modelos de Mensagem</TabsTrigger>
      </TabsList>

      {/* ── Aba de Configuração ────────────────────────────────────────────────── */}
      <TabsContent value="config" className="space-y-6">
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
                    {sendReminder ? `${reminderHoursBefore} hora${reminderHoursBefore !== 1 ? 's' : ''} antes` : "Desativado"}
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
                onClick={() => {
                  if (confirm("Tem certeza que deseja remover a configuração WhatsApp?")) {
                    deleteMut.mutate(undefined);
                  }
                }}
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
                          <Label className="text-foreground mb-1.5 block flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Horas Antes do Agendamento
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="24"
                              value={reminderHoursBefore}
                              onChange={(e) => setReminderHoursBefore(Math.max(1, parseInt(e.target.value) || 1))}
                              className="bg-background border-border"
                              disabled={upsertMut.isPending}
                            />
                            <span className="text-muted-foreground text-sm flex items-center">
                              hora{reminderHoursBefore !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            O lembrete será enviado {reminderHoursBefore} hora{reminderHoursBefore !== 1 ? 's' : ''} antes do agendamento
                          </p>
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
      </TabsContent>

      {/* ── Aba de Modelos de Mensagem ────────────────────────────────────────── */}
      <TabsContent value="templates" className="space-y-6">
        {!isEditingTemplates ? (
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
                onClick={() => setIsEditingTemplates(true)}
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
              <Button
                type="button"
                variant="outline"
                className="bg-card border-border mt-2"
                onClick={() => handleTestMessage("confirmation")}
                disabled={testTemplateMut.isPending || !confirmationMessage}
              >
                {testTemplateMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {!testTemplateMut.isPending && <Send className="w-4 h-4 mr-2" />}
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
                Variáveis: {'{cliente}'}, {'{barbeiro}'}, {'{serviço}'}, {'{data}'}, {'{hora}'}, {'{endereco}'}
              </p>
              <Button
                type="button"
                variant="outline"
                className="bg-card border-border mt-2"
                onClick={() => handleTestMessage("reminder")}
                disabled={testTemplateMut.isPending || !reminderMessage}
              >
                {testTemplateMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {!testTemplateMut.isPending && <Send className="w-4 h-4 mr-2" />}
                Testar Mensagem
              </Button>
            </div>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="bg-card border-border flex-1"
                onClick={() => setIsEditingTemplates(false)}
                disabled={updateTemplatesMut.isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveTemplates}
                disabled={updateTemplatesMut.isPending}
              >
                {updateTemplatesMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
      </TabsContent>
    </Tabs>
  );
}
