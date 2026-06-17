import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Scissors, Users, Plus, Pencil, Trash2, LogOut, Store, Loader2,
  Calendar, Clock, DollarSign, Link as LinkIcon, ChevronLeft, ChevronRight, MessageCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { PasswordInput } from "@/components/ui/password-input";

import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { formatBR, formatTimeBR, formatDateBR } from "@/lib/dateUtils";
import { ptBR } from "date-fns/locale";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
  confirmed: { label: "Confirmado", color: "border-green-500/40 text-green-400 bg-green-500/10" },
  cancelled: { label: "Cancelado", color: "border-red-500/40 text-red-400 bg-red-500/10" },
  blocked: { label: "Bloqueado", color: "border-gray-500/40 text-gray-400 bg-gray-500/10" },
};

function OwnerSidebar({ active, onTabChange }: { active: string; onTabChange: (t: string) => void }) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const nav = [
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "barbeiros", label: "Barbeiros", icon: Users },
    { id: "servicos", label: "Serviços", icon: Scissors },
    { id: "branding", label: "Branding", icon: Store },
  ];

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Scissors className="w-5 h-5 text-primary" />
          <span className="font-serif text-lg font-semibold text-sidebar-foreground">BarberBook</span>
        </button>
        <Badge variant="outline" className="mt-2 border-primary/40 text-primary bg-primary/10 text-xs">
          Dono da Barbearia
        </Badge>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active === id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
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
  );
}

