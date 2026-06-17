import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Phone, Calendar, Clock, DollarSign, X, Scissors } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatDateLongBR, formatTimeBR } from "@/lib/dateUtils";

export default function SearchAppointment() {
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState<string | null>(null);

  const { data: appointments, isLoading, isError, error, refetch } = trpc.booking.searchByPhone.useQuery(
    { phone: searchPhone! },
    { enabled: !!searchPhone }
  );

  const cancelMut = trpc.booking.cancelAppointment.useMutation({
    onSuccess: () => {
      toast.success("Agendamento cancelado!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove todos os caracteres que não são números
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 8) {
      toast.error("Digite um telefone válido (mínimo 8 dígitos)");
      return;
    }
    setSearchPhone(cleaned);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite apenas números
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
  };

  const statusLabel = (s: string) => {
    if (s === "pending") return "Pendente";
    if (s === "confirmed") return "Confirmado";
    if (s === "cancelled") return "Cancelado";
    if (s === "blocked") return "Bloqueado";
    return s;
  };

  const statusClass = (s: string) => {
    if (s === "pending") return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    if (s === "confirmed") return "bg-green-500/20 text-green-400 border border-green-500/30";
    return "bg-red-500/20 text-red-400 border border-red-500/30";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <Link href="/" className="text-primary hover:underline mb-8 inline-flex items-center gap-1 text-sm">
          ← Voltar
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Meus Agendamentos</h1>
          </div>
          <p className="text-muted-foreground ml-13">
            Digite seu telefone para encontrar seus agendamentos em qualquer barbearia
          </p>
        </div>

        {/* Formulário de busca */}
        <Card className="bg-card border-border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label className="text-foreground mb-2 block font-medium">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefone *
              </Label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="11999999999"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="bg-background border-border"
                  required
                  inputMode="numeric"
                />
                <Button type="submit" disabled={isLoading} className="gap-2 shrink-0">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  Buscar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use o mesmo número cadastrado no agendamento
              </p>
            </div>
          </form>
        </Card>

        {/* Resultados — só exibe após pesquisa */}
        {searchPhone && (
          <div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <Card className="bg-card border-border p-8 text-center">
                <Phone className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
                <p className="text-foreground font-medium mb-1">Erro ao buscar agendamentos</p>
                <p className="text-muted-foreground text-sm mb-4">
                  {error?.message || "Ocorreu um erro ao buscar seus agendamentos. Tente novamente."}
                </p>
                <Button onClick={() => refetch()} variant="outline" className="bg-card border-border">
                  Tentar Novamente
                </Button>
              </Card>
            ) : appointments && appointments.length > 0 ? (
              <div className="space-y-4">
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">
                  {appointments.length} agendamento{appointments.length !== 1 ? "s" : ""} encontrado{appointments.length !== 1 ? "s" : ""}
                </h2>
                {appointments.map((apt) => (
                  <Card key={apt.id} className="bg-card border-border p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-foreground text-base">{apt.barbershopName}</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span>
                              {formatDateLongBR(apt.startsAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>
                              {formatTimeBR(apt.startsAt)} – {formatTimeBR(apt.endsAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 shrink-0" />
                            <span><span className="font-medium text-foreground">Barbeiro:</span> {apt.barberName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 shrink-0 text-center text-xs">✂</span>
                            <span><span className="font-medium text-foreground">Serviço:</span> {apt.serviceName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 shrink-0" />
                            <span className="text-primary font-medium">
                              R$ {parseFloat(apt.servicePrice || "0").toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(apt.status)}`}>
                          {statusLabel(apt.status)}
                        </span>
                        {apt.status !== "cancelled" && apt.status !== "blocked" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent"
                            onClick={() => {
                              if (confirm("Deseja cancelar este agendamento?")) {
                                cancelMut.mutate({ id: apt.id, phone: searchPhone });
                              }
                            }}
                            disabled={cancelMut.isPending}
                          >
                            {cancelMut.isPending && cancelMut.variables?.id === apt.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <X className="w-3 h-3" />
                            }
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border p-8 text-center">
                <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-foreground font-medium mb-1">Nenhum agendamento encontrado</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Não encontramos agendamentos para o telefone <strong>{searchPhone}</strong>
                </p>
                <Link href="/" className="text-primary hover:underline text-sm">
                  Fazer um agendamento →
                </Link>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
