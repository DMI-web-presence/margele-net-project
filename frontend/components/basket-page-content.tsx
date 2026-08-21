'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { useCart } from '@/components/cart-provider';
import Reveal from '@/components/reveal';
import { getProductImageProps } from '@/lib/product-image-variants';
import { z } from 'zod';
import CityAutocompleteInput from '@/components/city-autocomplete';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  sku?: string | null;
  categoryId: number | null;
  createdAt: string;
};

type BasketPageContentProps = {
  products: Product[];
};

type PaymentStartResponse = {
  order?: {
    orderNumber: string;
    paymentStatus?: string;
  };
  payment?: {
    status?: string;
    redirectUrl?: string;
    redirectMethod?: 'GET' | 'POST' | 'NONE';
    formData?: Record<string, string>;
    message?: string;
  };
  message?: string;
};

type OrderCreateResponse = {
  orderNumber?: string;
  message?: string;
};

type PaymentMethod = 'card' | 'ramburs';

const currencyFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function collectBrowserData() {
  const screenPrint =
    typeof window !== 'undefined'
      ? `Current Resolution: ${window.screen.width}x${window.screen.height}, Available Resolution: ${window.screen.availWidth}x${window.screen.availHeight}, Color Depth: ${window.screen.colorDepth}`
      : '';

  return {
    BROWSER_USER_AGENT: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    OS: typeof navigator !== 'undefined' ? navigator.platform : '',
    OS_VERSION: '',
    MOBILE:
      typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        ? 'true'
        : 'false',
    SCREEN_POINT: 'false',
    SCREEN_PRINT: screenPrint,
    BROWSER_COLOR_DEPTH: typeof window !== 'undefined' ? String(window.screen.colorDepth || '') : '',
    BROWSER_SCREEN_HEIGHT: typeof window !== 'undefined' ? String(window.screen.height || '') : '',
    BROWSER_SCREEN_WIDTH: typeof window !== 'undefined' ? String(window.screen.width || '') : '',
    BROWSER_PLUGINS:
      typeof navigator !== 'undefined'
        ? Array.from(navigator.plugins || [])
            .map((plugin) => plugin.name)
            .join(', ')
        : '',
    BROWSER_JAVA_ENABLED:
      typeof navigator !== 'undefined' && typeof navigator.javaEnabled === 'function'
        ? String(navigator.javaEnabled())
        : 'false',
    BROWSER_LANGUAGE: typeof navigator !== 'undefined' ? navigator.language : '',
    BROWSER_TZ: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Bucharest',
    BROWSER_TZ_OFFSET: String(new Date().getTimezoneOffset()),
  };
}

function submitPaymentForm(action: string, formData: Record<string, string>) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.style.display = 'none';

  Object.entries(formData).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value ?? '');
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

function BasketIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-current stroke-[1.8]"
    >
      <path d="M6 9h12l-1 10H7L6 9Z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EmptyBasketIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 420 320"
      className="h-auto w-full max-w-[360px]"
    >
      <rect x="42" y="220" width="336" height="18" rx="9" className="fill-slate-100" />
      <path
        d="M121 132h184l-18 78H139l-18-78Z"
        className="fill-white stroke-slate-900"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d="M152 132V97c0-35 27-61 61-61s61 26 61 61v35"
        className="fill-none stroke-slate-900"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M153 158h119M160 184h105"
        className="stroke-slate-200"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="158" cy="238" r="16" className="fill-white stroke-slate-900" strokeWidth="7" />
      <circle cx="270" cy="238" r="16" className="fill-white stroke-slate-900" strokeWidth="7" />
      <path
        d="M292 72c20 4 34 18 38 38M317 54c23 11 39 30 47 55"
        className="fill-none stroke-[#4f2048]"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M82 91c-18 6-29 19-33 38M61 70c-22 12-36 31-43 56"
        className="fill-none stroke-[#4f2048]"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="96" cy="63" r="8" className="fill-[#4f2048]" />
      <circle cx="335" cy="145" r="7" className="fill-[#4f2048]" />
      <circle cx="83" cy="178" r="6" className="fill-slate-300" />
      <circle cx="343" cy="216" r="6" className="fill-slate-300" />
    </svg>
  );
}

