import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, ChevronLeft, ChevronRight, Check, User, Clock, Calendar, DollarSign, Phone, CheckCircle, AlertCircle, Loader2, Navigation } from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBR, formatDateLongBR } from "@/lib/dateUtils";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS = ["Barbeiro", "Serviço", "Data", "Horário", "Seus Dados", "Confirmação"];

function StepIndicator({ current, total, accentColor }: { current: number; total: number; accentColor: string }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 text-white"
            style={{
              backgroundColor: step <= current ? accentColor : "transparent",
              border: step <= current ? `2px solid ${accentColor}` : "2px solid var(--border)",
            }}
          >
            {step < current ? <Check className="w-3.5 h-3.5" /> : step}
          </div>
          {step < total && (
            <div className="h-px w-6 transition-colors duration-200" style={{ backgroundColor: step < current ? accentColor : "var(--border)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Booking() {
  const { slug } = useParams<{ slug: string }>();

  const [step, setStep] = useState<Step>(1);
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: barbershop, isLoading: loadingShop, error: shopError } = trpc.booking.getBarbershop.useQuery({ slug: slug! });
  const { data: barbers, isLoading: loadingBarbers } = trpc.booking.getBarbers.useQuery(
    { barbershopId: barbershop?.id ?? 0 },
    { enabled: !!barbershop }
  );
  const { data: services, isLoading: loadingServices } = trpc.booking.getServices.useQuery(
    { barbershopId: barbershop?.id ?? 0 },
    { enabled: !!barbershop }
  );

  const selectedService = services?.find((s) => s.id === selectedServiceId);
  const selectedBarber = barbers?.find((b) => b.id === selectedBarberId);

  const { data: availableDates, isLoading: loadingDates } = trpc.booking.getAvailableDates.useQuery(
    { barberId: selectedBarberId ?? 0, month: currentMonth, durationMin: Number(selectedService?.durationMin ?? 30) },
    { enabled: !!selectedBarberId && !!selectedService && step >= 3 }
  );

  const { data: availableSlots, isLoading: loadingSlots } = trpc.booking.getAvailableSlots.useQuery(
    { barberId: selectedBarberId ?? 0, date: selectedDate, durationMin: Number(selectedService?.durationMin ?? 30) },
    { enabled: !!selectedBarberId && !!selectedDate && !!selectedService }
  );

  const createMutation = trpc.booking.createAppointment.useMutation({
    onSuccess: (data) => {
      setConfirmedAppointment(data);
      setStep(6);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar agendamento.");
    },
  });

  // ── Month navigation ───────────────────────────────────────────────────────
  const [monthYear, monthNum] = currentMonth.split("-").map(Number);
  const monthLabel = format(new Date(monthYear, monthNum - 1, 1), "MMMM yyyy", { locale: ptBR });

  const prevMonth = () => {
    const d = new Date(monthYear, monthNum - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSelectedDate("");
  };
  const nextMonth = () => {
    const d = new Date(monthYear, monthNum, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSelectedDate("");
  };

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(monthYear, monthNum, 0).getDate();
    const firstDayOfWeek = new Date(Date.UTC(monthYear, monthNum - 1, 1)).getUTCDay();
    const days: Array<{ date: string; available: boolean; isPast: boolean } | null> = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthYear}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(monthYear, monthNum - 1, d);
      days.push({
        date: dateStr,
        available: availableDates?.includes(dateStr) ?? false,
        isPast: dateObj < today,
      });
    }
    return days;
  }, [monthYear, monthNum, availableDates]);

  // ── Confirm booking ────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!barbershop || !selectedBarberId || !selectedServiceId || !selectedDate || !selectedTime) return;
    createMutation.mutate({
      barbershopId: barbershop.id,
      barberId: selectedBarberId,
      serviceId: selectedServiceId,
      date: selectedDate,
      time: selectedTime,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
    });
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loadingShop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (shopError || !barbershop) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="font-serif text-2xl font-bold text-foreground">Barbearia não encontrada</h2>
        <p className="text-muted-foreground text-center">O link que você acessou não corresponde a nenhuma barbearia cadastrada.</p>
        <Link href="/"><Button variant="outline">Voltar ao início</Button></Link>
      </div>
    );
  }

  // ── Step 6: Success ────────────────────────────────────────────────────────
  if (step === 6 && confirmedAppointment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center page-enter">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="font-serif text-3xl font-bold mb-2 text-foreground">Agendado!</h2>
          <p className="text-muted-foreground mb-8">Seu horário foi reservado com sucesso.</p>

          <div className="bg-background rounded-xl p-5 text-left space-y-3 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Barbearia</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{barbershop.name}</span>
                {barbershop.address && (
                  <button
                    onClick={() => barbershop.address && window.open(`https://www.google.com/maps/search/${encodeURIComponent(barbershop.address)}`, "_blank")}
                    className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Abrir no Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Barbeiro</span>
              <span className="font-medium text-foreground">{selectedBarber?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Serviço</span>
              <span className="font-medium text-foreground">{confirmedAppointment.service.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Data e Hora</span>
              <span className="font-medium text-foreground">
                {formatBR(confirmedAppointment.startsAt, "dd/MM/yyyy 'às' HH:mm")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-medium text-primary">R$ {Number(confirmedAppointment.service.price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-medium text-foreground">{confirmedAppointment.customer.name}</span>
            </div>
          </div>

          <div className="flex gap-3 flex-col">
            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full bg-card border-border">Início</Button>
              </Link>
              <Button
                className="flex-1"
                onClick={() => {
                  setStep(1);
                  setSelectedBarberId(null);
                  setSelectedServiceId(null);
                  setSelectedDate("");
                  setSelectedTime("");
                  setCustomerName("");
                  setCustomerPhone("");
                  setConfirmedAppointment(null);
                }}
              >
                Novo Agendamento
              </Button>
            </div>
            <Link href="/buscar-agendamento" className="w-full">
              <Button variant="outline" className="w-full bg-card border-border border-primary/30 text-primary hover:bg-primary/10">
                Ver meus agendamentos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const accentColor = barbershop.accentColor || "#C9A84C";

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Facade */}
      <header className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            {barbershop.logoUrl ? (
              <img src={barbershop.logoUrl} alt={barbershop.name} className="w-8 h-8 rounded object-cover" />
            ) : (
              <Scissors className="w-4 h-4" style={{ color: accentColor }} />
            )}
            <span className="font-serif text-lg font-semibold text-foreground">{barbershop.name}</span>
          </Link>
          <Badge variant="outline" className="text-xs" style={{ borderColor: `${accentColor}66`, color: accentColor, backgroundColor: `${accentColor}15` }}>
            Agendamento
          </Badge>
        </div>
      </header>
      
      {/* Facade Image */}
      <div className="w-full h-48 bg-muted overflow-hidden relative">
        {barbershop.fachadaUrl ? (
          <>
            <img src={barbershop.fachadaUrl} alt={barbershop.name} className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Scissors className="w-12 h-12 text-primary/30" />
          </div>
        )}
      </div>

      <div className="container max-w-lg mx-auto py-10 page-enter">
        <div className="mb-6 rounded-xl overflow-hidden border border-border">
          {barbershop?.fachadaUrl ? (
            <img
              src={barbershop.fachadaUrl}
              alt={barbershop.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Scissors className="w-12 h-12 text-primary/30" />
            </div>
          )}
        </div>
        <StepIndicator current={step} total={5} accentColor={accentColor} />
        <p className="text-center text-xs text-muted-foreground mb-6 uppercase tracking-widest">
          Passo {step} de 5 — {STEP_LABELS[step - 1]}
        </p>

        {/* ── Step 1: Barbeiro ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-center mb-6 text-foreground">Escolha o Barbeiro</h2>
            {loadingBarbers ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : barbers && barbers.length > 0 ? (
              <div className="grid gap-3">
                {barbers.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => { setSelectedBarberId(barber.id); setSelectedServiceId(null); setSelectedDate(""); setSelectedTime(""); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                      selectedBarberId === barber.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {barber.avatarUrl ? (
                          <img src={barber.avatarUrl} alt={barber.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{barber.name}</p>
                        {barber.bio && <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">{barber.bio}</p>}
                      </div>
                      {selectedBarberId === barber.id && (
                        <Check className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum barbeiro disponível.</p>
            )}
            <Button
              className="w-full mt-6 text-white"
              style={{ backgroundColor: accentColor }}
              disabled={!selectedBarberId}
              onClick={() => setStep(2)}
            >
              Continuar <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Serviço ───────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-center mb-6 text-foreground">Escolha o Serviço</h2>
            {loadingServices ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : services && services.length > 0 ? (
              <div className="grid gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedServiceId(service.id); setSelectedDate(""); setSelectedTime(""); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                      selectedServiceId === service.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {barbershop?.logoUrl ? (
                            <img src={barbershop.logoUrl} alt={barbershop.name} className="w-full h-full object-cover" />
                          ) : (
                            <Scissors className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{service.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-muted-foreground text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {service.durationMin} min
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-lg">R$ {Number(service.price).toFixed(2)}</p>
                        {selectedServiceId === service.id && <Check className="w-4 h-4 text-primary ml-auto mt-1" />}
                      </div>
                    </div>
                    {service.description && (
                      <p className="text-muted-foreground text-xs mt-2 ml-13 pl-13">{service.description}</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum serviço disponível.</p>
            )}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="bg-card border-border" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button className="flex-1 text-white" style={{ backgroundColor: accentColor }} disabled={!selectedServiceId} onClick={() => setStep(3)}>
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Data ──────────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-center mb-6 text-foreground">Escolha a Data</h2>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" className="bg-card border-border" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium text-foreground capitalize">{monthLabel}</span>
              <Button variant="outline" size="sm" className="bg-card border-border" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Calendar */}
            {loadingDates ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => (
                  <div key={idx}>
                    {day === null ? (
                      <div />
                    ) : (
                      <button
                        disabled={!day.available || day.isPast}
                        onClick={() => { setSelectedDate(day.date); setSelectedTime(""); }}
                        className={`w-full aspect-square rounded-lg text-sm font-medium transition-all duration-150 ${
                          selectedDate === day.date
                            ? "bg-primary text-primary-foreground"
                            : day.available && !day.isPast
                            ? "bg-card border border-primary/30 text-foreground hover:border-primary hover:bg-primary/10"
                            : "text-muted-foreground/30 cursor-not-allowed"
                        }`}
                      >
                        {parseInt(day.date.split("-")[2])}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="bg-card border-border" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button className="flex-1 text-white" style={{ backgroundColor: accentColor }} disabled={!selectedDate} onClick={() => setStep(4)}>
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Horário ───────────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-center mb-2 text-foreground">Escolha o Horário</h2>
            <p className="text-center text-muted-foreground text-sm mb-6">
              {selectedDate && format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            {loadingSlots ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : availableSlots && availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all duration-150 ${
                      selectedTime === slot
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/10"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">Nenhum horário disponível nesta data.</p>
                <Button variant="outline" className="mt-4 bg-card border-border" onClick={() => setStep(3)}>
                  Escolher outra data
                </Button>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="bg-card border-border" onClick={() => setStep(3)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button className="flex-1 text-white" style={{ backgroundColor: accentColor }} disabled={!selectedTime} onClick={() => setStep(5)}>
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 5: Dados do Cliente ──────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-center mb-6 text-foreground">Seus Dados</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground mb-1.5 block">Nome completo</Label>
                <Input
                  id="name"
                  placeholder="Ex: João da Silva"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-foreground mb-1.5 block">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="11999999999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                  type="tel"
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card border border-border rounded-xl p-4 mt-6 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Resumo</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Barbeiro</span>
                <span className="text-foreground font-medium">{selectedBarber?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Serviço</span>
                <span className="text-foreground font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data</span>
                <span className="text-foreground font-medium">
                  {selectedDate && format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horário</span>
                <span className="text-foreground font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Valor</span>
                <span className="text-primary font-bold">R$ {Number(selectedService?.price).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="bg-card border-border" onClick={() => setStep(4)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: accentColor }}
                disabled={!customerName.trim() || customerPhone.trim().length < 8 || createMutation.isPending}
                onClick={handleConfirm}
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirmando...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Confirmar Agendamento</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// Deploy trigger 1781648346
