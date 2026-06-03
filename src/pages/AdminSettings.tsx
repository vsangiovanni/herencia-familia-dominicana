import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import DocumentHeader from '@/components/DocumentHeader';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { api, SiennaCaseConfig } from '@/lib/api';
import { applySiennaCaseConfig, getSiennaCaseConfig } from '@/lib/dominicanInheritance';

const emptyCaseConfig = (): SiennaCaseConfig => ({
  causante_name: '',
  family_trunk_name: '',
  legal_criterion_text: '',
  active_collateral_roots: [],
  known_intermediates: [],
});

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estateAmount, setEstateAmount] = useState('0');
  const [managementFeePercentage, setManagementFeePercentage] = useState('0');
  const [lawyerFeePercentage, setLawyerFeePercentage] = useState('0');
  const [caseConfig, setCaseConfig] = useState<SiennaCaseConfig>(emptyCaseConfig());
  const [advancedJson, setAdvancedJson] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settingsResponse = await api.getSettings();
      const amount = Number(settingsResponse.settings.estate_amount ?? 0);
      const managementFee = Number(settingsResponse.settings.management_fee_percentage ?? 0);
      const fee = Number(settingsResponse.settings.lawyer_fee_percentage ?? 0);
      setEstateAmount(String(amount));
      setManagementFeePercentage(String(managementFee));
      setLawyerFeePercentage(String(fee));
      applySiennaCaseConfig(settingsResponse.settings.sienna_case_config);
      const config = getSiennaCaseConfig();
      setCaseConfig(config);
      setAdvancedJson(JSON.stringify(config, null, 2));
    } catch (error) {
      toast({
        title: 'No se pudieron cargar los settings',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const syncFromAdvancedJson = () => {
    try {
      const parsed = JSON.parse(advancedJson) as SiennaCaseConfig;
      setCaseConfig(parsed);
      toast({
        title: 'JSON aplicado',
        description: 'El editor guiado fue actualizado con el JSON avanzado.',
      });
    } catch {
      toast({
        title: 'JSON inválido',
        description: 'No se pudo aplicar. Revisa el formato del JSON avanzado.',
        variant: 'destructive',
      });
    }
  };

  const syncAdvancedJsonFromForm = (nextConfig: SiennaCaseConfig) => {
    setAdvancedJson(JSON.stringify(nextConfig, null, 2));
  };

  const updateCaseConfig = (nextConfig: SiennaCaseConfig) => {
    setCaseConfig(nextConfig);
    syncAdvancedJsonFromForm(nextConfig);
  };

  const saveSettings = async () => {
    const parsedConfig = caseConfig;

    const amount = Math.max(0, Number(estateAmount || 0));
    const managementFee = Math.min(100, Math.max(0, Number(managementFeePercentage || 0)));
    const fee = Math.min(100, Math.max(0, Number(lawyerFeePercentage || 0)));
    setSaving(true);
    try {
      await api.updateSettings({
        estate_amount: amount,
        management_fee_percentage: managementFee,
        lawyer_fee_percentage: fee,
        sienna_case_config: parsedConfig,
      });
      applySiennaCaseConfig(parsedConfig);
      setEstateAmount(String(amount));
      setManagementFeePercentage(String(managementFee));
      setLawyerFeePercentage(String(fee));
      syncAdvancedJsonFromForm(parsedConfig);
      toast({
        title: 'Settings guardados',
        description: 'Los cambios de configuración quedaron persistidos en DB.',
      });
    } catch (error) {
      toast({
        title: 'No se pudieron guardar los settings',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SiennaPageLayout>
      <BackButton />
      <DocumentHeader
        title="Settings de Administracion"
        subtitle="Pantalla exclusiva para administradores. Configura parámetros globales y la configuración del caso Alessandro."
      />

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/sienna/miembros-arbol">Volver a Miembros del Arbol</Link>
        </Button>
      </div>

      <Card className="border border-legal-gold/20">
        <CardHeader className="bg-legal-blue/5 border-b">
          <CardTitle className="text-legal-blue">Settings (DB)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Monto bruto default de la herencia</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={estateAmount}
                onChange={(event) => setEstateAmount(event.target.value)}
                disabled={loading}
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-legal-gray">
                Default global para las pantallas del caso; cada pantalla puede simular otro monto sin cambiar Settings.
              </p>
            </div>
            <div>
              <Label>% gestión</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={managementFeePercentage}
                onChange={(event) => setManagementFeePercentage(event.target.value)}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-legal-gray">
                Se descuenta primero sobre el monto bruto.
              </p>
            </div>
            <div>
              <Label>% firma de abogados</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={lawyerFeePercentage}
                onChange={(event) => setLawyerFeePercentage(event.target.value)}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-legal-gray">
                Se aplica sobre el saldo después de gestión.
              </p>
            </div>
          </div>

          <div>
            <Label>Nombre del causante</Label>
            <Input
              value={caseConfig.causante_name}
              onChange={(event) =>
                updateCaseConfig({
                  ...caseConfig,
                  causante_name: event.target.value,
                })
              }
              disabled={loading}
            />
          </div>

          <div>
            <Label>Nombre del tronco familiar</Label>
            <Input
              value={caseConfig.family_trunk_name}
              onChange={(event) =>
                updateCaseConfig({
                  ...caseConfig,
                  family_trunk_name: event.target.value,
                })
              }
              disabled={loading}
            />
          </div>

          <div>
            <Label>Criterio legal (texto visible en el caso)</Label>
            <Textarea
              rows={5}
              value={caseConfig.legal_criterion_text}
              onChange={(event) =>
                updateCaseConfig({
                  ...caseConfig,
                  legal_criterion_text: event.target.value,
                })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ramas colaterales activas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateCaseConfig({
                    ...caseConfig,
                    active_collateral_roots: [...caseConfig.active_collateral_roots, { name: '', label: '' }],
                  })
                }
                disabled={loading}
              >
                Agregar rama
              </Button>
            </div>
            {caseConfig.active_collateral_roots.map((root, index) => (
              <div key={`root-${index}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder="Nombre en el árbol"
                  value={root.name}
                  onChange={(event) => {
                    const next = [...caseConfig.active_collateral_roots];
                    next[index] = { ...next[index], name: event.target.value };
                    updateCaseConfig({ ...caseConfig, active_collateral_roots: next });
                  }}
                  disabled={loading}
                />
                <Input
                  placeholder="Etiqueta corta (ej: Vincenzo/Vicente)"
                  value={root.label}
                  onChange={(event) => {
                    const next = [...caseConfig.active_collateral_roots];
                    next[index] = { ...next[index], label: event.target.value };
                    updateCaseConfig({ ...caseConfig, active_collateral_roots: next });
                  }}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() =>
                    updateCaseConfig({
                      ...caseConfig,
                      active_collateral_roots: caseConfig.active_collateral_roots.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  disabled={loading}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Nodos intermedios y explicación</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateCaseConfig({
                    ...caseConfig,
                    known_intermediates: [...caseConfig.known_intermediates, { name: '', reason: '' }],
                  })
                }
                disabled={loading}
              >
                Agregar intermedio
              </Button>
            </div>
            {caseConfig.known_intermediates.map((item, index) => (
              <div key={`intermediate-${index}`} className="space-y-2 rounded-md border p-3">
                <Input
                  placeholder="Nombre del miembro intermedio"
                  value={item.name}
                  onChange={(event) => {
                    const next = [...caseConfig.known_intermediates];
                    next[index] = { ...next[index], name: event.target.value };
                    updateCaseConfig({ ...caseConfig, known_intermediates: next });
                  }}
                  disabled={loading}
                />
                <Textarea
                  rows={2}
                  placeholder="Razón legal o de contexto para no heredar directamente"
                  value={item.reason}
                  onChange={(event) => {
                    const next = [...caseConfig.known_intermediates];
                    next[index] = { ...next[index], reason: event.target.value };
                    updateCaseConfig({ ...caseConfig, known_intermediates: next });
                  }}
                  disabled={loading}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() =>
                      updateCaseConfig({
                        ...caseConfig,
                        known_intermediates: caseConfig.known_intermediates.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                    disabled={loading}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label>Editor avanzado (JSON opcional)</Label>
            <Textarea
              rows={12}
              className="font-mono text-xs"
              value={advancedJson}
              onChange={(event) => setAdvancedJson(event.target.value)}
              disabled={loading}
            />
            <div className="mt-2 flex justify-end">
              <Button type="button" variant="outline" onClick={syncFromAdvancedJson} disabled={loading}>
                Aplicar JSON al formulario
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={saving || loading}>
              {saving ? 'Guardando...' : 'Guardar settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </SiennaPageLayout>
  );
};

export default AdminSettings;