const formatPhoneNumber = (value: string) => {
  const clean = value.replace(/\D/g, '');
  const limited = clean.slice(0, 10);
  if (limited.length <= 4) {
    return limited;
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 4)} ${limited.slice(4)}`;
  } else {
    return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`;
  }
};

function EmptyBasketState() {
  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <section className="animate-hero-item mx-auto grid max-w-[1100px] items-center gap-10 rounded-[2rem] border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:py-14">
        <div className="space-y-6">
          <div className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700">
            Cosul este gol
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Cosul tau asteapta primele materiale
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Nu ai produse adaugate momentan. Alege margele, accesorii sau materiale creative,
              iar produsele selectate vor aparea aici pentru verificare inainte de checkout.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/catalog"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-black"
            >
              Vezi catalogul
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Inapoi acasa
            </Link>
          </div>
        </div>

        <div className="flex justify-center rounded-[2rem] bg-slate-50 px-6 py-8">
          <EmptyBasketIllustration />
        </div>
      </section>
    </main>
  );
}

const ROMANIAN_COUNTIES = [
  'Alba', 'Arad', 'Arges', 'Bacau', 'Bihor', 'Bistrita-Nasaud', 'Botosani', 'Brasov', 'Braila', 'Bucuresti',
  'Buzau', 'Caras-Severin', 'Calarasi', 'Cluj', 'Constanta', 'Covasna', 'Dambovita', 'Dolj', 'Galati',
  'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara', 'Ialomita', 'Iasi', 'Ilfov', 'Maramures', 'Mehedinti',
  'Mures', 'Neamt', 'Olt', 'Prahova', 'Satu Mare', 'Salaj', 'Sibiu', 'Suceava', 'Teleorman', 'Timis',
  'Tulcea', 'Vaslui', 'Valcea', 'Vrancea'
];

