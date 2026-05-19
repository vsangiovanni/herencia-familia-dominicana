
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Sonner } from './components/ui/sonner';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import AdminUsers from './pages/AdminUsers';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Legal from './pages/Legal';
import CalculoHerencias from './pages/CalculoHerencias';
import Dashboard from './pages/Dashboard';
import ArbolGenealogico from './pages/ArbolGenealogico';
import ArbolGenealogicoClasico from './pages/ArbolGenealogicoClasico';
import LineasFamiliares from './pages/LineasFamiliares';
import DeterminacionHerederos from './pages/DeterminacionHerederos';
import Hallazgos from './pages/Hallazgos';
import CalculoFiliacion from './pages/CalculoFiliacion';
import DocumentosProbatorios from './pages/DocumentosProbatorios';
import ArbolGenealogicoSienna from './pages/ArbolGenealogicoSienna';
import MiembrosArbolSienna from './pages/MiembrosArbolSienna';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <NavBar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/perfil"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/legal" element={<Legal />} />
                  <Route
                    path="/admin-users"
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calculo-herencias"
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <CalculoHerencias />
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
                  <Route
                    path="/hallazgos"
                    element={
                      <ProtectedRoute>
                        <Hallazgos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calculo-filiacion"
                    element={
                      <ProtectedRoute>
                        <CalculoFiliacion />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sienna/arbol-genealogico"
                    element={
                      <ProtectedRoute>
                        <ArbolGenealogicoSienna />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sienna/miembros-arbol"
                    element={
                      <ProtectedRoute>
                        <MiembrosArbolSienna />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/documentos-probatorios"
                    element={
                      <ProtectedRoute>
                        <DocumentosProbatorios />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
