import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import OwnerPanel from "./pages/OwnerPanel";
import BarberPanel from "./pages/BarberPanel";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/agendar/:slug" component={Booking} />

      {/* Auth redirect */}
      <Route path="/painel" component={Dashboard} />

      {/* Role-specific panels */}
      <Route path="/painel/admin" component={AdminPanel} />
      <Route path="/painel/barbearia" component={OwnerPanel} />
      <Route path="/painel/barbeiro" component={BarberPanel} />
      <Route path="/painel/usuario" component={Dashboard} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
