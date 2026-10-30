import { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  AlertCircle,
  Gamepad2,
  Skull,
  Coins,
  PackageCheck,
  Tag,
  FileText
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Product, ProductFormData, GAME_CATEGORIES } from '../types.ts';
import { createProduct, updateProduct, uploadProductImage } from '../services/productsService.ts';
import { showToast } from './Toast.tsx';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  currentUser: User | null;
}

interface PresetImage {
  label: string;
  url: string;
  game: 'Steal A Brainrot' | 'Murder Mystery 2';
}

const PRESET_IMAGES: PresetImage[] = [
  // Steal A Brainrot Presets
  {
    label: 'Ultra Sigmasaur (Brainrot)',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1000&q=80',
    game: 'Steal A Brainrot',
  },
  {
    label: 'Mewing Mew Godly Pet',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
    game: 'Steal A Brainrot',
  },
  {
    label: 'Skibidi Titanyum Kalkan',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
    game: 'Steal A Brainrot',
  },
  {
    label: 'Rizzler King Efsanevi Pet',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80',
    game: 'Steal A Brainrot',
  },
  // Murder Mystery 2 Presets
  {
    label: 'Corrupt Godly Bıçak (MM2)',
    url: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?auto=format&fit=crop&w=1000&q=80',
    game: 'Murder Mystery 2',
  },
  {
    label: 'Harvester Ancient Tırpan (MM2)',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
    game: 'Murder Mystery 2',
  },
  {
    label: 'Bat Ancient Bıçak (MM2)',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80',
    game: 'Murder Mystery 2',
  },
  {
    label: 'Altın Luger Tabanca (MM2)',
    url: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=1000&q=80',
    game: 'Murder Mystery 2',
  },
];

const SUGGESTED_BADGES = ['GODLY', 'ANCIENT', 'ULTRA NADİR', 'YENİ', '%20 İNDİRİM', 'ÖZEL SET', 'POPÜLER'];

