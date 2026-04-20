'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { useEffect } from 'react';

export type CartProduct = {
  id: number;
  name: string;
  price: string;
  imageUrl: string | null;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

type CartContextValue = {
  count: number;
  items: CartItem[];
  basketPulseToken: number;
  favoriteItems: CartItem[];
  favoriteCount: number;
  favoritePulseToken: number;
  addToCart: (product: CartProduct, sourceElement: HTMLElement | null) => void;
  toggleFavorite: (product: CartProduct, sourceElement: HTMLElement | null) => void;
  removeFromCart: (productId: number) => void;
  incrementCartQuantity: (productId: number) => void;
  decrementCartQuantity: (productId: number) => void;
  removeFromFavorites: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = 'margele_cart_items_v1';
const FAVORITES_STORAGE_KEY = 'margele_favorite_items_v1';

function playFlyToTarget(sourceElement: HTMLElement | null, targetId: string, color: string) {
  if (!sourceElement) return;

  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;

  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();

  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  const flyer = document.createElement('div');
  flyer.setAttribute('aria-hidden', 'true');
  flyer.style.position = 'fixed';
  flyer.style.left = `${startX}px`;
  flyer.style.top = `${startY}px`;
  flyer.style.width = '18px';
  flyer.style.height = '18px';
  flyer.style.borderRadius = '999px';
  flyer.style.background = color;
  flyer.style.boxShadow = '0 6px 14px rgba(15, 23, 42, 0.28)';
  flyer.style.transform = 'translate(-50%, -50%) scale(1)';
  flyer.style.opacity = '0.95';
  flyer.style.zIndex = '9999';
  flyer.style.pointerEvents = 'none';
  flyer.style.transition = 'transform 650ms cubic-bezier(0.16, 1, 0.3, 1), opacity 650ms ease';

  document.body.appendChild(flyer);

  requestAnimationFrame(() => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    flyer.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.35)`;
    flyer.style.opacity = '0.2';
  });

  const removeFlyer = () => flyer.remove();
  flyer.addEventListener('transitionend', removeFlyer, { once: true });
  window.setTimeout(removeFlyer, 800);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [basketPulseToken, setBasketPulseToken] = useState(0);
  const [favoriteItems, setFavoriteItems] = useState<CartItem[]>([]);
  const [favoritePulseToken, setFavoritePulseToken] = useState(0);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const favoriteCount = useMemo(
    () => favoriteItems.reduce((sum, item) => sum + item.quantity, 0),
    [favoriteItems],
  );

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      const storedFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

      if (storedCart) {
        const parsedCart = JSON.parse(storedCart) as CartItem[];
        if (Array.isArray(parsedCart)) {
          setItems(parsedCart);
        }
      }

      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites) as CartItem[];
        if (Array.isArray(parsedFavorites)) {
          setFavoriteItems(parsedFavorites);
        }
      }
    } catch {
      // Ignore malformed localStorage and continue with empty state.
    } finally {
      setHasLoadedFromStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hasLoadedFromStorage]);

  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteItems));
  }, [favoriteItems, hasLoadedFromStorage]);

  const value = useMemo<CartContextValue>(
    () => ({
      count,
      items,
      basketPulseToken,
      favoriteItems,
      favoriteCount,
      favoritePulseToken,
      addToCart: (product, sourceElement) => {
        setItems((currentItems) => {
          const existingIndex = currentItems.findIndex(
            (item) => item.product.id === product.id,
          );

          if (existingIndex === -1) {
            return [{ product, quantity: 1 }, ...currentItems];
          }

          const existingItem = currentItems[existingIndex];
          const updatedItem: CartItem = {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          };

          return [
            updatedItem,
            ...currentItems.filter((item) => item.product.id !== product.id),
          ];
        });
        setBasketPulseToken((current) => current + 1);
        playFlyToTarget(
          sourceElement,
          'basket-icon-button',
          'linear-gradient(135deg, #4f46e5, #312e81)',
        );
      },
      toggleFavorite: (product, sourceElement) => {
        const exists = favoriteItems.some((item) => item.product.id === product.id);
        if (exists) {
          setFavoriteItems((currentItems) =>
            currentItems.filter((item) => item.product.id !== product.id),
          );
          return;
        }

        setFavoriteItems((currentItems) => {
          return [{ product, quantity: 1 }, ...currentItems];
        });
        setFavoritePulseToken((current) => current + 1);
        playFlyToTarget(
          sourceElement,
          'favorite-icon-button',
          'linear-gradient(135deg, #f43f5e, #be123c)',
        );
      },
      removeFromCart: (productId) => {
        setItems((currentItems) =>
          currentItems.filter((item) => item.product.id !== productId),
        );
      },
      incrementCartQuantity: (productId) => {
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        );
      },
      decrementCartQuantity: (productId) => {
        setItems((currentItems) =>
          currentItems
            .map((item) =>
              item.product.id === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            )
            .filter((item) => item.quantity > 0),
        );
      },
      removeFromFavorites: (productId) => {
        setFavoriteItems((currentItems) =>
          currentItems.filter((item) => item.product.id !== productId),
        );
      },
      isFavorite: (productId) =>
        favoriteItems.some((item) => item.product.id === productId),
    }),
    [count, items, basketPulseToken, favoriteItems, favoriteCount, favoritePulseToken],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
