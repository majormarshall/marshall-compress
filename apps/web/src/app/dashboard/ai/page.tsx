'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, Trash2, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { aiApi } from '@/lib/api/endpoints';
import { toast } from 'sonner';

type AIProvider = 'openai' | 'google' | 'anthropic';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: AIProvider;
}

const providers: { id: AIProvider; label: string; model: string; color: string }[] = [
  { id: 'openai', label: 'OpenAI GPT-4o', model: 'gpt-4o-mini', color: 'text-emerald-400' },
  { id: 'google', label: 'Gemini Flash', model: 'gemini-2.0-flash', color: 'text-blue-400' },
  { id: 'anthropic', label: 'Claude Sonnet', model: 'claude-sonnet-4-5', color: 'text-orange-400' },
];

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [showProviders, setShowProviders] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeProvider = providers.find(p => p.id === provider)!;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.chat({
        message: userMsg.content,
        provider,
        model: activeProvider.model,
        conversationId: conversationId || undefined,
      });
      if (res.conversationId && !conversationId) setConversationId(res.conversationId);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        timestamp: new Date(),
        provider,
      }]);
    } catch (err: any) {
      toast.error(err?.message || 'AI request failed. Check your API key configuration.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto w-full gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">AI Assistant</h1>
          <Badge variant="violet" className="ml-2">Multi-Provider</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Provider Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProviders(!showProviders)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/60 text-sm text-slate-300 hover:border-white/20 transition-colors"
            >
              <span className={cn('w-2 h-2 rounded-full bg-current', activeProvider.color)} />
              {activeProvider.label}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
            {showProviders && (
              <div className="absolute right-0 top-full mt-1 w-48 glass-dropdown rounded-xl p-1 z-50">
                {providers.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setProvider(p.id); setShowProviders(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                      provider === p.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full bg-current', p.color)} />
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={clearChat} className="text-slate-500 hover:text-rose-400">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col rounded-2xl border border-white/8 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">AI Assistant Ready</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Ask anything — summarise documents, write code, analyse data, or query your MARSHALL workspace.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {[
                  'Summarise my recent meeting notes',
                  'Help me write a project proposal',
                  'Explain the compression results',
                  'What files did I upload today?',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="text-left text-xs text-slate-400 border border-white/5 rounded-xl p-3 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
              )}
              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-blue-600/20 border border-blue-500/30 text-slate-100 rounded-tr-sm'
                  : 'bg-slate-800/60 border border-white/8 text-slate-200 rounded-tl-sm'
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {msg.timestamp.toLocaleTimeString()}
                  {msg.provider && ` · ${providers.find(p => p.id === msg.provider)?.label}`}
                </span>
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-slate-800/60 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-end gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${activeProvider.label}... (Enter to send, Shift+Enter for newline)`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none max-h-32 leading-relaxed"
              style={{ minHeight: '24px' }}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="shrink-0 shadow-lg shadow-blue-600/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
