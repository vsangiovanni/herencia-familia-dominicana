
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ArbolGenealogico from "./pages/ArbolGenealogico";
import ArbolGenealogicoClasico from "./pages/ArbolGenealogicoClasico";
import LineasFamiliares from "./pages/LineasFamiliares";
import DeterminacionHerederos from "./pages/DeterminacionHerederos";
import NotFound from "./pages/NotFound";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import UserProfile from "./pages/UserProfile";
import AdminUsers from "./pages/AdminUsers";

// Configure the QueryClient with conservative settings to prevent excessive network requests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // No retries
      staleTime: 300000, // 5 minutes
      gcTime: 600000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: undefined
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow">
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* User profile route - doesn't require approval */}
                <Route 
                  path="/perfil" 
                  element={
                    <ProtectedRoute requireApproved={false}>
                      <UserProfile />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected routes requiring approval */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/arbol-genealogico" 
                  element={
                    <ProtectedRoute>
                      <ArbolGenealogico />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/arbol-genealogico-clasico" 
                  element={
                    <ProtectedRoute>
                      <ArbolGenealogicoClasico />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/lineas-familiares" 
                  element={
                    <ProtectedRoute>
                      <LineasFamiliares />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/determinacion-herederos" 
                  element={
                    <ProtectedRoute>
                      <DeterminacionHerederos />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin routes */}
                <Route 
                  path="/admin/usuarios" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminUsers />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
