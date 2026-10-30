import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  DocumentChange
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { User } from 'firebase/auth';
import { db, storage } from '../firebase/config.ts';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler.ts';
import {
  Product,
  ProductFormData,
  SyncEvent,
  Order,
  OrderItem,
  OrderStatus,
  ChatConversation,
  ChatMessage,
  Announcement,
  maskEmail
} from '../types.ts';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const CHATS_COLLECTION = 'chats';
const ANNOUNCEMENTS_COLLECTION = 'announcements';

// ==========================================
// 1. PRODUCTS SERVICES
// ==========================================

export function subscribeToProducts(
  onProductsUpdate: (products: Product[], changes: { type: 'added' | 'modified' | 'removed'; doc: Product }[]) => void,
  onSyncEvent?: (event: SyncEvent) => void
): () => void {
  const collectionRef = collection(db, PRODUCTS_COLLECTION);
  let isFirstLoad = true;

  const unsubscribe = onSnapshot(
    collectionRef,
    (snapshot) => {
      const products: Product[] = [];
      const changesList: { type: 'added' | 'modified' | 'removed'; doc: Product }[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        products.push({
          ...data,
          id: docSnap.id,
        });
      });

      products.sort(
        (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );

      snapshot.docChanges().forEach((change: DocumentChange) => {
        const changedData = { ...(change.doc.data() as Product), id: change.doc.id };
        changesList.push({ type: change.type, doc: changedData });

        if (!isFirstLoad && onSyncEvent) {
          onSyncEvent({
            id: change.doc.id + '_' + Date.now(),
            type: change.type,
            productName: changedData.name || 'Ürün',
            timestamp: new Date(),
            details:
              change.type === 'added'
                ? `Yeni ürün eklendi (${changedData.price} R$)`
                : change.type === 'modified'
                ? `Güncellendi: ${changedData.price} R$ | Stok: ${changedData.stock}`
                : 'Ürün bulut mağazasından silindi'
          });
        }
      });

      if (isFirstLoad && onSyncEvent) {
        onSyncEvent({
          id: 'initial_load',
          type: 'initial',
          productName: `${products.length} ürün yüklendi`,
          timestamp: new Date(),
          details: 'Cloud Firestore ile gerçek zamanlı senkronize edildi'
        });
        isFirstLoad = false;
      }

      onProductsUpdate(products, changesList);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
    }
  );

  return unsubscribe;
}

export async function createProduct(formData: ProductFormData, user: User): Promise<Product> {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const docRef = doc(colRef);
  const now = new Date().toISOString();

  const newProduct: Product = {
    id: docRef.id,
    name: formData.name.trim(),
    description: formData.description.trim(),
    price: Number(formData.price),
    category: formData.category,
    imageUrl: formData.imageUrl.trim(),
    stock: Number(formData.stock),
    badge: formData.badge?.trim() || '',
    rating: formData.rating ?? 5.0,
    ratingCount: formData.ratingCount ?? 1,
    createdAt: now,
    updatedAt: now,
    creatorUid: user.uid,
  };

  try {
    await setDoc(docRef, newProduct);
    return newProduct;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${docRef.id}`);
  }
}

export async function updateProduct(productId: string, formData: Partial<ProductFormData>, user: User): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = {
    ...formData,
    updatedAt: now,
    creatorUid: user.uid,
  };

  if (formData.name !== undefined) updates.name = formData.name.trim();
  if (formData.description !== undefined) updates.description = formData.description.trim();
  if (formData.price !== undefined) updates.price = Number(formData.price);
  if (formData.stock !== undefined) updates.stock = Number(formData.stock);
  if (formData.imageUrl !== undefined) updates.imageUrl = formData.imageUrl.trim();
  if (formData.badge !== undefined) updates.badge = formData.badge.trim();

  delete updates.id;
  delete updates.createdAt;

  try {
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${productId}`);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${productId}`);
  }
}

export async function uploadProductImage(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `products/${Date.now()}_${cleanName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(percent);
      },
      (error) => {
        console.error('Firebase Storage upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

// ==========================================
// 2. ORDER MANAGEMENT SERVICES
// ==========================================

export async function createOrder(
  items: OrderItem[],
  totalAmount: number,
  user: User,
  robloxUsername?: string,
  robloxNote?: string
): Promise<Order> {
  const colRef = collection(db, ORDERS_COLLECTION);
  const docRef = doc(colRef);
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: docRef.id,
    userId: user.uid,
    customerName: user.displayName || 'Değerli Müşteri',
    customerEmailMasked: maskEmail(user.email),
    items,
    totalAmount,
    status: 'Ödeme Bekleniyor', // Always starts at Ödeme Bekleniyor per specification
    robloxUsername: robloxUsername?.trim() || '',
    robloxNote: robloxNote?.trim() || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, newOrder);
    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ORDERS_COLLECTION}/${docRef.id}`);
  }
}

export function subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void): () => void {
  const q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((d) => orders.push({ ...(d.data() as Order), id: d.id }));
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(orders);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, ORDERS_COLLECTION);
    }
  );
}

export function subscribeToAllOrders(callback: (orders: Order[]) => void): () => void {
  return onSnapshot(
    collection(db, ORDERS_COLLECTION),
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((d) => orders.push({ ...(d.data() as Order), id: d.id }));
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(orders);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, ORDERS_COLLECTION);
    }
  );
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const now = new Date().toISOString();
  try {
    await updateDoc(docRef, { status, updatedAt: now });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

// ==========================================
// 3. REAL-TIME LIVE CHAT SERVICES
// ==========================================

export function subscribeToChat(
  chatId: string,
  callback: (chat: ChatConversation | null) => void
): () => void {
  const docRef = doc(db, CHATS_COLLECTION, chatId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ ...(snapshot.data() as ChatConversation), id: snapshot.id });
      } else {
        callback(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${CHATS_COLLECTION}/${chatId}`);
    }
  );
}

