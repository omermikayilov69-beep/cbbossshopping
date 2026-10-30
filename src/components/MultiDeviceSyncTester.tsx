import { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  QrCode,
  Copy,
  Check,
  Radio,
  ExternalLink,
  X,
  History,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Product, SyncEvent } from '../types.ts';
import { showToast } from './Toast.tsx';

interface MultiDeviceSyncTesterProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  syncEvents: SyncEvent[];
  lastSyncTime: Date | null;
  onOpenAddModal: () => void;
  isAdmin: boolean;
}

export function MultiDeviceSyncTester({
  isOpen,
  onClose,
  products,
  syncEvents,
  lastSyncTime,
  onOpenAddModal,
  isAdmin,
}: MultiDeviceSyncTesterProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'real_devices' | 'live_feed'>('simulator');
  const [simulatorSearch, setSimulatorSearch] = useState('');

  const sharedUrl = window.location.href;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(sharedUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR kod oluşturulamadı:', err));
    }
  }, [isOpen, sharedUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    showToast('success', 'Bağlantı Kopyalandı', 'Gizli sekmede veya telefonunuzda açarak canlı senkronizasyonu test edebilirsiniz.');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSimProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(simulatorSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(simulatorSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Çoklu Cihaz Bulut Senkronizasyon Test Aracı
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Firestore Aktif
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Farklı cihazlar ve hesaplar arasında sayfa yenilemeden anlık senkronizasyon testi
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            İkili Cihaz Canlı Simülatörü
          </button>
          <button
            onClick={() => setActiveTab('real_devices')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'real_devices'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Kod / 2. Fiziksel Cihaz
          </button>
          <button
            onClick={() => setActiveTab('live_feed')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'live_feed'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="w-4 h-4" />
            Canlı Snapshot Günlüğü ({syncEvents.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DUAL-DEVICE LIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/20 text-xs text-neutral-300 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-400 block mb-0.5">
                    Canlı Test Nasıl Çalışır?
                  </span>
                  Sağ tarafta <strong>Cihaz B (Simüle Edilen Ziyaretçi Telefonu)</strong> yer almaktadır. Sol taraftan (Cihaz A) bir ürün eklediğinizde, fiyatını veya stoğunu güncellediğinizde veya sildiğinizde, Firestore'un{' '}
                  <code className="text-amber-300 bg-neutral-950 px-1 py-0.5 rounded font-mono">onSnapshot</code>{' '}
                  dinleyicisi sayesinde Cihaz B sayfa yenilenmeden anında güncellenir!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Device A */}
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Cihaz A: Ana Yönetim Ekranı
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                      {isAdmin ? 'Yönetici Aktif' : 'Ziyaretçi Modu'}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-neutral-400">
                    <p>
                      Cihaz A'dan bir değişiklik yaparak Cihaz B'deki anlık yansımayı gözlemleyin:
                    </p>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenAddModal();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md"
                    >
                      + Buluta Yeni Ürün Ekle
                    </button>

                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span>Bulut Veritabanı:</span>
                        <span className="text-emerald-400 font-mono">Bağlı</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Buluttaki Toplam Ürün:</span>
                        <span className="text-white font-mono font-bold">{products.length}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Son Senkronizasyon:</span>
                        <span className="text-neutral-300 font-mono">
                          {lastSyncTime ? lastSyncTime.toLocaleTimeString('tr-TR') : 'Şimdi'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device B: Phone Simulator */}
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-[320px] rounded-[36px] bg-neutral-950 border-[6px] border-neutral-800 shadow-2xl p-3 space-y-3">
                    <div className="flex items-center justify-between px-3 text-[10px] text-neutral-400 font-mono">
                      <span>09:41</span>
                      <div className="w-16 h-3 bg-neutral-800 rounded-full" />
                      <div className="flex items-center gap-1">
                        <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                        <span>5G</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-white tracking-wider">CBBOSS SHOP</div>
                        <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Canlı ({products.length} ürün)
                        </div>
                      </div>
                      <Smartphone className="w-4 h-4 text-neutral-400" />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {filteredSimProducts.slice(0, 5).map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900/90 border border-neutral-800"
                        >
                          <img
                            src={prod.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-neutral-950 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-white truncate">{prod.name}</div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-amber-400 font-mono font-bold">{prod.price} R$</span>
                              <span className="text-neutral-400 font-mono text-[9px]">
                                {prod.stock > 0 ? `Stok: ${prod.stock}` : 'Tükendi'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {products.length === 0 && (
                        <div className="text-center py-6 text-neutral-500 text-xs">
                          Veritabanında henüz ürün bulunmuyor.
                        </div>
                      )}
                    </div>

                    <div className="text-center text-[10px] text-neutral-500 font-mono py-1 border-t border-neutral-800/80">
                      Cihaz B: onSnapshot ile yenilenmeden güncellenir
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHYSICAL DEVICE QR */}
          {activeTab === 'real_devices' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-neutral-950 border border-neutral-800 text-center">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> Telefon veya Tabletinizle Tarayın
                </span>

                {qrDataUrl ? (
                  <div className="p-3 bg-white rounded-2xl shadow-xl">
                    <img src={qrDataUrl} alt="Mağaza QR Kodu" className="w-52 h-52 rounded-xl" />
                  </div>
                ) : (
                  <div className="w-52 h-52 rounded-2xl bg-neutral-900 flex items-center justify-center text-neutral-600">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                )}

                <p className="text-xs text-neutral-400 mt-4 max-w-xs">
                  Kameranızı açıp QR kodu okutarak CBBOSS SHOP'u telefonunuzda anında açabilirsiniz.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    2. Cihaz / Farklı Tarayıcı Bağlantısı
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Aşağıdaki bağlantıyı ikinci bir pencerede, gizli sekmede veya başka bir cihazda açarak iki yönlü senkronizasyonu test edebilirsiniz:
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <input
                    type="text"
                    readOnly
                    value={sharedUrl}
                    className="flex-1 bg-transparent px-3 py-1.5 text-xs text-neutral-300 font-mono outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Kopyalandı!' : 'Linki Kopyala'}
                  </button>
                </div>

                <div className="space-y-3 pt-2 border-t border-neutral-800 text-xs">
                  <div className="flex items-start gap-2.5 text-neutral-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Cihaz 1 (Yönetici):</strong> İki aşamalı giriş yaparak ürün ekleyin veya fiyat değiştirin.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-neutral-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Cihaz 2 (Müşteri/Ziyaretçi):</strong> Telefonda açık olan sayfada hiçbir yenileme yapmadan değişikliğin ekrana geldiğini görün.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SNAPSHOT LOGS */}
          {activeTab === 'live_feed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Firestore Anlık Bildirim Günlüğü
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Bu oturumda {syncEvents.length} olay kaydedildi
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                {syncEvents.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs">
                    Gelen Firestore değişiklikleri bekleniyor...
                  </div>
                ) : (
                  syncEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            evt.type === 'added'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : evt.type === 'modified'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : evt.type === 'removed'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {evt.type === 'added'
                            ? 'Eklendi'
                            : evt.type === 'modified'
                            ? 'Güncellendi'
                            : evt.type === 'removed'
                            ? 'Silindi'
                            : 'Yüklendi'}
                        </span>
                        <div>
                          <div className="font-semibold text-white">{evt.productName}</div>
                          {evt.details && (
                            <div className="text-[11px] text-neutral-400 mt-0.5">{evt.details}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-neutral-500 shrink-0">
                        {evt.timestamp.toLocaleTimeString('tr-TR')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs shrink-0">
          <div className="text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bulut Veritabanı: ai-studio-cbbossshop-30ecdbf5-fdc7-42dd-9f2b-3e6a094400a5</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
