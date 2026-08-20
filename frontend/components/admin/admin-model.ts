import { getProductImageUrl, type ProductImageVariant } from '@/lib/product-image-variants';

export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export function getAdminImageUrl(
  src: string | null | undefined,
  variant: ProductImageVariant = 'thumb',
) {
  return getProductImageUrl(String(src || ''), variant);
}

export const frontendVisibleRootCategorySlugs = [
  'margele',
  'accesorii-bijuterii',
  'pandantive-si-charm-uri',
  'fire-snururi-si-elastice',
  'materiale-handmade',
  'decoratiuni-si-evenimente',
  'unelte',
  'seturi-si-mixuri',
  'reduceri-lichidare-stoc',
] as const;

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  role: string;
};

export type BackupStatus = {
  generatedAt: string;
  local: {
    folder: string;
    latestBackup: {
      fileName: string;
      sizeBytes: number;
      modifiedAt: string;
      metadataCreatedAt: string | null;
      format: string;
    } | null;
  };
  offsite: {
    configured: boolean;
    bucketConfigured: boolean;
    encryptionConfigured: boolean;
    prefix: string;
    latestUploadedKey: string | null;
    latestUploadedAt: string | null;
  };
  schedule: {
    configured: boolean;
    state: string;
    checkedAt: string;
    note?: string;
  };
  alerts: {
    configured: boolean;
    brevoConfigured: boolean;
  };
  latestLog: {
    fileName: string;
    modifiedAt: string;
    status: 'success' | 'failed' | 'unknown';
    excerpt: string;
  } | null;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  isActive: boolean;
  productCount: number;
};

