
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ArbolGenealogico from "./pages/ArbolGenealogico";
import ArbolGenealogicoClasico from "./pages/ArbolGenealogicoCasico";
import LineasFamiliares from "./pages/LineasFamiliares";
import DeterminacionHerederos from "./pages/DeterminacionHerederos";
import NotFound from "./pages/NotFound";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <NavBar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/arbol-genealogico" element={<ArbolGenealogico />} />
              <Route path="/arbol-genealogico-clasico" element={<ArbolGenealogicoClasico />} />
              <Route path="/lineas-familiares" element={<LineasFamiliares />} />
              <Route path="/determinacion-herederos" element={<DeterminacionHerederos />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
