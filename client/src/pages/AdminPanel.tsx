import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scissors,
  Users,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  LayoutDashboard,
  Store,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

function Sidebar({ active, onTabChange }: { active: string; onTabChange: (tab: string) => void }) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const nav = [
    { id: "barbearias", label: "Barbearias", icon: Store },
    { id: "usuarios", label: "Usuários", icon: Users },
  ];

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          <span className="font-serif text-lg font-semibold text-sidebar-foreground">BarberBook</span>
        </div>
        <Badge variant="outline" className="mt-2 border-primary/40 text-primary bg-primary/10 text-xs">
          Administrador
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

// ── Barbershop Form ──────────────────────────────────────────────────────────
function BarbershopForm({ initial, onSuccess, onCancel }: {
  initial?: { id: number; name: string; slug: string; phone?: string | null; address?: string | null; description?: string | null; logoUrl?: string | null; accentColor?: string | null };
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [accentColor, setAccentColor] = useState(initial?.accentColor ?? "#C9A84C");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const utils = trpc.useUtils();

  const createMut = trpc.barbershops.create.useMutation({
    onSuccess: () => { toast.success("Barbearia criada!"); utils.barbershops.list.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.barbershops.update.useMutation({
    onSuccess: () => { toast.success("Barbearia atualizada!"); utils.barbershops.list.invalidate(); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const uploadLogoMut = trpc.branding.uploadLogo.useMutation({
    onSuccess: () => { toast.success("Logo atualizado!"); utils.barbershops.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateAccentMut = trpc.branding.updateAccentColor.useMutation({
    onSuccess: () => { toast.success("Cor atualizada!"); utils.barbershops.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) {
      updateMut.mutate({ id: initial.id, name, slug, phone: phone || undefined, address: address || undefined, description: description || undefined, accentColor });
    } else {
      createMut.mutate({ name, slug, phone: phone || undefined, address: address || undefined, description: description || undefined });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && initial) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        uploadLogoMut.mutate({ barbershopId: initial.id, base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-foreground mb-1.5 block">Nome *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-foreground mb-1.5 block">Slug (URL) *</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            required
            placeholder="minha-barbearia"
            className="bg-background border-border"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-foreground mb-1.5 block">Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-foreground mb-1.5 block">Endereço</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} className="bg-background border-border" />
        </div>
      </div>
      <div>
        <Label className="text-foreground mb-1.5 block">Descrição</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-background border-border" />
      </div>
      {initial && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground mb-1.5 block">Logo</Label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadLogoMut.isPending}
                className="block w-full text-sm border border-border rounded-lg p-2 bg-background text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground mb-1.5 block">Cor de Destaque</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-10 border border-border rounded cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-card border-border"
                  onClick={() => updateAccentMut.mutate({ barbershopId: initial.id, accentColor })}
                  disabled={updateAccentMut.isPending}
                >
                  {updateAccentMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar Cor"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="bg-card border-border" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initial ? "Salvar" : "Criar Barbearia"}
        </Button>
      </div>
    </form>
  );
}

// ── Barbershops Tab ──────────────────────────────────────────────────────────
function BarbershopsTab() {
  const { data: barbershops, isLoading } = trpc.barbershops.list.useQuery();
  const utils = trpc.useUtils();
  const [editTarget, setEditTarget] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  const deleteMut = trpc.barbershops.delete.useMutation({
    onSuccess: () => { toast.success("Barbearia excluída."); utils.barbershops.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold text-foreground">Barbearias</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Nova Barbearia</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-serif text-foreground">Nova Barbearia</DialogTitle>
            </DialogHeader>
            <BarbershopForm onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : barbershops && barbershops.length > 0 ? (
        <div className="space-y-3">
          {barbershops.map((shop) => (
            <div key={shop.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{shop.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-muted-foreground text-xs truncate">/{shop.slug}</p>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/agendar/${shop.slug}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link copiado!");
                      }}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Copiar link público"
                    >
                      <LinkIcon className="w-3 h-3" />
                    </button>
                  </div>
                  {shop.address && <p className="text-muted-foreground text-xs truncate">{shop.address}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className={shop.active ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-red-500/40 text-red-400 bg-red-500/10"}>
                  {shop.active ? "Ativa" : "Inativa"}
                </Badge>
                <Dialog open={editTarget?.id === shop.id} onOpenChange={(o) => !o && setEditTarget(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="w-8 h-8 bg-card border-border" onClick={() => setEditTarget(shop)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-foreground">Editar Barbearia</DialogTitle>
                    </DialogHeader>
                    {editTarget && (
                      <BarbershopForm
                        initial={editTarget}
                        onSuccess={() => setEditTarget(null)}
                        onCancel={() => setEditTarget(null)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 bg-card border-border hover:border-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Excluir esta barbearia?")) deleteMut.mutate({ id: shop.id }); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma barbearia cadastrada.</p>
        </div>
      )}
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const { data: users, isLoading } = trpc.adminUsers.list.useQuery();
  const { data: barbershops } = trpc.barbershops.list.useQuery();
  const utils = trpc.useUtils();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
  const [newBarbershopId, setNewBarbershopId] = useState<string>("");

  const updateRoleMut = trpc.adminUsers.updateRole.useMutation({
    onSuccess: () => { toast.success("Permissão atualizada!"); utils.adminUsers.list.invalidate(); setEditingUser(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteUserMut = trpc.adminUsers.delete.useMutation({
    onSuccess: () => { toast.success("Usuário deletado!"); utils.adminUsers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const ROLE_LABELS: Record<string, string> = {
    admin: "Administrador",
    owner: "Dono de Barbearia",
    barber: "Barbeiro",
    user: "Usuário",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold text-foreground">Usuários</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-serif text-foreground">Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <CreateUserForm barbershops={barbershops} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : users && users.length > 0 ? (
        <div className="space-y-3">
          {users.map((u: any) => (
            <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{u.name || "Sem nome"}</p>
                  <p className="text-muted-foreground text-xs truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">
                  {ROLE_LABELS[u.role] ?? u.role}
                </Badge>
                <Dialog open={editingUser?.id === u.id} onOpenChange={(o) => { if (!o) setEditingUser(null); }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-card border-border text-xs"
                      onClick={() => { setEditingUser(u); setNewRole(u.role); setNewBarbershopId(u.barbershopId?.toString() ?? ""); }}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-foreground">Editar Permissão</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label className="text-foreground mb-1.5 block">Usuário</Label>
                        <p className="text-muted-foreground text-sm">{editingUser?.name} — {editingUser?.email}</p>
                      </div>
                      <div>
                        <Label className="text-foreground mb-1.5 block">Perfil</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="barber">Barbeiro</SelectItem>
                            <SelectItem value="owner">Dono de Barbearia</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(newRole === "owner" || newRole === "barber") && (
                        <div>
                          <Label className="text-foreground mb-1.5 block">Barbearia</Label>
                          <Select value={newBarbershopId} onValueChange={setNewBarbershopId}>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Selecione a barbearia" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {barbershops?.map((b: any) => (
                                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="bg-card border-border" onClick={() => setEditingUser(null)}>Cancelar</Button>
                        <Button
                          className="flex-1"
                          disabled={updateRoleMut.isPending}
                          onClick={() => {
                            if (!editingUser) return;
                            updateRoleMut.mutate({
                              userId: editingUser.id,
                              role: newRole as any,
                              barbershopId: newBarbershopId ? parseInt(newBarbershopId) : null,
                            });
                          }}
                        >
                          {updateRoleMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 text-xs"
                  disabled={deleteUserMut.isPending}
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja deletar ${u.name || u.email}?`)) {
                      deleteUserMut.mutate({ userId: u.id });
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Deletar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum usuário encontrado.</p>
        </div>
      )}
    </div>
  );
}

// ── Create User Form ────────────────────────────────────────────────────────────
function CreateUserForm({ barbershops }: { barbershops: any[] | undefined }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [barbershopId, setBarbershopId] = useState<string>("");
  const utils = trpc.useUtils();

  const createMut = trpc.adminUsers.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      utils.adminUsers.list.invalidate();
      setName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setBarbershopId("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMut.mutate({
      name: name || undefined,
      email: email || undefined,
      password: password || undefined,
      role: role as any,
      barbershopId: barbershopId ? parseInt(barbershopId) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-foreground mb-1.5 block">Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="bg-background border-border" />
      </div>
      <div>
        <Label className="text-foreground mb-1.5 block">Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@exemplo.com" className="bg-background border-border" />
      </div>
      <div>
        <Label className="text-foreground mb-1.5 block">Senha *</Label>
        <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="bg-background border-border" required />
      </div>
      <div>
        <Label className="text-foreground mb-1.5 block">Permissão *</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="owner">Dono de Barbearia</SelectItem>
            <SelectItem value="barber">Barbeiro</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {role === "owner" || role === "barber" ? (
        <div>
          <Label className="text-foreground mb-1.5 block">Barbearia {role === "owner" ? "*" : ""}</Label>
          <Select value={barbershopId} onValueChange={setBarbershopId}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Selecione uma barbearia" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {barbershops?.map((b: any) => (
                <SelectItem key={b.id} value={b.id.toString()}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="bg-card border-border flex-1" onClick={() => { setName(""); setEmail(""); setPassword(""); setRole("user"); setBarbershopId(""); }}>Limpar</Button>
        <Button type="submit" className="flex-1" disabled={createMut.isPending}>
          {createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Criar Usuário
        </Button>
      </div>
    </form>
  );
}

// ── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("barbearias");

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

  if (user.role !== "admin") {
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
      <Sidebar active={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-8 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="barbearias"><BarbershopsTab /></TabsContent>
          <TabsContent value="usuarios"><UsersTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
