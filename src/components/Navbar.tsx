import { useState } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  Plus,
  LogIn,
  LogOut,
  Radio,
  Smartphone,
  Menu,
  X,
  Crown,
  Search,
  Package,
  Gamepad2,
  Skull,
} from 'lucide-react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase/config.ts';
import { showToast } from './Toast.tsx';

interface NavbarProps {
  currentUser: User | null;
  isAdminVerified: boolean;
  productCount: number;
  cartItemCount: number;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenCart: () => void;
  onOpenAddProduct: () => void;
  onOpenAdminDashboard: () => void;
  onSignIn: () => void;
  onOpenOrders: () => void;
  onOpenSyncTester: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isOnline: boolean;
}

export function Navbar({
  currentUser,
  isAdminVerified,
  productCount,
  cartItemCount,
  selectedCategory,
  onSelectCategory,
  onOpenCart,
  onOpenAddProduct,
  onOpenAdminDashboard,
  onSignIn,
  onOpenOrders,
  onOpenSyncTester,
  searchQuery,
  onSearchChange,
  isOnline,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('info', 'Çıkış Yapıldı', 'Oturumunuz güvenli bir şekilde kapatıldı.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectCategory('Tüm Oyunlar')}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-400/20 group-hover:scale-105 transition-transform duration-300">
                <Crown className="w-5 h-5 fill-neutral-950 stroke-neutral-950" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white font-sans uppercase">
                  CBBOSS <span className="text-amber-400 font-light">SHOP</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase -mt-1">
                  Roblox Mağazası
                </span>
              </div>
            </button>

            {/* Dedicated Game Menus on Navigation Bar */}
            <nav className="hidden xl:flex items-center gap-1.5 ml-4 pl-4 border-l border-neutral-800">
              <button
                onClick={() => onSelectCategory('Tüm Oyunlar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedCategory === 'Tüm Oyunlar'
                    ? 'bg-amber-400 text-neutral-950 shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <span>Tümü</span>
              </button>

              <button
                onClick={() => onSelectCategory('Steal A Brainrot')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedCategory === 'Steal A Brainrot'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 shadow-md'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Steal A Brainrot</span>
              </button>

              <button
                onClick={() => onSelectCategory('Murder Mystery 2')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedCategory === 'Murder Mystery 2'
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Skull className="w-3.5 h-3.5" />
                <span>Murder Mystery 2</span>
              </button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-3">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Brainrot pet, MM2 Godly, Ancient ara..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-neutral-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-white text-xs"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Multi-Device Sync Tester Button */}
            <button
              onClick={onOpenSyncTester}
              className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Çoklu Cihaz Testi</span>
            </button>

            {/* Customer Orders Button */}
            {currentUser && (
              <button
                onClick={onOpenOrders}
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Package className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Siparişlerim</span>
              </button>
            )}

            {/* Admin Management Buttons - Only shown when verified as Omermikayilov69@gmail.com */}
            {isAdminVerified && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAddProduct}
                  className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-400/20 active:scale-95 transition flex items-center gap-1.5"
                  title="Yeni İlan Ekle"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span className="hidden sm:inline">İlan Ekle</span>
                </button>
                <button
                  onClick={onOpenAdminDashboard}
                  className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold text-xs uppercase tracking-wider active:scale-95 transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span className="hidden lg:inline">Yönetici Paneli</span>
                </button>
              </div>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white transition flex items-center justify-center"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-neutral-950 font-mono font-bold text-[10px] flex items-center justify-center shadow-md animate-scale-in">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Auth / Account Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1 border-l border-neutral-800">
                <div
                  title={currentUser.displayName || 'Hesabım'}
                  className="flex items-center gap-2 p-1 rounded-xl bg-neutral-900 border border-neutral-800"
                >
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center font-bold text-xs text-amber-400">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.displayName?.charAt(0).toUpperCase() || 'M'
                    )}
                  </div>
                  <span className="hidden md:inline text-xs font-medium text-neutral-200 max-w-[90px] truncate">
                    {currentUser.displayName || 'Müşteri'}
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  title="Çıkış Yap"
                  className="p-2 text-neutral-400 hover:text-rose-400 rounded-xl hover:bg-neutral-900 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Giriş Yap</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown & Navigation */}
        {isMobileMenuOpen && (
          <div className="xl:hidden pb-4 pt-2 border-t border-neutral-800/80 space-y-3">
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onSelectCategory('Steal A Brainrot');
                  setIsMobileMenuOpen(false);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                  selectedCategory === 'Steal A Brainrot'
                    ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-md'
                    : 'bg-neutral-900 text-neutral-200 border-neutral-800'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                <span>Steal A Brainrot</span>
              </button>

              <button
                onClick={() => {
                  onSelectCategory('Murder Mystery 2');
                  setIsMobileMenuOpen(false);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                  selectedCategory === 'Murder Mystery 2'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                    : 'bg-neutral-900 text-neutral-200 border-neutral-800'
                }`}
              >
                <Skull className="w-4 h-4 text-rose-400" />
                <span>Murder Mystery 2</span>
              </button>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Brainrot veya MM2 eşyası ara..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 outline-none"
              />
            </div>

            {!currentUser && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignIn();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Google ile Giriş Yap</span>
              </button>
            )}

            {isAdminVerified && (
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAddProduct();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Yeni İlan Ekle</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAdminDashboard();
                  }}
                  className="py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Panel</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 px-1 gap-2">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                {productCount} ürün senkronize
              </span>

              {currentUser && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenOrders();
                  }}
                  className="text-amber-400 font-semibold"
                >
                  Siparişlerimi Görüntüle
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
