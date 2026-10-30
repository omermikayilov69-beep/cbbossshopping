import { useState, useEffect } from 'react';
import {
  Package,
  ShoppingBag,
  MessageSquare,
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Search,
  AlertCircle,
  Eye,
  Sliders,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  Product,
  Order,
  OrderStatus,
  ChatConversation,
  Announcement,
  ROBLOX_STORE_URL,
} from '../types.ts';
import {
  subscribeToAllOrders,
  updateOrderStatus,
  subscribeToAllChats,
  sendChatMessage,
  saveAnnouncement,
  subscribeToAnnouncements,
} from '../services/productsService.ts';
import { showToast } from './Toast.tsx';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUser: User | null;
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onAdminLogout: () => void;
}

export function AdminDashboard({
  isOpen,
  onClose,
  products,
  currentUser,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAdminLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'chats' | 'announcements'>('products');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Chats state
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annTitle, setAnnTitle] = useState('🔥 CBBOSS YENİ SEZON DROPU ŞİMDİ YAYINDA!');
  const [annMessage, setAnnMessage] = useState('Tüm siparişlerde geçerli Roblox oyun içi özel hediye kuponunu kaçırmayın.');
  const [annLinkUrl, setAnnLinkUrl] = useState(ROBLOX_STORE_URL);
  const [annLinkText, setAnnLinkText] = useState('Roblox Mağazasını Gör');
  const [annIsActive, setAnnIsActive] = useState(true);
  const [isSavingAnn, setIsSavingAnn] = useState(false);

  // Search & Category Filter
  const [productSearch, setProductSearch] = useState('');
  const [adminGameFilter, setAdminGameFilter] = useState<'all' | 'Steal A Brainrot' | 'Murder Mystery 2'>('all');

  // Subscribe to all orders
  useEffect(() => {
    if (isOpen) {
      const unsubOrders = subscribeToAllOrders((allOrders) => {
        setOrders(allOrders);
      });
      const unsubChats = subscribeToAllChats((allChats) => {
        setChats(allChats);
        if (!selectedChatId && allChats.length > 0) {
          setSelectedChatId(allChats[0].id);
        }
      });
      const unsubAnn = subscribeToAnnouncements((list) => {
        setAnnouncements(list);
        if (list.length > 0) {
          const first = list[0];
          setAnnTitle(first.title);
          setAnnMessage(first.message);
          setAnnLinkUrl(first.linkUrl || ROBLOX_STORE_URL);
          setAnnLinkText(first.linkText || 'Roblox Mağazası');
          setAnnIsActive(first.isActive);
        }
      });

      return () => {
        unsubOrders();
        unsubChats();
        unsubAnn();
      };
    }
  }, [isOpen, selectedChatId]);

  if (!isOpen) return null;

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast('success', 'Sipariş Durumu Güncellendi', `Sipariş durumu: ${newStatus}`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Güncelleme Başarısız', 'Sipariş durumu güncellenemedi.');
    }
  };

  const handleSendChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId || !currentUser) return;

    const currentChat = chats.find((c) => c.id === selectedChatId);

    try {
      setIsSendingReply(true);
      await sendChatMessage(selectedChatId, replyText, currentUser, true, currentChat);
      setReplyText('');
      showToast('success', 'Mesaj Gönderildi', 'Cevabınız müşteriye gerçek zamanlı iletildi.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Mesaj Gönderilemedi', 'Lütfen tekrar deneyin.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingAnn(true);
      await saveAnnouncement({
        id: 'main_banner',
        title: annTitle.trim(),
        message: annMessage.trim(),
        linkUrl: annLinkUrl.trim(),
        linkText: annLinkText.trim(),
        isActive: annIsActive,
      });
      showToast('success', 'Duyuru Güncellendi', 'Duyuru panosu tüm kullanıcılarda canlı güncellendi.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Hata', 'Duyuru kaydedilemedi.');
    } finally {
      setIsSavingAnn(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  const activeChat = chats.find((c) => c.id === selectedChatId);

  const filteredProducts = products.filter((p) => {
    const matchesGame = adminGameFilter === 'all' || p.category === adminGameFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());
    return matchesGame && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-6xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800 bg-neutral-950/90 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/20">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide uppercase">
                  CBBOSS Yönetici Kontrol Paneli
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Tam Yetkili
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {currentUser?.email} • Gerçek Zamanlı Bulut Veritabanı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAdminLogout();
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Yönetici Oturumunu Kapat</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition"
            >
              Mağazaya Dön
            </button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Ürün Yönetimi ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Siparişler ({orders.length})
            {orders.filter((o) => o.status === 'Ödeme Bekleniyor' || o.status === 'Beklemede').length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-neutral-950 text-[10px] flex items-center justify-center font-bold">
                {orders.filter((o) => o.status === 'Ödeme Bekleniyor' || o.status === 'Beklemede').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'chats'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Canlı Destek ({chats.length})
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Duyuru & Reklam Panosu
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950/30">
          {/* TAB 1: PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Ürün adı ara..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                    <button
                      onClick={() => setAdminGameFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        adminGameFilter === 'all'
                          ? 'bg-amber-400 text-neutral-950 font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Tüm Oyunlar
                    </button>
                    <button
                      onClick={() => setAdminGameFilter('Steal A Brainrot')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        adminGameFilter === 'Steal A Brainrot'
                          ? 'bg-amber-400 text-neutral-950 font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Steal A Brainrot
                    </button>
                    <button
                      onClick={() => setAdminGameFilter('Murder Mystery 2')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        adminGameFilter === 'Murder Mystery 2'
                          ? 'bg-rose-600 text-white font-bold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Murder Mystery 2
                    </button>
                  </div>
                </div>

                <button
                  onClick={onOpenAddProduct}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md shadow-amber-400/10 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Yeni İlan / Eşya Ekle
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex gap-3.5 items-start"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                            {product.category}
                          </span>
                          {product.badge && (
                            <span className="text-[9px] font-bold text-neutral-950 bg-amber-400 px-1.5 py-0.5 rounded">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-white truncate mt-1">{product.name}</h4>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="font-mono font-bold text-amber-400">{product.price} R$</span>
                          <span className="text-neutral-400 font-mono text-[11px]">
                            Stok: <strong className="text-neutral-200">{product.stock}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 mt-2 border-t border-neutral-800/60">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Düzenle
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product)}
                          className="py-1.5 px-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs transition"
                          title="Ürünü Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  Hiç ürün bulunamadı.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORDER MANAGEMENT & VERIFICATION */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-400">Durum Filtresi:</span>
                  {(['all', 'Ödeme Bekleniyor', 'Onaylandı', 'Teslim Edildi', 'İptal Edildi'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => setOrderFilter(st)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                          orderFilter === st
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : 'bg-neutral-950 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {st === 'all' ? 'Tümü' : st}
                      </button>
                    )
                  )}
                </div>

                <div className="text-xs text-neutral-400 font-mono">
                  Toplam: {filteredOrders.length} sipariş
                </div>
              </div>

              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="py-16 text-center text-neutral-500 text-xs">
                    Bu filtreye uygun sipariş bulunmuyor.
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-white font-semibold">{order.customerName}</span>
                          <span className="text-[11px] text-neutral-500 font-mono">
                            ({order.customerEmailMasked})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
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
                            {order.status === 'Onaylandı' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                            {(order.status === 'Teslim Edildi' || order.status === 'Tamamlandı') && <CheckCircle2 className="w-3 h-3" />}
                            {order.status === 'İptal Edildi' && <XCircle className="w-3 h-3" />}
                            {order.status}
                          </span>
                          <span className="text-xs font-mono font-black text-amber-400">
                            {order.totalAmount} R$
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-xs"
                          >
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover bg-neutral-950"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-white font-medium">{item.name}</div>
                              <div className="text-[11px] text-neutral-400 font-mono">
                                {item.quantity}x • {item.price} R$
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Roblox Details */}
                      {order.robloxUsername && (
                        <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">Roblox Kullanıcı Adı:</span>
                            <span className="font-mono text-amber-300 font-bold">
                              {order.robloxUsername}
                            </span>
                          </div>
                          {order.robloxNote && (
                            <div className="text-neutral-400 pt-1 border-t border-neutral-800/60">
                              <span className="text-neutral-500">Kullanıcı Notu:</span> {order.robloxNote}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Action Status Changer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
                        <div className="text-[11px] text-neutral-500 font-mono">
                          Tarih: {new Date(order.createdAt).toLocaleString('tr-TR')}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-neutral-400 mr-1">Durumu Değiştir:</span>
                          {(['Ödeme Bekleniyor', 'Onaylandı', 'Teslim Edildi', 'İptal Edildi'] as const).map(
                            (statusOption) => (
                              <button
                                key={statusOption}
                                onClick={() => handleStatusChange(order.id, statusOption)}
                                disabled={order.status === statusOption}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                  order.status === statusOption
                                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                                }`}
                              >
                                {statusOption}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REAL-TIME CUSTOMER LIVE CHAT */}
          {activeTab === 'chats' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[580px]">
              {/* Conversations List */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col h-full overflow-hidden">
                <div className="pb-3 border-b border-neutral-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Müşteri Talepleri ({chats.length})
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400">Canlı Senkronize</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
                  {chats.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 text-xs">
                      Henüz müşteri mesajı bulunmuyor.
                    </div>
                  ) : (
                    chats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedChatId === chat.id
                            ? 'bg-neutral-900 border-amber-400/80 shadow-md'
                            : 'bg-neutral-950 border-neutral-800/80 hover:bg-neutral-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{chat.customerName}</span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {chat.lastMessageTime
                              ? new Date(chat.lastMessageTime).toLocaleTimeString('tr-TR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate mt-1">
                          {chat.lastMessage || 'Yeni sohbet başlatıldı'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Messages Stream & Reply Composer */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col h-full overflow-hidden">
                {activeChat ? (
                  <>
                    <div className="pb-3 border-b border-neutral-800 flex items-center justify-between shrink-0">
                      <div>
                        <h4 className="text-xs font-bold text-white">{activeChat.customerName}</h4>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Müşteri ID: {activeChat.userId.slice(0, 8)} • {activeChat.customerEmailMasked}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        {activeChat.status === 'active' ? 'Aktif Görüşme' : 'Çözümlendi'}
                      </span>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                      {activeChat.messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            msg.senderRole === 'admin' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                              msg.senderRole === 'admin'
                                ? 'bg-amber-400 text-neutral-950 font-medium rounded-tr-sm'
                                : 'bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-tl-sm'
                            }`}
                          >
                            <div className="text-[10px] font-bold opacity-75 mb-0.5">
                              {msg.senderRole === 'admin' ? 'Siz (CBBOSS Yönetici)' : msg.senderName}
                            </div>
                            <div>{msg.text}</div>
                          </div>
                          <span className="text-[9px] font-mono text-neutral-500 mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Reply Input Form */}
                    <form onSubmit={handleSendChatReply} className="pt-3 border-t border-neutral-800 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Müşteriye yanıt yazın..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim() || isSendingReply}
                        className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Yanıtla</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-neutral-500 text-xs">
                    Görüntülemek için sol taraftan bir müşteri sohbeti seçin.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS & ADVERTISEMENTS BANNER */}
          {activeTab === 'announcements' && (
            <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  Mağaza Üst Duyuru & Kampanya Panosu
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Bu duyuru tüm ziyaretçilerin ekranının en üstünde canlı banner olarak gösterilir.
                </p>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-2">
                    Duyuru Başlığı
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-2">
                    Duyuru Mesajı
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase mb-2">
                      Yönlendirme Bağlantısı (URL)
                    </label>
                    <input
                      type="url"
                      value={annLinkUrl}
                      onChange={(e) => setAnnLinkUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 uppercase mb-2">
                      Bağlantı Buton Metni
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={annLinkText}
                      onChange={(e) => setAnnLinkText(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="annActive"
                    checked={annIsActive}
                    onChange={(e) => setAnnIsActive(e.target.checked)}
                    className="w-4 h-4 accent-amber-400 rounded"
                  />
                  <label htmlFor="annActive" className="text-xs font-semibold text-white cursor-pointer">
                    Duyuruyu sitede aktif olarak yayınla
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSavingAnn}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition"
                >
                  {isSavingAnn ? 'Kaydediliyor...' : 'Duyuruyu Yayınla & Güncelle'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
