import type { LegacyAiRequest, LegacyAiResponse } from './types';

const fallbackByMode: Record<LegacyAiRequest['mode'], LegacyAiResponse> = {
  narrator: {
    text: 'La Ruta de Vincenzo despierta. Cada piedra, sello y pergamino puede abrir una rama dormida del legado.',
    tone: 'epic',
    anchors: ['vincenzo-root', 'italia-1860'],
    suggested_action: 'Avanza hacia el pergamino luminoso.',
    confidence: 0.7,
  },
  hint: {
    text: 'El documento no esta perdido por azar. Busca la luz dorada: suele aparecer donde una ruta familiar pide ser recordada.',
    tone: 'mystery',
    anchors: ['acta-ruta-vincenzo'],
    suggested_action: 'Recoge el pergamino antes de acercarte al portal.',
    confidence: 0.72,
  },
  mission: {
    text: 'Restaura el primer fragmento del arbol para que la convergencia pueda abrirse sin tocar el expediente real.',
    tone: 'epic',
    anchors: ['acta-ruta-vincenzo', 'portal-paolo'],
    suggested_action: 'Completa Documento Historico.',
    confidence: 0.74,
  },
  dialogue: {
    text: 'Este hallazgo no cambia la historia: la ilumina. El expediente permanece intacto; el juego solo revela su eco narrativo.',
    tone: 'intimate',
    anchors: ['acta-ruta-vincenzo'],
    suggested_action: 'Lleva el fragmento hacia el portal.',
    confidence: 0.78,
  },
  convergence: {
    text: 'Las ramas reconocen su vinculo. El portal se abre como una memoria compartida entre Vincenzo y Paolo.',
    tone: 'epic',
    anchors: ['vincenzo-root', 'portal-paolo'],
    suggested_action: 'Cruza el portal cuando estes listo.',
    confidence: 0.76,
  },
};

export async function getLegacyAiLine(request: LegacyAiRequest): Promise<LegacyAiResponse> {
  try {
    const response = await fetch('/api/sienna-game-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return fallbackByMode[request.mode];
    }

    const data = (await response.json()) as Partial<LegacyAiResponse>;

    if (!data.text) {
      return fallbackByMode[request.mode];
    }

    return {
      text: data.text,
      tone: data.tone || fallbackByMode[request.mode].tone,
      anchors: data.anchors || fallbackByMode[request.mode].anchors,
      suggested_action: data.suggested_action || fallbackByMode[request.mode].suggested_action,
      confidence: typeof data.confidence === 'number' ? data.confidence : fallbackByMode[request.mode].confidence,
    };
  } catch {
    return fallbackByMode[request.mode];
  }
}

