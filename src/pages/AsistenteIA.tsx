import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, LockKeyhole, RefreshCcw, Route, Send, ShieldCheck, UserRound } from 'lucide-react';
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

const siennaThinkingMessages = [
  'Sienna está hilando la respuesta...',
  'Sienna está ordenando la idea para ti...',
  'Sienna está conectando los puntos...',
  'Sienna está preparando una respuesta clara...',
];

const pickThinkingMessage = (seed: string) => {
  const index = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % siennaThinkingMessages.length;
  return siennaThinkingMessages[index];
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
  const [thinkingMessage, setThinkingMessage] = useState(siennaThinkingMessages[0]);
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
    setThinkingMessage(pickThinkingMessage(prompt + String(Date.now())));
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
      <SiennaPageLayout className="flex min-h-dvh flex-col py-2 sm:py-4 lg:py-6">
        <div className="mb-3 flex shrink-0 flex-col gap-3 px-1 md:mb-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-legal-gold/35 bg-[#FFF6D8] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-[#0A1020] sm:text-xs">
              <Bot className="h-3.5 w-3.5 text-legal-gold" />
              Sienna contigo
            </div>
            <h1 className="font-serif text-xl font-bold leading-tight text-legal-blue dark:text-[#F5F7FA] sm:text-3xl">
              {personalization.isLinkedMember ? `${personalization.firstName}, hablemos de tu expediente` : 'Hablemos del expediente'}
            </h1>
            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-gray-700 dark:text-muted-foreground sm:text-sm">
              {personalization.isLinkedMember
                ? `Puedo guiarte tomando como referencia tu ficha familiar: ${personalization.memberLabel}. Siempre te explico y te llevo al lugar correcto, sin cambiar nada.`
                : 'Puedo ayudarte a entender el reparto, el árbol, los documentos y los hallazgos, siempre guiándote sin cambiar nada del expediente.'}
            </p>
          </div>
          <PageHelp helpKey="sienna-asistente" />
        </div>

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="legacy-surface flex min-h-0 overflow-hidden rounded-none border-x-0 sm:rounded-md sm:border-x">
            <CardContent className="flex h-[calc(100dvh-12.5rem)] min-h-[30rem] min-w-0 flex-1 flex-col p-0 sm:h-[calc(100dvh-12rem)] xl:h-[calc(100dvh-8rem)] xl:max-h-[52rem]">
              {(messages.length > 0 || hasStoredContext) && (
                <div className="flex shrink-0 justify-end border-b border-legal-blue/10 bg-white/55 px-3 py-2 dark:border-white/10 dark:bg-[#0F1726]/80 sm:px-4">
                  <Button type="button" variant="outline" size="sm" className="btn-secondary h-8 text-xs" onClick={clearConversation}>
                    <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                    Nueva conversación
                  </Button>
                </div>
              )}
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#FBF8EF] px-3 py-4 dark:bg-[#0F1726] sm:px-5">
                {messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center text-sm text-gray-600 dark:text-muted-foreground">
                    <div className="max-w-sm rounded-md border border-legal-gold/20 bg-white/65 px-5 py-6 shadow-sm dark:border-white/10 dark:bg-[#162033]/72">
	                      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-legal-gold/15 text-legal-gold">
                          <Bot className="h-6 w-6" />
                        </div>
	                      {personalization.isLinkedMember
	                        ? `${personalization.firstName}, pregúntame por tu rama familiar, tus documentos o una ruta del expediente.`
	                        : 'Escríbeme con tus palabras lo que quieres entender del expediente.'}
	                    </div>
                  </div>
                ) : (
                  messages.filter((message) => message.role !== 'assistant' || message.content).map((message, index) => (
                    <div
                      key={index}
                      className={`flex min-w-0 items-end gap-2 ${message.role === 'user' ? 'ml-auto max-w-[94%] flex-row-reverse sm:max-w-[82%]' : 'mr-auto max-w-[96%] sm:max-w-[88%]'}`}
                    >
                      <div
                        className={
                          message.role === 'user'
                            ? 'mb-1 hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-legal-blue text-white sm:grid'
                            : 'mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-legal-gold/18 text-legal-gold'
                        }
                      >
                        {message.role === 'user' ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                      <div
                        className={
                          message.role === 'user'
                            ? 'whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-legal-blue px-4 py-3 text-sm leading-relaxed text-white shadow-sm'
                            : 'whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-legal-gold/20 bg-[#FFFDF7] px-4 py-3 text-sm leading-relaxed text-[#1B2430] shadow-sm dark:bg-[#162033] dark:text-[#F5F7FA]'
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
                    </div>
                  ))
                )}
                {isSending && !messages[messages.length - 1]?.content && (
                  <div className="mr-auto flex max-w-[96%] items-end gap-2 sm:max-w-[88%]">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-legal-gold/18 text-legal-gold">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md border border-legal-gold/20 bg-[#FFFDF7] px-4 py-3 text-sm text-gray-600 shadow-sm dark:bg-[#162033] dark:text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span>{thinkingMessage}</span>
                        <span className="sienna-chat-dots" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && <p className="shrink-0 px-3 pt-2 text-sm font-medium text-red-600 sm:px-4">{error}</p>}
              <div className="shrink-0 border-t border-legal-blue/10 bg-[#FFFDF7]/96 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#111A2A]/96 sm:p-3">
                <div className="flex items-end gap-2">
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Escribe tu pregunta sobre el expediente..."
                  className="max-h-32 min-h-[48px] flex-1 resize-none rounded-2xl border-legal-blue/15 bg-white px-4 py-3 text-base sm:min-h-[56px] sm:text-sm"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault();
                      void ask();
                    }
                  }}
                />
                <Button className="btn-primary grid h-12 w-12 shrink-0 place-items-center rounded-full p-0 sm:w-14" disabled={!canSend} onClick={() => void ask()} aria-label="Enviar">
                  <Send className="h-4 w-4" />
                </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="hidden space-y-3 xl:block">
            <Card className="legacy-surface">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-legal-gold" />
                  <h2 className="font-serif text-lg font-bold text-legal-blue dark:text-[#F5F7FA]">Cuidado del expediente</h2>
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
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-legal-gold" />
                  <h2 className="font-serif text-lg font-bold text-legal-blue dark:text-[#F5F7FA]">Cómo te acompaño</h2>
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
