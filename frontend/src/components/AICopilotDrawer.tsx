import React, { useState } from 'react';
import { Sparkles, Send, X, ArrowUpRight, ShieldAlert, Database, ChevronRight, CornerDownLeft } from 'lucide-react';
import { api } from '../services/api';
import { CopilotQueryResponse } from '../types';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAccount: (id: string) => void;
  defaultAccountId?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  response?: CopilotQueryResponse;
  timestamp: string;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToAccount,
  defaultAccountId,
}) => {
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am **Pipeline IQ Copilot**. I analyze decision debt, graph relationship ripple effects, and revenue exposure across your active accounts.\n\nAsk me about high-risk accounts, stalled deals, or what actions your team should take today.",
      timestamp: 'Just now',
    },
  ]);

  const quickPrompts = [
    'Why is ACME high risk?',
    'Which accounts have the highest decision debt?',
    'What revenue is currently at risk?',
    'Which decisions are overdue?',
    'What should the sales team act on today?',
    'Show me accounts where multiple contacts are becoming inactive.',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.queryCopilot(textToSend, defaultAccountId);
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: res.answer,
        response: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: `Error processing query: ${err.message || 'Please check API connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pipeline IQ AI Copilot Assistant"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-label="Close copilot drawer"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-[#0B0F17] border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Pipeline IQ Copilot
                </h2>
                <p className="text-[11px] text-slate-400">
                  Grounded pipeline reasoning & deterministic evidence synthesis
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800/60">
            <div className="text-[10px] uppercase font-mono text-slate-500 mb-1.5">
              Suggested queries
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-emerald-500/40 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-xl p-3.5 leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {/* Render Markdown-like bolding and paragraphs */}
                    <div className="space-y-2 whitespace-pre-line">
                      {m.text.split('\n\n').map((paragraph, pIdx) => {
                        // Replace **bold** with <strong>
                        const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={pIdx}>
                            {parts.map((part, partIdx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <strong key={partIdx} className="font-semibold text-slate-100">
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return part;
                            })}
                          </p>
                        );
                      })}
                    </div>

                    {/* Cited Accounts Badges */}
                    {m.response?.cited_accounts && m.response.cited_accounts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80">
                        <div className="text-[10px] uppercase font-mono text-slate-400 mb-1.5 flex items-center gap-1">
                          <Database className="w-3 h-3 text-emerald-400" />
                          <span>Referenced Accounts:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.response.cited_accounts.map((acc) => (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => {
                                onNavigateToAccount(acc.id);
                                onClose();
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono hover:bg-emerald-900/60 transition-colors"
                            >
                              <span>{acc.name}</span>
                              <span className="text-[10px] text-emerald-400/80">
                                (${(acc.revenue_at_risk / 1000).toFixed(0)}k at risk)
                              </span>
                              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cited Evidence Badges */}
                    {m.response?.cited_evidence && m.response.cited_evidence.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                        <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">
                          Evidence Ledger Signals:
                        </div>
                        <div className="space-y-1">
                          {m.response.cited_evidence.map((ev, evIdx) => (
                            <div
                              key={ev.id || evIdx}
                              className="text-[11px] bg-slate-950/60 p-1.5 rounded border border-slate-800 text-slate-300 flex items-start gap-1.5"
                            >
                              <span className="text-emerald-400 font-mono text-[9px] mt-0.5">
                                [SIG]
                              </span>
                              <span>{ev.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl max-w-xs text-xs text-slate-400 animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Synthesizing database & graph telemetry...</span>
              </div>
            )}
          </div>

          {/* Bottom input */}
          <div className="p-3 sm:p-4 bg-slate-900/80 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about accounts, risks, or pipeline decision debt..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Grounding: 100% Deterministic Signals</span>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
