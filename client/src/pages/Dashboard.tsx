import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (user.role === "admin") navigate("/painel/admin");
    else if (user.role === "owner") navigate("/painel/barbearia");
    else if (user.role === "barber") navigate("/painel/barbeiro");
    else navigate("/painel/usuario");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