// ── Barber Form ──────────────────────────────────────────────────────────────
function BarberForm({ barbershopId, initial, onSuccess, onCancel }: {
  barbershopId: number;
  initial?: { id: number; name: string; bio?: string | null };
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const utils = trpc.useUtils();

  const createMut = trpc.barbers.createWithAccount.useMutation({
    onSuccess: (data) => {
      // Se há arquivo de avatar, fazer upload após criar
      if (avatarFile && data.barberId) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = (ev.target?.result as string).split(",")[1];
          uploadMut.mutate({ barberId: data.barberId!, base64 });
        };
        reader.readAsDataURL(avatarFile);
      } else {
        toast.success("Barbeiro criado!");
        utils.barbers.list.invalidate();
        onSuccess();
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.barbers.update.useMutation({
    onSuccess: async (_, vars) => {
      // Se há arquivo de avatar, fazer upload após atualizar
      if (avatarFile && initial) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = (ev.target?.result as string).split(",")[1];
          uploadMut.mutate({ barberId: initial.id, base64 });
        };
        reader.readAsDataURL(avatarFile);
      } else {
        toast.success("Barbeiro atualizado!");
        utils.barbers.list.invalidate();
        onSuccess();
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const uploadMut = trpc.barbers.uploadAvatar.useMutation({
    onSuccess: () => { toast.success("Barbeiro atualizado!"); utils.barbers.list.invalidate(); onSuccess(); setAvatarFile(null); },
    onError: (e) => toast.error(e.message),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) {
      updateMut.mutate({ id: initial.id, name, bio: bio || undefined });
    } else {
      if (!email) { toast.error("E-mail é obrigatório"); return; }
      if (!password) { toast.error("Senha é obrigatória"); return; }
      if (password !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
      if (password.length < 6) { toast.error("Senha deve ter mínimo 6 caracteres"); return; }
      createMut.mutate({ barbershopId, name, bio: bio || undefined, email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-foreground mb-1.5 block">Nome *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-background border-border" />
      </div>
      <div>
        <Label className="text-foreground mb-1.5 block">Bio</Label>
        <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Especialidades, experiência..." className="bg-background border-border" />
      </div>
      {!initial && (
        <>
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-3">Credenciais de acesso do barbeiro</p>
          </div>
          <div>
            <Label className="text-foreground mb-1.5 block">E-mail *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="barbeiro@email.com" className="bg-background border-border" />
          </div>
          <div>
            <Label className="text-foreground mb-1.5 block">Senha *</Label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="bg-background border-border" />
          </div>
          <div>
            <Label className="text-foreground mb-1.5 block">Confirmar Senha *</Label>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="bg-background border-border" />
          </div>
        </>
      )}
      <div>
        <Label className="text-foreground mb-1.5 block">Foto</Label>
        <Input type="file" accept="image/*" onChange={handleAvatarChange} className="bg-background border-border" />
        {avatarPreview && <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover mt-2" />}
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="bg-card border-border" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={createMut.isPending || updateMut.isPending || uploadMut.isPending}>
          {(createMut.isPending || updateMut.isPending || uploadMut.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initial ? "Salvar" : "Criar Barbeiro"}
        </Button>
      </div>
    </form>
  );
}

// ── Schedule Form ────────────────────────────────────────────────────────────
function ScheduleForm({ barberId, onSuccess, onCancel }: {
  barberId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { data: existing } = trpc.barbers.getSchedules.useQuery({ barberId });
  const [schedules, setSchedules] = useState<Record<number, { enabled: boolean; start: string; end: string; breakStart?: string; breakEnd?: string }>>(() => {
    const init: Record<number, { enabled: boolean; start: string; end: string; breakStart?: string; breakEnd?: string }> = {};
    for (let i = 0; i < 7; i++) init[i] = { enabled: false, start: "09:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" };
    return init;
  });
  const [initialized, setInitialized] = useState(false);

  // Populate from existing when loaded (useEffect to avoid stale closure)
  useEffect(() => {
    if (existing && !initialized) {
      const updated: Record<number, { enabled: boolean; start: string; end: string; breakStart?: string; breakEnd?: string }> = {};
      for (let i = 0; i < 7; i++) updated[i] = { enabled: false, start: "09:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" };
      existing.forEach((s: any) => {
        updated[s.dayOfWeek] = { enabled: true, start: s.startTime, end: s.endTime, breakStart: s.breakStartTime || "12:00", breakEnd: s.breakEndTime || "13:00" };
      });
      setSchedules(updated);
      setInitialized(true);
    }
  }, [existing, initialized]);

  const utils = trpc.useUtils();
  const setMut = trpc.barbers.setSchedules.useMutation({
    onSuccess: () => { toast.success("Horários salvos!"); utils.barbers.getSchedules.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = Object.entries(schedules)
      .filter(([, v]) => v.enabled)
      .map(([day, v]) => ({ dayOfWeek: parseInt(day), startTime: v.start, endTime: v.end, breakStartTime: v.breakStart, breakEndTime: v.breakEnd }));
    setMut.mutate({ barberId, schedules: payload });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {Array.from({ length: 7 }, (_, i) => i).map((day) => (
        <div key={day} className="rounded-lg border border-border/50 p-3 space-y-2">
          <div className="flex items-center gap-3">
            <Checkbox
              id={`day-${day}`}
              checked={schedules[day]?.enabled ?? false}
              onCheckedChange={(checked) =>
                setSchedules((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !!checked } }))
              }
            />
            <Label htmlFor={`day-${day}`} className="text-foreground text-sm font-medium cursor-pointer">{DAY_NAMES[day]}</Label>
          </div>
          {schedules[day]?.enabled && (
            <div className="pl-7 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground text-xs w-16">Expediente:</span>
                <Input
                  type="time"
                  value={schedules[day].start}
                  onChange={(e) => setSchedules((prev) => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))}
                  className="bg-background border-border w-28 text-sm h-8"
                />
                <span className="text-muted-foreground text-xs">até</span>
                <Input
                  type="time"
                  value={schedules[day].end}
                  onChange={(e) => setSchedules((prev) => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))}
                  className="bg-background border-border w-28 text-sm h-8"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground text-xs w-16">Intervalo:</span>
                <Input
                  type="time"
                  value={schedules[day].breakStart || "12:00"}
                  onChange={(e) => setSchedules((prev) => ({ ...prev, [day]: { ...prev[day], breakStart: e.target.value } }))}
                  className="bg-background border-border w-28 text-sm h-8"
                />
                <span className="text-muted-foreground text-xs">até</span>
                <Input
                  type="time"
                  value={schedules[day].breakEnd || "13:00"}
                  onChange={(e) => setSchedules((prev) => ({ ...prev, [day]: { ...prev[day], breakEnd: e.target.value } }))}
                  className="bg-background border-border w-28 text-sm h-8"
                />
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="bg-card border-border" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={setMut.isPending}>
          {setMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar Horários
        </Button>
      </div>
    </form>
  );
}

// ── Service Form ─────────────────────────────────────────────────────────────
function ServiceForm({ barbershopId, initial, onSuccess, onCancel }: {
  barbershopId: number;
  initial?: { id: number; name: string; description?: string | null; durationMin: number; price: string };
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial?.durationMin?.toString() ?? "30");
  const [price, setPrice] = useState(initial?.price ?? "");
  const utils = trpc.useUtils();

  const createMut = trpc.services.create.useMutation({
    onSuccess: () => { toast.success("Serviço criado!"); utils.services.list.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.services.update.useMutation({
    onSuccess: () => { toast.success("Serviço atualizado!"); utils.services.list.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) {
      updateMut.mutate({ id: initial.id, name, description: description || undefined, durationMin: parseInt(duration), price });
    } else {
      createMut.mutate({ barbershopId, name, description: description || undefined, durationMin: parseInt(duration), price });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-foreground mb-1.5 block">Nome *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-background border-border" />
      </div>
      <div>
        <Label className="text-foreground mb-1.5 block">Descrição</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-background border-border" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-foreground mb-1.5 block">Duração (min) *</Label>
          <Input type="number" min="5" max="480" value={duration} onChange={(e) => setDuration(e.target.value)} required className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-foreground mb-1.5 block">Valor (R$) *</Label>
          <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-background border-border" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="bg-card border-border" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={createMut.isPending || updateMut.isPending}>
          {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initial ? "Salvar" : "Criar Serviço"}
        </Button>
      </div>
    </form>
  );
}

// ── Barbers Tab ──────────────────────────────────────────────────────────────
function BarbersTab({ barbershopId }: { barbershopId: number }) {
  const { data: barbers, isLoading } = trpc.barbers.list.useQuery({ barbershopId });
  const utils = trpc.useUtils();
  const [editTarget, setEditTarget] = useState<any>(null);
  const [scheduleTarget, setScheduleTarget] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  const deleteMut = trpc.barbers.delete.useMutation({
    onSuccess: () => { toast.success("Barbeiro excluído."); utils.barbers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold text-foreground">Barbeiros</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Novo Barbeiro</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-serif text-foreground">Novo Barbeiro</DialogTitle></DialogHeader>
            <BarberForm barbershopId={barbershopId} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : barbers && barbers.length > 0 ? (
        <div className="space-y-3">
          {barbers.map((barber: any) => (
            <div key={barber.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{barber.name}</p>
                  {barber.bio && <p className="text-muted-foreground text-xs">{barber.bio}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Schedule */}
                <Dialog open={scheduleTarget?.id === barber.id} onOpenChange={(o) => !o && setScheduleTarget(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-card border-border text-xs gap-1" onClick={() => setScheduleTarget(barber)}>
                      <Clock className="w-3 h-3" /> Horários
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="font-serif text-foreground">Horários — {barber.name}</DialogTitle></DialogHeader>
                    {scheduleTarget && (
                      <ScheduleForm barberId={scheduleTarget.id} onSuccess={() => setScheduleTarget(null)} onCancel={() => setScheduleTarget(null)} />
                    )}
                  </DialogContent>
                </Dialog>
                {/* Edit */}
                <Dialog open={editTarget?.id === barber.id} onOpenChange={(o) => !o && setEditTarget(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="w-8 h-8 bg-card border-border" onClick={() => setEditTarget(barber)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader><DialogTitle className="font-serif text-foreground">Editar Barbeiro</DialogTitle></DialogHeader>
                    {editTarget && (
                      <BarberForm barbershopId={barbershopId} initial={editTarget} onSuccess={() => setEditTarget(null)} onCancel={() => setEditTarget(null)} />
                    )}
                  </DialogContent>
                </Dialog>
                {/* Delete */}
                <Button
                  variant="outline" size="icon" className="w-8 h-8 bg-card border-border hover:border-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Excluir este barbeiro?")) deleteMut.mutate({ id: barber.id }); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum barbeiro cadastrado.</p>
        </div>
      )}
    </div>
  );
}

// ── Services Tab ─────────────────────────────────────────────────────────────
function ServicesTab({ barbershopId }: { barbershopId: number }) {
  const { data: services, isLoading } = trpc.services.list.useQuery({ barbershopId });
  const utils = trpc.useUtils();
  const [editTarget, setEditTarget] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  const deleteMut = trpc.services.delete.useMutation({
    onSuccess: () => { toast.success("Serviço excluído."); utils.services.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold text-foreground">Serviços</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Novo Serviço</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-serif text-foreground">Novo Serviço</DialogTitle></DialogHeader>
            <ServiceForm barbershopId={barbershopId} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : services && services.length > 0 ? (
        <div className="space-y-3">
          {services.map((service: any) => (
            <div key={service.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Scissors className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{service.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {service.durationMin} min
                    </span>
                    <span className="text-primary text-xs font-semibold">R$ {Number(service.price).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Dialog open={editTarget?.id === service.id} onOpenChange={(o) => !o && setEditTarget(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="w-8 h-8 bg-card border-border" onClick={() => setEditTarget(service)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader><DialogTitle className="font-serif text-foreground">Editar Serviço</DialogTitle></DialogHeader>
                    {editTarget && (
                      <ServiceForm barbershopId={barbershopId} initial={editTarget} onSuccess={() => setEditTarget(null)} onCancel={() => setEditTarget(null)} />
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline" size="icon" className="w-8 h-8 bg-card border-border hover:border-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Excluir este serviço?")) deleteMut.mutate({ id: service.id }); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Scissors className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum serviço cadastrado.</p>
        </div>
      )}
    </div>
  );
}

// ── Agenda Tab ───────────────────────────────────────────────────────────────
function AgendaTab({ barbershopId, slug }: { barbershopId: number; slug: string }) {
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: appointments, isLoading } = trpc.appointments.listByBarbershop.useQuery({ barbershopId });
  const { data: barbers } = trpc.barbers.list.useQuery({ barbershopId });
  const utils = trpc.useUtils();

  const updateMut = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); utils.appointments.listByBarbershop.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Calcular semana atual
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Filtrar agendamentos por barbeiro e semana
  const filteredAppointments = appointments?.filter((appt: any) => {
    const apptDate = new Date(appt.startsAt);
    const matchesBarbeiro = !selectedBarberId || appt.barberId === selectedBarberId;
    const matchesWeek = apptDate >= weekStart && apptDate <= weekEnd;
    return matchesBarbeiro && matchesWeek;
  }) ?? [];

  // Agrupar por dia
  const appointmentsByDay: Record<string, any[]> = {};
  filteredAppointments.forEach((appt: any) => {
    const date = formatDateBR(appt.startsAt);
    if (!appointmentsByDay[date]) appointmentsByDay[date] = [];
    appointmentsByDay[date].push(appt);
  });

  // Ordenar dias
  const sortedDays = Object.keys(appointmentsByDay).sort((a, b) => {
    const dateA = new Date(appointmentsByDay[a][0].startsAt);
    const dateB = new Date(appointmentsByDay[b][0].startsAt);
    return dateA.getTime() - dateB.getTime();
  });

  // Ordenar agendamentos dentro de cada dia por hora
  sortedDays.forEach(day => {
    appointmentsByDay[day].sort((a: any, b: any) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
  });

  // Formatar período da semana
  const weekStartStr = formatDateBR(weekStart);
  const weekEndStr = formatDateBR(weekEnd);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Agenda</h2>
          <p className="text-sm text-muted-foreground mt-1">{weekStartStr} a {weekEndStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-card border-border gap-2"
            onClick={() => {
              const url = `${window.location.origin}/agendar/${slug}`;
              navigator.clipboard.writeText(url);
              toast.success("Link copiado!");
            }}
          >
            <LinkIcon className="w-3.5 h-3.5" /> Copiar Link
          </Button>
          <a href={`/agendar/${slug}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="bg-card border-border gap-2">
              <LinkIcon className="w-3.5 h-3.5" /> Visualizar
            </Button>
          </a>
        </div>
      </div>

      {/* Filtro por barbeiro e navegação de semana */}
      <div className="flex items-center gap-4 mb-6">
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
        </div>

        <Select value={selectedBarberId?.toString() ?? "all"} onValueChange={(v) => setSelectedBarberId(v === "all" ? null : parseInt(v))}>
          <SelectTrigger className="w-48 bg-card border-border">
            <SelectValue placeholder="Filtrar por barbeiro..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os barbeiros</SelectItem>
            {barbers?.map((b: any) => (
              <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : sortedDays.length > 0 ? (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <div key={day}>
              <h3 className="font-semibold text-foreground mb-3">{day}</h3>
              <div className="space-y-2">
                {appointmentsByDay[day].map((appt: any) => {
            const st = STATUS_LABELS[appt.status] ?? STATUS_LABELS.pending;
            return (
              <div key={appt.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-xs ${st.color}`}>{st.label}</Badge>
                    </div>
                    <p className="font-semibold text-foreground">{appt.customer?.name ?? "Cliente"}</p>
                    <p className="text-muted-foreground text-sm">{appt.customer?.phone}</p>
                    <p className="text-muted-foreground text-sm">{appt.service?.name}</p>
                    <p className="text-muted-foreground text-xs mt-1">Barbeiro: {appt.barber?.name ?? "N/A"}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateBR(appt.startsAt)}
                      </span>
                      <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeBR(appt.startsAt)}
                      </span>
                      <span className="text-primary text-xs font-semibold">
                        R$ {Number(appt.service?.price ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {appt.status !== "cancelled" && appt.status !== "blocked" && (
                    <div className="flex gap-2 flex-shrink-0">
                      {appt.status === "pending" && (
                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={() => updateMut.mutate({ id: appt.id, status: "confirmed" })}
                        >
                          Confirmar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-card border-border hover:border-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Cancelar este agendamento?")) updateMut.mutate({ id: appt.id, status: "cancelled" }); }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum agendamento encontrado para este período.</p>
        </div>
      )}
    </div>
  );
}

// ── Main Owner Panel ─────────────────────────────────────────────────────────
// ── Branding Tab ──────────────────────────────────────────────────────────
function BrandingTab({ barbershop }: { barbershop: any }) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [facadeFile, setFacadeFile] = useState<File | null>(null);
  const [accentColor, setAccentColor] = useState(barbershop.accentColor || "#C9A84C");
  const utils = trpc.useUtils();

  const uploadLogoMut = trpc.branding.uploadLogo.useMutation({
    onSuccess: () => { toast.success("Logo atualizado!"); utils.barbershops.getById.invalidate(); setLogoFile(null); },
    onError: (e) => toast.error(e.message),
  });

  const uploadFacadeMut = trpc.branding.uploadFacade.useMutation({
    onSuccess: () => { toast.success("Fachada atualizada!"); utils.barbershops.getById.invalidate(); setFacadeFile(null); },
    onError: (e) => toast.error(e.message),
  });

  const updateColorMut = trpc.branding.updateAccentColor.useMutation({
    onSuccess: () => { toast.success("Cor atualizada!"); utils.barbershops.getById.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadLogoMut.mutate({ barbershopId: barbershop.id, base64 });
    };
    reader.readAsDataURL(logoFile);
  };

  const handleFacadeUpload = async () => {
    if (!facadeFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadFacadeMut.mutate({ barbershopId: barbershop.id, base64 });
    };
    reader.readAsDataURL(facadeFile);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Personalização</h2>
      </div>

      {/* Logo Upload */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <Label className="text-foreground font-semibold block mb-3">Logotipo</Label>
          {barbershop.logoUrl && (
            <div className="mb-4 flex items-center gap-4">
              <img src={barbershop.logoUrl} alt="Logo" className="w-16 h-16 rounded object-cover" />
              <p className="text-muted-foreground text-sm">Logo atual</p>
            </div>
          )}
          <div className="flex gap-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="bg-background border-border"
            />
            <Button
              onClick={handleLogoUpload}
              disabled={!logoFile || uploadLogoMut.isPending}
              className="flex-shrink-0"
            >
              {uploadLogoMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </div>
        </div>
      </div>

      {/* Facade Upload */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <Label className="text-foreground font-semibold block mb-3">Foto da Fachada</Label>
          {barbershop.description && (
            <div className="mb-4 flex items-center gap-4">
              <img src={barbershop.description} alt="Fachada" className="w-32 h-24 rounded object-cover" />
              <p className="text-muted-foreground text-sm">Fachada atual</p>
            </div>
          )}
          <div className="flex gap-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFacadeFile(e.target.files?.[0] || null)}
              className="bg-background border-border"
            />
            <Button
              onClick={handleFacadeUpload}
              disabled={!facadeFile || uploadFacadeMut.isPending}
              className="flex-shrink-0"
            >
              {uploadFacadeMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </div>
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <Label className="text-foreground font-semibold block mb-3">Cor de Destaque</Label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-16 h-10 rounded cursor-pointer border border-border"
            />
            <span className="text-muted-foreground text-sm font-mono">{accentColor}</span>
            <Button
              onClick={() => updateColorMut.mutate({ barbershopId: barbershop.id, accentColor })}
              disabled={updateColorMut.isPending}
              className="ml-auto"
            >
              {updateColorMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
          <p className="text-muted-foreground text-xs mt-2">Esta cor será usada na página pública de agendamento.</p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerPanel() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("agenda");

  const { data: barbershops } = trpc.barbershops.list.useQuery(
    undefined,
    { enabled: !!user && (user.role === "owner" || user.role === "admin") }
  );

  const barbershop = barbershops?.[0];

  const toggleStatusMut = trpc.barbershops.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success(barbershop?.active ? "Barbearia desativada" : "Barbearia ativada");
      trpc.useUtils().barbershops.list.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

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

  if (user.role !== "owner" && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Acesso não autorizado.</p>
          <Button onClick={() => navigate("/")}>Voltar</Button>
        </div>
      </div>
    );
  }

  if (!barbershop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground mb-4">Nenhuma barbearia associada à sua conta.</p>
          <p className="text-muted-foreground text-sm mb-6">Peça ao administrador para associar uma barbearia ao seu perfil.</p>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <OwnerSidebar active={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-foreground">{barbershop.name}</h1>
                <p className="text-muted-foreground text-sm">/{barbershop.slug}</p>
              </div>
            </div>
            {user?.role === "admin" && (
              <Button
                variant={barbershop.active ? "outline" : "default"}
                onClick={() => toggleStatusMut.mutate({ id: barbershop.id })}
                disabled={toggleStatusMut.isPending}
              >
                {toggleStatusMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {barbershop.active ? "Desativar" : "Ativar"}
              </Button>
            )}
          </div>
        </div>

        {activeTab === "agenda" && <AgendaTab barbershopId={barbershop.id} slug={barbershop.slug} />}
        {activeTab === "barbeiros" && <BarbersTab barbershopId={barbershop.id} />}
        {activeTab === "servicos" && <ServicesTab barbershopId={barbershop.id} />}
        {activeTab === "branding" && <BrandingTab barbershop={barbershop} />}
      </main>
    </div>
  );
}
