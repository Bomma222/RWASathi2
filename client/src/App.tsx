import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGuard from "./components/AuthGuard";
import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";
import { useAuth } from "./hooks/useAuth";

// Pages
import AdminDashboard from "./pages/AdminDashboard";
import ResidentDashboard from "./pages/ResidentDashboard";
import BillingModule from "./pages/BillingModule";
import DetailedBilling from "./pages/DetailedBilling";
import ComplaintsModule from "./pages/ComplaintsModule";
import SubmitComplaint from "./pages/SubmitComplaint";
import NoticesModule from "./pages/NoticesModule";
import ResidentManagement from "./pages/ResidentManagement";
import NotFound from "@/pages/not-found";

function Router() {
  const { user } = useAuth();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Header />
      <main className="pt-20 pb-20 px-4">
        <Switch>
          <Route path="/" component={user?.role === 'admin' ? AdminDashboard : ResidentDashboard} />
          <Route path="/bills" component={BillingModule} />
          <Route path="/bills/detailed" component={DetailedBilling} />
          <Route path="/complaints" component={ComplaintsModule} />
          <Route path="/complaints/submit" component={SubmitComplaint} />
          <Route path="/notices" component={NoticesModule} />
          <Route path="/residents" component={ResidentManagement} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthGuard>
          <Router />
        </AuthGuard>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
