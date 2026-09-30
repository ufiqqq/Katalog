import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  toggleDrawer: (open?: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (newItem) =>
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.variantId === newItem.variantId
          );

          const newItems = [...state.items];
          const qtyToAdd = newItem.quantity ?? 1;

          if (existingItemIndex > -1) {
            const existingItem = state.items[existingItemIndex];
            const newQty = Math.min(
              existingItem.quantity + qtyToAdd,
              newItem.maxStock
            );
            newItems[existingItemIndex] = {
              ...existingItem,
              quantity: newQty,
            };
          } else {
            newItems.push({
              ...newItem,
              quantity: Math.min(qtyToAdd, newItem.maxStock),
            });
          }

          return { items: newItems, isOpen: true };
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock)) }
              : item
          ),
        })),
      clearCart: () => set({ items: [] }),
      toggleDrawer: (open) =>
        set((state) => ({ isOpen: open !== undefined ? open : !state.isOpen })),
    }),
    {
      name: "streetwear-cart",
    }
  )
);
