import { useState, useEffect } from 'react';
import { ShoppingBag, X, Clock, CheckCircle2, XCircle, ExternalLink, Package } from 'lucide-react';
import { User } from 'firebase/auth';
import { Order, ROBLOX_STORE_URL } from '../types.ts';
import { subscribeToUserOrders } from '../services/productsService.ts';

interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export function UserOrdersModal({ isOpen, onClose, currentUser }: UserOrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentUser) {
      setIsLoading(true);
      const unsub = subscribeToUserOrders(currentUser.uid, (userOrders) => {
        setOrders(userOrders);
        setIsLoading(false);
      });
      return () => unsub();
    } else {
      setOrders([]);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Siparişlerim</h2>
              <p className="text-xs text-neutral-400">Verdiğiniz tüm siparişlerin gerçek zamanlı durumu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!currentUser ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              Sipariş geçmişinizi görmek için lütfen giriş yapın.
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              Siparişleriniz yükleniyor...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 space-y-2">
              <Package className="w-10 h-10 mx-auto stroke-1 text-neutral-600" />
              <p className="text-sm font-semibold text-neutral-300">Henüz bir siparişiniz bulunmuyor</p>
              <p className="text-xs text-neutral-500">
                Koleksiyonumuzdan ürün ekleyip hemen sipariş verebilirsiniz.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-neutral-800">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      Sipariş #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-[11px] text-neutral-400 ml-2 font-mono">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                      order.status === 'Ödeme Bekleniyor' || order.status === 'Beklemede'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : order.status === 'Onaylandı'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : order.status === 'Teslim Edildi' || order.status === 'Tamamlandı'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {(order.status === 'Ödeme Bekleniyor' || order.status === 'Beklemede') && <Clock className="w-3 h-3" />}
                    {(order.status === 'Teslim Edildi' || order.status === 'Tamamlandı') && <CheckCircle2 className="w-3 h-3" />}
                    {order.status === 'Onaylandı' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                    {order.status === 'İptal Edildi' && <XCircle className="w-3 h-3" />}
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs text-neutral-300">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-neutral-900 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-semibold text-white">{item.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          Adet: {item.quantity} • Birim: {item.price} R$
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-400">
                        {item.price * item.quantity} R$
                      </span>
                    </div>
                  ))}
                </div>

                {order.robloxUsername && (
                  <div className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-900 flex justify-between">
                    <span>Roblox Teslimat Hesabı:</span>
                    <span className="text-amber-300 font-semibold">{order.robloxUsername}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                  <div className="text-neutral-400">
                    Toplam Robux Tutarı:{' '}
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {order.totalAmount} R$
                    </span>
                  </div>

                  <a
                    href={ROBLOX_STORE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition font-medium"
                  >
                    <span>Roblox Game Pass Mağazası</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
