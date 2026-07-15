import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Info, Settings, ShieldCheck } from 'lucide-react';
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
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API Key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('om_gemini_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveApiKey = () => {
    localStorage.setItem('om_gemini_key', apiKey.trim());
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isGenerating) return;

    const storedKey = localStorage.getItem('om_gemini_key')?.trim() || apiKey.trim();
    
    if (!storedKey) {
      // Append info warning to user to insert their API Key
      setMessages(prev => [
        ...prev,
        { id: 'user-temp-' + Date.now(), role: 'user', text: query },
        { 
          id: 'err-key-' + Date.now(), 
          role: 'error', 
          text: 'AIアシスタントをご利用いただくには、右上の「設定」からGemini APIキーの登録が必要です。登録されたキーはご自身のブラウザ(LocalStorage)にのみ安全に保存され、第三者に共有されることはありません。' 
        }
      ]);
      setShowSettings(true);
      if (!textToSend) setInput('');
      return;
    }

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

    // Prepare system instructions context
    const medsContext = meds && meds.length > 0 
      ? JSON.stringify(meds.map((m: any) => ({
          name: m.name,
          dosageQty: m.dosageQty,
          dosageUnit: m.dosageUnit,
          stock: m.stock,
          timing: m.timing,
          memo: m.memo || "特になし"
        })), null, 2)
      : "登録されたお薬はありません。";

    const historyContext = JSON.stringify(intakeLog, null, 2);

    const systemInstruction = `あなたは親切でプロフェッショナルな「AIお薬アシスタント（薬剤師キャラ）」です。
患者（ユーザー）からの質問に対して、登録されているお薬情報と服薬履歴をふまえて、優しく丁寧、かつ適切に日本語でアドバイスしてください。

【現在の登録お薬（残量情報を含む）】
${medsContext}

【直近の服薬履歴（服用したかどうかのログ）】
${historyContext}

【指示事項】
1. 残量が少なくなっているお薬（例えば残り5回分以下など、1回の服用量(dosageQty) × 5 以下のストック）がある場合は、優しく注意を促し、早めの受診や薬局での処方箋手続きを勧めてください。
2. 飲み合わせ、副作用、飲み忘れの対処方法、お薬に関する疑問などについて、医学・薬学的知識に基づいて分かりやすく解説してください。
3. 文末には必ず「※このアドバイスは一般的な情報提供であり、医師や薬剤師の診断の代わりにはなりません。重要な判断や体調不良の際は、必ず主治医や薬剤師にご相談ください。」という免責事項を優しく含めてください。
4. 返答は丁寧な日本語（「〜です」「〜ます」調）で、読みやすくマークダウン形式（太字など）を適度に使って整理して返してください。
`;

    // Call Gemini API directly from client side
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${storedKey}`;
    const payload = {
      contents: [{ parts: [{ text: query }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMsg = `APIエラーが発生しました。`;
        try {
          const errData = await response.json();
          if (errData.error?.message) {
            errorMsg += `詳細: ${errData.error.message}`;
          }
        } catch {
          errorMsg += `ステータスコード: ${response.status}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingId);
        if (generatedText) {
          return [...filtered, { id: 'ast-' + Date.now(), role: 'assistant', text: generatedText }];
        } else {
          return [...filtered, { id: 'err-' + Date.now(), role: 'error', text: 'AIからの有効な回答を受信できませんでした。' }];
        }
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev.filter(m => m.id !== loadingId),
        { id: 'err-' + Date.now(), role: 'error', text: `${error.message || '通信エラーが発生しました。APIキーに誤りがあるか、しばらく待ってからもう一度お試しください。'}` }
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
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-teal-400 to-emerald-400 p-2 rounded-xl text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base">お薬AIアシスタント</h2>
            <p className="text-[10px] text-slate-400">ご自身のGemini APIキーで安全に動作</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center space-x-1 p-1 hover:bg-slate-100 rounded-lg transition"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>設定</span>
        </button>
      </div>

      {/* API settings panel */}
      {showSettings && (
        <div className="bg-slate-100 rounded-2xl p-3 border border-slate-200 text-[11px] space-y-2 animate-[fadeIn_0.15s_ease-out] shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Gemini APIキー設定 (ブラウザ保存)</span>
            <span className="text-[9px] text-teal-600 font-bold flex items-center space-x-0.5">
              <ShieldCheck className="w-3 h-3" />
              <span>端末保存・安全</span>
            </span>
          </div>
          <p className="text-slate-500 leading-normal">
            無料枠のあるGemini APIキーを利用します。キーは外部サーバーを介さず直接ブラウザから安全に送信されます。
          </p>
          <div className="flex space-x-2">
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..." 
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-mono"
            />
            <button 
              onClick={saveApiKey} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold shrink-0 transition active:scale-95 text-xs"
            >
              保存
            </button>
          </div>
          {saveStatus && <p className="text-[10px] text-teal-600 font-semibold">✓ APIキーをLocalStorageに安全に保存しました</p>}
        </div>
      )}

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
                <div key={msg.id} className="flex items-start space-x-2 text-rose-600 bg-rose-50 border border-rose-100 p-3.5 rounded-2xl text-xs font-semibold">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{msg.text}</span>
                </div>
              );
            }

            // Assistant messages formatted
            return (
              <div key={msg.id} className="flex items-start space-x-2 animate-[fadeIn_0.2s_ease-out]">
                <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
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
