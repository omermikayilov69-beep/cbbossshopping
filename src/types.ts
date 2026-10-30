export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  badge?: string;
  rating?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
  creatorUid: string;
}

export type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'creatorUid'> & {
  id?: string;
};

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export type OrderStatus = 'Ödeme Bekleniyor' | 'Onaylandı' | 'Teslim Edildi' | 'İptal Edildi' | 'Beklemede' | 'Tamamlandı';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmailMasked: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  robloxUsername?: string;
  robloxNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  text: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  customerName: string;
  customerEmailMasked: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCountAdmin?: number;
  unreadCountCustomer?: number;
  status: 'active' | 'resolved';
  messages: ChatMessage[];
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  linkUrl?: string;
  linkText?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface SyncEvent {
  id: string;
  type: 'added' | 'modified' | 'removed' | 'initial';
  productName: string;
  timestamp: Date;
  details?: string;
}

// Exactly the 2 requested game categories
export const GAME_CATEGORIES = [
  'Steal A Brainrot',
  'Murder Mystery 2'
] as const;

export type GameCategory = typeof GAME_CATEGORIES[number];

export const CATEGORIES = [
  'Tüm Oyunlar',
  'Steal A Brainrot',
  'Murder Mystery 2'
] as const;

export const SIZES = ['Standart', 'Tier 1', 'Tier 2', 'Tier 3', 'VIP'] as const;

export const ROBLOX_STORE_URL = 'https://www.roblox.com/tr/games/77956189816312/Youtube-CBBOSS#!/store';

/**
 * Masks customer email to safeguard privacy (e.g., om***9@gmail.com)
 */
export function maskEmail(email?: string | null): string {
  if (!email) return 'Gizli Müşteri';
  const parts = email.split('@');
  if (parts.length !== 2) return 'Gizli Müşteri';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name.charAt(0)}***@${domain}`;
  }
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}