export type ProductImage = {
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type ProductAttribute = {
  key: string;
  value: string;
  sortOrder: number;
};

export type VariantOptionGroup = {
  name: string;
  valuesText: string;
};

export type ProductVariant = {
  id: number | null;
  optionName: string;
  optionValue: string;
  optionValues: Record<string, string>;
  legacyOptionId: string;
  legacyOptionValueId: string;
  combinationId: string;
  model: string;
  sku: string;
  quantity: number;
  variantPrice: string;
  priceDelta: number;
  pricePrefix: '+' | '-';
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
};

export type OrderItemRecord = {
  id: number;
  productId: number | null;
  productName: string;
  productImageUrl: string;
  sku: string | null;
  selectedOptions: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

export type ConversationMessageRecord = {
  id: number;
  direction: string;
  source: string;
  messageText: string;
  sentAt: string | null;
  authorUserId?: number | null;
  authorName?: string | null;
  attachments: unknown[];
};

export type ConversationRecord = {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  contactDetail: string;
  source: string;
  status: string;
  subject: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  messageCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  messages: ConversationMessageRecord[];
};

export type CustomerAddressRecord = {
  id: number | null;
  legacyId: number | null;
  name: string;
  phone: string;
  company: string;
  country: string;
  county: string;
  city: string;
  postalCode: string;
  address: string;
  billingDefault: boolean;
  shippingDefault: boolean;
};

export type CustomerRecord = {
  id: number | null;
  legacyId: number | null;
  type: 'registered' | 'legacy_guest';
  name: string;
  email: string;
  phone: string;
  clientType: string;
  requiresPasswordReset: boolean;
  orderCount: number;
  legacyOrderCount?: number;
  activeOrderCount?: number;
  totalSpent: string;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  addressCount: number;
  addresses: CustomerAddressRecord[];
};

export type ProductReviewRecord = {
  id: number;
  productId: number;
  userId: number | null;
  orderId: number | null;
  name: string;
  email: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  isVerifiedPurchase: boolean;
  adminNote: string;
  createdAt: string | null;
  updatedAt: string | null;
  product: {
    id: number;
    name: string;
    slug: string | null;
    sku: string | null;
    imageUrl: string | null;
  };
};

export type OrderRecord = {
  id: number;
  orderNumber: string;
  legacyId: number | null;
  legacyStatusName: string | null;
  legacyPaymentMethod: string | null;
  legacyShippingMethod: string | null;
  status: string;
  subtotal: string;
  deliveryTotal: string;
  total: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentProvider: string | null;
  providerPaymentId: string | null;
  paidAt: string | null;
  paymentError: string | null;
  createdAt: string;
  updatedAt?: string | null;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  packageStatus: string;
  packageCount: number;
  packedAt: string | null;
  shippedAt: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string;
  invoiceUrl: string | null;
  invoiceIssuedAt: string | null;
  billingCompany: string | null;
  billingVat: string | null;
  invoiceProvider: string | null;
  smartbillSeries: string | null;
  smartbillNumber: string | null;
  smartbillPdfFetchedAt: string | null;
  smartbillEmailSentAt: string | null;
  smartbillLastAttemptAt: string | null;
  smartbillError: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  shippingAddress: any | null;
  billingAddress: any | null;
  itemCount: number;
  customer: {
    id: number | null;
    name: string;
    email: string;
    phone?: string | null;
  };
  items: OrderItemRecord[];
};

export type ProductRecord = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  shortDescription: string | null;
  price: string;
  compareAtPrice: string | null;
  currency: string;
  imageUrl: string | null;
  sku: string | null;
  stockQuantity: number;
  status: 'draft' | 'active' | 'archived';
  material: string | null;
  categories: Array<{ id: number; name: string; slug: string; isPrimary?: boolean }>;
  images: Array<{
    imageUrl: string;
    altText?: string | null;
    sortOrder?: number | null;
    isPrimary?: boolean | null;
  }>;
  attributes: Array<{
    key: string;
    value: string;
    sortOrder?: number | null;
  }>;
  variants: Array<{
    id?: number | null;
    optionName: string;
    optionValue: string;
    optionValues?: Record<string, string> | null;
    legacyOptionId?: number | null;
    legacyOptionValueId?: number | null;
    combinationId?: string | null;
    model?: string | null;
    sku?: string | null;
    quantity?: number | null;
    variantPrice?: number | string | null;
    priceDelta?: number | string | null;
    pricePrefix?: string | null;
    imageUrl?: string | null;
    isActive?: boolean | null;
    sortOrder?: number | null;
  }>;
};

export type ProductDraft = {
  id: number | null;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  compareAtPrice: string;
  currency: string;
  imageUrl: string;
  sku: string;
  stockQuantity: string;
  status: 'draft' | 'active' | 'archived';
  material: string;
  categoryIds: number[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  variantOptionGroups: VariantOptionGroup[];
  variants: ProductVariant[];
};

export type AdminSection =
  | 'dashboard'
  | 'products'
  | 'customers'
  | 'orders'
  | 'legacy-orders'
  | 'reviews'
  | 'packages'
  | 'billing'
  | 'chat';

export type ImageUploadTarget = {
  kind: 'gallery' | 'variant';
  index: number | null;
};

export function getConversationActivityTimestamp(conversation: ConversationRecord) {
  const candidate = conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt;
  return candidate ? new Date(candidate).getTime() : 0;
}

export const conversationStatusOptions = ['nou', 'in_curs', 'rezolvat', 'spam'] as const;

export const conversationStatusLabels: Record<(typeof conversationStatusOptions)[number], string> = {
  nou: 'Nou',
  in_curs: 'In curs',
  rezolvat: 'Rezolvat',
  spam: 'Spam',
};

export const conversationSourceOptions = ['website', 'email', 'whatsapp'] as const;

export const conversationSourceLabels: Record<(typeof conversationSourceOptions)[number], string> = {
  website: 'Website',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

export const colorAttributeKey = 'Culoare';
export const colorAttributeKeyNormalized = colorAttributeKey.toLowerCase();
export const adminPageSize = 7;
export const adminNumberFormat = new Intl.NumberFormat('ro-RO');
export const paymentStatusOptions = ['unpaid', 'pending', 'paid', 'failed', 'refunded'] as const;
export const paymentStatusLabels: Record<(typeof paymentStatusOptions)[number], string> = {
  unpaid: 'Neplatita',
  pending: 'In asteptare',
  paid: 'Platita',
  failed: 'Esuata',
  refunded: 'Rambursata',
};

export type SidebarItem = {
  label: string;
  hint: string;
  icon: string;
  active?: boolean;
};

export type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

export const sidebarGroups: SidebarGroup[] = [
  {
    title: 'Meniu',
    items: [
      { label: 'Dashboard', hint: 'Sumar general', icon: 'home' },
      { label: 'Lista produse', hint: 'Produse si preturi', icon: 'box', active: true },
      { label: 'Clienti', hint: 'Date si adrese clienti', icon: 'user' },
      { label: 'Comenzi', hint: 'Comenzi si status', icon: 'receipt' },
      { label: 'Istoric comenzi', hint: 'Comenzi vechi importate', icon: 'history' },
      { label: 'Recenzii', hint: 'Moderare produse', icon: 'star' },
      { label: 'Colete', hint: 'Livrare si tracking', icon: 'package' },
      { label: 'Facturi si plati', hint: 'Facturi si plati', icon: 'wallet' },
      { label: 'Chat', hint: 'Mesaje clienti', icon: 'chat' },
    ],
  },
  {
    title: 'Suport',
    items: [
      { label: 'Deconectare', hint: 'Iesi din cont', icon: 'logout' },
    ],
  },
];

export function emptyDraft(): ProductDraft {
  return {
    id: null,
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '0',
    compareAtPrice: '',
    currency: 'RON',
    imageUrl: '',
    sku: generateDraftSku(),
    stockQuantity: '0',
    status: 'draft',
    material: '',
    categoryIds: [],
    images: [{ imageUrl: '', altText: '', sortOrder: 0, isPrimary: true }],
    attributes: [],
    variantOptionGroups: [],
    variants: [],
  };
}

export function generateDraftSku() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSegment = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MGL-${timestamp}-${randomSegment}`;
}

export function normalizeVariantOptionValues(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([name, optionValue]) => [name.trim(), String(optionValue || '').trim()] as const)
      .filter(([name, optionValue]) => name && optionValue),
  );
}

export function variantCombinationKey(optionValues: Record<string, string>) {
  return Object.entries(optionValues)
    .map(([name, value]) => `${name.trim().toLowerCase()}=${value.trim().toLowerCase()}`)
    .sort()
    .join('|');
}

export function parseVariantGroupValues(valuesText: string) {
  return Array.from(
    new Set(
      valuesText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function skuSegment(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function inferVariantOptionGroups(variants: ProductRecord['variants']): VariantOptionGroup[] {
  const groups = new Map<string, string[]>();

  for (const variant of variants) {
    const explicitValues = normalizeVariantOptionValues(variant.optionValues);
    const optionValues = Object.keys(explicitValues).length > 0
      ? explicitValues
      : variant.optionName && variant.optionValue
        ? { [variant.optionName]: variant.optionValue }
        : {};

    for (const [name, value] of Object.entries(optionValues)) {
      const values = groups.get(name) ?? [];
      if (!values.some((current) => current.toLowerCase() === value.toLowerCase())) {
        values.push(value);
      }
      groups.set(name, values);
    }
  }

  return Array.from(groups.entries()).map(([name, values]) => ({
    name,
    valuesText: values.join(', '),
  }));
}

export function draftFromProduct(product: ProductRecord): ProductDraft {
  return {
    id: product.id,
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    price: product.price || '0',
    compareAtPrice: product.compareAtPrice || '',
    currency: product.currency || 'RON',
    imageUrl: product.imageUrl || '',
    sku: product.sku || '',
    stockQuantity: String(product.stockQuantity ?? 0),
    status: product.status || 'draft',
    material: product.material || '',
    categoryIds: product.categories.map((category) => category.id),
    images:
      product.images.length > 0
        ? product.images.map((image, index) => ({
            imageUrl: image.imageUrl || '',
            altText: image.altText || '',
            sortOrder: Number(image.sortOrder ?? index),
            isPrimary: Boolean(image.isPrimary),
          }))
        : [{ imageUrl: product.imageUrl || '', altText: '', sortOrder: 0, isPrimary: true }],
    attributes: product.attributes.map((attribute, index) => ({
      key: attribute.key || '',
      value: attribute.value || '',
      sortOrder: Number(attribute.sortOrder ?? index),
    })),
    variantOptionGroups: inferVariantOptionGroups(product.variants),
    variants: product.variants.map((variant, index) => ({
      id: variant.id ?? null,
      optionName: variant.optionName || '',
      optionValue: variant.optionValue || '',
      optionValues: normalizeVariantOptionValues(variant.optionValues),
      legacyOptionId: variant.legacyOptionId ? String(variant.legacyOptionId) : '',
      legacyOptionValueId: variant.legacyOptionValueId ? String(variant.legacyOptionValueId) : '',
      combinationId: variant.combinationId || '',
      model: variant.model || '',
      sku: variant.sku || '',
      quantity: Number(variant.quantity ?? 0),
      variantPrice:
        variant.variantPrice === null || variant.variantPrice === undefined
          ? ''
          : String(variant.variantPrice),
      priceDelta: Number(variant.priceDelta ?? 0),
      pricePrefix: variant.pricePrefix === '-' ? '-' : '+',
      imageUrl: variant.imageUrl || '',
      isActive: variant.isActive !== false,
      sortOrder: Number(variant.sortOrder ?? index),
    })),
  };
}

export function getMenuSection(label: string): AdminSection | null {
  if (label === 'Dashboard') return 'dashboard';
  if (label === 'Lista produse') return 'products';
  if (label === 'Clienti') return 'customers';
  if (label === 'Comenzi') return 'orders';
  if (label === 'Istoric comenzi') return 'legacy-orders';
  if (label === 'Recenzii') return 'reviews';
  if (label === 'Colete') return 'packages';
  if (label === 'Facturi si plati') return 'billing';
  if (label === 'Chat') return 'chat';
  return null;
}

export function getPrimaryCategoryId(product: ProductRecord) {
  return product.categories.find((category) => category.isPrimary)?.id ?? product.categories[0]?.id ?? null;
}

export function buildCategoryBreadcrumb(categoryId: number | null, categoryMap: Map<number, Category>) {
  if (!categoryId) return [];

  const breadcrumb: Category[] = [];
  let current = categoryMap.get(categoryId) ?? null;

  while (current) {
    breadcrumb.unshift(current);
    current = current.parentId ? categoryMap.get(current.parentId) ?? null : null;
  }

  return breadcrumb;
}
