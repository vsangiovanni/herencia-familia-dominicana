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
    return <Navigate to="/dashboard" replace />;
  }

  if (user && !isApproved) {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <div className="bg-gradient-to-b from-legal-beige/80 via-white to-white">
      <section className="app-shell py-10 sm:py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="min-w-0 space-y-6">
            <Badge
              variant="outline"
              className="border-legal-gold/40 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-legal-blue"
            >
              República Dominicana · Derecho sucesorio
            </Badge>

            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-bold leading-tight text-legal-blue sm:text-5xl lg:text-6xl">
                HerenciaRD
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-gray-700 sm:text-xl">
                Plataforma privada para árbol genealógico, análisis de herederos y gestión del expediente
                familiar dominicano.
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-legal-gray sm:text-base">
              Centraliza la investigación genealógica, la explicación sucesoria y la validación documental
              en un solo entorno seguro para abogados, herederos y administradores del caso.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="h-11 w-full bg-legal-blue hover:bg-legal-blue/90 sm:w-auto">
                <Link to="/auth">
                  Acceder al sistema
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 w-full border-legal-blue/25 text-legal-blue hover:bg-legal-beige/60 sm:w-auto"
              >
                <a href="#modulos">Ver módulos</a>
              </Button>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-legal-gold/25 bg-legal-gold/5 p-3 text-sm text-legal-dark">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-legal-gold" />
              <p>
                Acceso restringido. Las credenciales las entrega el administrador del expediente; no hay
                auto-registro público.
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-legal-blue/10 bg-white shadow-lg">
              <img
                src="/og-image.png"
                alt="HerenciaRD — sistema de herencia familiar dominicana"
                className="h-auto w-full object-cover"
                width={1200}
                height={630}
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 rounded-xl border border-legal-blue/15 bg-white/95 p-4 shadow-md backdrop-blur sm:left-6 sm:right-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-legal-gray">Expediente activo</p>
              <p className="mt-1 font-serif text-lg font-bold text-legal-blue">Familia Sangiovanni</p>
              <p className="mt-1 text-sm text-gray-600">
                Sucesión intestada · árbol, herederos, dobles linajes y documentación probatoria.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="modulos" className="app-shell scroll-mt-24 pb-12 sm:pb-16">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-legal-gold">Módulos principales</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-legal-blue sm:text-3xl">
            Todo el expediente en una sola plataforma
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border border-legal-blue/10 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col p-5">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-legal-gold/30 bg-legal-gold/10">
                  <Icon className="h-5 w-5 text-legal-blue" />
                </div>
                <h3 className="font-serif text-lg font-bold text-legal-blue">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-legal-blue/10 bg-legal-blue/[0.03]">
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
                text: 'Herederos, colaboradores y administradores acceden solo a las pantallas autorizadas.',
              },
              {
                icon: ShieldCheck,
                title: 'Listo para producción',
                text: 'Datos en MySQL, sesiones seguras y despliegue en entorno Hostinger del expediente.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-xl border border-legal-blue/10 bg-white p-5 shadow-sm"
              >
                <Icon className="mb-3 h-6 w-6 text-legal-gold" />
                <h3 className="font-semibold text-legal-blue">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="app-shell py-12 sm:py-16">
        <div className="rounded-2xl border border-legal-gold/30 bg-gradient-to-br from-legal-blue to-legal-blue/90 px-6 py-8 text-center text-white sm:px-10 sm:py-10">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">¿Ya tienes credenciales?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-legal-beige/90 sm:text-base">
            Inicia sesión para acceder al árbol genealógico, la explicación de herederos y el resto de
            módulos del expediente.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 h-11 w-full bg-legal-gold text-legal-blue hover:bg-legal-gold/90 sm:w-auto"
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
