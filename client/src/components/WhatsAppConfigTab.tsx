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
  const [barbershopId, setBarbershopId] = useState<number | null>(null);
  const [provider, setProvider] = useState<"whatsapp_business" | "twilio">("whatsapp_business");
  
  // WhatsApp Business API
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [apiKey, setApiKey] = useState("");
  
  // Twilio
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState("");
  
  // Comum
  const [enabled, setEnabled] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [sendReminder, setSendReminder] = useState(true);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [confirmationContentSid, setConfirmationContentSid] = useState("");
  const [reminderContentSid, setReminderContentSid] = useState("");
  const [isEditingTemplates, setIsEditingTemplates] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestResult, setShowTestResult] = useState(false);

  const { data: barbershops } = trpc.barbershop.list.useQuery();
  const { data: config, isLoading } = trpc.whatsapp.getConfig.useQuery(
    { barbershopId: barbershopId || 0 },
    { enabled: !!barbershopId }
  );
  const { data: templates } = trpc.whatsapp.getMessageTemplates.useQuery(
    { barbershopId: barbershopId || 0 },
    { enabled: !!barbershopId }
  );

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
      const configProvider = (config as any).provider || "whatsapp_business";
      setProvider(configProvider);
      setPhoneNumber(config.phoneNumber);
      setPhoneNumberId(config.phoneNumberId || "");
      setApiKey(config.apiKey || "");
      setTwilioAccountSid((config as any).twilioAccountSid || "");
      setTwilioAuthToken((config as any).twilioAuthToken || "");
      setTwilioWhatsappNumber((config as any).twilioWhatsappNumber || "");
      setConfirmationContentSid((config as any).confirmationContentSid || "");
      setReminderContentSid((config as any).reminderContentSid || "");
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



  const handleSave = () => {
    if (!barbershopId) {
      toast.error("Selecione uma barbearia");
      return;
    }
    if (provider === "whatsapp_business") {
      if (!phoneNumber || !apiKey) {
        toast.error("Preencha número de telefone e API key");
        return;
      }
    } else {
      if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsappNumber) {
        toast.error("Preencha todas as credenciais do Twilio");
        return;
      }
    }

    upsertMut.mutate({
      barbershopId,
      provider,
      phoneNumber: provider === "whatsapp_business" ? phoneNumber : twilioWhatsappNumber,
      phoneNumberId: provider === "whatsapp_business" ? phoneNumberId : undefined,
      apiKey: provider === "whatsapp_business" ? apiKey : "",
      twilioAccountSid: provider === "twilio" ? twilioAccountSid : undefined,
      twilioAuthToken: provider === "twilio" ? twilioAuthToken : undefined,
      twilioWhatsappNumber: provider === "twilio" ? twilioWhatsappNumber : undefined,
      enabled,
      sendConfirmation,
      sendReminder,
      reminderMinutesBefore: reminderHoursBefore * 60,
      confirmationContentSid: provider === "twilio" ? confirmationContentSid : undefined,
      reminderContentSid: provider === "twilio" ? reminderContentSid : undefined,
    } as any);
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
    testTemplateMut.mutate({
      barbershopId,
      messageType: type,
      message,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Barbearias */}
      <Card className="bg-card border-border p-6">
        <Label className="text-muted-foreground text-sm mb-2 block">Selecione a Barbearia</Label>
        <select
          value={barbershopId || ""}
          onChange={(e) => setBarbershopId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
        >
          <option value="">-- Selecione uma barbearia --</option>
          {barbershops?.map((shop: any) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </Card>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="templates">Modelos de Mensagem</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          {!isEditing ? (
            <Card className="bg-card border-border p-6 space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Provider</Label>
                <p className="text-foreground text-sm mt-2 p-3 bg-background rounded border border-border">
                  {provider === "twilio" ? "Twilio" : "WhatsApp Business API"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Número de Telefone</Label>
                <p className="text-foreground text-sm mt-2 p-3 bg-background rounded border border-border">
                  {phoneNumber || twilioWhatsappNumber || "Não configurado"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Status</Label>
                <p className="text-foreground text-sm mt-2 p-3 bg-background rounded border border-border">
                  {enabled ? "✅ Ativado" : "❌ Desativado"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="bg-card border-border"
                  onClick={() => setIsEditing(true)}
                >
                  Editar Configuração
                </Button>
                <Button
                  variant="outline"
                  className="bg-card border-border"
                  onClick={() => {
                    if (provider === "twilio" && (!twilioAccountSid || !twilioAuthToken)) {
                      toast.error("Configure as credenciais do Twilio primeiro");
                      return;
                    }
                    if (provider === "whatsapp_business" && (!phoneNumber || !apiKey)) {
                      toast.error("Configure o WhatsApp Business API primeiro");
                      return;
                    }
                    testMut.mutate({
                      phoneNumber: provider === "twilio" ? twilioWhatsappNumber : phoneNumber,
                      apiKey: provider === "twilio" ? twilioAuthToken : apiKey,
                    });
                  }}
                  disabled={testMut.isPending}
                >
                  {testMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Testar Conexão
                </Button>
                <Button
                  variant="outline"
                  className="bg-card border-border"
                  onClick={() => handleTestMessage("confirmation")}
                  disabled={testTemplateMut.isPending || !confirmationMessage}
                >
                  {testTemplateMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Teste
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="bg-card border-border p-6 space-y-4">
              <div>
                <Label className="text-foreground mb-2 block">Provider *</Label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="w-full p-3 bg-background border border-border rounded text-foreground text-sm"
                >
                  <option value="whatsapp_business">WhatsApp Business API</option>
                  <option value="twilio">Twilio</option>
                </select>
              </div>

              {provider === "whatsapp_business" ? (
                <>
                  <div>
                    <Label className="text-foreground mb-2 block">Número de Telefone *</Label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+55 11 9 9999-9999"
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground mb-2 block">Phone Number ID *</Label>
                    <Input
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="Seu Phone Number ID"
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground mb-2 block">API Key *</Label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Seu Access Token"
                      className="bg-background border-border"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-foreground mb-2 block">Account SID *</Label>
                    <Input
                      value={twilioAccountSid}
                      onChange={(e) => setTwilioAccountSid(e.target.value)}
                      placeholder="AC..."
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground mb-2 block">Auth Token *</Label>
                    <Input
                      type="password"
                      value={twilioAuthToken}
                      onChange={(e) => setTwilioAuthToken(e.target.value)}
                      placeholder="Seu Auth Token"
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground mb-2 block">WhatsApp Number *</Label>
                    <Input
                      value={twilioWhatsappNumber}
                      onChange={(e) => setTwilioWhatsappNumber(e.target.value)}
                      placeholder="+1 415 523 8886"
                      className="bg-background border-border"
                    />
                  </div>
                  {provider === "twilio" && (
                    <div className="pt-4 border-t border-border space-y-4">
                      <h3 className="font-semibold text-foreground">Templates do Twilio</h3>
                      <p className="text-xs text-muted-foreground">Crie templates no Twilio e copie o Content SID aqui</p>
                      <div>
                        <Label className="text-foreground mb-2 block">Content SID - Confirmação</Label>
                        <Input
                          value={confirmationContentSid}
                          onChange={(e) => setConfirmationContentSid(e.target.value)}
                          placeholder="HX..."
                          className="bg-background border-border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Template para mensagens de confirmação</p>
                      </div>
                      <div>
                        <Label className="text-foreground mb-2 block">Content SID - Lembrete</Label>
                        <Input
                          value={reminderContentSid}
                          onChange={(e) => setReminderContentSid(e.target.value)}
                          placeholder="HX..."
                          className="bg-background border-border"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Template para mensagens de lembrete</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Ativar WhatsApp</Label>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Enviar Confirmação</Label>
                  <Switch checked={sendConfirmation} onCheckedChange={setSendConfirmation} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Enviar Lembrete</Label>
                  <Switch checked={sendReminder} onCheckedChange={setSendReminder} />
                </div>
              </div>

              {sendReminder && (
                <div>
                  <Label className="text-foreground mb-2 block flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Horas antes do agendamento para lembrete
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={reminderHoursBefore}
                    onChange={(e) => setReminderHoursBefore(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lembrete será enviado {reminderHoursBefore} hora{reminderHoursBefore > 1 ? "s" : ""} antes do agendamento
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="bg-card border-border flex-1"
                  onClick={() => setIsEditing(false)}
                  disabled={upsertMut.isPending}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={upsertMut.isPending}>
                  {upsertMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Configuração
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
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
                  Variáveis: {"{cliente}"}, {"{barbeiro}"}, {"{serviço}"}, {"{data}"}, {"{hora}"}, {"{valor}"}, {"{endereco}"}, {"{linkMaps}"}, {"{linkCancelamento}"}
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
                  Variáveis: {"{cliente}"}, {"{barbeiro}"}, {"{serviço}"}, {"{data}"}, {"{hora}"}, {"{endereco}"}, {"{linkMaps}"}
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
                  onClick={() => {
                    if (!barbershopId) {
                      toast.error("Selecione uma barbearia");
                      return;
                    }
                    updateTemplatesMut.mutate({
                      barbershopId,
                      confirmationMessage,
                      reminderMessage,
                    });
                  }}
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
                      <span className="font-mono">{"{" + key + "}"}</span>: {String(value)}
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
              • {"{cliente}"} - Nome do cliente
              <br />
              • {"{barbeiro}"} - Nome do barbeiro
              <br />
              • {"{barbearia}"} - Nome da barbearia
              <br />
              • {"{serviço}"} - Nome do serviço
              <br />
              • {"{valor}"} - Valor do serviço (ex: R$ 50,00)
              <br />
              • {"{data}"} - Data do agendamento (ex: 17/06/2026)
              <br />
              • {"{hora}"} - Hora do agendamento (ex: 14:30)
              <br />
              • {"{endereco}"} - Endereço da barbearia
              <br />
              • {"{linkMaps}"} - Link do Google Maps com o endereço
              <br />
              • {"{linkCancelamento}"} - Link para cancelar o agendamento
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
