
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PageHelp from '@/components/PageHelp';

const Legal = () => {
  return (
    <div className="app-shell py-8">
      <div className="relative max-w-5xl mx-auto">
        <div className="absolute right-0 top-0">
          <PageHelp helpKey="legal" />
        </div>
        <h1 className="pr-12 text-3xl font-bold text-gray-900 mb-8">Información Legal</h1>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Términos y Condiciones</CardTitle>
              <CardDescription>
                Última actualización: {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p>
                Al utilizar LegalTech, usted acepta cumplir con estos términos y condiciones.
                Nuestra plataforma está diseñada para simplificar procesos legales y 
                proporcionar herramientas útiles para profesionales del derecho.
              </p>
              
              <h3 className="text-lg font-semibold mt-6 mb-3">Uso de la Plataforma</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>La plataforma debe utilizarse únicamente para fines legales legítimos</li>
                <li>Los usuarios son responsables de la exactitud de la información ingresada</li>
                <li>No se permite el uso indebido o no autorizado de la plataforma</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Responsabilidad</h3>
              <p>
                LegalTech proporciona herramientas de asistencia, pero no constituye 
                asesoramiento legal profesional. Siempre consulte con un abogado 
                calificado para asuntos legales importantes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Política de Privacidad</CardTitle>
              <CardDescription>
                Cómo protegemos y utilizamos su información
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-3">Recopilación de Datos</h3>
              <p>
                Recopilamos únicamente la información necesaria para proporcionar 
                nuestros servicios, incluyendo:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Información de registro (email, nombre)</li>
                <li>Datos de uso de la plataforma</li>
                <li>Información ingresada en los cálculos y documentos</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Protección de Datos</h3>
              <p>
                Utilizamos medidas de seguridad estándar de la industria para 
                proteger su información personal y garantizar la confidencialidad 
                de sus datos legales.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
              <CardDescription>
                ¿Tiene preguntas sobre nuestros términos legales?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Para consultas legales o sobre privacidad, contáctenos en:
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Email:</strong> legal@legaltech.com</p>
                <p><strong>Teléfono:</strong> +1 (555) 123-4567</p>
                <p><strong>Dirección:</strong> 123 Legal Street, Ciudad, País</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Legal;
