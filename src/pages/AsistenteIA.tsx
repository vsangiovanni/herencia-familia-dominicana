import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, LockKeyhole, RefreshCcw, Route, Send, ShieldCheck } from 'lucide-react';
import PageHelp from '@/components/PageHelp';
import SiennaPageLayout from '@/components/sienna/SiennaPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useSiennaPersonalization } from '@/hooks/useSiennaPersonalization';
import { api, SiennaAiAssistantResponse, SiennaConversationMessage } from '@/lib/api';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  response?: SiennaAiAssistantResponse;
};

const SIENNA_CONVERSATION_STORAGE_KEY = 'herenciard:sienna-ai:last-conversation:v1';
const SIENNA_CONVERSATION_STORAGE_PREFIX = 'herenciard:sienna-ai:last-conversation:user:';

const conversationStorageKey = (userId?: string | null) =>
  userId ? `${SIENNA_CONVERSATION_STORAGE_PREFIX}${userId}:v1` : null;

const loadStoredConversation = (storageKey: string | null): ChatMessage[] => {
  if (typeof window === 'undefined') return [];
  if (!storageKey) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((message) => message && (message.role === 'user' || message.role === 'assistant') && String(message.content || '').trim())
      .slice(-20)
      .map((message) => ({
        role: message.role,
        content: String(message.content || '').slice(0, 2400),
        response: message.response,
      }));
  } catch {
    return [];
  }
};

