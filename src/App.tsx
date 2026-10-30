import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import {
  Sparkles,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Crown,
  Smartphone,
  ShieldCheck,
  PackageX,
  Package,
  Layers,
  LogIn,
  Megaphone,
  ExternalLink,
  Gamepad2,
  Skull,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { auth, googleProvider, ADMIN_EMAIL, testFirestoreConnection } from './firebase/config.ts';
import {
  subscribeToProducts,
  seedCatalogIfEmpty,
  updateProduct,
  subscribeToAnnouncements,
} from './services/productsService.ts';
import { Product, CartItem, CATEGORIES, GAME_CATEGORIES, SyncEvent, Announcement, ROBLOX_STORE_URL } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductFormModal } from './components/ProductFormModal.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { MultiDeviceSyncTester } from './components/MultiDeviceSyncTester.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CustomerLiveChat } from './components/CustomerLiveChat.tsx';
import { UserOrdersModal } from './components/UserOrdersModal.tsx';
import { PurchaseRulesModal } from './components/PurchaseRulesModal.tsx';
import { ToastContainer, showToast } from './components/Toast.tsx';

export default function App() {
  // Authentication & Admin Authorization
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  // Firestore Products
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Selected Category: 'Tüm Oyunlar', 'Steal A Brainrot', or 'Murder Mystery 2'
  const [selectedCategory, setSelectedCategory] = useState<string>('Tüm Oyunlar');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest');

  // Shopping Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals & Panels
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productForDetails, setProductForDetails] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSyncTesterOpen, setIsSyncTesterOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isUserOrdersOpen, setIsUserOrdersOpen] = useState(false);
  const [isPurchaseRulesOpen, setIsPurchaseRulesOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // 1. Connection check & Auth listener
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsFirestoreConnected(connected);
      if (!connected) {
        showToast('error', 'Bağlantı Hatası', 'Cloud Firestore veritabanına ulaşılamıyor.');
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);

      if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdminVerified(true);
      } else {
        setIsAdminVerified(false);
        setIsAdminDashboardOpen(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firestore onSnapshot for Products & Announcements
  useEffect(() => {
    setIsLoadingProducts(true);

    const unsubscribeProducts = subscribeToProducts(
      (updatedProducts) => {
        setProducts(updatedProducts);
        setIsLoadingProducts(false);
        setIsFirestoreConnected(true);
        setLastSyncTime(new Date());
      },
      (syncEvent) => {
        setSyncEvents((prev) => [syncEvent, ...prev.slice(0, 49)]);

        if (syncEvent.type === 'added') {
          showToast('success', 'Bulut Senkronizasyonu: Yeni Eşya', `${syncEvent.productName} eklendi.`);
        } else if (syncEvent.type === 'modified') {
          showToast('info', 'Bulut Senkronizasyonu: Güncellendi', `${syncEvent.productName} güncellendi.`);
        } else if (syncEvent.type === 'removed') {
          showToast('info', 'Bulut Senkronizasyonu: Silindi', `${syncEvent.productName} mağazadan kaldırıldı.`);
        }
      }
    );

    const unsubscribeAnnouncements = subscribeToAnnouncements((annList) => {
      setAnnouncements(annList);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeAnnouncements();
    };
  }, []);

  // Google Sign-In: If Omermikayilov69@gmail.com logs in, auto open Admin Dashboard; else standard customer
  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdminVerified(true);
        setIsAdminDashboardOpen(true);
        showToast('success', 'Yönetici Girişi Yapıldı', 'Hoş geldiniz Ömer! Yönetici paneli açıldı.');
      } else {
        setIsAdminVerified(false);
        setIsAdminDashboardOpen(false);
        showToast('success', 'Giriş Başarılı', `Hoş geldiniz, ${res.user.displayName || 'Değerli Müşterimiz'}!`);
      }
    } catch (err: unknown) {
      if (err instanceof Error && !err.message.includes('popup-closed-by-user')) {
        console.error('Google Giriş Hatası:', err);
        showToast('error', 'Giriş Başarısız', 'Google ile giriş yapılırken bir sorun oluştu.');
      }
    }
  };

  const handleAdminLogout = async () => {
    setIsAdminVerified(false);
    setIsAdminDashboardOpen(false);
    try {
      await auth.signOut();
    } catch (e) {
      console.error(e);
    }
    showToast('info', 'Çıkış Yapıldı', 'Oturum güvenle kapatıldı.');
  };

  // Seed default Roblox game catalog
  const handleSeedCatalog = async () => {
    if (!currentUser || !isAdminVerified) {
      showToast('error', 'Yönetici Girişi Gerekli', 'Kataloğu yüklemek için yönetici girişi yapın.');
      return;
    }
    try {
      setIsSeeding(true);
      const count = await seedCatalogIfEmpty(currentUser);
      if (count > 0) {
        showToast('success', 'İşlem Başarılı', `${count} adet oyun eşyası Cloud Firestore'a eklendi!`);
      } else {
        showToast('info', 'Katalog Dolu', 'Bulut veritabanında zaten ürünler mevcut.');
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Yükleme başarısız';
      showToast('error', 'Hata', msg);
    } finally {
      setIsSeeding(false);
    }
  };

  // Quick stock adjustment
  const handleQuickStockChange = async (product: Product, delta: number) => {
    if (!currentUser || !isAdminVerified) return;
    const newStock = Math.max(0, product.stock + delta);
    try {
      await updateProduct(product.id, { stock: newStock }, currentUser);
    } catch (err) {
      console.error(err);
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, size: string, quantity = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size
      );
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += quantity;
        return copy;
      }
      return [...prev, { product, selectedSize: size, quantity }];
    });
    showToast('success', 'Sepete Eklendi', `${product.name}`);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCartItems((prev) => {
      const copy = [...prev];
      copy[index].quantity = newQty;
      return copy;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Filter & Sort
  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        selectedCategory === 'Tüm Oyunlar' || product.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'tr');
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

  const brainrotProducts = products.filter((p) => p.category === 'Steal A Brainrot');
  const mm2Products = products.filter((p) => p.category === 'Murder Mystery 2');

  const cartItemTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const activeAnnouncement = announcements.find((a) => a.isActive);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-400 selection:text-neutral-950 flex flex-col font-sans">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Top Store Announcement Banner */}
      {activeAnnouncement && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 py-2.5 px-4 text-xs font-semibold shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 shrink-0" />
              <span>
                <strong>{activeAnnouncement.title}</strong> — {activeAnnouncement.message}
              </span>
            </div>
            {activeAnnouncement.linkUrl && (
              <a
                href={activeAnnouncement.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline font-bold hover:text-white transition"
              >
                <span>{activeAnnouncement.linkText || 'Roblox Mağazası'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Top Navbar with the 2 Game Menus */}
      <Navbar
        currentUser={currentUser}
        isAdminVerified={isAdminVerified}
        productCount={products.length}
        cartItemCount={cartItemTotalCount}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAddProduct={() => {
          setProductToEdit(null);
          setIsFormModalOpen(true);
        }}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onSignIn={handleGoogleSignIn}
        onOpenOrders={() => setIsUserOrdersOpen(true)}
        onOpenSyncTester={() => setIsSyncTesterOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOnline={isFirestoreConnected}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-900/60 via-neutral-950 to-neutral-950 border-b border-neutral-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-semibold tracking-wider uppercase">
                <Crown className="w-3.5 h-3.5" />
                <span>Resmi CBBOSS Roblox Mağazası</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none">
                CBBOSS <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600">SHOP</span>
              </h1>

              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-light">
                Yalnızca <strong>Steal A Brainrot</strong> ve <strong>Murder Mystery 2</strong> için en değerli Roblox eşyaları, Godly ve Ancient silahlar, nadir petler. Cloud Firestore ile tüm cihazlarda anında canlı senkronizasyon.
              </p>

              {/* Status & Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{products.length} Ürün Gerçek Zamanlı Yayında</span>
                </div>

                <a
                  href={ROBLOX_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition font-medium"
                >
                  <span>Roblox CBBOSS Mağazası</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Quick Access Status Box */}
            <div className="p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl space-y-3.5 max-w-sm w-full backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Yetki & Güvenlik
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    isAdminVerified
                      ? 'bg-amber-400 text-neutral-950'
                      : currentUser
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {isAdminVerified
                    ? 'Yönetici (Tam Yetkili)'
                    : currentUser
                    ? 'Müşteri Hesabı'
                    : 'Ziyaretçi Modu'}
                </span>
              </div>

              <div className="text-xs text-neutral-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Steal A Brainrot:</span>
                  <span className="text-amber-400 font-mono font-bold">{brainrotProducts.length} Eşya</span>
                </div>
                <div className="flex justify-between">
                  <span>Murder Mystery 2:</span>
                  <span className="text-rose-400 font-mono font-bold">{mm2Products.length} Silah & Bıçak</span>
                </div>
                <div className="flex justify-between">
                  <span>Aktif Kullanıcı:</span>
                  <span className="text-white font-mono text-[11px] truncate max-w-[170px]">
                    {currentUser ? currentUser.displayName || currentUser.email || 'Giriş Yapıldı' : 'Ziyaretçi'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {isAdminVerified ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setProductToEdit(null);
                          setIsFormModalOpen(true);
                        }}
                        className="py-2.5 px-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>İlan Ekle</span>
                      </button>
                      <button
                        onClick={() => setIsAdminDashboardOpen(true)}
                        className="py-2.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Panel</span>
                      </button>
                    </div>
                    {products.length === 0 && (
                      <button
                        onClick={handleSeedCatalog}
                        disabled={isSeeding}
                        className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                        Oyun Eşyalarını Yükle
                      </button>
                    )}
                  </>
                ) : !currentUser ? (
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Google ile Giriş Yap</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsUserOrdersOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Siparişlerimi Görüntüle</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2 MAIN GAME SHOWCASE CARDS (HOMEPAGE MENU REQUIREMENT) */}
          <div className="mt-10 pt-8 border-t border-neutral-800/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                <span>Oyun Kategorileri (Yalnızca 2 Oyun)</span>
              </h2>
              {selectedCategory !== 'Tüm Oyunlar' && (
                <button
                  onClick={() => setSelectedCategory('Tüm Oyunlar')}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Tüm Oyunları Göster
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* GAME CARD 1: STEAL A BRAINROT */}
              <div
                onClick={() => setSelectedCategory('Steal A Brainrot')}
                className={`group relative rounded-3xl p-6 border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                  selectedCategory === 'Steal A Brainrot'
                    ? 'bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 border-amber-400 ring-2 ring-amber-400/30 shadow-2xl'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-amber-400/60 hover:bg-neutral-900 shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-mono font-bold">
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>{brainrotProducts.length} Eşya Mevcut</span>
                    </div>

                    <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                      Steal A Brainrot
                    </h3>

                    <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                      Ultra Sigmasaur, Mewing Mew, Skibidi Kalkan, Rizzler Pet ve nadir statü artıran eşyalar.
                    </p>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Flame className="w-7 h-7" />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 group-hover:underline flex items-center gap-1.5">
                    <span>Özel Ürün Sayfasına Git</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Resmi Kategori</span>
                </div>
              </div>

              {/* GAME CARD 2: MURDER MYSTERY 2 */}
              <div
                onClick={() => setSelectedCategory('Murder Mystery 2')}
                className={`group relative rounded-3xl p-6 border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                  selectedCategory === 'Murder Mystery 2'
                    ? 'bg-gradient-to-br from-rose-950/40 via-neutral-900 to-neutral-950 border-rose-500 ring-2 ring-rose-500/30 shadow-2xl'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-rose-500/60 hover:bg-neutral-900 shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-mono font-bold">
                      <Skull className="w-3.5 h-3.5" />
                      <span>{mm2Products.length} Silah & Bıçak</span>
                    </div>

                    <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-rose-400 transition-colors">
                      Murder Mystery 2
                    </h3>

                    <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                      Corrupt Godly, Harvester Ancient, Bat, Chroma bıçaklar, Luger tabancalar ve efsanevi setler.
                    </p>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-110 transition-transform">
                    <Skull className="w-7 h-7" />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 group-hover:underline flex items-center gap-1.5">
                    <span>Özel Ürün Sayfasına Git</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Resmi Kategori</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog & Dedicated Game Page Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Dedicated Game Header Banner when single game is selected */}
        {selectedCategory === 'Steal A Brainrot' && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-950 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center font-black shadow-lg">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                  Steal A Brainrot — Özel Ürün Sayfası
                </h2>
                <p className="text-xs text-neutral-400">
                  Bu sayfada yalnızca Steal A Brainrot oyununa ait eşyalar listelenmektedir. ({filteredProducts.length} adet)
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCategory('Tüm Oyunlar')}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition shrink-0"
            >
              Tüm Oyunları Gör
            </button>
          </div>
        )}

        {selectedCategory === 'Murder Mystery 2' && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-neutral-900 to-neutral-950 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-lg">
                <Skull className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                  Murder Mystery 2 (MM2) — Özel Silah Sayfası
                </h2>
                <p className="text-xs text-neutral-400">
                  Bu sayfada yalnızca Murder Mystery 2 oyununa ait Godly, Ancient ve silahlar listelenmektedir. ({filteredProducts.length} adet)
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCategory('Tüm Oyunlar')}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition shrink-0"
            >
              Tüm Oyunları Gör
            </button>
          </div>
        )}

        {/* Category Filter Pills & Sort Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
          {/* Exactly 2 Game Categories + All */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === category
                    ? category === 'Murder Mystery 2'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                      : 'bg-amber-400 text-neutral-950 shadow-lg shadow-amber-400/20'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {category === 'Steal A Brainrot' && <Gamepad2 className="w-3.5 h-3.5" />}
                {category === 'Murder Mystery 2' && <Skull className="w-3.5 h-3.5" />}
                <span>{category}</span>
              </button>
            ))}
          </div>

          {/* Sort & Count Controls */}
          <div className="flex items-center gap-3 justify-between md:justify-end shrink-0">
            <span className="text-xs text-neutral-500 font-mono">
              {filteredProducts.length} eşya listeleniyor
            </span>

            <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-neutral-200 outline-none text-xs cursor-pointer"
              >
                <option value="newest" className="bg-neutral-900">En Yeniler</option>
                <option value="price-low" className="bg-neutral-900">Fiyat: Düşükten Yükseğe</option>
                <option value="price-high" className="bg-neutral-900">Fiyat: Yüksekten Düşüğe</option>
                <option value="name" className="bg-neutral-900">Alfabetik (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoadingProducts && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-xs text-neutral-400 font-mono">
              Cloud Firestore ürün veritabanı senkronize ediliyor...
            </p>
          </div>
        )}

        {/* Empty Catalog State */}
        {!isLoadingProducts && products.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-neutral-900/40 border border-neutral-800/80 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400">
              <Layers className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="text-lg font-bold text-white">Mağaza Kataloğu Boş</h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
              Veritabanı hazır. Yönetici olarak Steal A Brainrot ve Murder Mystery 2 eşyalarını ekleyebilir veya tek tıkla yükleyebilirsiniz.
            </p>
            {isAdminVerified ? (
              <button
                onClick={handleSeedCatalog}
                disabled={isSeeding}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
                Roblox Eşyalarını Yükle
              </button>
            ) : !currentUser ? (
              <button
                onClick={handleGoogleSignIn}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider"
              >
                Giriş Yap
              </button>
            ) : (
              <p className="text-xs text-neutral-500">Yeni ürünler çok yakında eklenecektir.</p>
            )}
          </div>
        )}

        {/* No Search Filter Match */}
        {!isLoadingProducts && products.length > 0 && filteredProducts.length === 0 && (
          <div className="py-16 text-center text-neutral-500 space-y-2">
            <PackageX className="w-10 h-10 mx-auto stroke-1 text-neutral-600" />
            <p className="text-sm font-semibold text-neutral-400">Bu kategoride veya aramada ürün bulunamadı</p>
            <button
              onClick={() => {
                setSelectedCategory('Tüm Oyunlar');
                setSearchQuery('');
              }}
              className="text-xs text-amber-400 hover:underline"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoadingProducts && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdmin={isAdminVerified}
                onAddToCart={(prod, size) => handleAddToCart(prod, size, 1)}
                onOpenDetails={(prod) => setProductForDetails(prod)}
                onEdit={(prod) => {
                  setProductToEdit(prod);
                  setIsFormModalOpen(true);
                }}
                onDelete={(prod) => setProductToDelete(prod)}
                onQuickStockChange={handleQuickStockChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Real-Time Customer Live Chat */}
      <CustomerLiveChat currentUser={currentUser} isAdmin={isAdminVerified} />

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-10 mt-16 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white uppercase tracking-wider">CBBOSS SHOP</span>
              <p className="text-[11px] text-neutral-500">
                Steal A Brainrot & Murder Mystery 2 Resmi Roblox Mağazası
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button
              onClick={() => setSelectedCategory('Steal A Brainrot')}
              className="hover:text-amber-400 transition"
            >
              Steal A Brainrot
            </button>
            <span>•</span>
            <button
              onClick={() => setSelectedCategory('Murder Mystery 2')}
              className="hover:text-rose-400 transition"
            >
              Murder Mystery 2
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSyncTesterOpen(true)}
              className="hover:text-amber-400 transition flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Çoklu Cihaz Testi</span>
            </button>
          </div>

          <div className="text-[11px] text-neutral-600 font-mono">
            &copy; {new Date().getFullYear()} CBBOSS SHOP. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        currentUser={currentUser}
      />

      {/* 2. Product Detail Modal */}
      <ProductDetailModal
        product={productForDetails}
        onClose={() => setProductForDetails(null)}
        onAddToCart={(prod, size, qty) => handleAddToCart(prod, size, qty)}
      />

      {/* 3. Delete Confirmation Modal */}
      <DeleteConfirmModal
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
      />

      {/* 4. Cart Drawer with Robux Pricing */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        currentUser={currentUser}
        onOpenOrders={() => setIsUserOrdersOpen(true)}
        onProceedToCheckout={() => setIsPurchaseRulesOpen(true)}
      />

      {/* 4b. Mandatory Turkish Purchase Rules Modal & Roblox Redirect */}
      <PurchaseRulesModal
        isOpen={isPurchaseRulesOpen}
        onClose={() => setIsPurchaseRulesOpen(false)}
        items={cartItems}
        currentUser={currentUser}
        onOrderCompleted={() => {
          setCartItems([]);
          setIsUserOrdersOpen(true);
        }}
      />

      {/* 5. Customer Orders Modal */}
      <UserOrdersModal
        isOpen={isUserOrdersOpen}
        onClose={() => setIsUserOrdersOpen(false)}
        currentUser={currentUser}
      />

      {/* 6. Real Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        products={products}
        currentUser={currentUser}
        onOpenAddProduct={() => {
          setProductToEdit(null);
          setIsFormModalOpen(true);
        }}
        onEditProduct={(prod) => {
          setProductToEdit(prod);
          setIsFormModalOpen(true);
        }}
        onDeleteProduct={(prod) => setProductToDelete(prod)}
        onAdminLogout={handleAdminLogout}
      />

      {/* 8. Multi-Device Sync Tester */}
      <MultiDeviceSyncTester
        isOpen={isSyncTesterOpen}
        onClose={() => setIsSyncTesterOpen(false)}
        products={products}
        syncEvents={syncEvents}
        lastSyncTime={lastSyncTime}
        onOpenAddModal={() => {
          setProductToEdit(null);
          setIsFormModalOpen(true);
        }}
        isAdmin={isAdminVerified}
      />
    </div>
  );
}