export function subscribeToAllChats(callback: (chats: ChatConversation[]) => void): () => void {
  return onSnapshot(
    collection(db, CHATS_COLLECTION),
    (snapshot) => {
      const chats: ChatConversation[] = [];
      snapshot.forEach((d) => chats.push({ ...(d.data() as ChatConversation), id: d.id }));
      chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      callback(chats);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, CHATS_COLLECTION);
    }
  );
}

export async function sendChatMessage(
  chatId: string,
  text: string,
  sender: User,
  isAdminSender: boolean,
  existingChat?: ChatConversation | null
): Promise<void> {
  const docRef = doc(db, CHATS_COLLECTION, chatId);
  const now = new Date().toISOString();

  const newMessage: ChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    senderId: sender.uid,
    senderName: isAdminSender ? 'CBBOSS Yönetici' : sender.displayName || 'Müşteri',
    senderRole: isAdminSender ? 'admin' : 'customer',
    text: text.trim(),
    timestamp: now,
  };

  const currentMessages = existingChat?.messages || [];
  const updatedMessages = [...currentMessages, newMessage];

  const payload: Partial<ChatConversation> = {
    userId: existingChat?.userId || chatId,
    customerName: existingChat?.customerName || sender.displayName || 'Değerli Müşteri',
    customerEmailMasked: existingChat?.customerEmailMasked || maskEmail(sender.email),
    lastMessage: text.trim().slice(0, 500),
    lastMessageTime: now,
    status: 'active',
    messages: updatedMessages,
    updatedAt: now,
    unreadCountAdmin: isAdminSender ? 0 : (existingChat?.unreadCountAdmin || 0) + 1,
    unreadCountCustomer: isAdminSender ? (existingChat?.unreadCountCustomer || 0) + 1 : 0,
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CHATS_COLLECTION}/${chatId}`);
  }
}

// ==========================================
// 4. ANNOUNCEMENTS SERVICES
// ==========================================

export function subscribeToAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
  return onSnapshot(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    (snapshot) => {
      const list: Announcement[] = [];
      snapshot.forEach((d) => list.push({ ...(d.data() as Announcement), id: d.id }));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, ANNOUNCEMENTS_COLLECTION);
    }
  );
}

export async function saveAnnouncement(announcement: Omit<Announcement, 'updatedAt'>): Promise<void> {
  const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcement.id || 'main_banner');
  const now = new Date().toISOString();
  try {
    await setDoc(docRef, { ...announcement, updatedAt: now }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ANNOUNCEMENTS_COLLECTION}/${docRef.id}`);
  }
}

// ==========================================
// 5. STARTER ROBLOX GAME ITEMS CATALOG
// ==========================================

