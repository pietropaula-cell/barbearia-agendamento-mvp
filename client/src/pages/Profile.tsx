import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export function Profile() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changePasswordMut = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de senha");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePasswordMut.mutateAsync({
        currentPassword,
        newPassword,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="bg-card border-border"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="font-serif text-3xl font-bold text-foreground">Meu Perfil</h1>
        </div>

        {/* Profile Info */}
        <Card className="bg-card border-border p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">Nome</Label>
              <p className="text-foreground font-medium">{user.name || "Sem nome"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Email</Label>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Perfil</Label>
              <p className="text-foreground font-medium capitalize">
                {user.role === "admin" && "Administrador"}
                {user.role === "owner" && "Dono de Barbearia"}
                {user.role === "barber" && "Barbeiro"}
                {user.role === "user" && "Usuário"}
              </p>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="bg-card border-border p-6">
          <h2 className="font-serif text-xl font-bold text-foreground mb-6">Alterar Senha</h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label className="text-foreground mb-1.5 block">Senha Atual *</Label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label className="text-foreground mb-1.5 block">Nova Senha *</Label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label className="text-foreground mb-1.5 block">Confirmar Nova Senha *</Label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || changePasswordMut.isPending}
            >
              {(isSubmitting || changePasswordMut.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Alterar Senha
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
