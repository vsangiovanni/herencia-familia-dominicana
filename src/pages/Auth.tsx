
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <div className="container mx-auto max-w-md px-4 py-8">
      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md border border-legal-gold/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-legal-blue">HerenciaRD</h1>
          <p className="mt-2 text-legal-dark">Sistema de Gestión de Herencias</p>
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
  );
};

export default Auth;
