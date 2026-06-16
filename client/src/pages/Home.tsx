import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
// import { getLoginUrl } from "@/const";
import { Scissors, Calendar, Clock, Star, ChevronRight, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: barbershops, isLoading } = trpc.booking.getAllBarbershops.useQuery();

  const getDashboardLink = () => {
    if (!user) return "/painel";
    if (user.role === "admin") return "/painel/admin";
    if (user.role === "owner") return "/painel/barbearia";
    if (user.role === "barber") return "/painel/barbeiro";
    return "/painel";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-serif text-xl font-semibold text-foreground">BarberBook</span>
          </Link>
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={getDashboardLink()}>
                <Button variant="default" size="sm" className="gap-2">
                  Painel <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm">Entrar</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-36">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10 text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/10 px-4 py-1.5 text-xs tracking-widest uppercase">
            Sistema de Agendamento
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-6 text-foreground">
            Agende com
            <span className="text-primary italic"> estilo</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
            Encontre a melhor barbearia da sua região e agende seu horário em segundos, sem complicação.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#barbearias">
              <Button size="lg" className="gap-2 px-8 font-medium">
                <Calendar className="w-4 h-4" /> Ver Barbearias
              </Button>
            </a>
            {!isAuthenticated && (
              <Link href="/login">
                <Button size="lg" variant="outline" className="gap-2 px-8 bg-card border-border hover:bg-secondary">
                  Sou Profissional
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="gold-line mx-auto max-w-2xl" />

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: "Agendamento Fácil", desc: "Escolha barbeiro, serviço, data e horário em poucos cliques." },
              { icon: Clock, title: "Disponibilidade Real", desc: "Veja apenas os horários realmente disponíveis, sem surpresas." },
              { icon: Star, title: "Sem Cadastro", desc: "Clientes agendam informando apenas nome e telefone." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors duration-200">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif font-semibold text-lg mb-2 text-foreground">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Barbershops List ─────────────────────────────────────────────────── */}
      <section id="barbearias" className="py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-3 text-foreground">Barbearias Disponíveis</h2>
            <p className="text-muted-foreground">Escolha uma barbearia e agende seu horário agora mesmo.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                  <div className="h-5 bg-muted rounded w-2/3 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : barbershops && barbershops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barbershops.map((shop) => (
                <div key={shop.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="border-green-500/40 text-green-400 bg-green-500/10 text-xs">
                      Aberto
                    </Badge>
                  </div>
                  <h3 className="font-serif font-semibold text-xl mb-2 text-foreground group-hover:text-primary transition-colors">
                    {shop.name}
                  </h3>
                  {shop.address && (
                    <p className="text-muted-foreground text-sm flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {shop.address}
                    </p>
                  )}
                  {shop.description && (
                    <p className="text-muted-foreground text-sm mt-2 mb-4 line-clamp-2">{shop.description}</p>
                  )}
                  <Link href={`/agendar/${shop.slug}`}>
                    <Button className="w-full mt-4 gap-2" size="sm">
                      <Calendar className="w-4 h-4" /> Agendar Agora
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Scissors className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Nenhuma barbearia cadastrada ainda.</p>
              <p className="text-sm">Seja o primeiro a cadastrar sua barbearia!</p>
              {!isAuthenticated && (
                <Link href="/login">
                  <Button className="mt-6" variant="outline">Cadastrar Barbearia</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" />
            <span className="font-serif text-foreground font-medium">BarberBook</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Sistema de agendamento para barbearias
          </p>
        </div>
      </footer>
    </div>
  );
}
