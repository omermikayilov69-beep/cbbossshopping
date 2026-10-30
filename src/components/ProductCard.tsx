import { useState } from 'react';
import { ShoppingBag, Edit3, Trash2, Check, Star, AlertTriangle, Layers } from 'lucide-react';
import { Product, SIZES } from '../types.ts';

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  onAddToCart: (product: Product, size: string) => void;
  onOpenDetails: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onQuickStockChange?: (product: Product, delta: number) => void;
}

export function ProductCard({
  product,
  isAdmin,
  onAddToCart,
  onOpenDetails,
  onEdit,
  onDelete,
  onQuickStockChange,
}: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>(SIZES[1]); // Default 'M'
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    onAddToCart(product, selectedSize);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700/80 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 overflow-hidden cursor-pointer"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-950 flex items-center justify-center">
        {!imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-600 gap-2 p-4 text-center">
            <Layers className="w-10 h-10 stroke-1" />
            <span className="text-xs">Görsel yüklenemedi</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {product.badge && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-md bg-amber-400 text-neutral-950 shadow-md">
              {product.badge}
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-md bg-rose-600 text-white shadow-md">
              Tükendi
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-amber-600/90 text-white shadow-md flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              Son {product.stock} adet
            </span>
          )}
        </div>

        {/* Admin Quick Action Floating Bar */}
        {isAdmin && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-neutral-700 shadow-xl opacity-90 group-hover:opacity-100 transition z-20"
          >
            <button
              title="Ürünü Düzenle"
              onClick={() => onEdit(product)}
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              title="Ürünü Sil"
              onClick={() => onDelete(product)}
              className="p-1.5 text-neutral-300 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Game Category tag */}
        <div
          className={`absolute bottom-2 left-3 text-[11px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${
            product.category === 'Murder Mystery 2'
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-sm shadow-rose-950'
              : 'bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-950'
          }`}
        >
          {product.category}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-4">
        {/* Rating and Reviews */}
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="font-semibold text-neutral-200">{product.rating ?? 5.0}</span>
            <span className="text-neutral-500">({product.ratingCount ?? 12})</span>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {product.stock > 0 ? `${product.stock} adet stokta` : 'Yakında yeniden stokta'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-neutral-100 text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-amber-400 transition-colors">
          {product.name}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-neutral-400 line-clamp-2 mt-1 mb-3">
          {product.description}
        </p>

        {/* Price & Size Selector */}
        <div className="mt-auto pt-2 border-t border-neutral-800/80">
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline">
              <span className="text-xl font-black font-mono tracking-tight text-white">
                {product.price}
              </span>
              <span className="text-xs text-amber-400 font-black ml-1.5 font-mono">R$</span>
            </div>

            {/* Game item badge */}
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-full border border-neutral-700/60">
              Roblox Eşyası
            </span>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
              isOutOfStock
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-white text-neutral-950 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-400/20 active:scale-[0.98]'
            }`}
          >
            {isOutOfStock ? (
              'Tükendi'
            ) : isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Sepete Eklendi
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                Sepete Ekle
              </>
            )}
          </button>

          {/* Admin Stock Quick Adjust Bar */}
          {isAdmin && onQuickStockChange && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-2.5 pt-2 border-t border-neutral-800/50 flex items-center justify-between text-xs text-neutral-400"
            >
              <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wider">
                Yönetici Stok:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  title="Stok Azalt"
                  onClick={() => onQuickStockChange(product, -1)}
                  disabled={product.stock <= 0}
                  className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 flex items-center justify-center font-bold text-xs transition"
                >
                  -
                </button>
                <span className="font-mono text-xs px-1 text-white">{product.stock}</span>
                <button
                  title="Stok Arttır"
                  onClick={() => onQuickStockChange(product, 1)}
                  className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center font-bold text-xs transition"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
