import { useState, useEffect } from 'react';
import { MessageSquare, X, Send, ShieldCheck, Sparkles, AlertCircle, LogIn } from 'lucide-react';
import { User, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config.ts';
import { ChatConversation, ChatMessage } from '../types.ts';
import { subscribeToChat, sendChatMessage } from '../services/productsService.ts';
import { showToast } from './Toast.tsx';

interface CustomerLiveChatProps {
  currentUser: User | null;
  isAdmin: boolean;
}

export function CustomerLiveChat({ currentUser, isAdmin }: CustomerLiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chat, setChat] = useState<ChatConversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Subscribe to the customer's chat if signed in
  useEffect(() => {
    if (currentUser) {
      const unsub = subscribeToChat(currentUser.uid, (chatData) => {
        setChat(chatData);
      });
      return () => unsub();
    } else {
      setChat(null);
    }
  }, [currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    try {
      setIsSending(true);
      await sendChatMessage(currentUser.uid, inputText, currentUser, false, chat);
      setInputText('');
    } catch (err: unknown) {
      console.error(err);
      showToast('error', 'Mesaj Gönderilemedi', 'Lütfen tekrar deneyin.');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('success', 'Giriş Yapıldı', 'Canlı desteğe bağlandınız.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Floating Chat Launcher Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-850 text-white border border-neutral-700/80 shadow-2xl flex items-center gap-2.5 hover:border-amber-400 transition-all group active:scale-95"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping" />
          </div>
          <span className="text-xs font-bold tracking-wide">Canlı Destek</span>
        </button>
      </div>

      {/* Chat Popover Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-full max-w-sm sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px] animate-scale-in">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">CBBOSS Müşteri Temsilcisi</h3>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Çevrimiçi • Canlı Yanıt
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-950/40">
            {!currentUser ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <MessageSquare className="w-10 h-10 text-neutral-600 stroke-1" />
                <h4 className="text-sm font-semibold text-white">Canlı Desteğe Bağlanın</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Sipariş durumunuz, Roblox hediyeleri ve ürün sorularınız için lütfen giriş yapın.
                </p>
                <button
                  onClick={handleQuickLogin}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Google ile Giriş Yap
                </button>
              </div>
            ) : !chat || !chat.messages || chat.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-neutral-500 text-xs">
                <Sparkles className="w-8 h-8 text-amber-400" />
                <p className="text-neutral-300 font-medium">Merhaba {currentUser.displayName}!</p>
                <p className="max-w-xs text-[11px]">
                  CBBOSS müşteri desteğine hoş geldiniz. Sorularınızı, beden veya Roblox sipariş notlarınızı
                  buradan iletebilirsiniz.
                </p>
              </div>
            ) : (
              chat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.senderRole === 'customer' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.senderRole === 'customer'
                        ? 'bg-amber-400 text-neutral-950 font-medium rounded-tr-sm'
                        : 'bg-neutral-900 border border-neutral-800 text-white rounded-tl-sm'
                    }`}
                  >
                    <div className="text-[10px] font-bold opacity-75 mb-0.5">
                      {msg.senderRole === 'customer' ? 'Siz' : 'CBBOSS Temsilcisi'}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer Input */}
          {currentUser && (
            <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-800 bg-neutral-950 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