export const DEFAULT_CATALOG: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'creatorUid'>[] = [
  // Steal A Brainrot Items
  {
    name: 'Ultra Sigmasaur Efsanevi Pet',
    description: 'Steal A Brainrot oyunundaki en nadir efsanevi karakter. Maksimum koşu hızı, anlık brainrot ve yumurta kapma yeteneği sağlar.',
    price: 350.0,
    category: 'Steal A Brainrot',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1000&q=80',
    stock: 20,
    badge: 'EFSANEVİ',
    rating: 5.0,
    ratingCount: 42,
  },
  {
    name: 'Mewing Mew Godly Karakter',
    description: 'Özel aura efekti, hasar bağışıklığı kalkanı ve rakipleri dondurma yeteneği içeren ultra nadir Steal A Brainrot karakteri.',
    price: 280.0,
    category: 'Steal A Brainrot',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
    stock: 15,
    badge: 'POPÜLER',
    rating: 4.9,
    ratingCount: 31,
  },
  {
    name: 'Skibidi Titanyum Kalkan & İtici',
    description: 'Steal A Brainrot için yüksek savunma sağlayan ve yakındaki rakipleri geri püskürten güçlü eşya.',
    price: 190.0,
    category: 'Steal A Brainrot',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
    stock: 35,
    badge: 'YENİ',
    rating: 4.8,
    ratingCount: 19,
  },
  {
    name: 'Rizzler King Altın Pet',
    description: '+%500 oyun içi para çarpanı ve otomatik brainrot toplama sağlayan altın taçlı pet.',
    price: 420.0,
    category: 'Steal A Brainrot',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80',
    stock: 10,
    badge: 'SINIRLI SAYIDA',
    rating: 5.0,
    ratingCount: 56,
  },

  // Murder Mystery 2 Items
  {
    name: 'Corrupt Godly Bıçak (MM2)',
    description: 'Murder Mystery 2 tarihinin en nadir ve en değerli Godly silahı. Özel siyah-mor partikül aurası ve efsanevi kill animasyonu.',
    price: 1850.0,
    category: 'Murder Mystery 2',
    imageUrl: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?auto=format&fit=crop&w=1000&q=80',
    stock: 5,
    badge: 'EN DEĞERLİ',
    rating: 5.0,
    ratingCount: 88,
  },
  {
    name: 'Harvester Ancient Yay (MM2)',
    description: 'Cadılar Bayramı Ancient serisinin en çok aranan silahı. Özel hasat partikülü ve ölümcül isabet oranı.',
    price: 1250.0,
    category: 'Murder Mystery 2',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
    stock: 8,
    badge: 'ANCIENT',
    rating: 4.9,
    ratingCount: 64,
  },
  {
    name: 'Bat Ancient Bıçak (MM2)',
    description: 'Uçuşan yarasalar ve karanlık gölge animasyonu eşliğinde vuran nadir koleksiyonluk Ancient bıçak.',
    price: 950.0,
    category: 'Murder Mystery 2',
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80',
    stock: 12,
    badge: 'ÇOK SATAN',
    rating: 4.9,
    ratingCount: 39,
  },
  {
    name: 'Chroma Fang Godly Bıçak (MM2)',
    description: 'Sürekli değişen gökkuşağı rengi geçişleri ve parlak neon kaplaması ile göz alıcı Chroma Godly bıçak.',
    price: 650.0,
    category: 'Murder Mystery 2',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80',
    stock: 14,
    badge: 'CHROMA',
    rating: 4.8,
    ratingCount: 47,
  },
  {
    name: 'Luger Godly Tabanca (MM2)',
    description: 'Saf altın kaplama, metalik parıltı ve klasik şerif silahlarının simgesi olan ikonik altın Luger.',
    price: 480.0,
    category: 'Murder Mystery 2',
    imageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=1000&q=80',
    stock: 18,
    badge: 'GODLY',
    rating: 4.9,
    ratingCount: 52,
  },
  {
    name: 'Icebreaker Ancient Bıçak (MM2)',
    description: 'Kristal buz partikülleri saçan ve kış kutlamalarına özel tasarlanmış görkemli buz balyozu/bıçağı.',
    price: 890.0,
    category: 'Murder Mystery 2',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
    stock: 9,
    badge: 'ANCIENT',
    rating: 4.8,
    ratingCount: 33,
  }
];

export async function seedCatalogIfEmpty(user: User): Promise<number> {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const snapshot = await getDocs(colRef);
  if (!snapshot.empty) {
    return 0;
  }

  let count = 0;
  for (const item of DEFAULT_CATALOG) {
    await createProduct(item, user);
    count++;
  }
  return count;
}
