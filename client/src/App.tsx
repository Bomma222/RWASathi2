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
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ResidentDashboard from "./pages/ResidentDashboard";
import WatchmanDashboard from "./pages/WatchmanDashboard";
import BillingModule from "./pages/BillingModule";
import DetailedBilling from "./pages/DetailedBilling";
import BillingFieldsManager from "./pages/BillingFieldsManager";
import BillingSummary from "./pages/BillingSummary";
import AdminBillingDashboard from "./pages/AdminBillingDashboard";
import ComplaintsModule from "./pages/ComplaintsModule";
import SubmitComplaint from "./pages/SubmitComplaint";
import NoticesModule from "./pages/NoticesModule";
import ResidentManagement from "./pages/ResidentManagement";
import FlatManagement from "./pages/FlatManagement";
import WaterMeterReading from "./pages/WaterMeterReading";
import NotFound from "@/pages/not-found";

function Router() {
  const { user } = useAuth();

  if (!user?.isAuthenticated) {
    //return <Login />;
  }

  // Role-based home page component
  const getHomePage = (role: string) => {
    switch (role) {
      case 'admin': return AdminDashboard;
      case 'watchman': return WatchmanDashboard;
      case 'resident':
      default: return ResidentDashboard;
    }
  };

  const HomePage = getHomePage(user?.role || 'resident');

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Header />
      <div className="flex-1 overflow-auto pb-20">
        <Switch>
          <Route path="/" component={getDashboardComponent()} />
          <Route path="/dashboard" component={getDashboardComponent()} />
          <Route path="/billing" component={user?.role === 'admin' ? AdminBillingDashboard : BillingSummary} />
          <Route path="/billing/summary" component={BillingSummary} />
          <Route path="/billing/module" component={BillingModule} />
          <Route path="/billing/detailed/:id" component={DetailedBilling} />
          <Route path="/billing/fields" component={BillingFieldsManager} />
          <Route path="/billing/readings" component={WaterMeterReading} />
          <Route path="/complaints" component={ComplaintsModule} />
          <Route path="/complaints/submit" component={SubmitComplaint} />
          <Route path="/notices" component={NoticesModule} />
          <Route path="/residents" component={ResidentManagement} />
          <Route path="/flats" component={FlatManagement} />
          <Route component={NotFound} />
        </Switch>
      </div>
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
