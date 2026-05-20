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
  hasAccess: (path: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const fetchUserPages = async (profile: UserProfile) => {
    try {
      const { pages } = await api.listPages();
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error.message || "Ocurrió un error durante el registro.",
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
        navigate("/dashboard");
        setTimeout(() => {
          navigationBlocker.current = false;
        }, 500);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: error.message || "Credenciales inválidas.",
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: error.message || "Ocurrió un error al cerrar la sesión.",
      });
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = useCallback((path: string) => {
    const normalizedPath = (path || "/").split("?")[0].replace(/\/+$/, "") || "/";
    if (normalizedPath === "/auth" || normalizedPath === "/perfil") return true;
    if (isAdmin) return true;
    if (!isApproved) return false;

    const publicApprovedPaths = new Set(["/", "/dashboard"]);
    if (publicApprovedPaths.has(normalizedPath)) return true;

    if (userPages.length === 0) return false;
    return userPages.some((page) => {
      const normalizedPagePath = (page.path || "/").replace(/\/+$/, "") || "/";
      return normalizedPagePath === normalizedPath;
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
