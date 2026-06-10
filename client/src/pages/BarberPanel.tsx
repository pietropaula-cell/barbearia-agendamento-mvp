import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Scissors, LogOut, Calendar, Clock, Loader2, Lock, Check, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const myBarber = barbers?.find((b: any) => b.userId === user?.id) ?? barbers?.[0];

  const { data: appointments, isLoading } = trpc.appointments.listMine.useQuery(
    { barberId: myBarber?.id ?? 0 },
    { enabled: !!myBarber }
  );

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
    const [year, month, day] = blockDate.split("-").map(Number);
    const [sh, sm] = blockStart.split(":").map(Number);
    const [eh, em] = blockEnd.split(":").map(Number);
    const startsAt = new Date(Date.UTC(year, month - 1, day, sh, sm));
    const endsAt = new Date(Date.UTC(year, month - 1, day, eh, em));
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
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-serif text-lg font-semibold text-sidebar-foreground">BarberBook</span>
          </div>
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
          </div>
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

        {!myBarber ? (
          <div className="text-center py-12 text-muted-foreground">
            <Scissors className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum perfil de barbeiro encontrado.</p>
            <p className="text-sm mt-1">Peça ao dono da barbearia para criar seu perfil.</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : appointments && appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appt: any) => {
              const st = STATUS_LABELS[appt.status] ?? STATUS_LABELS.pending;
              return (
                <div key={appt.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${st.color}`}>{st.label}</Badge>
                      </div>
                      {appt.status !== "blocked" ? (
                        <>
                          <p className="font-semibold text-foreground">{appt.customer?.name ?? "Cliente"}</p>
                          <p className="text-muted-foreground text-sm">{appt.service?.name}</p>
                        </>
                      ) : (
                        <p className="font-semibold text-foreground">Horário Bloqueado</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(appt.startsAt), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(appt.startsAt), "HH:mm", { locale: ptBR })} — {format(new Date(appt.endsAt), "HH:mm", { locale: ptBR })}
                        </span>
                        {appt.service && (
                          <span className="text-primary text-xs font-semibold">
                            R$ {Number(appt.service.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    {appt.status !== "cancelled" && appt.status !== "blocked" && (
                      <div className="flex gap-2 flex-shrink-0">
                        {appt.status === "pending" && (
                          <Button
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => updateMut.mutate({ id: appt.id, status: "confirmed" })}
                          >
                            <Check className="w-3 h-3" /> Confirmar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs bg-card border-border hover:border-destructive hover:text-destructive gap-1"
                          onClick={() => { if (confirm("Cancelar este agendamento?")) updateMut.mutate({ id: appt.id, status: "cancelled" }); }}
                        >
                          <X className="w-3 h-3" /> Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum agendamento encontrado.</p>
          </div>
        )}
      </main>
    </div>
  );
}
