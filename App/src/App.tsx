import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CustomersManagement from "./pages/admin/CustomersManagement";
import DriversManagement from "./pages/admin/DriversManagement";
import RouteBuilder from "./pages/admin/RouteBuilder";
import RoutesHistory from "./pages/admin/RoutesHistory";
import DriverTodayRoute from "./pages/driver/DriverTodayRoute";
import DriverRouteBuilder from "./pages/driver/DriverRouteBuilder";
import DriverRoutesHistory from "./pages/driver/DriverRoutesHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'driver' }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/driver'} replace />;
  }
  
  return <DataProvider>{children}</DataProvider>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/driver'} replace />;
  }
  
  return <>{children}</>;
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <Navigate to={user.role === 'admin' ? '/admin' : '/driver'} replace />;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    
    {/* Admin Routes */}
    <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/customers" element={<ProtectedRoute requiredRole="admin"><CustomersManagement /></ProtectedRoute>} />
    <Route path="/admin/drivers" element={<ProtectedRoute requiredRole="admin"><DriversManagement /></ProtectedRoute>} />
    <Route path="/admin/routes/new" element={<ProtectedRoute requiredRole="admin"><RouteBuilder /></ProtectedRoute>} />
    <Route path="/admin/routes" element={<ProtectedRoute requiredRole="admin"><RoutesHistory /></ProtectedRoute>} />
    
    {/* Driver Routes */}
    <Route path="/driver" element={<ProtectedRoute requiredRole="driver"><DriverTodayRoute /></ProtectedRoute>} />
    <Route path="/driver/routes/new" element={<ProtectedRoute requiredRole="driver"><DriverRouteBuilder /></ProtectedRoute>} />
    <Route path="/driver/history" element={<ProtectedRoute requiredRole="driver"><DriverRoutesHistory /></ProtectedRoute>} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
