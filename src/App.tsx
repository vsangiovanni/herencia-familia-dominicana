
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/arbol-genealogico" element={<ArbolGenealogico />} />
                <Route path="/arbol-genealogico-clasico" element={<ArbolGenealogicoClasico />} />
                <Route path="/lineas-familiares" element={<LineasFamiliares />} />
                <Route path="/determinacion-herederos" element={<DeterminacionHerederos />} />
                <Route path="/perfil" element={<UserProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
