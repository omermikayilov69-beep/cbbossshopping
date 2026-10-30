import { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Gamepad2,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { User, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config.ts';
import { CartItem, ROBLOX_STORE_URL } from '../types.ts';
import { createOrder } from '../services/productsService.ts';
import { showToast } from './Toast.tsx';

interface PurchaseRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentUser: User | null;
  onOrderCompleted: (orderId: string) => void;
}

export function PurchaseRulesModal({
  isOpen,
  onClose,
  items,
  currentUser,
  onOrderCompleted,
}: PurchaseRulesModalProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [robloxUsername, setRobloxUsername] = useState('');
  const [robloxNote, setRobloxNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalRobux = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleAcceptAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAccepted) return;

    if (!currentUser) {
      try {
        setAuthError(null);
        await signInWithPopup(auth, googleProvider);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Giriş yapılamadı';
        setAuthError('Sipariş oluşturmak için lütfen Google hesabınızla giriş yapın.');
        showToast('error', 'Giriş Gerekli', 'Lütfen Google ile oturum açın.');
        return;
      }
    }

    const activeUser = auth.currentUser;
    if (!activeUser) return;

    try {
      setIsSubmitting(true);
      setAuthError(null);

      const orderItems = items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        size: i.selectedSize || 'Standart',
        imageUrl: i.product.imageUrl,
      }));

      // Create order with initial status "Ödeme Bekleniyor"
      const newOrder = await createOrder(
        orderItems,
        totalRobux,
        activeUser,
        robloxUsername,
        robloxNote
      );

      showToast(
        'success',
        'Sipariş Oluşturuldu',
        `Sipariş #${newOrder.id.slice(0, 8)} "Ödeme Bekleniyor" durumunda kaydedildi. Roblox mağazasına yönlendiriliyorsunuz.`
      );

      // Open the official Roblox Game Pass store URL
      window.open(ROBLOX_STORE_URL, '_blank', 'noopener,noreferrer');

      onOrderCompleted(newOrder.id);
      onClose();
    } catch (err: unknown) {
      console.error('Order creation error:', err);
      const msg = err instanceof Error ? err.message : 'Sipariş oluşturulamadı';
      setAuthError(msg);
      showToast('error', 'Hata', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 bg-neutral-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/20">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
                SATIN ALMA KURALLARI
              </h2>
              <p className="text-xs text-neutral-400">
                Roblox Game Pass Ödeme & Güvenlik Bildirimi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & Rules Content */}
        <form onSubmit={handleAcceptAndProceed} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Order Summary in Robux */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold font-mono">
                R$
              </div>
              <div>
                <span className="text-xs text-neutral-400">Sipariş Edilen Ürünler ({items.length} Kalem)</span>
                <div className="text-xs font-semibold text-white truncate max-w-xs">
                  {items.map((i) => `${i.product.name} (${i.quantity}x)`).join(', ')}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">Gerekli Robux Tutarı</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                {totalRobux} R$
              </span>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* EXACT SPECIFICATION TEXT */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/30 space-y-4 text-xs sm:text-sm text-neutral-200">
            <div className="text-amber-400 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 pb-2 border-b border-neutral-800">
              <ShieldCheck className="w-4 h-4" />
              <span>SATIN ALMA KURALLARI</span>
            </div>

            <div className="space-y-3 leading-relaxed">
              <p>
                <strong>1.</strong> “Satın Al” butonuna tıklayın ve satın almak istediğiniz ürüne karşılık gelen Roblox oyunundaki Game Pass'i satın alın. Mutlaka ürününüzün belirtilen Robux fiyatına karşılık gelen Game Pass'i seçin. Yanlış fiyatlı Game Pass satın alırsanız siparişiniz onaylanmayabilir.
              </p>

              <p>
                <strong>2. Dolandırıcılık yoktur.</strong> Tüm kullanıcılar dürüst davranmalıdır. Sahte ödeme bildirimi, yanlış satın alma beyanı ve dolandırıcılık yasaktır.
              </p>
            </div>
          </div>

          {/* Roblox Username Input for trade delivery */}
          <div className="space-y-3 p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1.5 flex items-center justify-between">
                <span>Roblox Kullanıcı Adınız *</span>
                <span className="text-[10px] text-amber-400 font-mono">Eşya Teslimatı İçin Gerekli</span>
              </label>
              <input
                type="text"
                required
                maxLength={60}
                placeholder="Örn: RobloxOyuncuAdiniz"
                value={robloxUsername}
                onChange={(e) => setRobloxUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-400 font-mono tracking-wide"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1.5">
                Sipariş / Takas Notu (İsteğe Bağlı)
              </label>
              <input
                type="text"
                maxLength={300}
                placeholder="Örn: Steal A Brainrot oyunundayım, akşam teslim alabilirim"
                value={robloxNote}
                onChange={(e) => setRobloxNote(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Verification Notice */}
          <div className="p-3.5 rounded-xl bg-amber-400/5 border border-amber-400/20 text-xs text-neutral-300 flex items-start gap-2.5">
            <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              Roblox mağazasından <strong>{totalRobux} R$</strong> tutarındaki Game Pass'i satın aldıktan sonra, siparişiniz yönetici tarafından kontrol edilecek ve oyun içinde teslim edilecektir.
            </div>
          </div>

          {/* MANDATORY CHECKBOX (Exact required text) */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/60 cursor-pointer transition select-none">
              <input
                type="checkbox"
                required
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-amber-400 rounded shrink-0 cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-semibold text-white leading-snug">
                “Kuralları okudum ve kabul ediyorum.”
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2 pb-1">
            <button
              type="submit"
              disabled={!isAccepted || isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-amber-400/20 active:scale-[0.98] transition flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sipariş Kaydediliyor & Yönlendiriliyor...
                </>
              ) : (
                <>
                  <span>Kuralları Kabul Et ve Roblox'a Git</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
