
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHelp from "@/components/PageHelp";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Auth = () => {
  const { user, signIn, loading, isApproved } = useAuth();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Si el usuario ya está autenticado y aprobado, redirigir al dashboard
  if (user && isApproved) {
    return <Navigate to="/dashboard" />;
  }
  
  // Si el usuario está autenticado pero no aprobado, redirigir al perfil
  if (user && !isApproved) {
    return <Navigate to="/perfil" />;
  }

  const onLoginSubmit = async (data: LoginFormValues) => {
    await signIn(data.email, data.password);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-legal-beige/50 to-white">
      <div className="container relative mx-auto max-w-md px-4 py-8 sm:py-12">
        <div className="absolute right-4 top-8 z-10">
          <PageHelp helpKey="auth" />
        </div>
        <div className="mb-6 text-center">
          <Link to="/" className="text-sm font-medium text-legal-gray transition-colors hover:text-legal-blue">
            ← Volver al inicio
          </Link>
        </div>
        <div className="space-y-6 rounded-lg border border-legal-gold/20 bg-white p-6 shadow-md">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold text-legal-blue">HerenciaRD</h1>
            <p className="mt-2 text-legal-dark">Acceso al expediente familiar</p>
          </div>

        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-legal-blue hover:bg-legal-blue/90" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </Form>

        <Alert className="mt-4 bg-legal-beige border-legal-gold/20">
          <AlertDescription className="text-sm text-legal-dark">
            El acceso es privado. Solicita tus credenciales al administrador del expediente.
          </AlertDescription>
        </Alert>
        </div>
      </div>
    </div>
  );
};

export default Auth;