export function ProductFormModal({
  isOpen,
  onClose,
  productToEdit,
  currentUser,
}: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>(350);
  const [category, setCategory] = useState<string>(GAME_CATEGORIES[0]);
  const [stock, setStock] = useState<number | string>(15);
  const [badge, setBadge] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [presetGameFilter, setPresetGameFilter] = useState<'all' | 'Steal A Brainrot' | 'Murder Mystery 2'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description || '');
      setPrice(productToEdit.price);
      // Validate that category is strictly one of the 2 games
      const safeCategory = GAME_CATEGORIES.includes(productToEdit.category as any)
        ? productToEdit.category
        : GAME_CATEGORIES[0];
      setCategory(safeCategory);
      setStock(productToEdit.stock);
      setBadge(productToEdit.badge || '');
      setImageUrl(productToEdit.imageUrl || '');
      setErrorMsg(null);
    } else {
      setName('');
      setDescription('');
      setPrice(450);
      setCategory(GAME_CATEGORIES[0]);
      setStock(20);
      setBadge('YENİ');
      setImageUrl(PRESET_IMAGES[0].url);
      setErrorMsg(null);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Görsel dosyası 8MB sınırını aşamaz.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      setUploadProgress(10);

      const downloadUrl = await uploadProductImage(file, (progress) => {
        setUploadProgress(progress);
      });

      setImageUrl(downloadUrl);
      showToast('success', 'Görsel Yüklendi', 'Firebase Storage kalıcı bulut deposuna yüklendi.');
    } catch (err) {
      console.error(err);
      setErrorMsg('Firebase Storage yüklemesi başarısız oldu. Hazır görselleri veya doğrudan görsel bağlantısı (URL) kullanabilirsiniz.');
      showToast('error', 'Yükleme Hatası', 'Hazır görselleri veya doğrudan URL kullanabilirsiniz.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg('İlan kaydetmek için yetkili yönetici olarak giriş yapmış olmalısınız.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('İlan başlığı / ürün adı zorunludur.');
      return;
    }

    const numPrice = Math.floor(Number(price));
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Lütfen geçerli bir Robux fiyatı girin (R$).');
      return;
    }

    const numStock = Math.floor(Number(stock));
    if (isNaN(numStock) || numStock < 0) {
      setErrorMsg('Lütfen geçerli bir stok adedi girin (en az 0).');
      return;
    }

    if (!imageUrl.trim()) {
      setErrorMsg('İlan görseli zorunludur. Dosya yükleyin, hazır görsellerden seçin veya doğrudan URL girin.');
      return;
    }

    // Ensure category is strictly one of the 2 supported games
    if (!GAME_CATEGORIES.includes(category as any)) {
      setErrorMsg('Yalnızca Steal A Brainrot veya Murder Mystery 2 kategorileri desteklenmektedir.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload: ProductFormData = {
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        category,
        stock: numStock,
        badge: badge.trim(),
        imageUrl: imageUrl.trim(),
      };

      if (productToEdit) {
        await updateProduct(productToEdit.id, payload, currentUser);
        showToast('success', 'İlan Güncellendi', `"${name}" başarıyla güncellendi ve tüm cihazlara anında yansıdı.`);
      } else {
        await createProduct(payload, currentUser);
        showToast('success', 'İlan Yayına Alındı', `"${name}" kalıcı olarak Firestore'a eklendi ve tüm kullanıcılarda anında göründü.`);
      }

      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Veritabanı işlemi başarısız oldu.';
      setErrorMsg(`Kaydedilemedi: ${msg}`);
      showToast('error', 'Hata', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPresets = PRESET_IMAGES.filter((preset) => {
    if (presetGameFilter === 'all') return true;
    return preset.game === presetGameFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {productToEdit ? 'İlanı Düzenle' : 'Yeni İlan / Eşya Ekle'}
              </h2>
              <p className="text-xs text-neutral-400">
                {productToEdit
                  ? `İlan ID: #${productToEdit.id.slice(0, 8)} güncelleniyor`
                  : 'Cloud Firestore veritabanına kaydedilir, tüm cihazlarda (PC, mobil, tablet) anında görünür'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Product / Listing Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>İlan Başlığı / Eşya Adı *</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="Örn: Corrupt Godly Bıçak, Mewing Mew Pet, Harvester Ancient..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-neutral-600 text-sm transition outline-none"
            />
          </div>

          {/* Game Category & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Oyun Kategorisi *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-sm transition outline-none font-semibold cursor-pointer"
              >
                {GAME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-neutral-900 py-1 font-semibold">
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-500 mt-1">
                Yalnızca 2 oyun kategorisi desteklenmektedir.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Rozet / Etiket (İsteğe Bağlı)</span>
              </label>
              <input
                type="text"
                maxLength={40}
                placeholder="Örn: GODLY, ANCIENT, YENİ, %20 İNDİRİM"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-neutral-600 text-sm transition outline-none"
              />
              {/* Quick Tag suggestions */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {SUGGESTED_BADGES.slice(0, 5).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setBadge(sug)}
                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                  >
                    +{sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Robux Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Robux Fiyatı (R$) *</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  placeholder="350"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-neutral-600 text-sm font-mono font-bold transition outline-none"
                />
                <span className="absolute right-3.5 top-3 text-amber-400 font-bold font-mono text-xs px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  R$
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Roblox Robux cinsinden fiyatlandırma.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Stok Adedi *</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                placeholder="25"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-neutral-600 text-sm font-mono transition outline-none"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Mevcut eşya stoğu adedi.
              </p>
            </div>
          </div>

          {/* Item Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>İlan / Eşya Açıklaması</span>
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Roblox oyun içi teslimat yöntemi, takas şartları, seviye ve nadirlik detayları..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-neutral-600 text-sm transition outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Image Uploader & Storage */}
          <div className="pt-2 border-t border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>İlan Görseli *</span>
              </label>

              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveImageTab('upload')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    activeImageTab === 'upload'
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Dosya Yükle
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageTab('preset')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    activeImageTab === 'preset'
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Hazır Görseller
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageTab('url')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    activeImageTab === 'url'
                      ? 'bg-amber-400 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  URL Bağlantısı
                </button>
              </div>
            </div>

            {/* TAB 1: File Upload to Firebase Storage */}
            {activeImageTab === 'upload' && (
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-800 hover:border-amber-400/60 rounded-2xl p-6 text-center cursor-pointer transition bg-neutral-950/50 hover:bg-neutral-950 flex flex-col items-center justify-center gap-2 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-xs text-neutral-300 font-mono">
                      Firebase Storage'a Yükleniyor: %{uploadProgress}
                    </span>
                    <div className="w-56 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Görsel seçmek için buraya tıklayın</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        PNG, JPG veya WebP (En fazla 8MB). Firebase Storage'a yüklenir.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: Curated Game Presets */}
            {activeImageTab === 'preset' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs pb-1">
                  <span className="text-neutral-500 text-[11px]">Oyun Filtresi:</span>
                  <button
                    type="button"
                    onClick={() => setPresetGameFilter('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      presetGameFilter === 'all' ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetGameFilter('Steal A Brainrot')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      presetGameFilter === 'Steal A Brainrot' ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Brainrot
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetGameFilter('Murder Mystery 2')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      presetGameFilter === 'Murder Mystery 2' ? 'bg-rose-600 text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    MM2
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1.5 bg-neutral-950 rounded-2xl border border-neutral-800">
                  {filteredPresets.map((preset) => (
                    <div
                      key={preset.url}
                      onClick={() => setImageUrl(preset.url)}
                      className={`group relative rounded-xl overflow-hidden aspect-square border-2 cursor-pointer transition ${
                        imageUrl === preset.url
                          ? 'border-amber-400 ring-2 ring-amber-400/40'
                          : 'border-neutral-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/85 px-1 py-1 text-[9px] text-center font-medium truncate text-white leading-tight">
                        {preset.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Direct URL */}
            {activeImageTab === 'url' && (
              <div className="space-y-1">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... veya https://...jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-neutral-600 text-xs font-mono transition outline-none"
                />
                <p className="text-[11px] text-neutral-500">
                  İnternetten herhangi bir doğrudan görsel bağlantısı (HTTPS) girebilirsiniz.
                </p>
              </div>
            )}

            {/* Selected Image Preview */}
            {imageUrl && (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                  <img
                    src={imageUrl}
                    alt="Seçili Görsel"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = PRESET_IMAGES[0].url;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Görsel Bağlantısı Hazır
                  </span>
                  <p className="text-xs text-neutral-400 truncate font-mono mt-0.5">{imageUrl}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-semibold transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 active:scale-95 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Firestore'a Kaydediliyor...
                </>
              ) : productToEdit ? (
                'İlanı Güncelle'
              ) : (
                'İlanı Firestore\'a Ekle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
