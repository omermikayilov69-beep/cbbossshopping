import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Gamepad2,
  ExternalLink,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CartItem, ROBLOX_STORE_URL } from '../types.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  currentUser: User | null;
  onOpenOrders: () => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  currentUser,
  onOpenOrders,
  onProceedToCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalRobux = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckoutClick = () => {
    onClose();
    onProceedToCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white tracking-wide">Sepetim</h2>
              <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full font-bold">
                {totalItemCount} Eşya
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-300">Sepetiniz Boş</h3>
                <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                  Steal A Brainrot ve Murder Mystery 2 eşyalarından dilediklerinizi sepetinize ekleyip Robux ile satın alabilirsiniz.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-amber-400/10"
                >
                  Eşyaları Keşfet
                </button>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.product.id}_${item.selectedSize}_${index}`}
                  className="flex gap-4 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 group"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                          {item.product.category}
                        </span>
                        <h4 className="text-xs font-semibold text-white line-clamp-1">{item.product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {item.product.price} R$
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-neutral-500 hover:text-rose-400 p-1 transition"
                        title="Sepetten Çıkar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                      <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900">
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-neutral-400 hover:text-white transition"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-mono text-white">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="px-2 py-0.5 text-xs text-neutral-400 hover:text-white disabled:opacity-30 transition"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs font-mono font-black text-amber-400">
                        {item.product.price * item.quantity} R$
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Satın Al button */}
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-800 bg-neutral-950/80 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Toplam Ürün</span>
                  <span className="font-mono text-white">{totalItemCount} Adet</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Roblox Teslimat Ücreti</span>
                  <span className="font-mono text-emerald-400 font-bold">Ücretsiz (0 R$)</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex justify-between text-sm font-bold text-white items-baseline">
                  <span>Toplam Fiyat</span>
                  <div className="text-right">
                    <span className="text-xl font-black font-mono text-amber-400">{totalRobux}</span>
                    <span className="text-xs font-bold text-amber-400 ml-1">R$</span>
                  </div>
                </div>
              </div>

              {/* Satın Al button - Opens Purchase Rules Modal */}
              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-400/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>Satın Al</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Güvenli Robux Game Pass Takası</span>
                </div>
                {currentUser && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrders();
                    }}
                    className="text-amber-400 hover:underline font-medium"
                  >
                    Siparişlerim
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
