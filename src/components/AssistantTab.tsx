import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Info } from 'lucide-react';
import { ChatMessage, Medication, IntakeLog } from '../types';

interface AssistantTabProps {
  meds: Medication[];
  intakeLog: IntakeLog;
}

export default function AssistantTab({ meds, intakeLog }: AssistantTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: `こんにちは！お薬AIアシスタントです。

登録しているお薬についてや、残量不足への対応、一般的な飲み合わせ、飲み忘れの対処方法など、何でも聞いてくださいね。💊

※回答を生成する際、お薬箱に登録されているお薬の一覧と最近の服薬状況をふまえてアドバイスいたします。`
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isGenerating) return;

    if (!textToSend) setInput('');

    // Append user message
    const userMsgId = 'user-' + Date.now();
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, role: 'user', text: query }
    ];
    setMessages(newMessages);
    setIsGenerating(true);

    // Append loading message placeholder
    const loadingId = 'loading-' + Date.now();
    setMessages(prev => [...prev, { id: loadingId, role: 'loading', text: 'お薬のアドバイスを考えています...' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          meds: meds,
          history: intakeLog
        })
      });

      const data = await response.json();

      setMessages(prev => {
        // Remove loading state and append assistant response
        const filtered = prev.filter(m => m.id !== loadingId);
        if (response.ok && data.text) {
          return [...filtered, { id: 'ast-' + Date.now(), role: 'assistant', text: data.text }];
        } else {
          return [...filtered, { id: 'err-' + Date.now(), role: 'error', text: data.error || 'お薬の情報を取得できませんでした。時間をおいてもう一度お試しください。' }];
        }
      });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev.filter(m => m.id !== loadingId),
        { id: 'err-' + Date.now(), role: 'error', text: '通信エラーが発生しました。インターネット接続を確認し、もう一度お試しください。' }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const quickQuestions = [
    { label: "💊 残量が少ない薬は？", query: "残量が少なくなっているお薬はありますか？どのお薬を補充すればよいか教えてください。" },
    { label: "🤝 飲み合わせの注意点", query: "登録しているお薬の飲み合わせや注意点について、何か注意すべきことはありますか？" },
    { label: "⚠️ 飲み忘れたら？", query: "お薬を飲み忘れてしまった場合、どうすればよいですか？一般的な対処法を教えてください。" }
  ];

  return (
    <div className="space-y-4 flex flex-col h-[520px]">
      
      {/* Title */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="bg-gradient-to-r from-teal-400 to-emerald-400 p-2 rounded-xl text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-base">お薬AIアシスタント</h2>
          <p className="text-[10px] text-slate-400">Geminiがお薬の疑問にお答えします</p>
        </div>
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q.query)}
            disabled={isGenerating}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2.5 py-1.5 rounded-full transition duration-150 disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Frame */}
      <div className="bg-slate-50/70 rounded-2xl p-3.5 flex flex-col flex-1 border border-slate-150 overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-sm scroll-smooth">
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end animate-[fadeIn_0.2s_ease-out]">
                  <div className="bg-blue-500 text-white p-3.5 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>
              );
            }

            if (msg.role === 'loading') {
              return (
                <div key={msg.id} className="flex items-start space-x-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-xs font-medium text-slate-400 italic">
                    {msg.text}
                  </div>
                </div>
              );
            }

            if (msg.role === 'error') {
              return (
                <div key={msg.id} className="flex items-center space-x-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-2xl text-xs font-semibold">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              );
            }

            // Assistant messages formatted
            return (
              <div key={msg.id} className="flex items-start space-x-2 animate-[fadeIn_0.2s_ease-out]">
                <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                  {msg.id === 'welcome-msg' && (
                    <span className="text-[9px] text-rose-500 font-bold block mt-2.5 leading-normal bg-rose-50 border border-rose-100 p-1.5 rounded-lg">
                      ※アドバイスは専門家の診断に代わるものではありません。重要な判断は必ず専門家にご相談ください。
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="mt-2.5 flex space-x-2 border-t border-slate-200/60 pt-2.5 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isGenerating}
            placeholder="お薬について質問する..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isGenerating || !input.trim()}
            className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white p-2.5 rounded-xl shadow-sm active:scale-95 transition disabled:opacity-50"
            aria-label="送信"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
