import React, { useState } from 'react';
import { Send, X, Database, ChevronRight, CornerDownLeft, MessageSquareCode } from 'lucide-react';
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
      text: "Welcome to **Ask Pipeline IQ**. I answer queries by directly querying deterministic pipeline metrics, stakeholder relationship graphs, and decision debt calculations.\n\nAsk about high-risk accounts, revenue exposure, or unresolved contracts.",
      timestamp: 'Active',
    },
  ]);

  const quickPrompts = [
    'Why is ACME at critical risk?',
    'Which accounts have the highest decision debt?',
    'What revenue is currently at risk?',
    'Which decisions are overdue?',
    'What contracts are currently escalated?',
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
      aria-label="Ask Pipeline IQ Assistant"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-label="Close assistant drawer"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-[#0B0F17] border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 bg-[#111726] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-slate-900 border border-slate-700 text-blue-400">
                <MessageSquareCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Ask Pipeline IQ
                </h2>
                <p className="text-[11px] text-slate-400">
                  Grounded pipeline reasoning &amp; deterministic data queries
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2.5 bg-slate-950 border-b border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500 mb-1.5 font-medium">
              Suggested queries
            </div>
            <div className="flex flex-wrap gap-1">
              {quickPrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-[11px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-500">
                  <span>{msg.sender === 'user' ? 'Operator' : 'Pipeline IQ Engine'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-md text-xs leading-relaxed max-w-[92%] ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#111726] border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {msg.text}
                  </div>

                  {/* Grounded Account Context Card if attached */}
                  {msg.response && (msg.response.relevant_account_id || msg.response.cited_accounts?.[0]?.id) && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">
                        Target Account: <strong className="text-white">{msg.response.relevant_account_id || msg.response.cited_accounts?.[0]?.name || msg.response.cited_accounts?.[0]?.id}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = msg.response?.relevant_account_id || msg.response?.cited_accounts?.[0]?.id;
                          if (targetId) {
                            onNavigateToAccount(targetId);
                            onClose();
                          }
                        }}
                        className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                      >
                        <span>Open Account Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-[11px]">Querying pipeline data &amp; calculating telemetry...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-800 bg-[#111726]">
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
                placeholder="Ask about accounts, decision debt, or revenue risk..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
                aria-label="Send query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Grounding: SQLite Database + Deterministic Multi-Factor Formula</span>
              <span>Press Enter ↵</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
