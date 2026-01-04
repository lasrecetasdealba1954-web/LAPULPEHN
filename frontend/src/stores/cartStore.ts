import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  pulperiaId: string;
  pulperiaName: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearPulperiaItems: (pulperiaId: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemsByPulperia: () => Record<string, CartItem[]>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex((i) => i.productId === item.productId);

        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const items = get().items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        );
        set({ items });
      },

      clearCart: () => {
        set({ items: [] });
      },

      clearPulperiaItems: (pulperiaId) => {
        set({ items: get().items.filter((i) => i.pulperiaId !== pulperiaId) });
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getItemsByPulperia: () => {
        const items = get().items;
        const grouped: Record<string, CartItem[]> = {};

        for (const item of items) {
          if (!grouped[item.pulperiaId]) {
            grouped[item.pulperiaId] = [];
          }
          grouped[item.pulperiaId].push(item);
        }

        return grouped;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
