import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { api, UserPage, UserProfile } from "@/lib/api";

type AuthContextType = {
  session: UserProfile | null;
  user: UserProfile | null;
  userProfile: UserProfile | null;
  userPages: UserPage[];
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
  canEdit: boolean;
  hasAccess: (path: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const routeAliases: Record<string, string> = {
  "/sienna": "/dashboard",
  "/sienna/arbol": "/sienna/arbol-genealogico",
  "/sienna/linajes": "/sienna/dobles-linajes",
  "/sienna/miembros": "/sienna/miembros-arbol",
  "/sienna/explicacion": "/sienna/explicacion-herederos",
  "/sienna/documentos": "/documentos-probatorios",
  "/sienna/hallazgos": "/hallazgos",
  "/sienna/filiacion": "/calculo-filiacion",
  "/caso/determinacion-herederos": "/determinacion-herederos",
  "/legacy/arbol-genealogico": "/arbol-genealogico",
  "/legacy/arbol-clasico": "/arbol-genealogico-clasico",
  "/legacy/lineas-familiares": "/lineas-familiares",
  "/legacy/calculo-filiacion": "/calculo-filiacion",
  "/admin/usuarios": "/admin-users",
  "/admin/calculo-herencias": "/calculo-herencias",
};

const normalizeRoute = (path: string) => (path || "/").split("?")[0].replace(/\/+$/, "") || "/";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPages, setUserPages] = useState<UserPage[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const navigationBlocker = useRef(false);

  const isAdmin = Boolean(userProfile?.role === "admin");
  const isApproved = Boolean(userProfile?.is_approved);
  const canEdit = isAdmin || Boolean(userProfile?.can_edit);

  const fetchUserPages = async (profile: UserProfile) => {
    try {
      const { pages } = await api.listMyPages();
      setUserPages(pages);
    } catch (error) {
      console.error("Error obteniendo páginas:", error);
      setUserPages([]);
    }
  };

  const applySession = async (profile: UserProfile | null) => {
    setSession(profile);
    setUser(profile);
    setUserProfile(profile);
    if (profile) {
      await fetchUserPages(profile);
    } else {
      setUserPages([]);
    }
  };

  const refreshUserProfile = async () => {
    const { profile } = await api.getSession();
    await applySession(profile);
  };

  useEffect(() => {
    api.getSession()
      .then(({ profile }) => applySession(profile))
      .catch(() => applySession(null))
      .finally(() => setLoading(false));
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      await api.signUp(email, password);

      toast({
        title: "Registro exitoso",
        description: "Por favor espere a que un administrador apruebe su cuenta.",
      });

      if (!navigationBlocker.current) {
        navigationBlocker.current = true;
        navigate("/auth");
        setTimeout(() => {
          navigationBlocker.current = false;
        }, 500);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error instanceof Error ? error.message : "Ocurrió un error durante el registro.",
      });
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { profile } = await api.signIn(email, password);
      await applySession(profile);

      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo.",
      });

      if (!navigationBlocker.current) {
        navigationBlocker.current = true;
        navigate("/sienna");
        setTimeout(() => {
          navigationBlocker.current = false;
        }, 500);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: error instanceof Error ? error.message : "Credenciales inválidas.",
      });
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await api.signOut();
      await applySession(null);

      toast({
        title: "Sesión cerrada",
        description: "Ha cerrado sesión exitosamente.",
      });

      if (!navigationBlocker.current) {
        navigationBlocker.current = true;
        navigate("/");
        setTimeout(() => {
          navigationBlocker.current = false;
        }, 500);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: error instanceof Error ? error.message : "Ocurrió un error al cerrar la sesión.",
      });
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = useCallback((path: string) => {
    const normalizedPath = normalizeRoute(path);
    const canonicalPath = routeAliases[normalizedPath] || normalizedPath;
    if (normalizedPath === "/auth" || normalizedPath === "/perfil") return true;
    if (isAdmin) return true;
    if (!isApproved) return false;

    const sharedApprovedPaths = new Set(["/", "/dashboard", "/sienna", "/sienna/dobles-linajes", "/sienna/linajes"]);
    if (sharedApprovedPaths.has(normalizedPath) || sharedApprovedPaths.has(canonicalPath)) return true;

    if (userPages.length === 0) return false;
    return userPages.some((page) => {
      const normalizedPagePath = normalizeRoute(page.path || "/");
      const canonicalPagePath = routeAliases[normalizedPagePath] || normalizedPagePath;
      return (
        normalizedPagePath === normalizedPath ||
        normalizedPagePath === canonicalPath ||
        canonicalPagePath === normalizedPath ||
        canonicalPagePath === canonicalPath
      );
    });
  }, [isAdmin, isApproved, userPages]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userProfile,
        userPages,
        signUp,
        signIn,
        signOut,
        loading,
        refreshUserProfile,
        isAdmin,
        isApproved,
        canEdit,
        hasAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
