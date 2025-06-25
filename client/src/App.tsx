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
import PaymentManagement from "./pages/PaymentManagement";
import ComplaintsModule from "./pages/ComplaintsModule";
import ComplaintsManagement from "./pages/ComplaintsManagement";
import SubmitComplaint from "./pages/SubmitComplaint";
import NoticesModule from "./pages/NoticesModule";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import SystemConfiguration from "./pages/SystemConfiguration";
import ResidentManagement from "./pages/ResidentManagement";
import FlatManagement from "./pages/FlatManagement";
import WaterMeterReading from "./pages/WaterMeterReading";
import NotFound from "@/pages/not-found";

function Router() {
  const { user } = useAuth();

  if (!user?.isAuthenticated) {
    return <Login />;
  }

  // Role-based dashboard component
  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'admin': return AdminDashboard;
      case 'watchman': return WatchmanDashboard;
      case 'resident':
      default: return ResidentDashboard;
    }
  };

  const DashboardComponent = getDashboardComponent();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Header />
      <div className="flex-1 overflow-auto pb-20">
        <Switch>
          <Route path="/" component={DashboardComponent} />
          <Route path="/dashboard" component={DashboardComponent} />
          <Route path="/billing" component={user?.role === 'admin' ? AdminBillingDashboard : BillingSummary} />
          <Route path="/billing/summary" component={BillingSummary} />
          <Route path="/billing/module" component={BillingModule} />
          <Route path="/billing/detailed/:id" component={DetailedBilling} />
          <Route path="/billing/fields" component={BillingFieldsManager} />
          <Route path="/billing/readings" component={WaterMeterReading} />
          <Route path="/billing/payments" component={PaymentManagement} />
          <Route path="/complaints" component={user?.role === 'admin' ? ComplaintsManagement : ComplaintsModule} />
          <Route path="/complaints/submit" component={SubmitComplaint} />
          <Route path="/notices" component={NoticesModule} />
          <Route path="/residents" component={ResidentManagement} />
          <Route path="/flats" component={FlatManagement} />
          <Route path="/reports" component={ReportsAnalytics} />
          <Route path="/settings" component={SystemConfiguration} />
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