const MENU_LABEL_BY_ROUTE: Record<string, string> = {
  '/sienna/arbol': 'Árbol genealógico',
  '/sienna/arbol-genealogico': 'Árbol genealógico',
  '/sienna/miembros': 'Miembros del árbol',
  '/sienna/miembros-arbol': 'Miembros del árbol',
  '/sienna/documentos': 'Documentos probatorios',
  '/documentos-probatorios': 'Documentos probatorios',
  '/sienna/explicacion': 'Explicación herederos',
  '/sienna/explicacion-herederos': 'Explicación herederos',
  '/sienna/linajes': 'Dobles linajes',
  '/sienna/dobles-linajes': 'Dobles linajes',
  '/sienna/hallazgos': 'Hallazgos',
  '/hallazgos': 'Hallazgos',
  '/sienna/filiacion': 'Filiación',
  '/calculo-filiacion': 'Filiación',
  '/sienna/asistente': 'Sienna',
  '/sienna': 'Caso Alessandro',
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const humanizeAssistantAnswer = (value: string) => {
  let text = value;
  Object.entries(MENU_LABEL_BY_ROUTE)
    .sort(([left], [right]) => right.length - left.length)
    .forEach(([route, label]) => {
      const escaped = escapeRegExp(route);
      text = text.replace(new RegExp('\\s*\\(?' + escaped + '(?:\\?[^\\s)]*)?\\)?', 'g'), ' **' + label + '**');
    });

  const half = Math.floor(text.length / 2);
  const left = text.slice(0, half).trim();
  const right = text.slice(half).trim();
  if (left.length > 80 && left === right) return left;
  return text.replace(new RegExp('\\n{3,}', 'g'), '\\n\\n').trim();
};

const renderAnswer = (answer: string) => {
  const lines = humanizeAssistantAnswer(answer).split('\n');
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};

const AsistenteIA = () => {
  const location = useLocation();
  const { userProfile, user } = useAuth();
  const personalization = useSiennaPersonalization();
  const storageKey = useMemo(() => conversationStorageKey(userProfile?.id || user?.id), [user?.id, userProfile?.id]);
  const animationChainRef = useRef<Promise<void>>(Promise.resolve());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const previousConversationRef = useRef<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStoredContext, setHasStoredContext] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(() => question.trim().length >= 3 && !isSending, [question, isSending]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isSending]);

  useEffect(() => {
    const storedConversation = loadStoredConversation(storageKey);
    previousConversationRef.current = storedConversation;
    setMessages([]);
    setHasStoredContext(storedConversation.length > 0);
    setError(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SIENNA_CONVERSATION_STORAGE_KEY);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    if (typeof window === 'undefined') return;
    const persistable = messages
      .filter((message) => message.content.trim())
      .slice(-20)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 2400),
        response: message.response,
      }));
    if (!persistable.length) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(persistable));
    setHasStoredContext(true);
  }, [messages, storageKey]);

  const clearConversation = () => {
    previousConversationRef.current = [];
    setMessages([]);
    setHasStoredContext(false);
    setError(null);
    if (typeof window !== 'undefined' && storageKey) {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(SIENNA_CONVERSATION_STORAGE_KEY);
    }
  };

  const appendAssistantText = (delta: string) => {
    if (!delta) return Promise.resolve();
    const text = humanizeAssistantAnswer(delta);
    animationChainRef.current = animationChainRef.current.then(
      () =>
        new Promise<void>((resolve) => {
          let index = 0;
          const step = () => {
            const chunk = text.slice(index, index + 2);
            index += chunk.length;
            if (chunk) {
              setMessages((current) => {
                const next = [...current];
                const lastIndex = next.length - 1;
                if (next[lastIndex]?.role === 'assistant') {
                  next[lastIndex] = { ...next[lastIndex], content: next[lastIndex].content + chunk };
                }
                return next;
              });
            }
            if (index < text.length) {
              window.setTimeout(step, 14);
            } else {
              resolve();
            }
          };
          step();
        })
    );
    return animationChainRef.current;
  };

  const ask = async (text?: string) => {
    const prompt = (text || question).trim();
    if (prompt.length < 3) return;
    const visibleHistory = messages.filter((message) => message.content.trim());
    const conversationHistory: SiennaConversationMessage[] = [...previousConversationRef.current, ...visibleHistory]
      .filter((message) => message.content.trim())
      .slice(-8)
      .map((message) => ({ role: message.role, content: message.content.slice(0, 900) }));
    setError(null);
    setQuestion('');
    setMessages((current) => [...current, { role: 'user', content: prompt }, { role: 'assistant', content: '' }]);
    setIsSending(true);
    try {
      const response = await api.streamSiennaAssistant(prompt, location.pathname, (delta) => {
        void appendAssistantText(delta);
      }, conversationHistory);
      await animationChainRef.current;
      setMessages((current) => {
        const next = [...current];
        const lastIndex = next.length - 1;
        if (next[lastIndex]?.role === 'assistant') {
          next[lastIndex] = { role: 'assistant', content: humanizeAssistantAnswer(response.answer), response };
        }
        return next;
      });
    } catch (caught) {
      try {
        const response = await api.askSiennaAssistant(prompt, location.pathname, conversationHistory);
        await appendAssistantText(response.answer);
        setMessages((current) => {
          const next = [...current];
          const lastIndex = next.length - 1;
          if (next[lastIndex]?.role === 'assistant') {
            next[lastIndex] = { role: 'assistant', content: humanizeAssistantAnswer(response.answer), response };
          }
          return next;
        });
      } catch (fallbackError) {
        setMessages((current) => current.filter((_, index) => index !== current.length - 1));
        setError(fallbackError instanceof Error ? fallbackError.message : 'No pude consultar el expediente en este momento.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#F6F2E8] dark:bg-background">
      <SiennaPageLayout>
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-legal-gold/35 bg-[#FFF6D8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0A1020]">
              <Bot className="h-3.5 w-3.5 text-legal-gold" />
              Sienna contigo
            </div>
            <h1 className="font-serif text-2xl font-bold text-legal-blue dark:text-[#F5F7FA] sm:text-3xl">
              {personalization.isLinkedMember ? `${personalization.firstName}, hablemos de tu expediente` : 'Hablemos del expediente'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700 dark:text-muted-foreground">
              {personalization.isLinkedMember
                ? `Puedo guiarte tomando como referencia tu ficha familiar: ${personalization.memberLabel}. Siempre te explico y te llevo al lugar correcto, sin cambiar nada.`
                : 'Puedo ayudarte a entender el reparto, el árbol, los documentos y los hallazgos, siempre guiándote sin cambiar nada del expediente.'}
            </p>
          </div>
          <PageHelp helpKey="sienna-asistente" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="legacy-surface overflow-hidden">
            <CardContent className="flex h-[calc(100dvh-15rem)] min-h-[420px] min-w-0 flex-col p-3 sm:h-[calc(100dvh-12rem)] sm:min-h-[560px] sm:p-5 xl:h-[calc(100dvh-6rem)] xl:max-h-[820px]">
              {(messages.length > 0 || hasStoredContext) && (
                <div className="mb-3 flex justify-end">
                  <Button type="button" variant="outline" size="sm" className="btn-secondary" onClick={clearConversation}>
                    <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                    Nueva conversación
                  </Button>
                </div>
              )}
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-md border border-legal-blue/10 bg-white/55 p-3 dark:border-white/10 dark:bg-[#0F1726]/70">
                {messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center text-sm text-gray-600 dark:text-muted-foreground">
                    <div>
	                      <Bot className="mx-auto mb-3 h-10 w-10 text-legal-gold" />
	                      {personalization.isLinkedMember
	                        ? `${personalization.firstName}, pregúntame por tu rama familiar, tus documentos o una ruta del expediente.`
	                        : 'Escríbeme con tus palabras lo que quieres entender del expediente.'}
	                    </div>
                  </div>
                ) : (
                  messages.filter((message) => message.role !== 'assistant' || message.content).map((message, index) => (
                    <div
                      key={index}
                      className={message.role === 'user' ? 'ml-auto min-w-0 max-w-[88%] sm:max-w-[82%]' : 'mr-auto min-w-0 max-w-[94%] sm:max-w-[92%]'}
                    >
                      <div
                        className={
                          message.role === 'user'
                            ? 'whitespace-pre-wrap break-words rounded-md bg-legal-blue px-4 py-3 text-sm leading-relaxed text-white'
                            : 'whitespace-pre-wrap break-words rounded-md border border-legal-gold/25 bg-[#FFFDF7] px-4 py-3 text-sm leading-relaxed text-[#1B2430] dark:bg-[#162033] dark:text-[#F5F7FA]'
                        }
                      >
                        {message.role === 'assistant' ? renderAnswer(message.content) : message.content}
                      </div>
                      {message.response?.suggested_paths?.length ? (
                        <div className="mt-2 flex max-w-full flex-wrap gap-2">
                          {message.response.suggested_paths.map((item) => (
                            <Button key={item.path} asChild size="sm" variant="outline" className="btn-secondary">
                              <Link to={item.path}>
                                <Route className="mr-1.5 h-3.5 w-3.5" />
                                {item.label}
                              </Link>
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
                {isSending && !messages[messages.length - 1]?.content && (
                  <div className="mr-auto max-w-[92%] rounded-md border border-legal-gold/25 bg-[#FFFDF7] px-4 py-3 text-sm text-gray-600 dark:bg-[#162033] dark:text-muted-foreground">
                    Estoy revisando el expediente...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Escribe tu pregunta sobre el expediente..."
                  className="min-h-[64px] flex-1 resize-none"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault();
                      void ask();
                    }
                  }}
                />
                <Button className="btn-primary sm:w-36" disabled={!canSend} onClick={() => void ask()}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="legacy-surface">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-legal-gold" />
                  <h2 className="font-serif text-xl font-bold text-legal-blue dark:text-[#F5F7FA]">Cuidado del expediente</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700 dark:text-muted-foreground">
                  <li>No cambio nada por ti.</li>
                  <li>No toca el reparto, el árbol, los documentos ni los miembros.</li>
                  <li>Te explica qué revisar y dónde hacerlo.</li>
                  <li>Si hay que corregir algo, te guía paso a paso en la pantalla correcta.</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="legacy-surface">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-legal-gold" />
                  <h2 className="font-serif text-xl font-bold text-legal-blue dark:text-[#F5F7FA]">Cómo te acompaño</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-muted-foreground">
                  Estoy aquí para ayudarte a leer el expediente con claridad, sin tomar decisiones ni hacer cambios por cuenta propia.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SiennaPageLayout>
    </div>
  );
};

export default AsistenteIA;