export default function BasketPageContent({ products }: BasketPageContentProps) {
  const router = useRouter();
  const {
    items,
    count,
    removeFromCart,
    setCartQuantity,
    clearCart,
  } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const [user, setUser] = useState<{ id: number; email: string; fullName?: string; cui?: string; trade_register_number?: string } | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [customerDetails, setCustomerDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [shippingAddress, setShippingAddress] = useState({
    prenume: '',
    nume: '',
    adresa1: '',
    adresa2: '',
    oras: '',
    judet: '',
    codPostal: '',
    telefon: '',
    companie: '',
    tara: 'Romania',
  });

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [isCompanyBilling, setIsCompanyBilling] = useState(false);

  const [billingAddress, setBillingAddress] = useState({
    prenume: '',
    nume: '',
    adresa1: '',
    adresa2: '',
    oras: '',
    judet: '',
    codPostal: '',
    telefon: '',
    companie: '',
    cui: '',
    regCom: '',
    tara: 'Romania',
  });

  useEffect(() => {
    const loadUserAndAddresses = async () => {
      setIsLoadingAuth(true);
      try {
        const meRes = await fetch(`${backendUrl}/auth/me`, { credentials: 'include' });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setUser(meData.user);
            const addrRes = await fetch(`${backendUrl}/auth/addresses`, { credentials: 'include' });
            if (addrRes.ok) {
              const addrData = await addrRes.json();
              setAddresses(addrData);
              const defaultAddr = addrData.find((a: any) => a.implicit_livrare) || addrData[0];
              if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading checkout auth:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    void loadUserAndAddresses();
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const enrichedItems = useMemo(
    () =>
      items.map((item) => {
        const product = productMap.get(item.product.id);
        return {
          ...item,
          product: {
            ...item.product,
            name: product?.name ?? item.product.name,
            imageUrl: item.product.imageUrl ?? product?.imageUrl ?? null,
            price:
              item.product.variantId || item.product.selectedSize
                ? item.product.price
                : product?.price ?? item.product.price,
            sku: item.product.sku ?? product?.sku ?? null,
            description: product?.description ?? null,
          },
        };
      }),
    [items, productMap],
  );

  const subtotal = enrichedItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const delivery = 0;
  const total = subtotal + delivery;

  const handlePlaceOrder = async () => {
    setOrderError('');

    const customerDetailsSchema = z.object({
      fullName: z.string().min(3, 'Numele complet trebuie sa aiba cel putin 3 caractere.').max(100),
      email: z.string().email('Adresa de email este invalida.'),
      phone: z.string().refine((val) => {
        const clean = val.replace(/\s+/g, '');
        return /^0[0-9]{9}$/.test(clean);
      }, {
        message: 'Numarul de telefon trebuie sa aiba 10 cifre si sa inceapa cu 0 (ex: 0722 123 456).',
      }),
    });

    const addressSchema = z.object({
      prenume: z.string().min(2, 'Prenumele trebuie sa aiba cel putin 2 caractere.').max(50),
      nume: z.string().min(2, 'Numele trebuie sa aiba cel putin 2 caractere.').max(50),
      adresa1: z.string().min(5, 'Adresa este prea scurta (minim 5 caractere).').max(150),
      adresa2: z.string().max(150).optional(),
      oras: z.string().min(2, 'Orasul trebuie sa aiba cel putin 2 caractere.').max(50),
      judet: z.string().min(2, 'Te rugam sa alegi judetul.'),
      codPostal: z.string().optional().refine((val) => !val || /^[0-9]{6}$/.test(val), {
        message: 'Codul postal trebuie sa aiba exact 6 cifre.',
      }),
      telefon: z.string().optional().refine((val) => {
        if (!val) return true;
        const clean = val.replace(/\s+/g, '');
        return /^0[0-9]{9}$/.test(clean);
      }, {
        message: 'Numarul de telefon din adresa trebuie sa aiba 10 cifre si sa inceapa cu 0.',
      }),
      companie: z.string().optional(),
      tara: z.string().default('Romania'),
    });

    const companyBillingSchema = z.object({
      companie: z.string().min(3, 'Numele companiei este obligatoriu.'),
      cui: z.string().min(2, 'CUI-ul este obligatoriu (ex: RO123456).'),
      regCom: z.string().min(3, 'Registrul comertului este obligatoriu.'),
      adresa1: z.string().min(5, 'Adresa de facturare este prea scurta.').max(150),
      adresa2: z.string().max(150).optional(),
      oras: z.string().min(2, 'Orasul de facturare trebuie sa aiba cel putin 2 caractere.').max(50),
      judet: z.string().min(2, 'Te rugam sa alegi judetul de facturare.'),
      codPostal: z.string().optional().refine((val) => !val || /^[0-9]{6}$/.test(val), {
        message: 'Codul postal de facturare trebuie sa aiba exact 6 cifre.',
      }),
      telefon: z.string().optional(),
      tara: z.string().default('Romania'),
    });

    if (!user) {
      const detailsCheck = customerDetailsSchema.safeParse(customerDetails);
      if (!detailsCheck.success) {
        setOrderError(detailsCheck.error.issues[0].message);
        return;
      }
      const shippingCheck = addressSchema.safeParse(shippingAddress);
      if (!shippingCheck.success) {
        setOrderError(shippingCheck.error.issues[0].message);
        return;
      }
      if (!useSameAddress) {
        if (isCompanyBilling) {
          const billingCheck = companyBillingSchema.safeParse(billingAddress);
          if (!billingCheck.success) {
            setOrderError(billingCheck.error.issues[0].message);
            return;
          }
        } else {
          const billingCheck = addressSchema.safeParse(billingAddress);
          if (!billingCheck.success) {
            setOrderError(billingCheck.error.issues[0].message);
            return;
          }
        }
      }
    } else {
      if (addresses.length > 0 && !selectedAddressId) {
        setOrderError('Te rugam sa selectezi o adresa de livrare.');
        return;
      }
      if (addresses.length === 0) {
        const shippingCheck = addressSchema.safeParse(shippingAddress);
        if (!shippingCheck.success) {
          setOrderError(shippingCheck.error.issues[0].message);
          return;
        }
      }
    }

    setIsPlacingOrder(true);

    try {
      const endpoint =
        paymentMethod === 'card'
          ? `${backendUrl}${user ? '/auth' : ''}/payments/netopia/start`
          : `${backendUrl}${user ? '/auth' : ''}/orders`;

      const payload: any = {
        items: enrichedItems,
        deliveryTotal: delivery,
      };

      if (!user) {
        payload.customerDetails = customerDetails;
        payload.shippingAddress = {
          ...shippingAddress,
          telefon: shippingAddress.telefon || customerDetails.phone,
        };
        if (!useSameAddress) {
          payload.billingAddress = isCompanyBilling
            ? { ...billingAddress, prenume: '', nume: '' }
            : { ...billingAddress, companie: '', cui: '', regCom: '' };
        } else {
          payload.billingAddress = payload.shippingAddress;
        }
      } else {
        if (addresses.length > 0) {
          const activeAddr = addresses.find((a) => a.id === selectedAddressId);
          if (activeAddr) {
            const formattedAddr = {
              apelativ: activeAddr.apelativ || '',
              prenume: activeAddr.prenume || '',
              nume: activeAddr.nume || '',
              tara: activeAddr.tara || 'Romania',
              adresa1: activeAddr.adresa1 || '',
              adresa2: activeAddr.adresa2 || '',
              codPostal: activeAddr.cod_postal || '',
              oras: activeAddr.oras || '',
              judet: activeAddr.judet || '',
              telefon: activeAddr.telefon || '',
              companie: activeAddr.companie || activeAddr.company || '',
            };
            payload.shippingAddress = formattedAddr;
            payload.billingAddress = formattedAddr;
          }
        } else {
          payload.shippingAddress = shippingAddress;
          payload.billingAddress = useSameAddress ? shippingAddress : billingAddress;
        }
      }

      if (paymentMethod === 'card') {
        payload.browserData = collectBrowserData();
      } else {
        payload.paymentMethod = 'ramburs';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as PaymentStartResponse | OrderCreateResponse | null;
      if (!response.ok) {
        throw new Error(result?.message || 'Nu am putut plasa comanda.');
      }

      const cardResult = result as PaymentStartResponse | null;
      const rambursResult = result as OrderCreateResponse | null;
      const orderNumber =
        paymentMethod === 'card'
          ? cardResult?.order?.orderNumber
          : rambursResult?.orderNumber;
      const redirectUrl = paymentMethod === 'card' ? cardResult?.payment?.redirectUrl : '';
      const redirectMethod =
        paymentMethod === 'card' ? cardResult?.payment?.redirectMethod || 'GET' : 'NONE';

      clearCart();
      if (redirectUrl && redirectMethod === 'POST') {
        submitPaymentForm(redirectUrl, cardResult?.payment?.formData || {});
        return;
      }

      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      router.push(orderNumber ? `/checkout/status?orderNumber=${encodeURIComponent(orderNumber)}` : '/cont/comenzi');
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Nu am putut plasa comanda.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (enrichedItems.length === 0) {
    return <EmptyBasketState />;
  }

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-8">
            <div className="animate-hero-item space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Cosul tau ({count} {count === 1 ? 'articol' : 'articole'})
              </h1>
              <div className="flex items-start gap-3 text-slate-900">
                <div className="pt-0.5">
                  <BasketIcon />
                </div>
                <div className="space-y-0.5">
                  <p className="text-base">Expediat din stocul Margele.net</p>
                  <p className="text-xl font-semibold tracking-tight">
                    Livrare estimata in 1-3 zile lucratoare
                  </p>
                </div>
              </div>
            </div>

            <Reveal>
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <ul className="home-stagger divide-y divide-slate-200">
                {enrichedItems.map((item) => {
                  const unitPrice = Number(item.product.price);
                  const linePrice = unitPrice * item.quantity;

                  return (
                    <li key={`${item.product.id}-${item.product.selectedSize ?? 'default'}`} className="px-6 py-6 sm:px-8">
                      <div className="grid gap-5 lg:grid-cols-[7.5rem_minmax(0,1fr)_auto_auto] lg:items-start">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50"
                        >
                          {item.product.imageUrl ? (
                            <Image
                              {...getProductImageProps(item.product.imageUrl, 'card')}
                              alt={item.product.name}
                              className="h-[120px] w-full object-contain transition duration-300 group-hover:scale-105"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-[120px] items-center justify-center text-sm text-slate-500">
                              Fara imagine
                            </div>
                          )}
                        </Link>

                        <div className="space-y-3">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="text-xl font-semibold leading-7 text-slate-900 transition hover:text-slate-700"
                          >
                            {item.product.name}
                          </Link>

                          <div className="space-y-1">
                            <p className="text-2xl font-semibold tracking-tight text-slate-900">
                              {currencyFormatter.format(linePrice)}
                            </p>
                            <p className="text-sm text-slate-500">
                              Pret unitar: {currencyFormatter.format(unitPrice)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                            {item.product.sku ? <p>SKU: {item.product.sku}</p> : null}
                            {item.product.selectedSize ? (
                              <p className="font-semibold text-indigo-700">{item.product.selectedSize}</p>
                            ) : null}
                          </div>

                          <Link
                            href={`/products/${item.product.id}`}
                            className="inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4 transition hover:text-slate-700"
                          >
                            Vezi produsul
                          </Link>
                        </div>

                        <div className="lg:justify-self-end">
                          <label className="sr-only" htmlFor={`quantity-${item.product.id}-${item.product.selectedSize ?? 'default'}`}>
                            Cantitate pentru {item.product.name}
                          </label>
                          <div className="flex items-center gap-2">
                            {item.quantity > 1 ? (
                              <button
                                type="button"
                                onClick={() => setCartQuantity(item.product.id, item.quantity - 1, item.product.selectedSize)}
                                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                                aria-label={`Scade cantitatea pentru ${item.product.name}`}
                              >
                                <MinusIcon />
                              </button>
                            ) : (
                              <div className="h-11 w-11" aria-hidden="true" />
                            )}

                            <input
                              id={`quantity-${item.product.id}-${item.product.selectedSize ?? 'default'}`}
                              type="number"
                              min={1}
                              max={999}
                              value={item.quantity}
                              onChange={(event) => {
                                const rawValue = event.target.value;
                                if (!rawValue) return;
                                const nextQuantity = Number(rawValue);
                                if (!Number.isFinite(nextQuantity)) return;
                                setCartQuantity(item.product.id, nextQuantity, item.product.selectedSize);
                              }}
                              className="w-24 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-base text-slate-900 outline-none transition hover:border-slate-400 focus:border-slate-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />

                            {item.quantity < 999 ? (
                              <button
                                type="button"
                                onClick={() => setCartQuantity(item.product.id, item.quantity + 1, item.product.selectedSize)}
                                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                                aria-label={`Creste cantitatea pentru ${item.product.name}`}
                              >
                                <PlusIcon />
                              </button>
                            ) : (
                              <div className="h-11 w-11" aria-hidden="true" />
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end lg:pl-2">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id, item.product.selectedSize)}
                            className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            aria-label={`Elimina ${item.product.name} din cos`}
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            </Reveal>

            <Reveal>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Date de contact si livrare</h2>

              {isLoadingAuth ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : !user ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nume complet *</label>
                    <input
                      type="text"
                      value={customerDetails.fullName}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, fullName: e.target.value })}
                      placeholder="Numele si prenumele tau"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                      placeholder="email@exemplu.com"
                      maxLength={100}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Telefon *</label>
                    <input
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, phone: formatPhoneNumber(e.target.value) })}
                      placeholder="07xx xxx xxx"
                      maxLength={12}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>
              ) : null}

              {user && addresses.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-700">Alege o adresa salvata din cont:</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((addr: any) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`flex flex-col text-left p-4 rounded-2xl border transition ${
                          selectedAddressId === addr.id
                            ? 'border-[#4f2048] bg-[#4f2048]/5 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-semibold text-sm">
                          {addr.prenume} {addr.nume}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          {addr.adresa1}{addr.adresa2 ? `, ${addr.adresa2}` : ''}
                        </span>
                        <span className="text-xs text-slate-500">
                          {addr.oras}, {addr.judet}
                        </span>
                        <span className="text-xs text-slate-500">
                          {addr.telefon}
                        </span>
                        {addr.companie ? (
                          <span className="text-xs font-semibold text-violet-700 mt-1">
                            {addr.companie}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : !isLoadingAuth ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">Adresa de livrare</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Prenume *</label>
                      <input
                        type="text"
                        value={shippingAddress.prenume}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, prenume: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Nume *</label>
                      <input
                        type="text"
                        value={shippingAddress.nume}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, nume: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Adresa *</label>
                      <input
                        type="text"
                        value={shippingAddress.adresa1}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, adresa1: e.target.value })}
                        placeholder="Strada, numar, bloc, scara, apartament"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Adresa line 2 (optional)</label>
                      <input
                        type="text"
                        value={shippingAddress.adresa2}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, adresa2: e.target.value })}
                        placeholder="Detalii suplimentare, repere"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Oras *</label>
                      <CityAutocompleteInput
                        value={shippingAddress.oras}
                        onChange={(val) => setShippingAddress({ ...shippingAddress, oras: val })}
                        onSelectCity={(city, county) => setShippingAddress({ ...shippingAddress, oras: city, judet: county })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Judet *</label>
                      <select
                        value={shippingAddress.judet}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, judet: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base bg-white text-slate-900 outline-none transition focus:border-slate-400"
                      >
                        <option value="">Alege judetul...</option>
                        {ROMANIAN_COUNTIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Cod postal</label>
                      <input
                        type="text"
                        value={shippingAddress.codPostal}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, codPostal: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Telefon livrare *</label>
                      <input
                        type="tel"
                        value={shippingAddress.telefon}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, telefon: formatPhoneNumber(e.target.value) })}
                        placeholder="07xx xxx xxx"
                        maxLength={12}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {!isLoadingAuth && (!user || addresses.length === 0) ? (
                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="useSameAddress"
                      checked={useSameAddress}
                      onChange={(e) => setUseSameAddress(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 accent-[#4f2048] transition cursor-pointer"
                    />
                    <label htmlFor="useSameAddress" className="text-base font-semibold text-slate-800 cursor-pointer select-none">
                      Factureaza pe aceeasi adresa
                    </label>
                  </div>

                  {!useSameAddress ? (
                    <div className="space-y-4 border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
                      <h4 className="text-base font-bold text-slate-800">Date facturare</h4>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          id="isCompanyBilling"
                          checked={isCompanyBilling}
                          onChange={(e) => setIsCompanyBilling(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 accent-[#4f2048] transition cursor-pointer"
                        />
                        <label htmlFor="isCompanyBilling" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                          Factura pe Persoana Juridica (Companie)
                        </label>
                      </div>

                      {isCompanyBilling ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nume Companie *</label>
                            <input
                              type="text"
                              value={billingAddress.companie}
                              onChange={(e) => setBillingAddress({ ...billingAddress, companie: e.target.value })}
                              placeholder="SC Companie SRL"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">CUI *</label>
                            <input
                              type="text"
                              value={billingAddress.cui}
                              onChange={(e) => setBillingAddress({ ...billingAddress, cui: e.target.value })}
                              placeholder="RO1234567"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Registru Comert *</label>
                            <input
                              type="text"
                              value={billingAddress.regCom}
                              onChange={(e) => setBillingAddress({ ...billingAddress, regCom: e.target.value })}
                              placeholder="J40/123/2020"
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Prenume *</label>
                            <input
                              type="text"
                              value={billingAddress.prenume}
                              onChange={(e) => setBillingAddress({ ...billingAddress, prenume: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nume *</label>
                            <input
                              type="text"
                              value={billingAddress.nume}
                              onChange={(e) => setBillingAddress({ ...billingAddress, nume: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2 mt-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Adresa facturare *</label>
                          <input
                            type="text"
                            value={billingAddress.adresa1}
                            onChange={(e) => setBillingAddress({ ...billingAddress, adresa1: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Oras *</label>
                          <CityAutocompleteInput
                            value={billingAddress.oras}
                            onChange={(val) => setBillingAddress({ ...billingAddress, oras: val })}
                            onSelectCity={(city, county) => setBillingAddress({ ...billingAddress, oras: city, judet: county })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Judet *</label>
                          <select
                            value={billingAddress.judet}
                            onChange={(e) => setBillingAddress({ ...billingAddress, judet: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base bg-white text-slate-900 outline-none transition focus:border-slate-400"
                          >
                            <option value="">Alege judetul...</option>
                            {ROMANIAN_COUNTIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Cod postal</label>
                          <input
                            type="text"
                            value={billingAddress.codPostal}
                            onChange={(e) => setBillingAddress({ ...billingAddress, codPostal: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Telefon facturare</label>
                          <input
                            type="tel"
                            value={billingAddress.telefon}
                            onChange={(e) => setBillingAddress({ ...billingAddress, telefon: formatPhoneNumber(e.target.value) })}
                            placeholder="07xx xxx xxx"
                            maxLength={12}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            </Reveal>

            <div className="space-y-2 text-sm text-slate-700">
              <p>
                Articolele din cos nu sunt rezervate.
              </p>
              <p>
                Pret: valorile afisate sunt calculate din preturile actuale ale produselor din catalog.
              </p>
            </div>
          </section>

          <aside
            className="animate-hero-item h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-24"
            style={{ animationDelay: '120ms' }}
          >
            <div className="space-y-3 text-lg text-slate-900">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-700">Suma partiala</span>
                <span className="font-medium">{currencyFormatter.format(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-700">Livrare</span>
                <span className="font-medium">{currencyFormatter.format(delivery)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-xl font-semibold">
                <span>Total</span>
                <span>{currencyFormatter.format(total)}</span>
              </div>
              <p className="text-sm text-slate-500">TVA inclus</p>
            </div>

            <fieldset className="mt-6 space-y-3 border-t border-slate-200 pt-6">
              <legend className="text-sm font-semibold text-slate-900">Metoda de plata</legend>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  aria-pressed={paymentMethod === 'card'}
                  className={`flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                    paymentMethod === 'card'
                      ? 'border-[#4f2048] bg-[#4f2048]/5 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">Card online</span>
                    <span className="mt-1 block text-xs text-slate-500">Plata securizata prin NETOPIA</span>
                  </span>
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      paymentMethod === 'card' ? 'border-[#4f2048] bg-[#4f2048]' : 'border-slate-300'
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ramburs')}
                  aria-pressed={paymentMethod === 'ramburs'}
                  className={`flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                    paymentMethod === 'ramburs'
                      ? 'border-[#4f2048] bg-[#4f2048]/5 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">Ramburs la livrare</span>
                    <span className="mt-1 block text-xs text-slate-500">Platesti numerar cand primesti coletul</span>
                  </span>
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      paymentMethod === 'ramburs' ? 'border-[#4f2048] bg-[#4f2048]' : 'border-slate-300'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </fieldset>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPlacingOrder
                ? paymentMethod === 'card'
                  ? 'Se porneste plata...'
                  : 'Se trimite comanda...'
                : paymentMethod === 'card'
                  ? 'Continua spre plata'
                  : 'Trimite comanda'}
            </button>

            {orderError ? (
              <p className="mt-3 text-sm font-semibold text-red-600">{orderError}</p>
            ) : null}

            {paymentMethod === 'card' ? (
              <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
                <p className="text-sm font-semibold text-slate-900">Plată securizată prin NETOPIA Payments</p>
                <p className="text-sm leading-6 text-slate-600">
                  Vei fi redirectionat catre procesator pentru finalizarea platii cu cardul.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3">
                    <Image
                      src="/visa-logo.svg"
                      alt="Visa"
                      width={72}
                      height={24}
                      className="h-6 w-auto object-contain"
                    />
                  </span>
                  <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3">
                    <Image
                      src="/mastercard-logo.svg"
                      alt="Mastercard"
                      width={105}
                      height={24}
                      className="h-6 w-auto object-contain"
                    />
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Vei plati comanda ramburs, direct la curier, in momentul livrarii.
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
