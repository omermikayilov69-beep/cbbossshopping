import { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  X,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { User, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, ADMIN_EMAIL } from '../firebase/config.ts';
import { showToast } from './Toast.tsx';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAdminVerified: (sessionToken: string) => void;
  isSecondaryAdminVerified: boolean;
}

export function AdminLoginModal({
  isOpen,
  onClose,
  currentUser,
  onAdminVerified,
  isSecondaryAdminVerified,
}: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSecretConfigured, setIsSecretConfigured] = useState<boolean | null>(null);

  // Check server status on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setPassword('');
      fetch('/api/admin/check-status')
        .then((res) => res.json())
        .then((data) => {
          setIsSecretConfigured(data.configured);
        })
        .catch((err) => {
          console.error('Server status check error:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isGoogleAdminAccount =
    currentUser !== null && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setErrorMessage(
          `Giriş yapılan hesap (${res.user.email}) yetkili yönetici hesabı değildir. Yalnızca "${ADMIN_EMAIL}" ile yönetici girişi yapılabilir.`
        );
        showToast('error', 'Yetkisiz Hesap', `Lütfen ${ADMIN_EMAIL} ile giriş yapın.`);
      } else {
        showToast('success', 'Google Doğrulandı', 'Şimdi lütfen 2. aşama yönetici parolanızı girin.');
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Google girişi başarısız';
      setErrorMessage(`Google Giriş Hatası: ${msg}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMessage('Lütfen önce yetkili Google hesabınızla giriş yapın.');
      return;
    }

    if (!isGoogleAdminAccount) {
      setErrorMessage(`Yalnızca yetkili yönetici (${ADMIN_EMAIL}) yönetici parolası doğrulayabilir.`);
      return;
    }

    if (!password) {
      setErrorMessage('Lütfen yönetici parolanızı girin.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage(null);

      // Retrieve fresh Google ID Token
      const idToken = await currentUser.getIdToken(true);

      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Doğrulama başarısız oldu.');
        showToast('error', 'Giriş Başarısız', data.error || 'Yönetici parolası doğrulanamadı.');
        return;
      }

      showToast('success', 'İşlem Başarılı', 'Yönetici kimliği ve parolası başarıyla doğrulandı.');
      onAdminVerified(data.token);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Bağlantı hatası';
      setErrorMessage(`Sunucu iletişim hatası: ${msg}`);
      showToast('error', 'Sunucu Hatası', msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Yönetici Girişi</h2>
              <p className="text-[11px] text-neutral-400">İki Aşamalı Güvenli Kimlik Doğrulama</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server secret warning if not configured */}
        {isSecretConfigured === false && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Sunucu Yapılandırması:</strong> Sunucu tarafında{' '}
              <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300 font-mono">
                ADMIN_PASSWORD
              </code>{' '}
              sırrı henüz ayarlanmamış. Parolayı AI Studio Secrets panelinden ekleyebilirsiniz.
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1">{errorMessage}</div>
          </div>
        )}

        {/* STEP 1: Google Account Authentication */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 font-mono text-[11px] flex items-center justify-center font-bold">
                1
              </span>
              Yetkili Google Hesabı
            </span>

            {isGoogleAdminAccount && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Doğrulandı
              </span>
            )}
          </div>

          {!currentUser ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white font-semibold text-xs tracking-wider transition flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98]"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Google Oturumu Açılıyor...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-amber-400" />
                  Google ile Giriş Yap ({ADMIN_EMAIL})
                </>
              )}
            </button>
          ) : isGoogleAdminAccount ? (
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{currentUser.displayName || 'Yönetici'}</div>
                  <div className="text-[11px] text-neutral-400 font-mono">{currentUser.email}</div>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 space-y-2">
              <div className="flex justify-between">
                <span>Giriş Yapılan:</span>
                <span className="font-mono text-white">{currentUser.email}</span>
              </div>
              <p className="text-[11px] text-rose-400">
                Bu hesap yetkili değildir. Lütfen {ADMIN_EMAIL} ile giriş yapın.
              </p>
              <button
                onClick={handleGoogleSignIn}
                className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
              >
                Farklı Google Hesabıyla Giriş Yap
              </button>
            </div>
          )}
        </div>

        {/* STEP 2: Separate Administrator Password */}
        <form onSubmit={handlePasswordSubmit} className="mt-6 pt-5 border-t border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 font-mono text-[11px] flex items-center justify-center font-bold">
                2
              </span>
              Yönetici Özel Parolası
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">ADMIN_PASSWORD Sırrı</span>
          </div>

          <div className="relative">
            <div className="absolute left-3.5 top-3.5 text-neutral-500">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sunucu tarafı yönetici parolasını girin..."
              disabled={!isGoogleAdminAccount || isVerifying}
              autoComplete="current-password"
              className="w-full pl-10 pr-11 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-neutral-600 text-sm font-mono tracking-wider transition outline-none disabled:opacity-40"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-neutral-500 hover:text-white transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Güvenlik Standartları:</span>
            </div>
            <p className="leading-relaxed">
              Parola hiçbir zaman istemcide veya Firestore'da saklanmaz. Yalnızca arka uç Express sunucusunda{' '}
              <code className="text-amber-300">process.env.ADMIN_PASSWORD</code> ile sabit zamanlı kriptografik
              karşılaştırma yapılarak doğrulanır.
            </p>
          </div>

          <button
            type="submit"
            disabled={!isGoogleAdminAccount || !password || isVerifying}
            className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Yetki Doğrulanıyor...
              </>
            ) : isSecondaryAdminVerified ? (
              'Yetki Zaten Aktif'
            ) : (
              'Yönetici Yetkisini Doğrula ve Paneli Aç'
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-center text-[10px] text-neutral-500 gap-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>Brute-force koruması: 5 hatalı denemede 15 dakika kilitlenir.</span>
        </div>
      </div>
    </div>
  );
}
