import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/protected-route";
import Navbar from "@/components/navbar";
import Home from "@/pages/home";
import InquiryForm from "@/pages/inquiry-form";
import EnrollmentForm from "@/pages/enrollment-form";
import Fees from "@/pages/fees";
import FeesManagement from "@/pages/fees-management";
import InquiriesList from "@/pages/inquiries-list";
import InquiryEdit from "@/pages/inquiry-edit";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLogin from "@/pages/admin-login";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10 relative overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.3) 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }}
          />
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-blue-500/[0.01] dark:to-purple-500/[0.02]" />
        <div className="relative z-10">
          <Navbar />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/inquiry/new" component={InquiryForm} />
            <Route path="/inquiry/edit/:id" component={InquiryEdit} />
            <Route path="/inquiry/enroll/:id" component={EnrollmentForm} />
            <Route path="/fees" component={Fees} />
            <Route path="/fees-management" component={FeesManagement} />
            <Route path="/inquiries" component={InquiriesList} />
            <Route path="/admin-login" component={AdminLogin} />
            <Route path="/admin-dashboard" component={AdminDashboard} />
            <Route path="/admin" component={AdminLogin} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
