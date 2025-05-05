
import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role?: "admin" | "regular";
  is_approved?: boolean;
}

interface UserPage {
  id: string;
  name: string;
  path: string;
  description?: string | null;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPages, setUserPages] = useState<UserPage[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const navigationBlocker = useRef(false);
  
  const isAdmin = Boolean(userProfile?.role === "admin");
  const isApproved = Boolean(userProfile?.is_approved);

  const fetchUserPages = async (userId: string) => {
    try {
      // Primer enfoque: buscar páginas permitidas al usuario específicamente
      const { data: userPermissions, error: permissionsError } = await supabase
        .from('user_page_permissions')
        .select('page_id')
        .eq('user_id', userId);

      if (permissionsError) {
        console.error("Error obteniendo permisos del usuario:", permissionsError);
        return;
      }
      
      // Si el usuario es administrador, obtener todas las páginas
      if (userProfile?.role === 'admin') {
        const { data: allPages, error: allPagesError } = await supabase
          .from('pages')
          .select('*');

        if (allPagesError) {
          console.error("Error obteniendo páginas:", allPagesError);
          return;
        }

        if (allPages) {
          setUserPages(allPages as UserPage[]);
        }
      } 
      // Si no es administrador pero tiene permisos específicos
      else if (userPermissions && userPermissions.length > 0) {
        const pageIds = userPermissions.map(p => p.page_id);
        
        const { data: pages, error: pagesError } = await supabase
          .from('pages')
          .select('*')
          .in('id', pageIds);

        if (pagesError) {
          console.error("Error obteniendo páginas:", pagesError);
          return;
        }

        if (pages) {
          setUserPages(pages as UserPage[]);
        }
      } else {
        // Si no es admin y no tiene permisos específicos, no tiene acceso a ninguna página
        setUserPages([]);
      }
    } catch (error) {
      console.error("Error en fetchUserPages:", error);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, role, is_approved')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      if (data) {
        setUserProfile(data as UserProfile);
        
        // Obtener páginas permitidas para este usuario
        await fetchUserPages(userId);
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    }
  };

  const refreshUserProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user profile after authentication
        if (session?.user) {
          // Use setTimeout to prevent deadlock with Supabase client
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
          setUserPages([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Session exists" : "No session");
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      toast({
        title: "Registro exitoso",
        description: "Por favor espere a que un administrador apruebe su cuenta.",
      });
      
      // Use a flag to prevent multiple redirects
      if (!navigationBlocker.current) {
        navigationBlocker.current = true;
        navigate("/auth");
        // Reset the flag after a short delay
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
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo.",
      });
      
      // Use a flag to prevent multiple redirects
      if (!navigationBlocker.current) {
        navigationBlocker.current = true;
        navigate("/");
        // Reset the flag after a short delay
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
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Sesión cerrada",
        description: "Ha cerrado sesión exitosamente.",
      });
      
      // Use a flag to prevent multiple redirects
      if (!navigationBlocker.current) {
        navigationBlocker.current = true;
        navigate("/");
        // Reset the flag after a short delay
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

  const hasAccess = (path: string) => {
    // Siempre permitir acceso a la página de inicio y autenticación
    if (path === '/' || path === '/auth') return true;
    
    // El administrador tiene acceso a todas las páginas
    if (isAdmin) return true;
    
    // Para usuarios regulares, verificar si están aprobados y tienen permisos
    if (!isApproved) return false;
    
    // Verificar si el usuario tiene permiso para acceder a la página
    return userPages.some(page => path.startsWith(page.path));
  };

  const value = {
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
    hasAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
