
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10000, // 10 seconds
      refetchOnWindowFocus: false // Prevents excessive refetching
    }
  }
});

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow">
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Ruta protegida para perfil de usuario (no requiere aprobación) */}
                <Route element={<ProtectedRoute requireApproved={false} />}>
                  <Route path="/perfil" element={<UserProfile />} />
                </Route>
                
                {/* Rutas protegidas que requieren aprobación */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/arbol-genealogico" element={<ArbolGenealogico />} />
                  <Route path="/arbol-genealogico-clasico" element={<ArbolGenealogicoClasico />} />
                  <Route path="/lineas-familiares" element={<LineasFamiliares />} />
                  <Route path="/determinacion-herederos" element={<DeterminacionHerederos />} />
                </Route>
                
                {/* Rutas solo para administradores */}
                <Route element={<ProtectedRoute requireAdmin={true} />}>
                  <Route path="/admin/usuarios" element={<AdminUsers />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
