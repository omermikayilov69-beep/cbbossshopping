import { useState } from 'react';
import { X, ShoppingBag, Star, ShieldCheck, Truck, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { Product, SIZES } from '../types.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
}

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>(SIZES[1]);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-neutral-950/70 hover:bg-neutral-800 text-neutral-400 hover:text-white transition backdrop-blur-md border border-neutral-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image Section */}
          <div className="relative aspect-square md:aspect-auto bg-neutral-950 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-neutral-800">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover object-center max-h-[500px]"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-amber-400 text-neutral-950 shadow-xl">
                {product.badge}
              </span>
            )}
          </div>

          {/* Details & Purchase Section */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  {product.category}
                </span>
                <span className="text-xs text-neutral-500 font-mono">ID: #{product.id.slice(0, 8)}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
                {product.name}
              </h2>

              {/* Rating & Stock */}
              <div className="flex items-center justify-between mt-3 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-semibold text-sm text-neutral-100">{product.rating ?? 5.0}</span>
                  <span className="text-xs text-neutral-500">({product.ratingCount ?? 14} değerlendirme)</span>
                </div>

                <div className="text-right">
                  {isOutOfStock ? (
                    <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
                      Tükendi
                    </span>
                  ) : isLowStock ? (
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Son {product.stock} adet kaldı
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-400 font-mono">
                      {product.stock} adet stokta
                    </span>
                  )}
                </div>
              </div>

              {/* Price in Robux */}
              <div className="my-5">
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Robux Fiyatı</span>
                <div className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline">
                  {product.price}
                  <span className="text-lg font-black text-amber-400 ml-1.5 font-mono">R$</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Eşya Detayı
                </h4>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {product.description || 'CBBOSS Roblox mağazası özel dijital oyun içi eşyası.'}
                </p>
              </div>

              {/* Tier / Delivery Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Teslimat & Seviye Paketi
                  </label>
                  <span className="text-xs text-amber-400 font-mono">Roblox İçi Takas / Hediye</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedSize === size
                          ? 'bg-amber-400 text-neutral-950 ring-2 ring-amber-400/50 shadow-md scale-105'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Adet
                </label>
                <div className="flex items-center border border-neutral-700 rounded-xl overflow-hidden bg-neutral-950">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3 py-1.5 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 transition font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-mono text-white min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="px-3 py-1.5 text-neutral-300 hover:bg-neutral-800 disabled:opacity-40 transition font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions & Assurance */}
            <div>
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : isAdded
                    ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/25'
                    : 'bg-white text-neutral-950 hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-400/20 active:scale-[0.98]'
                }`}
              >
                {isOutOfStock ? (
                  'Tükendi'
                ) : isAdded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    Sepete Eklendi
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Sepete Ekle ({quantity} Adet) • {product.price * quantity} R$
                  </>
                )}
              </button>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-neutral-800 text-[10px] text-neutral-400 text-center">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Game Pass Güvencesi</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Oyun İçi Hızlı Teslimat</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Canlı Destek & Takas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
