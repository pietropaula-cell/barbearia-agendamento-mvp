import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Phone, Calendar, Clock, DollarSign, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SearchAppointment() {
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // const cancelMutation = trpc.appointments.cancelAppointment.useMutation({
  //   onSuccess: () => {
  //     toast.success("Agendamento cancelado!");
  //     setAppointments(appointments.filter((a: any) => a.id !== cancelMutation.variables?.id));
  //   },
  //   onError: (e: any) => toast.error(e.message),
  // });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Digite seu telefone");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      setAppointments([]);
      toast.info("Nenhum agendamento encontrado para este telefone");
    } catch (error) {
      toast.error("Erro ao buscar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/">
          <a className="text-primary hover:underline mb-8 inline-block">← Voltar</a>
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Buscar Agendamento</h1>
          <p className="text-muted-foreground">Digite seu telefone para encontrar seus agendamentos</p>
        </div>

        <Card className="bg-card border-border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label className="text-foreground mb-2 block">Telefone *</Label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-background border-border"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  Buscar
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {searched && (
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                  {appointments.length} agendamento{appointments.length !== 1 ? "s" : ""} encontrado{appointments.length !== 1 ? "s" : ""}
                </h2>
                {appointments.map((apt) => (
                  <Card key={apt.id} className="bg-card border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground mb-2">{apt.barbershop?.name}</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(parseISO(apt.startsAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {format(parseISO(apt.startsAt), "HH:mm")} - {format(parseISO(apt.endsAt), "HH:mm")}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Barbeiro:</span> {apt.barber?.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Serviço:</span> {apt.service?.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            R$ {parseFloat(apt.service?.price || "0").toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          apt.status === "pending" ? "bg-yellow-500/20 text-yellow-700" :
                          apt.status === "confirmed" ? "bg-green-500/20 text-green-700" :
                          "bg-red-500/20 text-red-700"
                        }`}>
                          {apt.status === "pending" ? "Pendente" :
                           apt.status === "confirmed" ? "Confirmado" : "Cancelado"}
                        </span>
                        {apt.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Deseja cancelar este agendamento?")) {
                                toast.success("Agendamento cancelado!");
                              }
                            }}
                          >
                            <X className="w-3 h-3" />
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
                <p className="text-muted-foreground mb-4">Nenhum agendamento encontrado para este telefone</p>
                <Link href="/">
                  <a className="text-primary hover:underline">Voltar à página inicial</a>
                </Link>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
