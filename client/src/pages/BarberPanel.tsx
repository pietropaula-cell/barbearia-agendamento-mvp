import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Scissors, LogOut, Calendar, Clock, Loader2, Lock, Check, X } from "lucide-react";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { formatDateBR, formatTimeBR } from "@/lib/dateUtils";
import { useAuth } from "@/_core/hooks/useAuth";
import { WeeklyCalendar } from "@/components/WeeklyCalendar";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
  confirmed: { label: "Confirmado", color: "border-green-500/40 text-green-400 bg-green-500/10" },
  cancelled: { label: "Cancelado", color: "border-red-500/40 text-red-400 bg-red-500/10" },
  blocked: { label: "Bloqueado", color: "border-gray-500/40 text-gray-400 bg-gray-500/10" },
};

export default function BarberPanel() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showBlock, setShowBlock] = useState(false);
  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("10:00");
  const [blockNote, setBlockNote] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  // Find barber linked to this user
  const { data: barbershops } = trpc.barbershops.list.useQuery(
    undefined,
    { enabled: !!user && (user.role === "barber" || user.role === "owner" || user.role === "admin") }
  );
  const barbershopId = user?.barbershopId;
  const { data: barbers } = trpc.barbers.list.useQuery(
    { barbershopId: barbershopId ?? 0 },
    { enabled: !!barbershopId }
  );
  // Find barber matching this user
  const myBarber = barbers?.find((b: any) => b.userId === user?.id);
  
  if (!myBarber && barbers && barbers.length > 0) {
    console.warn("Barbeiro não encontrado para este usuário. User ID:", user?.id, "Barbeiros:", barbers);
  }

  const { data: appointments, isLoading } = trpc.appointments.listMine.useQuery(
    { barberId: myBarber?.id ?? 0 },
    { enabled: !!myBarber }
  );

  // Calcular semana atual
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Filtrar agendamentos da semana
  const weekAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter((a: any) => {
      const apptDate = new Date(a.startsAt);
      return apptDate >= weekStart && apptDate < weekEnd && a.status !== "blocked";
    }).sort((a: any, b: any) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [appointments, weekStart, weekEnd]);

  // Calcular resumo semanal
  const weeklySummary = useMemo(() => {
    const summary: Record<string, { count: number; total: number }> = {};
    let totalConfirmed = 0;
    weekAppointments.forEach((a: any) => {
      if (a.status === "confirmed") {
        const serviceName = a.service?.name || "Serviço desconhecido";
        if (!summary[serviceName]) summary[serviceName] = { count: 0, total: 0 };
        summary[serviceName].count++;
        summary[serviceName].total += Number(a.service?.price || 0);
        totalConfirmed += Number(a.service?.price || 0);
      }
    });
    return { services: summary, totalConfirmed };
  }, [weekAppointments]);

  const utils = trpc.useUtils();
  const updateMut = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); utils.appointments.listMine.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const blockMut = trpc.appointments.blockSlot.useMutation({
    onSuccess: () => { toast.success("Horário bloqueado!"); utils.appointments.listMine.invalidate(); setShowBlock(false); },
    onError: (e) => toast.error(e.message),
  });

  const handleBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myBarber || !barbershopId) return;
    // Interpreta os valores do input como horário local de Brasília (UTC-3)
    // Adicionando 3h para converter para UTC antes de enviar ao servidor
    const [year, month, day] = blockDate.split("-").map(Number);
    const [sh, sm] = blockStart.split(":").map(Number);
    const [eh, em] = blockEnd.split(":").map(Number);
    const startsAt = new Date(Date.UTC(year, month - 1, day, sh + 3, sm));
    const endsAt = new Date(Date.UTC(year, month - 1, day, eh + 3, em));
    if (endsAt <= startsAt) { toast.error("Horário de fim deve ser após o início."); return; }
    blockMut.mutate({ barberId: myBarber.id, barbershopId, startsAt, endsAt, notes: blockNote || undefined });
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Você precisa estar logado.</p>
          <a href={getLoginUrl()}><Button>Entrar</Button></a>
        </div>
      </div>
    );
  }

  if (user.role !== "barber" && user.role !== "owner" && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Acesso não autorizado.</p>
          <Button onClick={() => navigate("/")}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-5 border-b border-sidebar-border">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-serif text-lg font-semibold text-sidebar-foreground">BarberBook</span>
          </button>
          <Badge variant="outline" className="mt-2 border-primary/40 text-primary bg-primary/10 text-xs">
            Barbeiro
          </Badge>
        </div>
        <nav className="flex-1 p-3">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-sidebar-primary text-sidebar-primary-foreground">
            <Calendar className="w-4 h-4" /> Minha Agenda
          </button>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-sidebar-foreground font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => navigate("/perfil")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors mb-1"
          >
            <Scissors className="w-4 h-4" /> Meu Perfil
          </button>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Minha Agenda</h1>
            {myBarber && <p className="text-muted-foreground text-sm mt-0.5">{myBarber.name}</p>}
            <p className="text-muted-foreground text-xs mt-1">
              Semana de {weekStart.toLocaleDateString('pt-BR')} a {new Date(weekEnd.getTime() - 86400000).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="bg-card border-border"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(0)}
              className="bg-card border-border"
            >
              Esta Semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="bg-card border-border"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Dialog open={showBlock} onOpenChange={setShowBlock}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-card border-border gap-2">
                  <Lock className="w-4 h-4" /> Bloquear Horário
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-serif text-foreground">Bloquear Horário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBlock} className="space-y-4">
                <div>
                  <Label className="text-foreground mb-1.5 block">Data *</Label>
                  <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} required className="bg-background border-border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground mb-1.5 block">Início *</Label>
                    <Input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} required className="bg-background border-border" />
                  </div>
                  <div>
                    <Label className="text-foreground mb-1.5 block">Fim *</Label>
                    <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} required className="bg-background border-border" />
                  </div>
                </div>
                <div>
                  <Label className="text-foreground mb-1.5 block">Motivo</Label>
                  <Input value={blockNote} onChange={(e) => setBlockNote(e.target.value)} placeholder="Opcional" className="bg-background border-border" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="bg-card border-border" onClick={() => setShowBlock(false)}>Cancelar</Button>
                  <Button type="submit" className="flex-1" disabled={blockMut.isPending}>
                    {blockMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Bloquear
                  </Button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Resumo Semanal */}
        {!isLoading && Object.keys(weeklySummary.services).length > 0 && (
          <div className="mb-6 bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold text-foreground mb-3">Resumo da Semana</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(weeklySummary.services).map(([service, data]) => (
                <div key={service} className="bg-background rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{service}</p>
                  <p className="text-sm font-semibold text-foreground">{data.count} atendimento{data.count > 1 ? 's' : ''}</p>
                  <p className="text-xs text-primary">R$ {data.total.toFixed(2)}</p>
                </div>
              ))}
              <div className="bg-primary/10 border border-primary/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Confirmado</p>
                <p className="text-sm font-semibold text-primary">R$ {weeklySummary.totalConfirmed.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {!myBarber ? (
          <div className="text-center py-12 text-muted-foreground">
            <Scissors className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum perfil de barbeiro encontrado.</p>
            <p className="text-sm mt-1">Peça ao dono da barbearia para criar seu perfil.</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : weekAppointments ? (
          <WeeklyCalendar
            appointments={weekAppointments}
            weekStart={weekStart}
            onAppointmentClick={(appt) => {
              console.log("Agendamento clicado:", appt);
            }}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum agendamento encontrado para esta semana.</p>
          </div>
        )}
      </main>
    </div>
  );
}
