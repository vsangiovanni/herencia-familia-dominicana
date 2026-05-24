import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  FileText,
  GitMerge,
  Lock,
  Network,
  Scale,
  ShieldCheck,
  TreePine,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: TreePine,
    title: 'Árbol genealógico',
    description:
      'Visualización clásica e interactiva de linajes, con herederos, montos y estado vital de cada miembro.',
  },
  {
    icon: Scale,
    title: 'Determinación sucesoral',
    description:
      'Cálculo y documentación orientada al orden hereditario del Código Civil dominicano.',
  },
  {
    icon: GitMerge,
    title: 'Dobles linajes',
    description:
      'Auditoría de convergencias, rutas duplicadas e inconsistencias en filiación y uniones formales.',
  },
  {
    icon: FileText,
    title: 'Expediente probatorio',
    description:
      'Hallazgos, documentos, explicación para herederos y trazabilidad del caso activo.',
  },
];

const Home = () => {
  const { user, loading, isApproved } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user && isApproved) {
    return <Navigate to="/sienna" replace />;
  }

  if (user && !isApproved) {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <div className="legacy-gradient">
      <section className="app-shell py-10 sm:py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="min-w-0 space-y-6">
            <Badge
              variant="outline"
              className="border-legal-gold/40 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-legal-blue backdrop-blur dark:bg-white/5"
            >
              Archivo Vivo del Legado Sangiovanni
            </Badge>

            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-bold leading-tight text-legal-blue sm:text-5xl lg:text-6xl">
                Legado Sangiovanni
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-gray-700 sm:text-xl">
                El archivo vivo de Alessandro de Paola Sangiovanni: genealogía, herencia, evidencia y memoria
                familiar en una experiencia privada, elegante y profundamente legible.
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-legal-gray sm:text-base">
              La asistencia inteligente queda al servicio del archivo; el protagonista visual y narrativo es el
              legado Sangiovanni, con una lectura distinta para herederos, abogados y administradores.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="btn-primary h-11 w-full sm:w-auto">
                <Link to="/auth">
                  Acceder al sistema
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="btn-secondary h-11 w-full sm:w-auto"
              >
                <a href="#modulos">Ver módulos</a>
              </Button>
            </div>

            <div className="legacy-surface flex items-start gap-2 rounded-md p-3 text-sm text-legal-dark">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-legal-gold" />
              <p>
                Acceso restringido. Las credenciales las entrega el administrador del expediente; no hay
                auto-registro público.
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="legacy-surface overflow-hidden rounded-lg">
              <img
                src="/legado-sangiovanni-logo-transparent.png"
                alt="Legado Sangiovanni — archivo vivo de herencia familiar"
                className="h-auto w-full object-cover"
                width={1200}
                height={630}
                loading="eager"
              />
            </div>
            <div className="legacy-surface absolute -bottom-4 left-4 right-4 rounded-lg p-4 sm:left-6 sm:right-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray">Expediente activo</p>
              <p className="mt-1 font-serif text-lg font-bold text-legal-blue">Alessandro de Paola Sangiovanni</p>
              <p className="mt-1 text-sm text-gray-600">
                Sucesión intestada · árbol, herederos, dobles linajes y documentación probatoria.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="modulos" className="app-shell scroll-mt-24 pb-12 sm:pb-16">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-legal-gold">Legado Sangiovanni</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-legal-blue sm:text-3xl">
            El expediente convertido en memoria clara, verificable y humana
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="legacy-surface border-legal-blue/10 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col p-5">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-legal-gold/30 bg-legal-gold/10">
                  <Icon className="h-5 w-5 text-legal-blue" />
                </div>
                <h3 className="font-serif text-lg font-bold text-legal-blue">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-legal-blue/10 bg-legal-blue/[0.03] dark:border-[#243047] dark:bg-[#162033]/40">
        <div className="app-shell py-10 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: Network,
                title: 'Genealogía verificable',
                text: 'Uniones formales, vínculos parentales y badges de verificación documental en el árbol.',
              },
              {
                icon: Users,
                title: 'Roles y permisos',
                text: 'Roles, permisos y prioridades para que cada usuario vea primero lo que necesita.',
              },
              {
                icon: ShieldCheck,
                title: 'Listo para producción',
                text: 'Datos en MySQL, sesiones seguras y despliegue controlado cuando Víctor lo autorice.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="legacy-surface rounded-lg p-5"
              >
                <Icon className="mb-3 h-6 w-6 text-legal-gold" />
                <h3 className="font-semibold text-legal-blue">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="app-shell py-12 sm:py-16">
        <div className="rounded-lg border border-legal-gold/30 bg-gradient-to-br from-[#223A5E] to-[#1B2430] px-6 py-8 text-center text-white shadow-[0_28px_80px_rgb(10_16_32_/_0.24)] dark:from-[#162033] dark:to-[#0A1020] sm:px-10 sm:py-10">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">¿Ya tienes credenciales?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-legal-beige/90 sm:text-base">
            Inicia sesión para entrar al archivo vivo: árbol, reparto, hallazgos, linajes y documentos del expediente.
          </p>
          <Button
            asChild
            size="lg"
            className="btn-primary mt-6 h-11 w-full sm:w-auto"
          >
            <Link to="/auth">
              Iniciar sesión
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
