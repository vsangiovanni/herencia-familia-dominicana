
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Sonner } from './components/ui/sonner';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import PageVisitTracker from './components/PageVisitTracker';
import SoftLoadingIndicator from './components/SoftLoadingIndicator';

const Auth = lazy(() => import('./pages/Auth'));
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Legal = lazy(() => import('./pages/Legal'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const CalculoHerencias = lazy(() => import('./pages/CalculoHerencias'));
const ArbolGenealogico = lazy(() => import('./pages/ArbolGenealogico'));
const ArbolGenealogicoClasico = lazy(() => import('./pages/ArbolGenealogicoClasico'));
const LineasFamiliares = lazy(() => import('./pages/LineasFamiliares'));
const DeterminacionHerederos = lazy(() => import('./pages/DeterminacionHerederos'));
const Hallazgos = lazy(() => import('./pages/Hallazgos'));
const CalculoFiliacion = lazy(() => import('./pages/CalculoFiliacion'));
const ArbolGenealogicoSienna = lazy(() => import('./pages/ArbolGenealogicoSienna'));
const MiembrosArbolSienna = lazy(() => import('./pages/MiembrosArbolSienna'));
const ExplicacionHerederosSienna = lazy(() => import('./pages/ExplicacionHerederosSienna'));
const AnalisisDoblesLinajesSienna = lazy(() => import('./pages/AnalisisDoblesLinajesSienna'));
const DocumentosProbatorios = lazy(() => import('./pages/DocumentosProbatorios'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const { user } = useAuth();

  return (
    <>
      <PageVisitTracker />
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className={`flex-1 ${user ? 'md:pl-64' : ''}`}>
          <Suspense
            fallback={
              <div className="py-6">
                <SoftLoadingIndicator message="Preparando pantalla..." />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
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
                path="/sienna"
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
              <Route
                path="/legal"
                element={
                  <ProtectedRoute>
                    <Legal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-users"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calculo-herencias"
                element={
                  <ProtectedRoute>
                    <CalculoHerencias />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/calculo-herencias"
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
                path="/legacy/arbol-genealogico"
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
                path="/legacy/arbol-clasico"
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
                path="/legacy/lineas-familiares"
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
                path="/caso/determinacion-herederos"
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
                path="/sienna/hallazgos"
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
                path="/sienna/filiacion"
                element={
                  <ProtectedRoute>
                    <CalculoFiliacion />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/legacy/calculo-filiacion"
                element={<Navigate to="/sienna/filiacion" replace />}
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
                path="/sienna/arbol"
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
                path="/sienna/miembros"
                element={
                  <ProtectedRoute>
                    <MiembrosArbolSienna />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sienna/explicacion-herederos"
                element={
                  <ProtectedRoute>
                    <ExplicacionHerederosSienna />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sienna/explicacion"
                element={
                  <ProtectedRoute>
                    <ExplicacionHerederosSienna />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sienna/dobles-linajes"
                element={
                  <ProtectedRoute>
                    <AnalisisDoblesLinajesSienna />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sienna/linajes"
                element={
                  <ProtectedRoute>
                    <AnalisisDoblesLinajesSienna />
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
              <Route
                path="/sienna/documentos"
                element={
                  <ProtectedRoute>
                    <DocumentosProbatorios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <div className={user ? 'md:pl-64' : ''}>
          <Footer />
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
