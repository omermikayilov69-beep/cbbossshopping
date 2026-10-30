import { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Product } from '../types.ts';
import { deleteProduct } from '../services/productsService.ts';
import { showToast } from './Toast.tsx';

interface DeleteConfirmModalProps {
  product: Product | null;
  onClose: () => void;
}

export function DeleteConfirmModal({ product, onClose }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!product) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProduct(product.id);
      showToast(
        'info',
        'İşlem Başarılı',
        `"${product.name}" Cloud Firestore'dan silindi ve tüm bağlı cihazlardan anında kaldırıldı.`
      );
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Silme işlemi başarısız';
      showToast('error', 'Silme Hatası', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Ürünü Kalıcı Olarak Sil?
          </h3>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            <strong className="text-white">"{product.name}"</strong> (ID:{' '}
            <span className="font-mono">#{product.id.slice(0, 8)}</span>) ürününü Cloud Firestore veritabanından kalıcı olarak silmek üzeresiniz. Bu işlem tüm ziyaretçilerin ekranından anında kaybolmasını sağlar.
          </p>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
          <img
            src={product.imageUrl}
            alt=""
            className="w-12 h-12 rounded-lg object-cover bg-neutral-900 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-white truncate">{product.name}</h4>
            <span className="text-xs font-mono text-amber-400 font-bold">{product.price.toFixed(2)} TL</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-semibold transition"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Siliniyor...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Buluttan Sil
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
