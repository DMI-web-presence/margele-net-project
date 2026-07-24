'use client';

import { ChangeEvent, DragEvent, FormEvent, ReactNode, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

const frontendVisibleRootCategorySlugs = [
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

type AdminUser = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  role: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  isActive: boolean;
  productCount: number;
};

type ProductImage = {
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

type ProductAttribute = {
  key: string;
  value: string;
  sortOrder: number;
};

type VariantOptionGroup = {
  name: string;
  valuesText: string;
};

type ProductVariant = {
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

type OrderItemRecord = {
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

type ConversationMessageRecord = {
  id: number;
  direction: string;
  source: string;
  messageText: string;
  sentAt: string | null;
  authorUserId?: number | null;
  authorName?: string | null;
  attachments: unknown[];
};

type ConversationRecord = {
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

type OrderRecord = {
  id: number;
  orderNumber: string;
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
  itemCount: number;
  customer: {
    id: number | null;
    name: string;
    email: string;
  };
  items: OrderItemRecord[];
};

type ProductRecord = {
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

type ProductDraft = {
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

type AdminSection = 'dashboard' | 'products' | 'orders' | 'packages' | 'billing' | 'chat';

type ImageUploadTarget = {
  kind: 'gallery' | 'variant';
  index: number | null;
};

function getConversationActivityTimestamp(conversation: ConversationRecord) {
  const candidate = conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt;
  return candidate ? new Date(candidate).getTime() : 0;
}

const conversationStatusOptions = ['nou', 'in_curs', 'rezolvat', 'spam'] as const;

const conversationStatusLabels: Record<(typeof conversationStatusOptions)[number], string> = {
  nou: 'Nou',
  in_curs: 'In curs',
  rezolvat: 'Rezolvat',
  spam: 'Spam',
};

const conversationSourceOptions = ['website', 'email', 'whatsapp'] as const;

const conversationSourceLabels: Record<(typeof conversationSourceOptions)[number], string> = {
  website: 'Website',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

const colorAttributeKey = 'Culoare';
const colorAttributeKeyNormalized = colorAttributeKey.toLowerCase();

const sidebarGroups = [
  {
    title: 'Meniu',
    items: [
      { label: 'Dashboard', hint: 'Sumar general', icon: 'home' },
      { label: 'Lista produse', hint: 'Produse si preturi', icon: 'box', active: true },
      { label: 'Comenzi', hint: 'Comenzi si status', icon: 'receipt' },
      { label: 'Packages', hint: 'Livrare si tracking', icon: 'package' },
      { label: 'Facturi si plati', hint: 'Facturi si plati', icon: 'wallet' },
      { label: 'Chat', hint: 'Mesaje clienti', icon: 'chat' },
      { label: 'Calendar', hint: 'Activitate planificata', icon: 'calendar' },
      { label: 'Rapoarte si analiza', hint: 'Performanta magazin', icon: 'chart' },
    ],
  },
  {
    title: 'Suport',
    items: [
      { label: 'Deconectare', hint: 'Iesi din cont', icon: 'logout' },
    ],
  },
];

function emptyDraft(): ProductDraft {
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

function generateDraftSku() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSegment = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MGL-${timestamp}-${randomSegment}`;
}

function normalizeVariantOptionValues(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([name, optionValue]) => [name.trim(), String(optionValue || '').trim()] as const)
      .filter(([name, optionValue]) => name && optionValue),
  );
}

function variantCombinationKey(optionValues: Record<string, string>) {
  return Object.entries(optionValues)
    .map(([name, value]) => `${name.trim().toLowerCase()}=${value.trim().toLowerCase()}`)
    .sort()
    .join('|');
}

function parseVariantGroupValues(valuesText: string) {
  return Array.from(
    new Set(
      valuesText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function skuSegment(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inferVariantOptionGroups(variants: ProductRecord['variants']): VariantOptionGroup[] {
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

function draftFromProduct(product: ProductRecord): ProductDraft {
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

function getMenuSection(label: string): AdminSection | null {
  if (label === 'Dashboard') return 'dashboard';
  if (label === 'Lista produse') return 'products';
  if (label === 'Comenzi') return 'orders';
  if (label === 'Packages') return 'packages';
  if (label === 'Facturi si plati') return 'billing';
  if (label === 'Chat') return 'chat';
  return null;
}

function getPrimaryCategoryId(product: ProductRecord) {
  return product.categories.find((category) => category.isPrimary)?.id ?? product.categories[0]?.id ?? null;
}

function buildCategoryBreadcrumb(categoryId: number | null, categoryMap: Map<number, Category>) {
  if (!categoryId) return [];

  const breadcrumb: Category[] = [];
  let current = categoryMap.get(categoryId) ?? null;

  while (current) {
    breadcrumb.unshift(current);
    current = current.parentId ? categoryMap.get(current.parentId) ?? null : null;
  }

  return breadcrumb;
}

export default function AdminPanel() {
  const [status, setStatus] = useState<'loading' | 'login' | 'forbidden' | 'ready'>('loading');
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isProductPreviewVisible, setIsProductPreviewVisible] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft());
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [orderDraftStatus, setOrderDraftStatus] = useState<string>('');
  const [orderDraftPaymentStatus, setOrderDraftPaymentStatus] = useState<string>('');
  const [packageStatusFilter, setPackageStatusFilter] = useState<string>('');
  const [packageDraftStatus, setPackageDraftStatus] = useState<string>('nepregatit');
  const [packageDraftCourier, setPackageDraftCourier] = useState('');
  const [packageDraftTrackingNumber, setPackageDraftTrackingNumber] = useState('');
  const [packageDraftTrackingUrl, setPackageDraftTrackingUrl] = useState('');
  const [packageDraftCount, setPackageDraftCount] = useState('1');
  const [billingPaymentStatusFilter, setBillingPaymentStatusFilter] = useState<string>('');
  const [billingInvoiceStatusFilter, setBillingInvoiceStatusFilter] = useState<string>('');
  const [billingDraftPaymentStatus, setBillingDraftPaymentStatus] = useState<string>('unpaid');
  const [billingDraftInvoiceStatus, setBillingDraftInvoiceStatus] = useState<string>('negenerata');
  const [billingDraftInvoiceNumber, setBillingDraftInvoiceNumber] = useState('');
  const [billingDraftInvoiceUrl, setBillingDraftInvoiceUrl] = useState('');
  const [billingDraftCompany, setBillingDraftCompany] = useState('');
  const [billingDraftVat, setBillingDraftVat] = useState('');
  const [conversationStatusFilter, setConversationStatusFilter] = useState<string>('');
  const [conversationSourceFilter, setConversationSourceFilter] = useState<string>('');
  const [showAllEditorCategories, setShowAllEditorCategories] = useState(false);
  const [showAllEditorAttributes, setShowAllEditorAttributes] = useState(false);
  const [showAllEditorVariants, setShowAllEditorVariants] = useState(false);
  const [activeVariantDetailsIndex, setActiveVariantDetailsIndex] = useState<number | null>(null);
  const [productEditorKey, setProductEditorKey] = useState(0);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isCategoryCreatorOpen, setIsCategoryCreatorOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryDeleteCandidate, setCategoryDeleteCandidate] = useState<Category | null>(null);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [imageUploadTarget, setImageUploadTarget] = useState<ImageUploadTarget>({
    kind: 'gallery',
    index: null,
  });
  const [imageUploadFile, setImageUploadFile] = useState<File | null>(null);
  const [imageUploadPreview, setImageUploadPreview] = useState('');
  const [imageUploadAltText, setImageUploadAltText] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationDraftStatus, setConversationDraftStatus] = useState<string>('nou');
  const [conversationReplyDraft, setConversationReplyDraft] = useState('');
  const [isSendingConversationReply, setIsSendingConversationReply] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loadAdminData = useCallback(async (selectProductId?: number | null) => {
    const [productsResponse, categoriesResponse, ordersResponse, conversationsResponse] = await Promise.all([
      fetch(`${backendUrl}/admin/products`, { credentials: 'include' }),
      fetch(`${backendUrl}/admin/categories`, { credentials: 'include' }),
      fetch(`${backendUrl}/admin/orders`, { credentials: 'include' }),
      fetch(`${backendUrl}/admin/conversations`, { credentials: 'include' }),
    ]);

    if (!productsResponse.ok || !categoriesResponse.ok || !ordersResponse.ok || !conversationsResponse.ok) {
      throw new Error('Admin fetch failed.');
    }

    const nextProducts = (await productsResponse.json()) as ProductRecord[];
    const nextCategories = (await categoriesResponse.json()) as Category[];
    const nextOrders = (await ordersResponse.json()) as OrderRecord[];
    const nextConversations = (await conversationsResponse.json()) as ConversationRecord[];

    setProducts(nextProducts);
    setCategories(nextCategories);
    setOrders(nextOrders);
    setConversations(nextConversations);

    if (selectProductId === null) {
      setSelectedProductId(null);
      setDraft(emptyDraft());
      return;
    }

    const nextSelectedId = selectProductId === undefined ? selectedProductId : selectProductId;

    if (nextSelectedId !== null && nextSelectedId !== undefined) {
      const selected = nextProducts.find((product) => product.id === nextSelectedId);
      if (selected) {
        setIsCreatingProduct(false);
        setSelectedProductId(selected.id);
        setDraft(draftFromProduct(selected));
        return;
      }
    }

    if (isCreatingProduct) {
      setSelectedProductId(null);
      setDraft(emptyDraft());
      return;
    }

    if (nextProducts[0]) {
      setIsCreatingProduct(false);
      setSelectedProductId(nextProducts[0].id);
      setDraft(draftFromProduct(nextProducts[0]));
      return;
    }

    setSelectedProductId(null);
    setDraft(emptyDraft());
  }, [isCreatingProduct, selectedProductId]);

  const bootstrap = useCallback(async () => {
    setIsBootstrapping(true);
    try {
      const response = await fetch(`${backendUrl}/auth/admin/me`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!data.authenticated) {
        setStatus('login');
        return;
      }

      if (!data.isAdmin) {
        setUser(data.user ?? null);
        setStatus('forbidden');
        return;
      }

      setUser(data.user);
      setStatus('ready');
      await loadAdminData();
    } catch {
      setErrorMessage('Nu am putut conecta panoul de administrare la backend.');
      setStatus('login');
    } finally {
      setIsBootstrapping(false);
    }
  }, [loadAdminData]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const allTopLevelCategories = useMemo(
    () =>
      categories
        .filter((category) => category.parentId === null && category.isActive)
        .sort((left, right) => left.name.localeCompare(right.name, 'ro')),
    [categories],
  );

  const frontendVisibleTopLevelCategories = useMemo(() => {
    const visibleRoots = frontendVisibleRootCategorySlugs
      .map((slug) =>
        categories.find((category) => category.parentId === null && category.isActive && category.slug === slug),
      )
      .filter(Boolean) as Category[];

    return visibleRoots;
  }, [categories]);

  const subcategories = useMemo(
    () =>
      categories
        .filter((category) => category.parentId === selectedCategoryId)
        .sort((left, right) => left.name.localeCompare(right.name, 'ro')),
    [categories, selectedCategoryId],
  );

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !query ||
        [product.name, product.slug, product.sku]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(query));

      const primaryCategoryId = getPrimaryCategoryId(product);
      const breadcrumbIds = buildCategoryBreadcrumb(primaryCategoryId, categoryMap).map((category) => category.id);
      const matchesCategory = !selectedCategoryId || breadcrumbIds.includes(selectedCategoryId);
      const matchesSubcategory = !selectedSubcategoryId || breadcrumbIds.includes(selectedSubcategoryId);

      return matchesQuery && matchesCategory && matchesSubcategory;
    });
  }, [products, search, selectedCategoryId, selectedSubcategoryId, categoryMap]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !query ||
        [
          order.orderNumber,
          order.customer.name,
          order.customer.email,
          ...order.items.map((item) => item.productName),
        ]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(query));

      const matchesStatus =
        !orderStatusFilter || order.status.toLowerCase() === orderStatusFilter.toLowerCase();
      const matchesPayment =
        !paymentStatusFilter ||
        order.paymentStatus.toLowerCase() === paymentStatusFilter.toLowerCase();

      return matchesQuery && matchesStatus && matchesPayment;
    });
  }, [orders, search, orderStatusFilter, paymentStatusFilter]);

  const visiblePackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !query ||
        [
          order.orderNumber,
          order.customer.name,
          order.customer.email,
          order.courier,
          order.trackingNumber,
        ]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(query));

      const matchesStatus =
        !packageStatusFilter ||
        order.packageStatus.toLowerCase() === packageStatusFilter.toLowerCase();

      return matchesQuery && matchesStatus;
    });
  }, [orders, search, packageStatusFilter]);

  const visibleBillingOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !query ||
        [
          order.orderNumber,
          order.customer.name,
          order.customer.email,
          order.invoiceNumber,
          order.providerPaymentId,
        ]
          .map((value) => String(value || '').toLowerCase())
          .some((value) => value.includes(query));

      const matchesPaymentStatus =
        !billingPaymentStatusFilter ||
        order.paymentStatus.toLowerCase() === billingPaymentStatusFilter.toLowerCase();
      const matchesInvoiceStatus =
        !billingInvoiceStatusFilter ||
        order.invoiceStatus.toLowerCase() === billingInvoiceStatusFilter.toLowerCase();

      return matchesQuery && matchesPaymentStatus && matchesInvoiceStatus;
    });
  }, [orders, search, billingPaymentStatusFilter, billingInvoiceStatusFilter]);

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations
      .filter((conversation) => {
        const matchesQuery =
          !query ||
          [
            conversation.customerName,
            conversation.customerEmail,
            conversation.customerPhone,
            conversation.contactDetail,
            conversation.subject,
            conversation.lastMessagePreview,
          ]
            .map((value) => String(value || '').toLowerCase())
            .some((value) => value.includes(query));

        const matchesStatus =
          !conversationStatusFilter ||
          conversation.status.toLowerCase() === conversationStatusFilter.toLowerCase();
        const matchesSource =
          !conversationSourceFilter ||
          conversation.source.toLowerCase() === conversationSourceFilter.toLowerCase();

        return matchesQuery && matchesStatus && matchesSource;
      })
      .sort((left, right) => {
        const difference = getConversationActivityTimestamp(right) - getConversationActivityTimestamp(left);
        return difference !== 0 ? difference : right.id - left.id;
      });
  }, [conversations, search, conversationStatusFilter, conversationSourceFilter]);

  useEffect(() => {
    setConversationPage(1);
  }, [search, conversationStatusFilter, conversationSourceFilter]);

  useEffect(() => {
    if (!isConversationModalOpen) return;

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsConversationModalOpen(false);
        setConversationReplyDraft('');
        setMessage('');
        setErrorMessage('');
      }
    }

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isConversationModalOpen]);

  const categoryTree = useMemo(
    () => [...categories].sort((left, right) => left.name.localeCompare(right.name, 'ro')),
    [categories],
  );

  const editorCategorySelection = useMemo(() => {
    let categoryId: number | null = null;
    let subcategoryId: number | null = null;

    for (const categoryIdCandidate of draft.categoryIds) {
      const category = categoryMap.get(categoryIdCandidate);
      if (!category) continue;

      if (category.parentId) {
        categoryId = category.parentId;
        subcategoryId = category.id;
        break;
      }

      if (!categoryId) {
        categoryId = category.id;
      }
    }

    return { categoryId, subcategoryId };
  }, [categoryMap, draft.categoryIds]);

  const editorSubcategories = useMemo(
    () =>
      categories
        .filter((category) => category.parentId === editorCategorySelection.categoryId)
        .sort((left, right) => left.name.localeCompare(right.name, 'ro')),
    [categories, editorCategorySelection.categoryId],
  );

  useEffect(() => {
    if (!isCategoryCreatorOpen) return;

    if (editorCategorySelection.categoryId) {
      setNewCategoryParentId(String(editorCategorySelection.categoryId));
      return;
    }

    setNewCategoryParentId('');
  }, [editorCategorySelection.categoryId, isCategoryCreatorOpen]);

  const visibleEditorCategories = useMemo(() => {
    if (showAllEditorCategories) return categoryTree;

    const previewLimit = 8;
    const previewIds = new Set(categoryTree.slice(0, previewLimit).map((category) => category.id));
    draft.categoryIds.forEach((categoryId) => previewIds.add(categoryId));

    return categoryTree.filter((category) => previewIds.has(category.id));
  }, [categoryTree, draft.categoryIds, showAllEditorCategories]);

  const visibleEditorVariants = useMemo(() => {
    const variantsWithIndex = draft.variants.map((variant, index) => ({ variant, index }));
    if (showAllEditorVariants) return variantsWithIndex;
    return variantsWithIndex.slice(0, 3);
  }, [draft.variants, showAllEditorVariants]);

  const visibleEditorAttributes = useMemo(() => {
    const attributesWithIndex = draft.attributes.map((attribute, index) => ({ attribute, index }));
    if (showAllEditorAttributes) return attributesWithIndex;
    return attributesWithIndex.slice(0, 4);
  }, [draft.attributes, showAllEditorAttributes]);

  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((product) => product.status === 'active').length;
    const lowStockProducts = products.filter((product) => product.stockQuantity <= 5).length;
    const draftProducts = products.filter((product) => product.status === 'draft').length;

    return [
      { label: 'Produse totale', value: totalProducts, tone: 'from-violet-500 to-violet-600', description: 'Toate produsele din catalog.' },
      { label: 'Produse active', value: activeProducts, tone: 'from-emerald-500 to-emerald-600', description: 'Produsele vizibile pe site.' },
      { label: 'Stoc scazut', value: lowStockProducts, tone: 'from-amber-400 to-orange-500', description: 'Produse cu stoc de maximum 5 bucati.' },
      { label: 'In draft', value: draftProducts, tone: 'from-slate-500 to-slate-700', description: 'Produse salvate, dar nepublicate.' },
    ];
  }, [products]);

  const orderMetrics = useMemo(() => {
    const totalOrders = orders.length;
    const paidOrders = orders.filter((order) => order.paymentStatus === 'paid').length;
    const pendingOrders = orders.filter((order) => ['Plasata', 'Confirmata', 'In procesare'].includes(order.status)).length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return [
      { label: 'Comenzi totale', value: totalOrders, tone: 'from-violet-500 to-violet-600' },
      { label: 'Comenzi platite', value: paidOrders, tone: 'from-emerald-500 to-emerald-600' },
      { label: 'In lucru', value: pendingOrders, tone: 'from-amber-400 to-orange-500' },
      { label: 'Venit total', value: Number(totalRevenue.toFixed(2)), tone: 'from-sky-500 to-cyan-600' },
    ];
  }, [orders]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const selectedPackage = useMemo(
    () => orders.find((order) => order.id === selectedPackageId) ?? null,
    [orders, selectedPackageId],
  );

  const selectedBillingOrder = useMemo(
    () => orders.find((order) => order.id === selectedBillingId) ?? null,
    [orders, selectedBillingId],
  );

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  function buildProductCategoryIds(nextCategoryId: number | null, nextSubcategoryId: number | null, currentCategoryIds: number[]) {
    const idsToExclude = new Set<number>();
    if (editorCategorySelection.categoryId) idsToExclude.add(editorCategorySelection.categoryId);
    if (editorCategorySelection.subcategoryId) idsToExclude.add(editorCategorySelection.subcategoryId);

    const preservedCategoryIds = currentCategoryIds.filter((categoryId) => !idsToExclude.has(categoryId));
    const orderedIds: number[] = [];

    if (nextSubcategoryId) orderedIds.push(nextSubcategoryId);
    if (nextCategoryId) orderedIds.push(nextCategoryId);

    for (const categoryId of preservedCategoryIds) {
      if (!orderedIds.includes(categoryId)) {
        orderedIds.push(categoryId);
      }
    }

    return orderedIds;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setMessage('');
    setIsLoggingIn(true);

    try {
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        setErrorMessage('Emailul sau parola nu sunt corecte.');
        return;
      }

      await bootstrap();
    } catch {
      setErrorMessage('Autentificarea a esuat momentan.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch(`${backendUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    setUser(null);
    setProducts([]);
    setOrders([]);
    setCategories([]);
    setSelectedProductId(null);
    setSelectedOrderId(null);
    setSelectedPackageId(null);
    setSelectedBillingId(null);
    setSelectedConversationId(null);
    setIsEditorOpen(false);
    setIsOrderModalOpen(false);
    setIsPackageModalOpen(false);
    setIsBillingModalOpen(false);
    setIsConversationModalOpen(false);
    setDraft(emptyDraft());
    setStatus('login');
    setMessage('');
    setErrorMessage('');
  }

  function requestLogout() {
    setIsLogoutConfirmOpen(true);
  }

  function closeLogoutConfirm() {
    setIsLogoutConfirmOpen(false);
  }

  function selectProduct(product: ProductRecord) {
    setCurrentSection('products');
    setIsCreatingProduct(false);
    setSelectedProductId(product.id);
    setDraft(draftFromProduct(product));
    setActiveVariantDetailsIndex(null);
    setProductEditorKey((current) => current + 1);
    setIsProductPreviewVisible(true);
    setIsEditorOpen(true);
    setMessage('');
    setErrorMessage('');
  }

  function handleNewProduct() {
    setCurrentSection('products');
    setIsCreatingProduct(true);
    setSelectedProductId(null);
    setDraft(emptyDraft());
    setShowAllEditorCategories(false);
    setShowAllEditorAttributes(false);
    setShowAllEditorVariants(false);
    setActiveVariantDetailsIndex(null);
    setIsCategoryCreatorOpen(false);
    setNewCategoryName('');
    setNewSubcategoryName('');
    setNewCategoryParentId('');
    closeImageUploadModal();
    setProductEditorKey((current) => current + 1);
    setIsProductPreviewVisible(true);
    setIsEditorOpen(true);
    setMessage('');
    setErrorMessage('');
  }

  function closeEditor() {
    setIsCreatingProduct(false);
    setIsEditorOpen(false);
    setMessage('');
    setErrorMessage('');
    setActiveVariantDetailsIndex(null);
    closeImageUploadModal();
  }

  function openOrder(order: OrderRecord) {
    setSelectedOrderId(order.id);
    setOrderDraftStatus(order.status);
    setOrderDraftPaymentStatus(order.paymentStatus);
    setIsOrderModalOpen(true);
    setMessage('');
    setErrorMessage('');
  }

  function closeOrderModal() {
    setIsOrderModalOpen(false);
    setMessage('');
    setErrorMessage('');
  }

  function openPackage(order: OrderRecord) {
    setSelectedPackageId(order.id);
    setPackageDraftStatus(order.packageStatus || 'nepregatit');
    setPackageDraftCourier(order.courier || '');
    setPackageDraftTrackingNumber(order.trackingNumber || '');
    setPackageDraftTrackingUrl(order.trackingUrl || '');
    setPackageDraftCount(String(order.packageCount || 1));
    setIsPackageModalOpen(true);
    setMessage('');
    setErrorMessage('');
  }

  function closePackageModal() {
    setIsPackageModalOpen(false);
    setMessage('');
    setErrorMessage('');
  }

  function openBilling(order: OrderRecord) {
    setSelectedBillingId(order.id);
    setBillingDraftPaymentStatus(order.paymentStatus || 'unpaid');
    setBillingDraftInvoiceStatus(order.invoiceStatus || 'negenerata');
    setBillingDraftInvoiceNumber(order.invoiceNumber || '');
    setBillingDraftInvoiceUrl(order.invoiceUrl || '');
    setBillingDraftCompany(order.billingCompany || '');
    setBillingDraftVat(order.billingVat || '');
    setIsBillingModalOpen(true);
    setMessage('');
    setErrorMessage('');
  }

  function closeBillingModal() {
    setIsBillingModalOpen(false);
    setMessage('');
    setErrorMessage('');
  }

  function openConversation(conversation: ConversationRecord) {
    setSelectedConversationId(conversation.id);
    setConversationDraftStatus(conversation.status || 'nou');
    setConversationReplyDraft('');
    setIsConversationModalOpen(true);
    setMessage('');
    setErrorMessage('');
  }

  function closeConversationModal() {
    setIsConversationModalOpen(false);
    setConversationReplyDraft('');
    setMessage('');
    setErrorMessage('');
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setMessage('');

    const incompleteVariantIndex = draft.variants.findIndex(
      (variant) => !variant.optionName.trim() || !variant.optionValue.trim(),
    );
    if (incompleteVariantIndex >= 0) {
      setActiveVariantDetailsIndex(incompleteVariantIndex);
      setErrorMessage('Completeaza tipul si valoarea fiecarei variante inainte de salvare.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: draft.name,
        slug: draft.slug,
        description: draft.description,
        shortDescription: draft.shortDescription,
        price: draft.price,
        compareAtPrice: draft.compareAtPrice,
        currency: draft.currency,
        imageUrl: draft.imageUrl,
        sku: draft.sku,
        stockQuantity: draft.stockQuantity,
        status: draft.status,
        material: draft.material,
        categoryIds: draft.categoryIds,
        images: draft.images,
        attributes: draft.attributes,
        variants: draft.variants.map((variant) => ({
          ...variant,
          legacyOptionId: variant.legacyOptionId.trim() ? Number(variant.legacyOptionId) : null,
          legacyOptionValueId: variant.legacyOptionValueId.trim() ? Number(variant.legacyOptionValueId) : null,
        })),
      };

      const response = await fetch(
        draft.id ? `${backendUrl}/admin/products/${draft.id}` : `${backendUrl}/admin/products`,
        {
          method: draft.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.message || 'Produsul nu a putut fi salvat.');
        return;
      }

      const savedProductId = data?.id ?? draft.id ?? null;
      await loadAdminData(savedProductId);
      setIsCreatingProduct(false);
      setMessage(draft.id ? 'Produs actualizat.' : 'Produs adaugat.');
      setIsEditorOpen(false);
    } catch {
      setErrorMessage('A aparut o eroare la salvare.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!draft.id) {
      handleNewProduct();
      return;
    }

    const confirmed = window.confirm(`Stergi produsul "${draft.name}"?`);
    if (!confirmed) return;

    setErrorMessage('');
    setMessage('');
    setIsDeleting(true);

    try {
      const response = await fetch(`${backendUrl}/admin/products/${draft.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.message || 'Produsul nu a putut fi sters.');
        return;
      }

      await loadAdminData(null);
      setMessage('Produs sters.');
      setIsEditorOpen(false);
    } catch {
      setErrorMessage('Stergerea a esuat.');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleOrderUpdate() {
    if (!selectedOrder) return;

    setErrorMessage('');
    setMessage('');
    setIsUpdatingOrder(true);

    try {
      const response = await fetch(`${backendUrl}/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: orderDraftStatus,
          paymentStatus: orderDraftPaymentStatus,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.message || 'Comanda nu a putut fi actualizata.');
        return;
      }

      await loadAdminData(selectedProductId);
      setMessage(`Comanda ${selectedOrder.orderNumber} a fost actualizata.`);
      setIsOrderModalOpen(false);
    } catch {
      setErrorMessage('Actualizarea comenzii a esuat.');
    } finally {
      setIsUpdatingOrder(false);
    }
  }

  async function handlePackageUpdate() {
    if (!selectedPackage) return;

    setErrorMessage('');
    setMessage('');
    setIsUpdatingOrder(true);

    try {
      const response = await fetch(`${backendUrl}/admin/orders/${selectedPackage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          packageStatus: packageDraftStatus,
          courier: packageDraftCourier,
          trackingNumber: packageDraftTrackingNumber,
          trackingUrl: packageDraftTrackingUrl,
          packageCount: packageDraftCount,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.message || 'Coletul nu a putut fi actualizat.');
        return;
      }

      await loadAdminData(selectedProductId);
      setMessage(`Coletul pentru ${selectedPackage.orderNumber} a fost actualizat.`);
      setIsPackageModalOpen(false);
    } catch {
      setErrorMessage('Actualizarea coletului a esuat.');
    } finally {
      setIsUpdatingOrder(false);
    }
  }

  async function handleBillingUpdate() {
    if (!selectedBillingOrder) return;

    setErrorMessage('');
    setMessage('');
    setIsUpdatingOrder(true);

    try {
      const response = await fetch(`${backendUrl}/admin/orders/${selectedBillingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paymentStatus: billingDraftPaymentStatus,
          invoiceStatus: billingDraftInvoiceStatus,
          invoiceNumber: billingDraftInvoiceNumber,
          invoiceUrl: billingDraftInvoiceUrl,
          billingCompany: billingDraftCompany,
          billingVat: billingDraftVat,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.message || 'Factura sau plata nu au putut fi actualizate.');
        return;
      }

      await loadAdminData(selectedProductId);
      setMessage(`Datele financiare pentru ${selectedBillingOrder.orderNumber} au fost actualizate.`);
      setIsBillingModalOpen(false);
    } catch {
      setErrorMessage('Actualizarea datelor financiare a esuat.');
    } finally {
      setIsUpdatingOrder(false);
    }
  }

  async function handleConversationUpdate() {
    if (!selectedConversation) return;

    setErrorMessage('');
    setMessage('');
    setIsUpdatingOrder(true);

    try {
      const response = await fetch(`${backendUrl}/admin/conversations/${selectedConversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: conversationDraftStatus,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.message || 'Conversatia nu a putut fi actualizata.');
        return;
      }

      await loadAdminData(selectedProductId);
      setMessage(`Conversatia cu ${selectedConversation.customerName} a fost actualizata.`);
      setIsConversationModalOpen(false);
    } catch {
      setErrorMessage('Actualizarea conversatiei a esuat.');
    } finally {
      setIsUpdatingOrder(false);
    }
  }

  async function handleConversationReply() {
    if (!selectedConversation) return;
    if (!conversationReplyDraft.trim()) {
      setErrorMessage('Scrie mesajul pe care vrei sa il trimiti.');
      return;
    }

    setErrorMessage('');
    setMessage('');
    setIsSendingConversationReply(true);

    try {
      const response = await fetch(`${backendUrl}/admin/conversations/${selectedConversation.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: conversationReplyDraft,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.message || 'Raspunsul nu a putut fi trimis.');
        return;
      }

      await loadAdminData(selectedProductId);
      setConversationReplyDraft('');
      setMessage(`Raspunsul catre ${selectedConversation.customerName} a fost trimis.`);
    } catch {
      setErrorMessage('Trimiterea raspunsului a esuat.');
    } finally {
      setIsSendingConversationReply(false);
    }
  }

  function updateDraft<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateImage(index: number, patch: Partial<ProductImage>) {
    setDraft((current) => {
      const images = current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...patch } : image,
      );

      return {
        ...current,
        imageUrl: images[index]?.isPrimary ? images[index].imageUrl : current.imageUrl,
        images,
      };
    });
  }

  function setPrimaryImage(index: number) {
    setDraft((current) => ({
      ...current,
      imageUrl: current.images[index]?.imageUrl || current.imageUrl,
      images: current.images.map((image, imageIndex) => ({
        ...image,
        isPrimary: imageIndex === index,
      })),
    }));
  }

  function addImage() {
    openImageUploadModal(null);
  }

  function removeImage(index: number) {
    setDraft((current) => {
      const images = current.images.filter((_, imageIndex) => imageIndex !== index);
      const normalizedImages = images.map((image, imageIndex) => ({
        ...image,
        sortOrder: imageIndex,
        isPrimary: image.isPrimary || (imageIndex === 0 && !images.some((item) => item.isPrimary)),
      }));

      return {
        ...current,
        imageUrl: normalizedImages.find((image) => image.isPrimary)?.imageUrl || '',
        images: normalizedImages.length
          ? normalizedImages
          : [{ imageUrl: '', altText: '', sortOrder: 0, isPrimary: true }],
      };
    });
  }

  function addAttribute() {
    setDraft((current) => ({
      ...current,
      attributes: [...current.attributes, { key: '', value: '', sortOrder: current.attributes.length }],
    }));
  }

  function updateAttribute(index: number, patch: Partial<ProductAttribute>) {
    setDraft((current) => ({
      ...current,
      attributes: current.attributes.map((attribute, attributeIndex) =>
        attributeIndex === index ? { ...attribute, ...patch } : attribute,
      ),
    }));
  }

  function removeAttribute(index: number) {
    setDraft((current) => ({
      ...current,
      attributes: current.attributes
        .filter((_, attributeIndex) => attributeIndex !== index)
        .map((attribute, attributeIndex) => ({ ...attribute, sortOrder: attributeIndex })),
    }));
  }

  function getColorAttributeValue() {
    return (
      draft.attributes.find((attribute) => attribute.key.trim().toLowerCase() === colorAttributeKeyNormalized)
        ?.value ?? ''
    );
  }

  function updateColorAttribute(value: string) {
    setDraft((current) => {
      const existingColorIndex = current.attributes.findIndex(
        (attribute) => attribute.key.trim().toLowerCase() === colorAttributeKeyNormalized,
      );

      if (!value.trim()) {
        return {
          ...current,
          attributes: current.attributes
            .filter((_, attributeIndex) => attributeIndex !== existingColorIndex)
            .map((attribute, attributeIndex) => ({ ...attribute, sortOrder: attributeIndex })),
        };
      }

      if (existingColorIndex >= 0) {
        return {
          ...current,
          attributes: current.attributes
            .map((attribute, attributeIndex) =>
              attributeIndex === existingColorIndex
                ? { ...attribute, key: colorAttributeKey, value }
                : attribute,
            )
            .filter(
              (attribute, attributeIndex) =>
                attributeIndex === existingColorIndex ||
                attribute.key.trim().toLowerCase() !== colorAttributeKeyNormalized,
            )
            .map((attribute, attributeIndex) => ({ ...attribute, sortOrder: attributeIndex })),
        };
      }

      return {
        ...current,
        attributes: [
          ...current.attributes,
          { key: colorAttributeKey, value, sortOrder: current.attributes.length },
        ],
      };
    });
  }

  function addVariant() {
    setDraft((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          id: null,
          optionName: '',
          optionValue: '',
          optionValues: {},
          legacyOptionId: '',
          legacyOptionValueId: '',
          combinationId: '',
          model: '',
          sku: '',
          quantity: 0,
          variantPrice: current.price,
          priceDelta: 0,
          pricePrefix: '+',
          imageUrl: '',
          isActive: true,
          sortOrder: current.variants.length,
        },
      ],
    }));
  }

  function addDetailedProductVariant() {
    const variantIndex = draft.variants.length;
    const parentSku = skuSegment(draft.sku) || 'MGL';
    const usedSkus = new Set(draft.variants.map((variant) => variant.sku.trim().toUpperCase()));
    const skuBase = `${parentSku}-VAR-${variantIndex + 1}`;
    let sku = skuBase;
    let counter = 2;
    while (usedSkus.has(sku)) {
      sku = `${skuBase}-${counter}`;
      counter += 1;
    }

    setDraft((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          id: null,
          optionName: 'Culoare',
          optionValue: '',
          optionValues: {},
          legacyOptionId: '',
          legacyOptionValueId: '',
          combinationId: '',
          model: '',
          sku,
          quantity: 0,
          variantPrice: current.price,
          priceDelta: 0,
          pricePrefix: '+',
          imageUrl: '',
          isActive: current.status === 'active',
          sortOrder: current.variants.length,
        },
      ],
    }));
    setActiveVariantDetailsIndex(variantIndex);
  }

  function updateDetailedVariantOption(
    index: number,
    patch: Partial<Pick<ProductVariant, 'optionName' | 'optionValue'>>,
  ) {
    setDraft((current) => {
      const usedSkus = new Set(
        current.variants
          .filter((_, variantIndex) => variantIndex !== index)
          .map((variant) => variant.sku.trim().toUpperCase())
          .filter(Boolean),
      );

      return {
        ...current,
        variants: current.variants.map((variant, variantIndex) => {
        if (variantIndex !== index) return variant;

        const optionName = patch.optionName ?? variant.optionName;
        const optionValue = patch.optionValue ?? variant.optionValue;
        const optionValues = optionName.trim() && optionValue.trim()
          ? { [optionName.trim()]: optionValue.trim() }
          : {};
        let sku = variant.sku;
        if (variant.id === null) {
          const parentSku = skuSegment(current.sku) || 'MGL';
          const valueSuffix = skuSegment(optionValue) || `VAR-${index + 1}`;
          const skuBase = `${parentSku}-${valueSuffix}`;
          sku = skuBase;
          let counter = 2;
          while (usedSkus.has(sku)) {
            sku = `${skuBase}-${counter}`;
            counter += 1;
          }
        }

        return {
          ...variant,
          optionName,
          optionValue,
          optionValues,
          combinationId: variantCombinationKey(optionValues).slice(0, 255),
          sku,
        };
        }),
      };
    });
  }

  function removeDetailedProductVariant(index: number) {
    removeVariant(index);
    setActiveVariantDetailsIndex(null);
  }

  function addVariantOptionGroup() {
    setDraft((current) => ({
      ...current,
      variantOptionGroups: [
        ...current.variantOptionGroups,
        {
          name: current.variantOptionGroups.length === 0 ? 'Culoare' : '',
          valuesText: '',
        },
      ],
    }));
  }

  function updateVariantOptionGroup(index: number, patch: Partial<VariantOptionGroup>) {
    setDraft((current) => ({
      ...current,
      variantOptionGroups: current.variantOptionGroups.map((group, groupIndex) =>
        groupIndex === index ? { ...group, ...patch } : group,
      ),
    }));
  }

  function removeVariantOptionGroup(index: number) {
    setDraft((current) => ({
      ...current,
      variantOptionGroups: current.variantOptionGroups.filter((_, groupIndex) => groupIndex !== index),
    }));
  }

  function generateVariantMatrix() {
    const groups = draft.variantOptionGroups
      .map((group) => ({
        name: group.name.trim(),
        values: parseVariantGroupValues(group.valuesText),
      }))
      .filter((group) => group.name || group.values.length > 0);

    if (groups.length === 0 || groups.some((group) => !group.name || group.values.length === 0)) {
      setErrorMessage('Completeaza numele si cel putin o valoare pentru fiecare optiune.');
      return;
    }

    const normalizedNames = groups.map((group) => group.name.toLowerCase());
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      setErrorMessage('Fiecare grup de optiuni trebuie sa aiba un nume diferit.');
      return;
    }

    const combinations = groups.reduce<Array<Record<string, string>>>(
      (currentCombinations, group) =>
        currentCombinations.flatMap((combination) =>
          group.values.map((value) => ({ ...combination, [group.name]: value })),
        ),
      [{}],
    );

    if (combinations.length > 250) {
      setErrorMessage(`Sunt ${combinations.length} combinatii. Limita este de 250 pentru un produs.`);
      return;
    }

    setErrorMessage('');
    setDraft((current) => {
      const existingByCombination = new Map(
        current.variants.map((variant) => [variantCombinationKey(variant.optionValues), variant]),
      );
      const usedSkus = new Set(
        current.variants.map((variant) => variant.sku.trim().toUpperCase()).filter(Boolean),
      );
      const baseSku = skuSegment(current.sku) || 'MGL';

      const variants = combinations.map((optionValues, index) => {
        const key = variantCombinationKey(optionValues);
        const existing = existingByCombination.get(key);
        if (existing) {
          return {
            ...existing,
            optionName: Object.keys(optionValues)[0],
            optionValue: Object.values(optionValues)[0],
            optionValues,
            combinationId: key.slice(0, 255),
            sortOrder: index,
          };
        }

        const suffix = Object.values(optionValues).map(skuSegment).filter(Boolean).join('-') || String(index + 1);
        const skuBase = `${baseSku}-${suffix}`;
        let sku = skuBase;
        let counter = 2;
        while (usedSkus.has(sku)) {
          sku = `${skuBase}-${counter}`;
          counter += 1;
        }
        usedSkus.add(sku);

        return {
          id: null,
          optionName: Object.keys(optionValues)[0],
          optionValue: Object.values(optionValues)[0],
          optionValues,
          legacyOptionId: '',
          legacyOptionValueId: '',
          combinationId: key.slice(0, 255),
          model: '',
          sku,
          quantity: 0,
          variantPrice: current.price,
          priceDelta: 0,
          pricePrefix: '+' as const,
          imageUrl: '',
          isActive: true,
          sortOrder: index,
        };
      });

      const colorGroup = groups.find((group) => group.name.toLowerCase() === colorAttributeKeyNormalized);
      const existingColorIndex = current.attributes.findIndex(
        (attribute) => attribute.key.trim().toLowerCase() === colorAttributeKeyNormalized,
      );
      let attributes = current.attributes;
      if (colorGroup) {
        const colorValue = colorGroup.values.join(', ');
        attributes =
          existingColorIndex >= 0
            ? current.attributes.map((attribute, index) =>
                index === existingColorIndex
                  ? { ...attribute, key: colorAttributeKey, value: colorValue }
                  : attribute,
              )
            : [
                ...current.attributes,
                { key: colorAttributeKey, value: colorValue, sortOrder: current.attributes.length },
              ];
      }

      return { ...current, attributes, variants };
    });
  }

  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  }

  function removeVariant(index: number) {
    setDraft((current) => ({
      ...current,
      variants: current.variants
        .filter((_, variantIndex) => variantIndex !== index)
        .map((variant, variantIndex) => ({ ...variant, sortOrder: variantIndex })),
    }));
  }

  function toggleCategory(categoryId: number) {
    setDraft((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId],
    }));
  }

  function handleEditorCategoryChange(nextValue: string) {
    const nextCategoryId = nextValue ? Number(nextValue) : null;

    setDraft((current) => {
      const nextCategoryIds = buildProductCategoryIds(nextCategoryId, null, current.categoryIds);
      return {
        ...current,
        categoryIds: nextCategoryIds,
      };
    });

    if (nextCategoryId) {
      setNewCategoryParentId(String(nextCategoryId));
    } else {
      setNewCategoryParentId('');
    }
  }

  function handleEditorSubcategoryChange(nextValue: string) {
    const nextSubcategoryId = nextValue ? Number(nextValue) : null;

    setDraft((current) => ({
      ...current,
      categoryIds: buildProductCategoryIds(editorCategorySelection.categoryId, nextSubcategoryId, current.categoryIds),
    }));
  }

  async function handleCreateCategory() {
    const trimmedCategoryName = newCategoryName.trim();
    const trimmedSubcategoryName = newSubcategoryName.trim();

    if (!trimmedCategoryName && !trimmedSubcategoryName) {
      setErrorMessage('Introdu categoria sau subcategoria pe care vrei sa o creezi.');
      return;
    }

    setErrorMessage('');
    setMessage('');
    setIsCreatingCategory(true);

    try {
      async function createAdminCategory(name: string, parentId: number | null) {
        const response = await fetch(`${backendUrl}/admin/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name,
            parentId,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || 'Categoria nu a putut fi creata.');
        }

        return data as Category;
      }

      let createdCategory: Category | null = null;
      let createdSubcategory: Category | null = null;

      if (trimmedCategoryName) {
        createdCategory = await createAdminCategory(trimmedCategoryName, null);
      }

      if (trimmedSubcategoryName) {
        const fallbackParentId = Number(newCategoryParentId || editorCategorySelection.categoryId || 0) || null;
        const subcategoryParentId = createdCategory?.id ?? fallbackParentId;

        if (!subcategoryParentId) {
          setErrorMessage('Selecteaza mai intai categoria parinte sau completeaza campul Categorie.');
          return;
        }

        createdSubcategory = await createAdminCategory(trimmedSubcategoryName, subcategoryParentId);
      }

      const createdEntries = [createdCategory, createdSubcategory].filter(Boolean) as Category[];
      if (createdEntries.length > 0) {
        setCategories((current) => [...current, ...createdEntries]);
      }

      if (createdSubcategory) {
        setDraft((current) => ({
          ...current,
          categoryIds: buildProductCategoryIds(createdSubcategory.parentId, createdSubcategory.id, current.categoryIds),
        }));
        setNewCategoryParentId(String(createdSubcategory.parentId));
        setIsCategoryCreatorOpen(false);
        setMessage(createdCategory ? 'Categoria si subcategoria au fost adaugate.' : 'Subcategoria a fost adaugata.');
      } else if (createdCategory) {
        setDraft((current) => ({
          ...current,
          categoryIds: buildProductCategoryIds(createdCategory.id, null, current.categoryIds),
        }));
        setNewCategoryParentId(String(createdCategory.id));
        setIsCategoryCreatorOpen(true);
        setMessage('Categoria a fost adaugata. Poti adauga acum o subcategorie pentru ea.');
      }

      setNewCategoryName('');
      setNewSubcategoryName('');
    } catch {
      setErrorMessage('Categoria nu a putut fi creata.');
    } finally {
      setIsCreatingCategory(false);
    }
  }

  function requestDeleteCategory() {
    const categoryIdToDelete = editorCategorySelection.subcategoryId ?? editorCategorySelection.categoryId;
    if (!categoryIdToDelete) {
      setErrorMessage('Selecteaza mai intai categoria sau subcategoria pe care vrei sa o stergi.');
      return;
    }

    const categoryToDelete = categoryMap.get(categoryIdToDelete);
    if (!categoryToDelete) {
      setErrorMessage('Categoria selectata nu a fost gasita.');
      return;
    }

    setCategoryDeleteCandidate(categoryToDelete);
  }

  function closeCategoryDeleteConfirm() {
    if (isDeletingCategory) return;
    setCategoryDeleteCandidate(null);
  }

  async function handleDeleteCategory() {
    const categoryToDelete = categoryDeleteCandidate;
    if (!categoryToDelete) {
      setErrorMessage('Categoria selectata nu a fost gasita.');
      return;
    }

    const categoryIdToDelete = categoryToDelete.id;

    setErrorMessage('');
    setMessage('');
    setIsDeletingCategory(true);

    try {
      const response = await fetch(`${backendUrl}/admin/categories/${categoryIdToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.message || 'Categoria nu a putut fi stearsa.');
        return;
      }

      setCategories((current) => current.filter((category) => category.id !== categoryIdToDelete));
      setDraft((current) => {
        const remainingIds = current.categoryIds.filter((id) => id !== categoryIdToDelete);

        if (!categoryToDelete.parentId) {
          return {
            ...current,
            categoryIds: remainingIds,
          };
        }

        const nextCategoryIds = [categoryToDelete.parentId, ...remainingIds.filter((id) => id !== categoryToDelete.parentId)];
        return {
          ...current,
          categoryIds: nextCategoryIds,
        };
      });

      setMessage(categoryToDelete.parentId ? 'Subcategoria a fost stearsa.' : 'Categoria a fost stearsa.');
      setCategoryDeleteCandidate(null);
    } catch {
      setErrorMessage('Categoria nu a putut fi stearsa.');
    } finally {
      setIsDeletingCategory(false);
    }
  }

  function openImageUploadModal(index: number | null) {
    setImageUploadTarget({ kind: 'gallery', index });
    setImageUploadFile(null);
    setImageUploadPreview(index !== null ? draft.images[index]?.imageUrl || '' : '');
    setImageUploadAltText(index !== null ? draft.images[index]?.altText || '' : '');
    setImageUploadError('');
    setIsImageUploadModalOpen(true);
  }

  function openVariantImageUploadModal(index: number) {
    const variant = draft.variants[index];
    setImageUploadTarget({ kind: 'variant', index });
    setImageUploadFile(null);
    setImageUploadPreview(variant?.imageUrl || '');
    setImageUploadAltText(
      Object.values(variant?.optionValues || {}).join(' - ') || draft.name || 'Varianta produs',
    );
    setImageUploadError('');
    setIsImageUploadModalOpen(true);
  }

  function closeImageUploadModal() {
    setIsImageUploadModalOpen(false);
    setImageUploadTarget({ kind: 'gallery', index: null });
    setImageUploadFile(null);
    setImageUploadPreview('');
    setImageUploadAltText('');
    setImageUploadError('');
    setIsUploadingImage(false);
  }

  function requestDeleteProduct() {
    if (!draft.id) {
      handleNewProduct();
      return;
    }

    setIsDeleteConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    setIsDeleteConfirmOpen(false);
  }

  function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setImageUploadFile(nextFile);
    setImageUploadError('');

    if (!nextFile) {
      setImageUploadPreview(
        imageUploadTarget.kind === 'variant' && imageUploadTarget.index !== null
          ? draft.variants[imageUploadTarget.index]?.imageUrl || ''
          : imageUploadTarget.index !== null
            ? draft.images[imageUploadTarget.index]?.imageUrl || ''
            : '',
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUploadPreview(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(nextFile);
  }

  function handleImageDrop(event: DragEvent<HTMLButtonElement>, index: number | null) {
    event.preventDefault();
    const nextFile = event.dataTransfer.files?.[0] ?? null;
    if (!nextFile) return;

    setImageUploadTarget({ kind: 'gallery', index });
    setImageUploadFile(nextFile);
    setImageUploadAltText(index !== null ? draft.images[index]?.altText || '' : '');
    setImageUploadError('');
    setIsImageUploadModalOpen(true);

    const reader = new FileReader();
    reader.onload = () => {
      setImageUploadPreview(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(nextFile);
  }

  async function handleImageUpload() {
    if (!imageUploadFile) {
      setImageUploadError('Selecteaza o imagine de pe dispozitiv.');
      return;
    }

    setErrorMessage('');
    setImageUploadError('');
    setIsUploadingImage(true);

    try {
      const base64Data = await fileToBase64(imageUploadFile);
      const response = await fetch(`${backendUrl}/admin/uploads/product-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileName: imageUploadFile.name,
          mimeType: imageUploadFile.type,
          base64Data,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setImageUploadError(data?.message || 'Imaginea nu a putut fi incarcata.');
        return;
      }

      const uploadedImageUrl = String(data?.imageUrl || '').trim();
      if (!uploadedImageUrl) {
        setImageUploadError('Serverul nu a returnat URL-ul imaginii.');
        return;
      }

      if (imageUploadTarget.kind === 'variant' && imageUploadTarget.index !== null) {
        updateVariant(imageUploadTarget.index, {
          imageUrl: uploadedImageUrl,
        });
      } else if (imageUploadTarget.index === null) {
        setDraft((current) => {
          const hasOnlyPlaceholderImage =
            current.images.length === 1 &&
            !current.images[0]?.imageUrl &&
            !current.images[0]?.altText;

          if (hasOnlyPlaceholderImage) {
            return {
              ...current,
              imageUrl: uploadedImageUrl,
              images: [
                {
                  imageUrl: uploadedImageUrl,
                  altText: imageUploadAltText,
                  sortOrder: 0,
                  isPrimary: true,
                },
              ],
            };
          }

          const nextImage = {
            imageUrl: uploadedImageUrl,
            altText: imageUploadAltText,
            sortOrder: current.images.length,
            isPrimary: current.images.length === 0,
          };
          return {
            ...current,
            imageUrl: current.imageUrl || uploadedImageUrl,
            images: [...current.images, nextImage],
          };
        });
      } else {
        updateImage(imageUploadTarget.index, {
          imageUrl: uploadedImageUrl,
          altText: imageUploadAltText,
        });
      }

      closeImageUploadModal();
    } catch {
      setImageUploadError('Imaginea nu a putut fi incarcata.');
    } finally {
      setIsUploadingImage(false);
    }
  }

  function renderProductEditorDesign() {
    const primaryImageIndex = draft.images.findIndex((image) => image.isPrimary && image.imageUrl);
    const fallbackImageIndex = draft.images.findIndex((image) => image.imageUrl);
    const previewImageIndex = primaryImageIndex >= 0 ? primaryImageIndex : fallbackImageIndex;
    const previewImage =
      (previewImageIndex >= 0 ? draft.images[previewImageIndex]?.imageUrl : '') || draft.imageUrl;
    const selectedCategory = editorCategorySelection.categoryId
      ? categoryMap.get(editorCategorySelection.categoryId)
      : null;
    const selectedSubcategory = editorCategorySelection.subcategoryId
      ? categoryMap.get(editorCategorySelection.subcategoryId)
      : null;
    const statusLabel =
      draft.status === 'active' ? 'Activ' : draft.status === 'archived' ? 'Arhivat' : 'Draft';
    const isActive = draft.status === 'active';
    const activeDetailedVariant =
      activeVariantDetailsIndex !== null ? draft.variants[activeVariantDetailsIndex] ?? null : null;

    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-[#f4f7fb] font-[family-name:var(--font-geist-sans)] text-[#17213a]">
        <form
          key={productEditorKey}
          onSubmit={handleSave}
          className={`flex min-h-[100dvh] w-full max-w-none flex-col gap-3 px-3 pb-3 pt-0 ${
            isProductPreviewVisible ? '' : 'product-editor-expanded'
          }`}
        >
          <header className="flex min-h-[86px] flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[#e3e8f0] bg-white px-5 py-3 shadow-[0_3px_12px_rgba(31,42,68,0.08)]">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Inapoi la lista de produse"
                title="Inapoi la lista de produse"
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[11px] bg-[linear-gradient(145deg,#9149ee,#6f2ee8)] text-white shadow-[0_7px_16px_rgba(124,58,237,0.30)] transition hover:-translate-y-0.5 hover:shadow-[0_9px_20px_rgba(124,58,237,0.38)]"
              >
                <EditorGlyph name="tag" className="h-6 w-6" />
              </button>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7c3aed]">Editor produs</p>
                <h1 className="mt-0.5 text-[20px] font-bold leading-tight text-[#17213a]">
                  {draft.id ? draft.name || `Produs #${draft.id}` : 'Produs nou'}
                </h1>
                <p className="mt-0.5 text-[12px] text-[#65728a]">
                  Gestioneaza numele, pretul, categoriile si toate datele tehnice.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[12px] font-semibold ${
                  isActive
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-[#dfead9] bg-[#f3faef] text-[#30843b]'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#37a34a]'}`} />
                {statusLabel}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                title={draft.id ? 'Salveaza modificarile' : 'Creeaza produsul'}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[#e4e8ef] bg-white px-4 text-[12px] font-semibold text-[#536078] shadow-[0_2px_7px_rgba(30,41,59,0.04)] transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <EditorGlyph name="check" className="h-4 w-4" />
                {isSaving ? 'Se salveaza...' : 'Salvare automata'}
              </button>
            </div>
          </header>

          {message ? <Alert tone="success">{message}</Alert> : null}
          {errorMessage ? <Alert tone="danger">{errorMessage}</Alert> : null}

          <div
            className={`grid flex-1 items-stretch gap-3 transition-[grid-template-columns] duration-300 ${
              isProductPreviewVisible ? 'xl:grid-cols-[minmax(0,1fr)_336px]' : 'grid-cols-1'
            }`}
          >
            <div className="flex min-h-full flex-col gap-3">
              <ProductEditorCard>
                <ProductEditorSectionHeader
                  icon="details"
                  title="Detalii de baza"
                  description="Datele principale pe care clientul le vede in catalog."
                  action={
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={addDetailedProductVariant}
                        className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-[8px] bg-violet-600 px-4 text-[11px] font-semibold text-white shadow-[0_5px_14px_rgba(124,58,237,0.2)] transition hover:bg-violet-700"
                      >
                        <span className="text-base font-light leading-none">+</span>
                        Adauga o noua varianta a produsului
                      </button>
                      {!isProductPreviewVisible ? (
                      <button
                        type="button"
                        onClick={() => setIsProductPreviewVisible(true)}
                        aria-expanded="false"
                        className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-[8px] border border-violet-200 bg-white px-4 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50"
                      >
                        <EditorGlyph name="eye" className="h-4 w-4" />
                        Arata preview
                      </button>
                      ) : null}
                    </div>
                  }
                />

                <div className="mt-3 grid gap-x-5 gap-y-[5px] md:grid-cols-2">
                  <ProductEditorField label="Nume produs">
                    <ProductEditorInput
                      value={draft.name}
                      onChange={(event) => updateDraft('name', event.target.value)}
                      placeholder="Ex: Margele de nisip irizate 4 mm"
                      required
                    />
                  </ProductEditorField>

                  <ProductEditorField
                    label={
                      <FieldLabelWithHint
                        label="Slug"
                        hint="Link produs pentru URL si pentru SEO. Se genereaza automat din numele produsului daca ramane gol."
                      />
                    }
                  >
                    <ProductEditorInput
                      value={draft.slug}
                      onChange={(event) => updateDraft('slug', event.target.value)}
                      placeholder="Ex: margele-de-nisip-irizate-4mm"
                    />
                  </ProductEditorField>

                  <ProductEditorField label="Pret">
                    <ProductEditorInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(event) => updateDraft('price', event.target.value)}
                      required
                    />
                  </ProductEditorField>

                  <ProductEditorField label="Pret vechi">
                    <ProductEditorInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.compareAtPrice}
                      onChange={(event) => updateDraft('compareAtPrice', event.target.value)}
                      placeholder="Ex: 9.90"
                    />
                  </ProductEditorField>

                  <ProductEditorField label="Moneda">
                    <ProductEditorSelect
                      value={draft.currency}
                      disabled
                      aria-label="Moneda produsului"
                      className="cursor-not-allowed bg-[#f7f9fc] text-[#536078]"
                    >
                      <option value="RON">RON</option>
                    </ProductEditorSelect>
                  </ProductEditorField>

                  <ProductEditorField
                    label={
                      <FieldLabelWithHint
                        label="SKU"
                        hint="Se genereaza automat un cod nou unic pentru fiecare produs adaugat."
                      />
                    }
                  >
                    <ProductEditorInput
                      value={draft.sku}
                      disabled={!draft.id}
                      onChange={(event) => updateDraft('sku', event.target.value)}
                      className={!draft.id ? 'cursor-not-allowed bg-[#f1f4f8] text-[#6f7d95]' : ''}
                    />
                  </ProductEditorField>

                  <ProductEditorField label="Stoc">
                    <ProductEditorInput
                      type="number"
                      min="0"
                      step="1"
                      value={draft.stockQuantity}
                      onChange={(event) => updateDraft('stockQuantity', event.target.value)}
                    />
                  </ProductEditorField>

                  <ProductEditorField
                    label={
                      <FieldLabelWithHint
                        label="Status"
                        hint="Selecteaza activ pentru ca produsul sa fie vizibil pe website."
                      />
                    }
                  >
                    <ProductEditorSelect
                      value={draft.status}
                      onChange={(event) => updateDraft('status', event.target.value as ProductDraft['status'])}
                    >
                      <option value="draft">ciorna</option>
                      <option value="active">activ</option>
                      <option value="archived">arhivat</option>
                    </ProductEditorSelect>
                  </ProductEditorField>

                  <ProductEditorField
                    label={
                      <FieldLabelWithHint
                        label="Imagine principala"
                        hint="Imaginea principala se completeaza din galerie si poate fi stocata local sau in Cloudflare."
                      />
                    }
                  >
                    <button
                      type="button"
                      onClick={() => openImageUploadModal(previewImageIndex >= 0 ? previewImageIndex : null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleImageDrop(event, previewImageIndex >= 0 ? previewImageIndex : null)}
                      className="product-editor-image-drop flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-[9px] border border-dashed border-[#cbd4e2] bg-[#fbfcfe] px-4 py-2 text-left transition hover:border-violet-300 hover:bg-violet-50/30"
                    >
                      {previewImage ? (
                        <img src={previewImage} alt="" className="h-8 w-10 rounded-md object-cover" />
                      ) : (
                        <EditorGlyph name="image" className="h-6 w-6 shrink-0 text-[#64748b]" />
                      )}
                      <span className="text-[12px] leading-4 text-[#506079]">
                        <strong className="block font-semibold">
                          {previewImage ? 'Inlocuieste imaginea principala' : 'Alege o imagine sau trage aici'}
                        </strong>
                        <span>JPG, PNG, WEBP · max. 10MB</span>
                      </span>
                    </button>
                  </ProductEditorField>

                  <ProductEditorField label="Material">
                    <ProductEditorInput
                      value={draft.material}
                      onChange={(event) => updateDraft('material', event.target.value)}
                      placeholder="Ex: Sticla, acril, metal sau piatra semipretioasa"
                    />
                  </ProductEditorField>

                  <ProductEditorField label="Culoare">
                    <ProductEditorInput
                      value={getColorAttributeValue()}
                      onChange={(event) => updateColorAttribute(event.target.value)}
                      placeholder="Ex: Rosu, Auriu, Transparent, Multicolor"
                    />
                  </ProductEditorField>

                  <ProductEditorField label="Descriere scurta" className="md:col-span-2">
                    <div className="relative">
                      <ProductEditorTextarea
                        value={draft.shortDescription}
                        onChange={(event) => updateDraft('shortDescription', event.target.value)}
                        placeholder="O scurta descriere a produsului..."
                        maxLength={255}
                        className="h-12 resize-none pr-16"
                      />
                      <span className="absolute bottom-2 right-3 text-[10px] text-[#71809a]">
                        {draft.shortDescription.length} / 255
                      </span>
                    </div>
                  </ProductEditorField>

                  <ProductEditorField label="Descriere completa" className="md:col-span-2">
                    <div className="relative">
                      <ProductEditorTextarea
                        value={draft.description}
                        onChange={(event) => updateDraft('description', event.target.value)}
                        placeholder="Descriere completa a produsului..."
                        maxLength={5000}
                        className="h-12 resize-none pr-20"
                      />
                      <span className="absolute bottom-2 right-3 text-[10px] text-[#71809a]">
                        {draft.description.length} / 5000
                      </span>
                    </div>
                  </ProductEditorField>
                </div>
              </ProductEditorCard>

              {activeDetailedVariant && activeVariantDetailsIndex !== null ? (
                <ProductEditorCard>
                  <ProductEditorSectionHeader
                    icon="details"
                    title={`Detalii de baza - Varianta ${activeVariantDetailsIndex + 1}`}
                    description="Aceasta varianta mosteneste produsul principal, dar are cod, pret, stoc, stare si imagine proprii."
                    action={
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveVariantDetailsIndex(null)}
                          className="inline-flex h-8 cursor-pointer items-center rounded-[8px] border border-[#d9e0ea] bg-white px-4 text-[11px] font-semibold text-[#59677e]"
                        >
                          Ascunde
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDetailedProductVariant(activeVariantDetailsIndex)}
                          className="inline-flex h-8 cursor-pointer items-center rounded-[8px] border border-rose-200 bg-white px-4 text-[11px] font-semibold text-rose-500 transition hover:bg-rose-50"
                        >
                          Sterge varianta
                        </button>
                      </div>
                    }
                  />

                  <div className="mt-3 rounded-[10px] border border-violet-100 bg-violet-50/45 px-4 py-3 text-[11px] text-[#59677e]">
                    Numele, descrierile, materialul, categoriile si galeria produsului principal sunt
                    mostenite automat. Completeaza mai jos doar datele care identifica si vand aceasta
                    varianta.
                  </div>

                  <div className="mt-3 grid gap-x-5 gap-y-[5px] md:grid-cols-2">
                    <ProductEditorField label="Nume produs mostenit">
                      <ProductEditorInput
                        value={
                          `${draft.name || 'Produs nou'}${
                            activeDetailedVariant.optionValue
                              ? ` - ${activeDetailedVariant.optionValue}`
                              : ''
                          }`
                        }
                        disabled
                        className="cursor-not-allowed bg-[#f1f4f8] text-[#6f7d95]"
                      />
                    </ProductEditorField>

                    <ProductEditorField label="Tip varianta">
                      <ProductEditorSelect
                        value={activeDetailedVariant.optionName}
                        onChange={(event) =>
                          updateDetailedVariantOption(activeVariantDetailsIndex, {
                            optionName: event.target.value,
                          })
                        }
                      >
                        <option value="Culoare">Culoare</option>
                        <option value="Marime">Marime</option>
                        <option value="Ambalaj">Ambalaj</option>
                        <option value="Model">Model</option>
                      </ProductEditorSelect>
                    </ProductEditorField>

                    <ProductEditorField label="Valoare varianta">
                      <ProductEditorInput
                        value={activeDetailedVariant.optionValue}
                        onChange={(event) =>
                          updateDetailedVariantOption(activeVariantDetailsIndex, {
                            optionValue: event.target.value,
                          })
                        }
                        placeholder={
                          activeDetailedVariant.optionName === 'Culoare'
                            ? 'Ex: Rosu'
                            : activeDetailedVariant.optionName === 'Marime'
                              ? 'Ex: 4 mm'
                              : activeDetailedVariant.optionName === 'Ambalaj'
                                ? 'Ex: 100 buc'
                                : 'Ex: Varianta premium'
                        }
                        required
                      />
                    </ProductEditorField>

                    <ProductEditorField
                      label={
                        <FieldLabelWithHint
                          label="SKU varianta"
                          hint="Este generat automat din SKU-ul produsului principal si ramane unic."
                        />
                      }
                    >
                      <ProductEditorInput
                        value={activeDetailedVariant.sku}
                        disabled
                        className="cursor-not-allowed bg-[#f1f4f8] text-[#6f7d95]"
                      />
                    </ProductEditorField>

                    <ProductEditorField label="Pret varianta">
                      <ProductEditorInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={activeDetailedVariant.variantPrice}
                        onChange={(event) =>
                          updateVariant(activeVariantDetailsIndex, {
                            variantPrice: event.target.value,
                          })
                        }
                        required
                      />
                    </ProductEditorField>

                    <ProductEditorField label="Moneda">
                      <ProductEditorSelect
                        value={draft.currency}
                        disabled
                        className="cursor-not-allowed bg-[#f1f4f8] text-[#6f7d95]"
                      >
                        <option value="RON">RON</option>
                      </ProductEditorSelect>
                    </ProductEditorField>

                    <ProductEditorField label="Stoc varianta">
                      <ProductEditorInput
                        type="number"
                        min="0"
                        step="1"
                        value={activeDetailedVariant.quantity}
                        onChange={(event) =>
                          updateVariant(activeVariantDetailsIndex, {
                            quantity: Number(event.target.value),
                          })
                        }
                      />
                    </ProductEditorField>

                    <ProductEditorField
                      label={
                        <FieldLabelWithHint
                          label="Status varianta"
                          hint="Varianta activa poate fi selectata si cumparata pe website daca are stoc."
                        />
                      }
                    >
                      <ProductEditorSelect
                        value={activeDetailedVariant.isActive ? 'active' : 'inactive'}
                        onChange={(event) =>
                          updateVariant(activeVariantDetailsIndex, {
                            isActive: event.target.value === 'active',
                          })
                        }
                      >
                        <option value="active">activa</option>
                        <option value="inactive">inactiva</option>
                      </ProductEditorSelect>
                    </ProductEditorField>

                    <ProductEditorField label="Imagine varianta">
                      <button
                        type="button"
                        onClick={() => openVariantImageUploadModal(activeVariantDetailsIndex)}
                        className="product-editor-image-drop flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-[9px] border border-dashed border-violet-300 bg-violet-50/35 px-4 py-2 text-left transition hover:bg-violet-50"
                      >
                        {activeDetailedVariant.imageUrl ? (
                          <img
                            src={activeDetailedVariant.imageUrl}
                            alt=""
                            className="h-8 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <EditorGlyph name="image" className="h-6 w-6 shrink-0 text-violet-600" />
                        )}
                        <span className="text-[12px] leading-4 text-[#506079]">
                          <strong className="block font-semibold">
                            {activeDetailedVariant.imageUrl
                              ? 'Inlocuieste imaginea variantei'
                              : 'Adauga imagine variantei'}
                          </strong>
                          <span>JPG, PNG, WEBP - max. 10MB</span>
                        </span>
                      </button>
                    </ProductEditorField>

                    <ProductEditorField label="Material mostenit">
                      <ProductEditorInput
                        value={draft.material}
                        disabled
                        placeholder="Se foloseste materialul produsului principal"
                        className="cursor-not-allowed bg-[#f1f4f8] text-[#6f7d95]"
                      />
                    </ProductEditorField>
                  </div>
                </ProductEditorCard>
              ) : null}

              <ProductEditorCard>
                <ProductEditorSectionHeader
                  icon="categories"
                  title="Categorii si subcategorii"
                  description="Alege categoria principala si, optional, o subcategorie pentru produs."
                  action={
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCategoryCreatorOpen((current) => !current);
                          setNewCategoryParentId(
                            editorCategorySelection.categoryId
                              ? String(editorCategorySelection.categoryId)
                              : '',
                          );
                        }}
                        className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-[8px] border border-violet-300 bg-white px-4 text-[12px] font-semibold text-violet-700 transition hover:bg-violet-50"
                      >
                        <span className="text-lg font-light leading-none">+</span>
                        {isCategoryCreatorOpen
                          ? 'Ascunde formularul'
                          : editorCategorySelection.categoryId
                            ? 'Adauga subcategorie'
                            : 'Adauga categorie'}
                      </button>
                      <button
                        type="button"
                        onClick={requestDeleteCategory}
                        disabled={
                          isDeletingCategory ||
                          (!editorCategorySelection.categoryId && !editorCategorySelection.subcategoryId)
                        }
                        className="inline-flex h-8 cursor-pointer items-center rounded-[8px] border border-rose-200 bg-white px-5 text-[12px] font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {isDeletingCategory ? 'Se sterge...' : 'Sterge categoria'}
                      </button>
                    </div>
                  }
                />

                <div className="mt-0 grid gap-3 md:grid-cols-2">
                  <ProductEditorField label="Categorie">
                    <ProductEditorSelect
                      value={editorCategorySelection.categoryId ?? ''}
                      onChange={(event) => handleEditorCategoryChange(event.target.value)}
                    >
                      <option value="">Selecteaza categoria</option>
                      {allTopLevelCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </ProductEditorSelect>
                  </ProductEditorField>

                  <ProductEditorField label="Subcategorie">
                    <ProductEditorSelect
                      value={editorCategorySelection.subcategoryId ?? ''}
                      onChange={(event) => handleEditorSubcategoryChange(event.target.value)}
                      disabled={!editorCategorySelection.categoryId || editorSubcategories.length === 0}
                    >
                      <option value="">
                        {!editorCategorySelection.categoryId
                          ? 'Selecteaza mai intai categoria'
                          : editorSubcategories.length === 0
                            ? 'Nu exista subcategorii'
                            : 'Selecteaza subcategoria'}
                      </option>
                      {editorSubcategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </ProductEditorSelect>
                  </ProductEditorField>

                  {isCategoryCreatorOpen ? (
                    <div className="grid gap-4 rounded-[12px] border border-dashed border-violet-200 bg-violet-50/35 p-4 md:col-span-2 md:grid-cols-[1fr_1fr_auto]">
                      <ProductEditorField label="Categorie">
                        <ProductEditorInput
                          value={newCategoryName}
                          onChange={(event) => setNewCategoryName(event.target.value)}
                          placeholder="Ex: Margele de nisip"
                        />
                      </ProductEditorField>
                      <ProductEditorField label="Subcategorie">
                        <ProductEditorInput
                          value={newSubcategoryName}
                          onChange={(event) => setNewSubcategoryName(event.target.value)}
                          placeholder={
                            newCategoryParentId || newCategoryName
                              ? 'Ex: Semimate 2mm'
                              : 'Selecteaza categoria parinte'
                          }
                        />
                      </ProductEditorField>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory}
                          className="h-8 cursor-pointer rounded-[8px] bg-violet-600 px-5 text-[12px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCreatingCategory
                            ? 'Se adauga...'
                            : newCategoryName && newSubcategoryName
                              ? 'Creeaza ambele'
                              : newSubcategoryName
                                ? 'Creeaza subcategoria'
                                : 'Creeaza categoria'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </ProductEditorCard>

              <ProductEditorCard>
                <ProductEditorSectionHeader
                  icon="gallery"
                  title="Galerie"
                  description="Mai multe imagini, plus setarea imaginii principale."
                  action={
                    <button
                      type="button"
                      onClick={addImage}
                      className="inline-flex h-8 cursor-pointer items-center rounded-[8px] border border-violet-300 bg-white px-5 text-[12px] font-semibold text-violet-700 transition hover:bg-violet-50"
                    >
                      Adauga imagine
                    </button>
                  }
                />

                <div className="mt-3 space-y-4">
                  {draft.images.map((image, index) => (
                    <div
                      key={`product-editor-image-${index}`}
                      className="grid gap-5 md:grid-cols-[355px_minmax(0,1fr)]"
                    >
                      <button
                        type="button"
                        onClick={() => openImageUploadModal(image.imageUrl ? index : null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleImageDrop(event, image.imageUrl ? index : null)}
                        className="product-editor-gallery-drop relative flex h-[140px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-[#cbd4e2] bg-[#fbfcfe] p-2 text-center transition hover:border-violet-300 hover:bg-violet-50/30"
                      >
                        {image.imageUrl ? (
                          <>
                            <img
                              src={image.imageUrl}
                              alt={image.altText || `Imagine produs ${index + 1}`}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 bg-slate-950/30" />
                            <span className="relative rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700">
                              {image.isPrimary ? 'Imagine principala' : 'Imagine galerie'}
                            </span>
                          </>
                        ) : (
                          <>
                            <EditorGlyph name="upload" className="h-8 w-8 text-violet-600" />
                            <span className="mt-1 text-[13px] font-semibold text-[#506079]">Trage imagini aici</span>
                            <span className="mt-0.5 text-[11px] text-[#75839a]">sau</span>
                            <span className="mt-1 rounded-[7px] border border-violet-300 bg-white px-8 py-2 text-[11px] font-semibold text-violet-700">
                              Incarca din calculator
                            </span>
                            <span className="mt-1.5 text-[10px] text-[#61708a]">JPG, PNG, WEBP · max. 10MB</span>
                          </>
                        )}
                      </button>

                      <div className="flex min-w-0 flex-col justify-between gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <ProductEditorField label="Alt text">
                            <ProductEditorInput
                              value={image.altText}
                              onChange={(event) => updateImage(index, { altText: event.target.value })}
                              placeholder="Descriere imagine (ex: vedere din laterala)"
                            />
                          </ProductEditorField>
                          <ProductEditorField label="Sortare">
                            <ProductEditorInput
                              type="number"
                              min="0"
                              value={image.sortOrder}
                              onChange={(event) => updateImage(index, { sortOrder: Number(event.target.value) })}
                            />
                          </ProductEditorField>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {!image.isPrimary && image.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[8px] border border-violet-200 bg-white px-4 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50"
                            >
                              <EditorGlyph name="check" className="h-4 w-4" />
                              Seteaza principala
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openImageUploadModal(image.imageUrl ? index : null)}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[8px] border border-[#d7dee9] bg-white px-4 text-[11px] font-semibold text-[#506079] transition hover:bg-slate-50"
                          >
                            <EditorGlyph name="replace" className="h-4 w-4" />
                            Inlocuieste imaginea
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[8px] border border-rose-200 bg-white px-4 text-[11px] font-semibold text-rose-500 transition hover:bg-rose-50"
                          >
                            <EditorGlyph name="trash" className="h-4 w-4" />
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ProductEditorCard>

              <details className="group rounded-[14px] border border-[#e1e7ef] bg-white shadow-[0_4px_14px_rgba(31,42,68,0.06)]">
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[13px] font-bold text-[#17213a]">
                  Date avansate: atribute si variante
                  <span className="text-violet-600 transition group-open:rotate-45">+</span>
                </summary>
                <div className="space-y-5 border-t border-[#edf0f5] p-5">
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-[13px] font-bold">Atribute</h3>
                        <p className="text-[11px] text-[#6b7890]">Material, stil, marime si alte detalii.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addAttribute}
                        className="rounded-[8px] border border-violet-200 px-4 py-2 text-[11px] font-semibold text-violet-700"
                      >
                        Adauga atribut
                      </button>
                    </div>
                    <div className="space-y-3">
                      {draft.attributes.length === 0 ? (
                        <p className="text-[12px] text-[#8290a6]">Momentan nu exista atribute.</p>
                      ) : null}
                      {draft.attributes.map((attribute, index) => (
                        <div
                          key={`advanced-attribute-${index}`}
                          className="grid gap-3 rounded-[10px] bg-[#f7f9fc] p-3 md:grid-cols-[1fr_1fr_100px_auto]"
                        >
                          <ProductEditorInput
                            value={attribute.key}
                            onChange={(event) => updateAttribute(index, { key: event.target.value })}
                            placeholder="Cheie"
                          />
                          <ProductEditorInput
                            value={attribute.value}
                            onChange={(event) => updateAttribute(index, { value: event.target.value })}
                            placeholder="Valoare"
                          />
                          <ProductEditorInput
                            type="number"
                            value={attribute.sortOrder}
                            onChange={(event) =>
                              updateAttribute(index, { sortOrder: Number(event.target.value) })
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeAttribute(index)}
                            className="px-3 text-[11px] font-semibold text-rose-500"
                          >
                            Elimina
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#edf0f5] pt-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-[13px] font-bold">Optiuni si variante</h3>
                        <p className="text-[11px] text-[#6b7890]">
                          Defineste optiunile, apoi genereaza toate combinatiile vandabile.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addVariantOptionGroup}
                        className="rounded-[8px] border border-violet-200 px-4 py-2 text-[11px] font-semibold text-violet-700"
                      >
                        + Adauga optiune
                      </button>
                    </div>

                    <div className="mb-3 grid gap-2 rounded-[10px] border border-violet-100 bg-violet-50/50 p-3 text-[11px] text-[#58677f] md:grid-cols-2">
                      <p>
                        <span className="font-bold text-[#27344d]">Mostenite de la produs:</span>{' '}
                        nume, descrieri, material, categorii si galerie.
                      </p>
                      <p>
                        <span className="font-bold text-[#27344d]">Proprii fiecarei variante:</span>{' '}
                        combinatie, SKU unic, pret, stoc, imagine si stare activa.
                      </p>
                    </div>

                    <div className="space-y-3 rounded-[12px] border border-[#e6eaf1] bg-[#f9fafc] p-4">
                      {draft.variantOptionGroups.length === 0 ? (
                        <div className="rounded-[10px] border border-dashed border-[#d9dfeb] bg-white px-4 py-5 text-center">
                          <p className="text-[12px] font-semibold text-[#34425a]">
                            Adauga optiuni precum Culoare, Marime sau Ambalaj.
                          </p>
                          <p className="mt-1 text-[11px] text-[#8290a6]">
                            Fiecare combinatie va primi SKU, pret si stoc propriu.
                          </p>
                        </div>
                      ) : null}

                      {draft.variantOptionGroups.map((group, index) => (
                        <div
                          key={`variant-option-group-${index}`}
                          className="grid gap-3 rounded-[10px] border border-[#e6eaf1] bg-white p-3 md:grid-cols-[minmax(180px,0.4fr)_1fr_auto]"
                        >
                          <ProductEditorField label="Nume optiune">
                            <ProductEditorInput
                              value={group.name}
                              onChange={(event) =>
                                updateVariantOptionGroup(index, { name: event.target.value })
                              }
                              placeholder="Ex: Culoare"
                            />
                          </ProductEditorField>
                          <ProductEditorField label="Valori separate prin virgula">
                            <ProductEditorInput
                              value={group.valuesText}
                              onChange={(event) =>
                                updateVariantOptionGroup(index, { valuesText: event.target.value })
                              }
                              placeholder="Ex: Rosu, Albastru, Auriu"
                            />
                          </ProductEditorField>
                          <button
                            type="button"
                            onClick={() => removeVariantOptionGroup(index)}
                            className="self-end px-3 pb-2 text-[11px] font-semibold text-rose-500"
                          >
                            Elimina
                          </button>
                        </div>
                      ))}

                      {draft.variantOptionGroups.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <p className="text-[11px] text-[#6b7890]">
                            Exemplu: 2 culori x 3 marimi = 6 variante.
                          </p>
                          <button
                            type="button"
                            onClick={generateVariantMatrix}
                            className="rounded-[8px] bg-violet-600 px-4 py-2 text-[11px] font-semibold text-white shadow-[0_5px_14px_rgba(124,58,237,0.2)] transition hover:bg-violet-700"
                          >
                            Genereaza combinatiile
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {draft.variants.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[12px] font-bold text-[#17213a]">
                            Matrice variante ({draft.variants.length})
                          </p>
                          <p className="text-[11px] text-[#8290a6]">
                            SKU-urile trebuie sa fie unice pentru fiecare combinatie.
                          </p>
                        </div>

                        {draft.variants.map((variant, index) => (
                          <div
                            key={`advanced-variant-${variantCombinationKey(variant.optionValues) || index}`}
                            className="rounded-[12px] border border-[#e2e7f0] bg-white p-4"
                          >
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(variant.optionValues).map(([name, value]) => (
                                  <span
                                    key={`${name}-${value}`}
                                    className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700"
                                  >
                                    {name}: {value}
                                  </span>
                                ))}
                              </div>
                              <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-[#34425a]">
                                <input
                                  type="checkbox"
                                  checked={variant.isActive}
                                  onChange={(event) =>
                                    updateVariant(index, { isActive: event.target.checked })
                                  }
                                  className="h-4 w-4 accent-violet-600"
                                />
                                Varianta activa
                              </label>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <ProductEditorField label="SKU unic">
                                <ProductEditorInput
                                  value={variant.sku}
                                  onChange={(event) => updateVariant(index, { sku: event.target.value })}
                                  placeholder="MGL-ROS-4MM-50"
                                />
                              </ProductEditorField>
                              <ProductEditorField label="Pret varianta (RON)">
                                <ProductEditorInput
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={variant.variantPrice}
                                  onChange={(event) =>
                                    updateVariant(index, { variantPrice: event.target.value })
                                  }
                                  placeholder={draft.price}
                                />
                              </ProductEditorField>
                              <ProductEditorField label="Stoc varianta">
                                <ProductEditorInput
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={variant.quantity}
                                  onChange={(event) =>
                                    updateVariant(index, { quantity: Number(event.target.value) })
                                  }
                                />
                              </ProductEditorField>
                              <ProductEditorField label="Imagine varianta (optional)">
                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={() => openVariantImageUploadModal(index)}
                                    className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-[8px] border border-dashed border-violet-300 bg-violet-50/40 px-3 text-left text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50"
                                  >
                                    {variant.imageUrl ? (
                                      <img
                                        src={variant.imageUrl}
                                        alt=""
                                        className="h-7 w-9 rounded object-cover"
                                      />
                                    ) : (
                                      <EditorGlyph name="upload" className="h-5 w-5" />
                                    )}
                                    <span>
                                      {variant.imageUrl ? 'Inlocuieste imaginea' : 'Incarca imagine pentru varianta'}
                                    </span>
                                  </button>
                                  <div className="flex gap-2">
                                    <ProductEditorSelect
                                      value={variant.imageUrl}
                                      onChange={(event) =>
                                        updateVariant(index, { imageUrl: event.target.value })
                                      }
                                    >
                                      <option value="">Imaginea principala</option>
                                      {draft.images
                                        .filter((image) => image.imageUrl)
                                        .map((image, imageIndex) => (
                                          <option
                                            key={`${image.imageUrl}-${imageIndex}`}
                                            value={image.imageUrl}
                                          >
                                            {image.altText || `Imagine galerie ${imageIndex + 1}`}
                                          </option>
                                        ))}
                                      {variant.imageUrl &&
                                      !draft.images.some((image) => image.imageUrl === variant.imageUrl) ? (
                                        <option value={variant.imageUrl}>Imagine proprie incarcata</option>
                                      ) : null}
                                    </ProductEditorSelect>
                                    {variant.imageUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => updateVariant(index, { imageUrl: '' })}
                                        className="rounded-[8px] border border-rose-200 px-3 text-[11px] font-semibold text-rose-500"
                                        title="Foloseste din nou imaginea principala"
                                      >
                                        Sterge
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </ProductEditorField>
                            </div>

                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className="text-[11px] font-semibold text-rose-500"
                              >
                                Elimina combinatia
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {draft.variantOptionGroups.length > 0 && draft.variants.length === 0 ? (
                      <p className="mt-3 text-[12px] text-[#8290a6]">
                        Completeaza optiunile si apasa &quot;Genereaza combinatiile&quot;.
                      </p>
                    ) : null}
                    </div>
                  </div>
              </details>

              <div className="mt-auto flex flex-wrap justify-end gap-3 pb-4 pt-3">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="h-10 cursor-pointer rounded-[9px] border border-[#d9e0ea] bg-white px-5 text-[12px] font-semibold text-[#506079]"
                >
                  Inapoi la lista
                </button>
                <button
                  type="button"
                  onClick={requestDeleteProduct}
                  disabled={isDeleting || isSaving}
                  className="h-10 cursor-pointer rounded-[9px] border border-rose-200 bg-white px-5 text-[12px] font-semibold text-rose-500 disabled:opacity-50"
                >
                  {draft.id ? (isDeleting ? 'Se sterge...' : 'Sterge produsul') : 'Reseteaza'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 cursor-pointer rounded-[9px] bg-violet-600 px-6 text-[12px] font-semibold text-white shadow-[0_7px_16px_rgba(124,58,237,0.22)] transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {isSaving
                    ? 'Se salveaza...'
                    : draft.id
                      ? 'Salveaza modificarile'
                      : 'Creeaza produsul'}
                </button>
              </div>
            </div>

            {isProductPreviewVisible ? (
            <aside className="flex h-auto self-start flex-col rounded-[14px] border border-[#e1e7ef] bg-white p-4 shadow-[0_4px_14px_rgba(31,42,68,0.07)]">
              <button
                type="button"
                onClick={() => setIsProductPreviewVisible(false)}
                aria-expanded="true"
                title="Ascunde preview produs"
                className="flex w-full cursor-pointer items-center gap-2 border-b border-[#e8ecf2] pb-3 text-left text-[13px] font-bold text-[#17213a] transition hover:text-violet-700"
              >
                <EditorGlyph name="eye" className="h-5 w-5 text-violet-600" />
                <span>Preview produs</span>
                <span className="ml-auto text-[10px] font-medium text-[#8390a5]">Ascunde</span>
              </button>
              <div className="mb-5 h-px w-8 bg-violet-500" />

              <div className="flex h-[190px] items-center justify-center overflow-hidden rounded-[10px] border border-[#e1e7ef] bg-[linear-gradient(145deg,#fbfcfe,#f5f7fa)]">
                {previewImage ? (
                  <img src={previewImage} alt={draft.name || 'Preview produs'} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-[#9aa7ba]">
                    <EditorGlyph name="image" className="mx-auto h-8 w-8" />
                    <p className="mt-2 text-[11px]">Fara imagine</p>
                  </div>
                )}
              </div>

              <h2 className="mt-4 truncate text-[16px] font-bold text-[#17213a]">{draft.name || 'Nume produs'}</h2>
              <p className="mt-1 text-[18px] font-bold text-violet-600">
                {Number(draft.price || 0).toLocaleString('ro-RO', { maximumFractionDigits: 2 })}{' '}
                <span className="text-[13px]">{draft.currency || 'RON'}</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="max-w-full truncate rounded-[8px] bg-[#f1f4f8] px-3 py-2 text-[10px] font-semibold text-[#68758c]">
                  SKU: {draft.sku || 'Se genereaza automat'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#dfead9] bg-[#f3faef] px-3 py-1.5 text-[10px] font-semibold text-[#30843b]">
                  <span className="h-2 w-2 rounded-full bg-[#37a34a]" />
                  {statusLabel}
                </span>
              </div>

              <div className="mt-4 space-y-3 border-t border-[#e8ecf2] pt-4 text-[11px]">
                <PreviewDetail label="Stoc disponibil" value={`${draft.stockQuantity || 0} buc`} />
                <PreviewDetail label="Material" value={draft.material || '—'} />
                <PreviewDetail label="Culoare" value={getColorAttributeValue() || '—'} />
                <PreviewDetail label="Categorie" value={selectedCategory?.name || '—'} />
                <PreviewDetail label="Subcategorie" value={selectedSubcategory?.name || '—'} />
              </div>
            </aside>
            ) : null}
          </div>
        </form>
      </div>
    );
  }

  function renderProductEditorPage() {
    return (
      <div className="space-y-6">
        <form key={productEditorKey} onSubmit={handleSave} className="space-y-6">
          {message ? <Alert tone="success">{message}</Alert> : null}
          {errorMessage ? <Alert tone="danger">{errorMessage}</Alert> : null}

          <DashboardCard className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Editor produs</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  {draft.id ? draft.name || `Produs #${draft.id}` : 'Produs nou'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Gestioneaza numele, pretul, categoriile si toate datele tehnice.
                </p>
              </div>

              <div className="fixed bottom-6 right-8 z-30 flex flex-wrap gap-3 rounded-[28px] border border-white/70 bg-white/92 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <Button type="button" variant="secondary" onClick={closeEditor} className="rounded-2xl">
                  Inapoi la lista
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={requestDeleteProduct}
                  disabled={isDeleting || isSaving}
                  className="rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100"
                >
                  {draft.id ? (isDeleting ? 'Se sterge...' : 'Sterge') : 'Reseteaza'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-violet-600 px-5 py-2.5 text-white hover:bg-violet-700"
                >
                  {isSaving ? 'Se salveaza...' : draft.id ? 'Salveaza modificarile' : 'Creeaza produsul'}
                </Button>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <DashboardSection title="Detalii de baza" description="Datele principale pe care clientul le vede in catalog.">
                <div className="grid gap-4 md:grid-cols-2">
                  <DashboardField label="Nume produs">
                    <DashboardInput value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} required />
                  </DashboardField>
                  <DashboardField
                    label={
                      <FieldLabelWithHint
                        label="Slug"
                        hint="Link produs pentru URL si pentru SEO. Se genereaza automat din numele produsului daca ramane gol."
                      />
                    }
                  >
                    <DashboardInput value={draft.slug} onChange={(event) => updateDraft('slug', event.target.value)} placeholder="Ex: margele-de-nisip-irizate-4mm" />
                  </DashboardField>
                  <DashboardField label="Pret">
                    <DashboardInput type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} required />
                  </DashboardField>
                  <DashboardField label="Pret vechi">
                    <DashboardInput type="number" min="0" step="0.01" value={draft.compareAtPrice} onChange={(event) => updateDraft('compareAtPrice', event.target.value)} />
                  </DashboardField>
                  <DashboardField label="Moneda">
                    <div className="flex h-12 w-full cursor-not-allowed items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-400 shadow-none">
                      {draft.currency || 'RON'}
                    </div>
                  </DashboardField>
                  <DashboardField
                    label={
                      <FieldLabelWithHint
                        label="SKU"
                        hint="Se genereaza automat un cod nou unic pentru fiecare produs adaugat."
                      />
                    }
                  >
                    <DashboardInput
                      value={draft.sku}
                      onChange={(event) => updateDraft('sku', event.target.value)}
                      disabled={!draft.id}
                      placeholder={!draft.id ? 'Se genereaza automat pentru produsul nou' : ''}
                      className={!draft.id ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500' : ''}
                    />
                  </DashboardField>
                  <DashboardField label="Stoc">
                    <DashboardInput type="number" min="0" step="1" value={draft.stockQuantity} onChange={(event) => updateDraft('stockQuantity', event.target.value)} />
                  </DashboardField>
                  <DashboardField
                    label={
                      <FieldLabelWithHint
                        label="Status"
                        hint="Selecteaza activ pentru ca produsul sa fie vizibil pe website."
                      />
                    }
                  >
                    <DashboardSelect value={draft.status} onChange={(event) => updateDraft('status', event.target.value as ProductDraft['status'])}>
                      <option value="draft">ciorna</option>
                      <option value="active">activ</option>
                      <option value="archived">arhivat</option>
                    </DashboardSelect>
                  </DashboardField>
                  <DashboardField
                    label={
                      <FieldLabelWithHint
                        label="Imagine principala"
                        hint="Se completeaza automat din galerie si afiseaza sursa imaginii principale, fie local, fie din Cloudflare, in functie de unde este stocata."
                      />
                    }
                  >
                    <DashboardInput
                      value={draft.imageUrl}
                      disabled
                      placeholder="Se completeaza automat din galerie"
                      className="cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    />
                  </DashboardField>
                  <DashboardField label="Material">
                    <DashboardInput value={draft.material} onChange={(event) => updateDraft('material', event.target.value)} />
                  </DashboardField>
                </div>
                <DashboardField label="Descriere scurta">
                  <DashboardTextarea value={draft.shortDescription} onChange={(event) => updateDraft('shortDescription', event.target.value)} className="min-h-24" />
                </DashboardField>
                <DashboardField label="Descriere completa">
                  <DashboardTextarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
                </DashboardField>
              </DashboardSection>

              <DashboardSection
                title="Categorie si subcategorie"
                description="Alege categoria principala si, optional, o subcategorie pentru produs."
                action={
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setIsCategoryCreatorOpen((current) => !current);
                        setNewCategoryParentId(editorCategorySelection.categoryId ? String(editorCategorySelection.categoryId) : '');
                      }}
                      className="rounded-2xl"
                    >
                      {isCategoryCreatorOpen ? 'Ascunde formularul' : editorCategorySelection.categoryId ? 'Adauga subcategorie' : 'Adauga categorie'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={requestDeleteCategory}
                      disabled={isDeletingCategory || (!editorCategorySelection.categoryId && !editorCategorySelection.subcategoryId)}
                      className="rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      {isDeletingCategory ? 'Se sterge...' : 'Sterge categoria'}
                    </Button>
                  </div>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <DashboardField label="Categorie">
                    <DashboardSelect
                      value={editorCategorySelection.categoryId ?? ''}
                      onChange={(event) => handleEditorCategoryChange(event.target.value)}
                    >
                      <option value="">Selecteaza categoria</option>
                      {allTopLevelCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </DashboardSelect>
                  </DashboardField>

                  <DashboardField label="Subcategorie">
                    <DashboardSelect
                      value={editorCategorySelection.subcategoryId ?? ''}
                      onChange={(event) => handleEditorSubcategoryChange(event.target.value)}
                      disabled={!editorCategorySelection.categoryId || editorSubcategories.length === 0}
                    >
                      <option value="">
                        {!editorCategorySelection.categoryId
                          ? 'Selecteaza mai intai categoria'
                          : editorSubcategories.length === 0
                            ? 'Nu exista subcategorii'
                            : 'Selecteaza subcategoria'}
                      </option>
                      {editorSubcategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </DashboardSelect>
                  </DashboardField>

                  {isCategoryCreatorOpen ? (
                    <div className="grid gap-4 rounded-[24px] border border-dashed border-violet-200 bg-violet-50/50 p-4 md:col-span-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_220px]">
                      <DashboardField label="Categorie">
                        <DashboardInput
                          value={newCategoryName}
                          onChange={(event) => setNewCategoryName(event.target.value)}
                          placeholder="Ex: Margele de nisip"
                        />
                      </DashboardField>

                      <DashboardField label="Subcategorie">
                        <DashboardInput
                          value={newSubcategoryName}
                          onChange={(event) => setNewSubcategoryName(event.target.value)}
                          placeholder={newCategoryParentId || newCategoryName ? 'Ex: Semimate 2mm' : 'Selecteaza mai intai categoria de mai sus'}
                        />
                      </DashboardField>

                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory}
                          className="w-full rounded-2xl md:w-auto"
                        >
                          {isCreatingCategory
                            ? 'Se adauga...'
                            : newCategoryName && newSubcategoryName
                              ? 'Creeaza categoria si subcategoria'
                              : newSubcategoryName
                                ? 'Creeaza subcategoria'
                                : 'Creeaza categoria'}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {false && visibleEditorCategories.map((category) => (
                    <label
                      key={category.id}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                        draft.categoryIds.includes(category.id)
                          ? 'border-violet-200 bg-violet-50/80'
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={draft.categoryIds.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600"
                      />
                      <span>
                        <span className="block font-semibold text-slate-900">{category.name}</span>
                        <span className="block text-xs text-slate-400">
                          {category.slug}{!category.isActive ? ' • inactiva' : ''}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </DashboardSection>

              <DashboardSection
                title="Galerie"
                description="Mai multe imagini, plus setarea imaginii principale."
                action={
                  draft.images.some((image) => image.imageUrl) ? null : (
                    <Button type="button" variant="secondary" onClick={addImage} className="rounded-2xl">
                      Adauga imagine
                    </Button>
                  )
                }
              >
                <div className="space-y-4">
                  {draft.images.map((image, index) => (
                    <div key={`image-${index}`} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                        <div className="space-y-3">
                          <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                            {image.imageUrl ? (
                              <img src={image.imageUrl} alt={image.altText || `Imagine produs ${index + 1}`} className="h-full w-full object-cover" />
                            ) : (
                              <div className="px-6 text-center text-sm text-slate-400">Nu exista imagine incarcata.</div>
                            )}
                            {image.isPrimary && image.imageUrl ? (
                              <div className="absolute left-3 top-3 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg">
                                Principala
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!image.isPrimary ? (
                              <Button type="button" variant="secondary" onClick={() => setPrimaryImage(index)} className="rounded-2xl">
                                Seteaza ca principala
                              </Button>
                            ) : null}
                            <Button type="button" variant="secondary" onClick={() => openImageUploadModal(index)} className="rounded-2xl">
                              Inlocuieste imaginea
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => removeImage(index)} className="rounded-2xl">
                              Elimina
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <DashboardField label="Alt text">
                            <DashboardInput value={image.altText} onChange={(event) => updateImage(index, { altText: event.target.value })} />
                          </DashboardField>
                          <DashboardField label="Sortare">
                            <DashboardInput type="number" value={image.sortOrder} onChange={(event) => updateImage(index, { sortOrder: Number(event.target.value) })} />
                          </DashboardField>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardSection>

              <DashboardSection
                title="Atribute"
                description="Detalii descriptive precum material, stil, marime."
                action={
                  <div className="flex items-center gap-3">
                    {draft.attributes.length > visibleEditorAttributes.length ? (
                      <button
                        type="button"
                        onClick={() => setShowAllEditorAttributes(true)}
                        className="cursor-pointer text-sm font-semibold text-violet-600 transition hover:text-violet-700"
                      >
                        Vezi toate atributele ({draft.attributes.length - visibleEditorAttributes.length} in plus)
                      </button>
                    ) : draft.attributes.length > 4 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllEditorAttributes(false)}
                        className="cursor-pointer text-sm font-semibold text-violet-600 transition hover:text-violet-700"
                      >
                        Restrange lista
                      </button>
                    ) : null}
                    <Button type="button" variant="secondary" onClick={addAttribute} className="rounded-2xl">
                      Adauga atribut
                    </Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  {draft.attributes.length === 0 ? (
                    <p className="text-sm text-slate-400">Momentan nu exista atribute.</p>
                  ) : null}
                  {visibleEditorAttributes.map(({ attribute, index }) => (
                    <div key={`attribute-${index}`} className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-4 md:grid-cols-[1fr_1fr_120px_110px]">
                      <DashboardField label="Cheie">
                        <DashboardInput value={attribute.key} onChange={(event) => updateAttribute(index, { key: event.target.value })} />
                      </DashboardField>
                      <DashboardField label="Valoare">
                        <DashboardInput value={attribute.value} onChange={(event) => updateAttribute(index, { value: event.target.value })} />
                      </DashboardField>
                      <DashboardField label="Sortare">
                        <DashboardInput type="number" value={attribute.sortOrder} onChange={(event) => updateAttribute(index, { sortOrder: Number(event.target.value) })} />
                      </DashboardField>
                      <div className="flex items-end">
                        <Button type="button" variant="secondary" onClick={() => removeAttribute(index)} className="w-full rounded-2xl">
                          Elimina
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardSection>

              <DashboardSection
                title="Variante"
                description="Optiuni de produs cu SKU, pret si stoc propriu."
                action={
                  <div className="flex items-center gap-3">
                    {draft.variants.length > visibleEditorVariants.length ? (
                      <button
                        type="button"
                        onClick={() => setShowAllEditorVariants(true)}
                        className="cursor-pointer text-sm font-semibold text-violet-600 transition hover:text-violet-700"
                      >
                        Vezi toate variantele ({draft.variants.length - visibleEditorVariants.length} in plus)
                      </button>
                    ) : draft.variants.length > 3 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllEditorVariants(false)}
                        className="cursor-pointer text-sm font-semibold text-violet-600 transition hover:text-violet-700"
                      >
                        Restrange lista
                      </button>
                    ) : null}
                    <Button type="button" variant="secondary" onClick={addVariant} className="rounded-2xl">
                      Adauga varianta
                    </Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  {draft.variants.length === 0 ? (
                    <p className="text-sm text-slate-400">Momentan nu exista variante.</p>
                  ) : null}
                  {visibleEditorVariants.map(({ variant, index }) => (
                    <div key={`variant-${index}`} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <DashboardField label="Nume optiune">
                          <DashboardInput value={variant.optionName} onChange={(event) => updateVariant(index, { optionName: event.target.value })} placeholder="culoare" />
                        </DashboardField>
                        <DashboardField label="Valoare optiune">
                          <DashboardInput value={variant.optionValue} onChange={(event) => updateVariant(index, { optionValue: event.target.value })} placeholder="rosu" />
                        </DashboardField>
                        <DashboardField label="SKU">
                          <DashboardInput value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} />
                        </DashboardField>
                        <DashboardField label="Model">
                          <DashboardInput value={variant.model} onChange={(event) => updateVariant(index, { model: event.target.value })} />
                        </DashboardField>
                        <DashboardField label="Cantitate">
                          <DashboardInput type="number" min="0" step="1" value={variant.quantity} onChange={(event) => updateVariant(index, { quantity: Number(event.target.value) })} />
                        </DashboardField>
                        <DashboardField label="Diferenta pret">
                          <DashboardInput type="number" step="0.01" value={variant.priceDelta} onChange={(event) => updateVariant(index, { priceDelta: Number(event.target.value) })} />
                        </DashboardField>
                        <DashboardField label="Prefix pret">
                          <DashboardSelect value={variant.pricePrefix} onChange={(event) => updateVariant(index, { pricePrefix: event.target.value as '+' | '-' })}>
                            <option value="+">+</option>
                            <option value="-">-</option>
                          </DashboardSelect>
                        </DashboardField>
                        <DashboardField label="Sortare">
                          <DashboardInput type="number" min="0" step="1" value={variant.sortOrder} onChange={(event) => updateVariant(index, { sortOrder: Number(event.target.value) })} />
                        </DashboardField>
                        <DashboardField label="ID combinatie">
                          <DashboardInput value={variant.combinationId} onChange={(event) => updateVariant(index, { combinationId: event.target.value })} />
                        </DashboardField>
                        <DashboardField label="ID optiune legacy">
                          <DashboardInput value={variant.legacyOptionId} onChange={(event) => updateVariant(index, { legacyOptionId: event.target.value })} />
                        </DashboardField>
                        <DashboardField label="ID valoare optiune legacy">
                          <DashboardInput value={variant.legacyOptionValueId} onChange={(event) => updateVariant(index, { legacyOptionValueId: event.target.value })} />
                        </DashboardField>
                        <DashboardField label="Imagine varianta">
                          <DashboardInput value={variant.imageUrl} onChange={(event) => updateVariant(index, { imageUrl: event.target.value })} />
                        </DashboardField>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button type="button" variant="secondary" onClick={() => removeVariant(index)} className="rounded-2xl">
                          Elimina varianta
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardSection>
            </div>
          </DashboardCard>
        </form>
      </div>
    );
  }

  if (status === 'loading' || isBootstrapping) {
    return (
      <AdminStage>
        <CenteredCard title="Se incarca panoul" subtitle="Pregatim catalogul si configuratiile de administrare." />
      </AdminStage>
    );
  }

  if (status === 'login') {
    return (
      <AdminStage>
        <CenteredCard title="Autentificare administrator" subtitle="Conecteaza-te cu un cont de administrare pentru a gestiona catalogul.">
          <form onSubmit={handleLogin} className="space-y-5">
            <DashboardField label="Email">
              <DashboardInput
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="admin@margele.net"
              />
            </DashboardField>
            <DashboardField label="Parola">
              <DashboardInput
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Introdu parola"
              />
            </DashboardField>
            {errorMessage ? <p className="text-sm font-medium text-rose-600">{errorMessage}</p> : null}
            <Button type="submit" disabled={isLoggingIn} className="h-12 w-full rounded-2xl bg-violet-600 text-base hover:bg-violet-700">
              {isLoggingIn ? 'Se conecteaza...' : 'Intra in dashboard'}
            </Button>
          </form>
        </CenteredCard>
      </AdminStage>
    );
  }

  if (status === 'forbidden') {
    return (
      <AdminStage>
        <CenteredCard title="Acces restrictionat" subtitle="Contul curent nu are permisiuni pentru aceasta zona.">
          <div className="space-y-4 text-sm text-slate-600">
            <p>
              Contul {user?.email ? <strong>{user.email}</strong> : 'curent'} nu are rol de admin.
            </p>
            <p>
              Adauga emailul in `ADMIN_EMAILS` sau seteaza coloana `role` la `admin`.
            </p>
            <Button onClick={handleLogout} variant="secondary" className="rounded-2xl">
              Deconectare
            </Button>
          </div>
        </CenteredCard>
      </AdminStage>
    );
  }

  return (
    <AdminStage>
      <div className="relative h-screen overflow-hidden bg-[#eef2f8]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.85),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.18),_transparent_28%)]" />
        <div className={`relative grid h-screen ${isSidebarExpanded ? 'grid-cols-[78px_250px_minmax(0,1fr)]' : 'grid-cols-[78px_minmax(0,1fr)]'}`}>
          <PurpleRail
            groups={sidebarGroups}
            currentSection={currentSection}
            isExpanded={isSidebarExpanded}
            userName={user?.name || user?.email || 'Admin'}
            onToggleExpanded={() => setIsSidebarExpanded((current) => !current)}
            onSelectItem={(label) => {
              if (label === 'Deconectare') {
                requestLogout();
                return;
              }

              const nextSection = getMenuSection(label);
              if (nextSection) {
                setCurrentSection(nextSection);
              }
            }}
          />

          {isSidebarExpanded ? (
          <aside className="sticky top-0 h-screen overflow-y-auto border-r border-white/70 bg-white/78 px-5 py-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-300/40">
                <div className="flex gap-1">
                  <span className="h-3.5 w-2.5 rounded-full bg-white/95" />
                  <span className="h-3.5 w-2.5 rounded-full bg-white/95" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-500">Panou</p>
                <h1 className="text-2xl font-semibold text-slate-900">Margele Admin</h1>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {sidebarGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{group.title}</p>
                  {group.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.label === 'Deconectare') {
                          requestLogout();
                          return;
                        }

                        const nextSection = getMenuSection(item.label);
                        if (nextSection) {
                          setCurrentSection(nextSection);
                        }
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                        (getMenuSection(item.label) === currentSection)
                          ? 'bg-violet-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.12)]'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        (getMenuSection(item.label) === currentSection) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <SidebarIcon name={item.icon} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.label}</p>
                        <p className="truncate text-xs text-slate-400">{item.hint}</p>
                      </div>
                      {(getMenuSection(item.label) === currentSection) ? <span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> : null}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>
          ) : null}

          <section className="flex h-screen min-h-0 flex-col overflow-hidden">
            {currentSection !== 'dashboard' ? (
            <header className="sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-white/60 bg-white/55 px-6 py-5 backdrop-blur-xl">
              <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                <span className="text-slate-400">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    currentSection === 'orders'
                      ? 'Cauta comanda, client sau produs'
                      : currentSection === 'chat'
                        ? 'Cauta conversatie, client sau mesaj'
                        : currentSection === 'products' && isEditorOpen
                          ? 'Editor produs deschis'
                          : 'Cauta produs, SKU sau slug'
                  }
                  disabled={currentSection === 'products' && isEditorOpen}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-3">
                {currentSection === 'products' && isEditorOpen ? null : (
                  <>
                    <ToolbarPill>{currentSection === 'orders' ? `${orders.length} comenzi` : `${products.length} produse`}</ToolbarPill>
                    <ToolbarPill>
                      {currentSection === 'orders'
                        ? `${orders.filter((order) => order.paymentStatus === 'paid').length} platite`
                        : `${categories.length} categorii`}
                    </ToolbarPill>
                  </>
                )}
                {currentSection === 'products' && !isEditorOpen ? (
                  <button
                    type="button"
                    onClick={handleNewProduct}
                    className="cursor-pointer rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
                  >
                    Adauga produs
                  </button>
                ) : null}
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f59e0b_0%,#8b5cf6_100%)] text-sm font-semibold text-white">
                    {(user?.name || 'A').slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user?.name || 'Administrator'}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
              </div>
            </header>
            ) : null}

            <div className={`flex-1 overflow-y-auto ${currentSection === 'dashboard' ? 'bg-[#f7f9fc] p-5' : 'p-6'}`}>
              {currentSection === 'dashboard' ? (
                <DashboardOverviewReference
                  products={products}
                  orders={orders}
                  categories={categories}
                  onOpenProducts={() => setCurrentSection('products')}
                  onOpenOrders={() => setCurrentSection('orders')}
                  onNewProduct={handleNewProduct}
                  onViewStore={() => window.open('/', '_blank', 'noopener,noreferrer')}
                />
              ) : null}

              {currentSection === 'products' ? (
              isEditorOpen ? renderProductEditorDesign() : <div className="space-y-6">
                <div className="grid gap-4 xl:grid-cols-4">
                  {metrics.map((metric) => (
                    <div key={metric.label} className={`rounded-[28px] bg-gradient-to-br ${metric.tone} p-[1px] shadow-lg`}>
                      <div className="rounded-[27px] bg-white/92 px-5 py-4 backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
                        <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
                        <p className="mt-2 text-sm text-slate-500">{metric.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <DashboardCard className="overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-950">Privire generala catalog</h2>
                      </div>
                    </div>

                    <div className="grid gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-4 md:grid-cols-2 xl:grid-cols-[220px_220px_1fr]">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Categorie</span>
                        <select
                          value={selectedCategoryId ?? ''}
                          onChange={(event) => {
                            const nextValue = event.target.value ? Number(event.target.value) : null;
                            setSelectedCategoryId(nextValue);
                            setSelectedSubcategoryId(null);
                          }}
                          className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                        >
                          <option value="">Toate categoriile</option>
                          {frontendVisibleTopLevelCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Subcategorie</span>
                        <select
                          value={selectedSubcategoryId ?? ''}
                          onChange={(event) => setSelectedSubcategoryId(event.target.value ? Number(event.target.value) : null)}
                          disabled={!selectedCategoryId || subcategories.length === 0}
                          className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                        >
                          <option value="">{selectedCategoryId ? 'Toate subcategoriile' : 'Selecteaza mai intai categoria'}</option>
                          {subcategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="flex items-end">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                          Afisezi <span className="font-semibold text-slate-900">{visibleProducts.length}</span> produse
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          <tr>
                            <th className="px-6 py-4">Produs</th>
                            <th className="px-4 py-4">Slug</th>
                            <th className="px-4 py-4">Pret</th>
                            <th className="px-4 py-4">Stoc</th>
                            <th className="px-4 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actiune</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visibleProducts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                                Nu exista produse care sa corespunda cautarii.
                              </td>
                            </tr>
                          ) : null}
                          {visibleProducts.map((product) => {
                            const isSelected = product.id === selectedProductId;
                            return (
                              <tr
                                key={product.id}
                                className={`transition ${
                                  isSelected ? 'bg-violet-50/80' : 'hover:bg-slate-50/80'
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <button
                                    type="button"
                                    onClick={() => selectProduct(product)}
                                    className="flex items-center gap-3 text-left"
                                  >
                                    {product.imageUrl ? (
                                      <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                                        <img
                                          src={product.imageUrl}
                                          alt={product.name || 'Imagine produs'}
                                          className="h-full w-full object-cover"
                                        />
              </div>
              ) : null}
                                    <div>
                                      <p className="font-semibold text-slate-900">{product.name}</p>
                                      <p className="text-xs text-slate-400">{product.sku || `ID ${product.id}`}</p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {buildCategoryBreadcrumb(getPrimaryCategoryId(product), categoryMap)
                                          .map((category) => category.name)
                                          .join(' / ') || 'Fara categorie'}
                                      </p>
                                    </div>
                                  </button>
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-500">{product.slug || '-'}</td>
                                <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                                  {product.price} {product.currency}
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-600">{product.stockQuantity}</td>
                                <td className="px-4 py-4">
                                  <StatusPill status={product.status} />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex justify-end gap-2">
                                    <IconAction onClick={() => selectProduct(product)} label="Editeaza">
                                      ✎
                                    </IconAction>
                                    <IconAction onClick={handleNewProduct} label="Duplica">
                                      +
                                    </IconAction>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </DashboardCard>
                </div>
                </div>
              ) : null}

              {currentSection === 'orders' ? (
                <OrdersOverview
                  metrics={orderMetrics}
                  orders={visibleOrders}
                  selectedOrderId={selectedOrderId}
                  statusFilter={orderStatusFilter}
                  paymentStatusFilter={paymentStatusFilter}
                  onStatusFilterChange={setOrderStatusFilter}
                  onPaymentStatusFilterChange={setPaymentStatusFilter}
                  onOpenOrder={openOrder}
                />
              ) : null}

              {currentSection === 'packages' ? (
                <PackagesOverview
                  metrics={orderMetrics}
                  packages={visiblePackages}
                  selectedPackageId={selectedPackageId}
                  packageStatusFilter={packageStatusFilter}
                  onPackageStatusFilterChange={setPackageStatusFilter}
                  onOpenPackage={openPackage}
                />
              ) : null}

              {currentSection === 'billing' ? (
                <BillingOverview
                  metrics={orderMetrics}
                  orders={visibleBillingOrders}
                  selectedBillingId={selectedBillingId}
                  paymentStatusFilter={billingPaymentStatusFilter}
                  invoiceStatusFilter={billingInvoiceStatusFilter}
                  onPaymentStatusFilterChange={setBillingPaymentStatusFilter}
                  onInvoiceStatusFilterChange={setBillingInvoiceStatusFilter}
                  onOpenBilling={openBilling}
                />
              ) : null}

              {currentSection === 'chat' ? (
                <ChatOverview
                  conversations={visibleConversations}
                  selectedConversationId={selectedConversationId}
                  currentPage={conversationPage}
                  statusFilter={conversationStatusFilter}
                  sourceFilter={conversationSourceFilter}
                  onPageChange={setConversationPage}
                  onStatusFilterChange={setConversationStatusFilter}
                  onSourceFilterChange={setConversationSourceFilter}
                  onOpenConversation={openConversation}
                />
              ) : null}
            </div>
          </section>
        </div>

        {false && isEditorOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
            onClick={closeEditor}
          >
            <div
              className="max-h-[calc(100vh-2rem)] w-full max-w-[1180px] overflow-hidden rounded-[32px] bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <form onSubmit={handleSave} className="flex max-h-[calc(100vh-2rem)] flex-col">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Editor produs</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                      {draft.id ? draft.name || `Produs #${draft.id}` : 'Produs nou'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Gestioneaza numele, pretul, categoriile si toate datele tehnice.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeEditor}
                      className="rounded-2xl"
                    >
                      Inchide
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleDelete}
                      disabled={isDeleting || isSaving}
                      className="rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      {draft.id ? (isDeleting ? 'Se sterge...' : 'Sterge') : 'Reseteaza'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-2xl bg-violet-600 px-5 py-2.5 text-white hover:bg-violet-700"
                    >
                      {isSaving ? 'Se salveaza...' : draft.id ? 'Salveaza modificarile' : 'Creeaza produsul'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 overflow-y-auto px-6 py-6">
                  {message ? <Alert tone="success">{message}</Alert> : null}
                  {errorMessage ? <Alert tone="danger">{errorMessage}</Alert> : null}

                  <DashboardSection title="Detalii de baza" description="Datele principale pe care clientul le vede in catalog.">
                    <div className="grid gap-4 md:grid-cols-2">
                      <DashboardField label="Nume produs">
                        <DashboardInput value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} required />
                      </DashboardField>
                      <DashboardField
                        label={
                          <FieldLabelWithHint
                            label="Slug"
                            hint="Link produs pentru URL si pentru SEO. Se genereaza automat din numele produsului daca ramane gol."
                          />
                        }
                      >
                        <DashboardInput value={draft.slug} onChange={(event) => updateDraft('slug', event.target.value)} placeholder="Ex: margele-de-nisip-irizate-4mm" />
                      </DashboardField>
                      <DashboardField label="Pret">
                        <DashboardInput type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} required />
                      </DashboardField>
                      <DashboardField label="Pret vechi">
                        <DashboardInput type="number" min="0" step="0.01" value={draft.compareAtPrice} onChange={(event) => updateDraft('compareAtPrice', event.target.value)} />
                      </DashboardField>
                      <DashboardField label="Moneda">
                        <div className="flex h-12 w-full cursor-not-allowed items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-400 shadow-none">
                          {draft.currency || 'RON'}
                        </div>
                      </DashboardField>
                      <DashboardField
                        label={
                          <FieldLabelWithHint
                            label="SKU"
                            hint="Se genereaza automat un cod nou unic pentru fiecare produs adaugat."
                          />
                        }
                      >
                        <DashboardInput
                          value={draft.sku}
                          onChange={(event) => updateDraft('sku', event.target.value)}
                          disabled={!draft.id}
                          placeholder={!draft.id ? 'Se genereaza automat pentru produsul nou' : ''}
                          className={!draft.id ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500' : ''}
                        />
                      </DashboardField>
                      <DashboardField label="Stoc">
                        <DashboardInput type="number" min="0" step="1" value={draft.stockQuantity} onChange={(event) => updateDraft('stockQuantity', event.target.value)} />
                      </DashboardField>
                      <DashboardField
                        label={
                          <FieldLabelWithHint
                            label="Status"
                            hint="Selecteaza activ pentru ca produsul sa fie vizibil pe website."
                          />
                        }
                      >
                        <DashboardSelect value={draft.status} onChange={(event) => updateDraft('status', event.target.value as ProductDraft['status'])}>
                          <option value="draft">ciorna</option>
                          <option value="active">activ</option>
                          <option value="archived">arhivat</option>
                        </DashboardSelect>
                      </DashboardField>
                      <DashboardField
                        label={
                          <FieldLabelWithHint
                            label="Imagine principala"
                            hint="Se completeaza automat din galerie si afiseaza sursa imaginii principale, fie local, fie din Cloudflare, in functie de unde este stocata."
                          />
                        }
                      >
                        <DashboardInput
                          value={draft.imageUrl}
                          disabled
                          placeholder="Se completeaza automat din galerie"
                          className="cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        />
                      </DashboardField>
                      <DashboardField label="Material">
                        <DashboardInput value={draft.material} onChange={(event) => updateDraft('material', event.target.value)} />
                      </DashboardField>
                    </div>
                    <DashboardField label="Descriere scurta">
                      <DashboardTextarea value={draft.shortDescription} onChange={(event) => updateDraft('shortDescription', event.target.value)} className="min-h-24" />
                    </DashboardField>
                    <DashboardField label="Descriere completa">
                      <DashboardTextarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
                    </DashboardField>
                  </DashboardSection>

                  <DashboardSection title="Categorii" description="Prima categorie selectata devine categoria principala.">
                    <div className="grid gap-3 md:grid-cols-2">
                      {categoryTree.map((category) => (
                        <label
                          key={category.id}
                          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                            draft.categoryIds.includes(category.id)
                              ? 'border-violet-200 bg-violet-50/80'
                              : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={draft.categoryIds.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600"
                          />
                          <span>
                            <span className="block font-semibold text-slate-900">{category.name}</span>
                            <span className="block text-xs text-slate-400">
                              {category.slug}{!category.isActive ? ' • inactiva' : ''}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </DashboardSection>

                  <DashboardSection
                    title="Galerie"
                    description="Mai multe imagini, plus setarea imaginii principale."
                    action={
                      <Button type="button" variant="secondary" onClick={addImage} className="rounded-2xl">
                        Adauga imagine
                      </Button>
                    }
                  >
                    <div className="space-y-4">
                      {draft.images.map((image, index) => (
                        <div key={`image-${index}`} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <DashboardField label="URL imagine">
                              <DashboardInput value={image.imageUrl} onChange={(event) => updateImage(index, { imageUrl: event.target.value })} />
                            </DashboardField>
                            <DashboardField label="Alt text">
                              <DashboardInput value={image.altText} onChange={(event) => updateImage(index, { altText: event.target.value })} />
                            </DashboardField>
                            <DashboardField label="Sortare">
                              <DashboardInput type="number" value={image.sortOrder} onChange={(event) => updateImage(index, { sortOrder: Number(event.target.value) })} />
                            </DashboardField>
                            <div className="flex items-end justify-between gap-3">
                              <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input type="radio" name="primary-image" checked={image.isPrimary} onChange={() => setPrimaryImage(index)} />
                                Principala
                              </label>
                              <Button type="button" variant="secondary" onClick={() => removeImage(index)} className="rounded-2xl">
                                Elimina
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DashboardSection>

                  <DashboardSection
                    title="Atribute"
                    description="Detalii descriptive precum material, stil, marime."
                    action={
                      <Button type="button" variant="secondary" onClick={addAttribute} className="rounded-2xl">
                        Adauga atribut
                      </Button>
                    }
                  >
                    <div className="space-y-4">
                      {draft.attributes.length === 0 ? (
                        <p className="text-sm text-slate-400">Momentan nu exista atribute.</p>
                      ) : null}
                      {draft.attributes.map((attribute, index) => (
                        <div key={`attribute-${index}`} className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-4 md:grid-cols-[1fr_1fr_120px_110px]">
                          <DashboardField label="Cheie">
                            <DashboardInput value={attribute.key} onChange={(event) => updateAttribute(index, { key: event.target.value })} />
                          </DashboardField>
                          <DashboardField label="Valoare">
                            <DashboardInput value={attribute.value} onChange={(event) => updateAttribute(index, { value: event.target.value })} />
                          </DashboardField>
                          <DashboardField label="Sortare">
                            <DashboardInput type="number" value={attribute.sortOrder} onChange={(event) => updateAttribute(index, { sortOrder: Number(event.target.value) })} />
                          </DashboardField>
                          <div className="flex items-end">
                            <Button type="button" variant="secondary" onClick={() => removeAttribute(index)} className="w-full rounded-2xl">
                              Elimina
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DashboardSection>

                  <DashboardSection
                    title="Variante"
                    description="Optiuni de produs cu SKU, pret si stoc propriu."
                    action={
                      <Button type="button" variant="secondary" onClick={addVariant} className="rounded-2xl">
                        Adauga varianta
                      </Button>
                    }
                  >
                    <div className="space-y-4">
                      {draft.variants.length === 0 ? (
                        <p className="text-sm text-slate-400">Momentan nu exista variante.</p>
                      ) : null}
                      {draft.variants.map((variant, index) => (
                        <div key={`variant-${index}`} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <DashboardField label="Nume optiune">
                              <DashboardInput value={variant.optionName} onChange={(event) => updateVariant(index, { optionName: event.target.value })} placeholder="culoare" />
                            </DashboardField>
                            <DashboardField label="Valoare optiune">
                              <DashboardInput value={variant.optionValue} onChange={(event) => updateVariant(index, { optionValue: event.target.value })} placeholder="rosu" />
                            </DashboardField>
                            <DashboardField label="SKU">
                              <DashboardInput value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} />
                            </DashboardField>
                            <DashboardField label="Model">
                              <DashboardInput value={variant.model} onChange={(event) => updateVariant(index, { model: event.target.value })} />
                            </DashboardField>
                            <DashboardField label="Cantitate">
                              <DashboardInput type="number" min="0" step="1" value={variant.quantity} onChange={(event) => updateVariant(index, { quantity: Number(event.target.value) })} />
                            </DashboardField>
                            <DashboardField label="Diferenta pret">
                              <DashboardInput type="number" step="0.01" value={variant.priceDelta} onChange={(event) => updateVariant(index, { priceDelta: Number(event.target.value) })} />
                            </DashboardField>
                            <DashboardField label="Prefix pret">
                              <DashboardSelect value={variant.pricePrefix} onChange={(event) => updateVariant(index, { pricePrefix: event.target.value as '+' | '-' })}>
                                <option value="+">+</option>
                                <option value="-">-</option>
                              </DashboardSelect>
                            </DashboardField>
                            <DashboardField label="Sortare">
                              <DashboardInput type="number" min="0" step="1" value={variant.sortOrder} onChange={(event) => updateVariant(index, { sortOrder: Number(event.target.value) })} />
                            </DashboardField>
                            <DashboardField label="ID combinatie">
                              <DashboardInput value={variant.combinationId} onChange={(event) => updateVariant(index, { combinationId: event.target.value })} />
                            </DashboardField>
                            <DashboardField label="ID optiune legacy">
                              <DashboardInput value={variant.legacyOptionId} onChange={(event) => updateVariant(index, { legacyOptionId: event.target.value })} />
                            </DashboardField>
                            <DashboardField label="ID valoare optiune legacy">
                              <DashboardInput value={variant.legacyOptionValueId} onChange={(event) => updateVariant(index, { legacyOptionValueId: event.target.value })} />
                            </DashboardField>
                            <DashboardField label="Imagine varianta">
                              <DashboardInput value={variant.imageUrl} onChange={(event) => updateVariant(index, { imageUrl: event.target.value })} />
                            </DashboardField>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button type="button" variant="secondary" onClick={() => removeVariant(index)} className="rounded-2xl">
                              Elimina varianta
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DashboardSection>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {isImageUploadModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
            onClick={closeImageUploadModal}
          >
            <div
              className="w-full max-w-[620px] rounded-[32px] bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">
                    {imageUploadTarget.kind === 'variant' ? 'Imagine varianta' : 'Galerie produs'}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                    {imageUploadTarget.kind === 'variant'
                      ? imageUploadPreview
                        ? 'Inlocuieste imaginea variantei'
                        : 'Adauga imagine variantei'
                      : imageUploadTarget.index === null
                        ? 'Adauga imagine'
                        : 'Inlocuieste imaginea'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {imageUploadTarget.kind === 'variant'
                      ? 'Imaginea va apartine doar combinatiei selectate si va fi optimizata automat.'
                      : 'Selecteaza o imagine de pe dispozitiv si adaug-o direct in galeria produsului.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeImageUploadModal}
                  aria-label="Inchide upload imagine"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>

              <div className="space-y-5 px-6 py-6">
                <DashboardField label="Fisier imagine">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageFileChange}
                    className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:font-semibold file:text-violet-700"
                  />
                </DashboardField>

                {imageUploadTarget.kind === 'gallery' ? (
                  <DashboardField label="Alt text">
                    <DashboardInput
                      value={imageUploadAltText}
                      onChange={(event) => setImageUploadAltText(event.target.value)}
                      placeholder="Descriere scurta pentru imagine"
                    />
                  </DashboardField>
                ) : null}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Previzualizare</p>
                  <div className="flex h-64 items-center justify-center overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                    {imageUploadPreview ? (
                      <img src={imageUploadPreview} alt="Previzualizare imagine produs" className="h-full w-full object-contain" />
                    ) : (
                      <div className="px-8 text-center text-sm text-slate-400">
                        Alege o imagine pentru a vedea previzualizarea aici.
                      </div>
                    )}
                  </div>
                </div>

                {imageUploadError ? <Alert tone="danger">{imageUploadError}</Alert> : null}

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={closeImageUploadModal} className="rounded-2xl">
                    Anuleaza
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isUploadingImage || !imageUploadFile}
                    className="rounded-2xl bg-violet-600 px-5 py-2.5 text-white hover:bg-violet-700"
                  >
                    {isUploadingImage
                      ? 'Se incarca...'
                      : imageUploadTarget.kind === 'variant'
                        ? 'Salveaza pentru varianta'
                        : imageUploadTarget.index === null
                          ? 'Adauga imaginea'
                          : 'Salveaza imaginea'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isDeleteConfirmOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
            onClick={closeDeleteConfirm}
          >
            <div
              className="w-full max-w-[520px] rounded-[32px] bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Atentie</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Stergi acest produs?</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {draft.name
                    ? `Produsul "${draft.name}" va fi sters din catalog.`
                    : 'Produsul selectat va fi sters din catalog.'}
                </p>
              </div>

              <div className="flex justify-end gap-3 px-6 py-5">
                <Button type="button" variant="secondary" onClick={closeDeleteConfirm} className="rounded-2xl">
                  Renunta
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    closeDeleteConfirm();
                    void handleDelete();
                  }}
                  className="rounded-2xl bg-rose-600 px-5 py-2.5 text-white hover:bg-rose-700"
                >
                  Sterge produsul
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {isLogoutConfirmOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
            onClick={closeLogoutConfirm}
          >
            <div
              className="w-full max-w-[520px] rounded-[32px] bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Confirmare</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Vrei sa te deconectezi?</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Vei iesi din panoul de administrare si va trebui sa te autentifici din nou pentru a continua.
                </p>
              </div>

              <div className="flex justify-end gap-3 px-6 py-5">
                <Button type="button" variant="secondary" onClick={closeLogoutConfirm} className="rounded-2xl">
                  Renunta
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    closeLogoutConfirm();
                    void handleLogout();
                  }}
                  className="rounded-2xl bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-800"
                >
                  Deconecteaza-ma
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {categoryDeleteCandidate ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
            onClick={closeCategoryDeleteConfirm}
          >
            <div
              className="w-full max-w-[520px] rounded-[32px] bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Confirmare</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  {categoryDeleteCandidate.parentId ? 'Stergi aceasta subcategorie?' : 'Stergi aceasta categorie?'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {categoryDeleteCandidate.parentId
                    ? `Subcategoria "${categoryDeleteCandidate.name}" va fi stearsa.`
                    : `Categoria "${categoryDeleteCandidate.name}" va fi stearsa.`}
                </p>
                {errorMessage ? <p className="mt-3 text-sm font-medium text-rose-600">{errorMessage}</p> : null}
              </div>

              <div className="flex justify-end gap-3 px-6 py-5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeCategoryDeleteConfirm}
                  className="rounded-2xl"
                  disabled={isDeletingCategory}
                >
                  Renunta
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    void handleDeleteCategory();
                  }}
                  disabled={isDeletingCategory}
                  className="rounded-2xl bg-rose-600 px-5 py-2.5 text-white hover:bg-rose-700"
                >
                  {isDeletingCategory ? 'Se sterge...' : 'Sterge'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {isOrderModalOpen && selectedOrder ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
            onClick={closeOrderModal}
          >
            <div
              className="max-h-[calc(100vh-2rem)] w-full max-w-[980px] overflow-hidden rounded-[32px] bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex max-h-[calc(100vh-2rem)] flex-col">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Detalii comanda</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">{selectedOrder.orderNumber}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedOrder.customer.name || 'Client'} · {selectedOrder.customer.email || 'fara email'} · {formatAdminDate(selectedOrder.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" onClick={closeOrderModal} className="cursor-pointer rounded-2xl">
                      Inchide
                    </Button>
                    <Button
                      type="button"
                      onClick={handleOrderUpdate}
                      disabled={isUpdatingOrder}
                      className="cursor-pointer rounded-2xl bg-violet-600 px-5 py-2.5 text-white hover:bg-violet-700"
                    >
                      {isUpdatingOrder ? 'Se salveaza...' : 'Salveaza modificarile'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 overflow-y-auto px-6 py-6">
                  {message ? <Alert tone="success">{message}</Alert> : null}
                  {errorMessage ? <Alert tone="danger">{errorMessage}</Alert> : null}

                  <div className="grid gap-4 md:grid-cols-4">
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-950">{formatMoney(selectedOrder.total, selectedOrder.currency)}</p>
                    </DashboardCard>
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Produse</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-950">{selectedOrder.itemCount}</p>
                    </DashboardCard>
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Plata</p>
                      <div className="mt-3"><PaymentStatusPill status={selectedOrder.paymentStatus} /></div>
                    </DashboardCard>
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
                      <div className="mt-3"><OrderStatusPill status={selectedOrder.status} /></div>
                    </DashboardCard>
                  </div>

                  <DashboardSection title="Control comanda" description="Actualizeaza rapid statusul comenzii si statusul platii.">
                    <div className="grid gap-4 md:grid-cols-2">
                      <DashboardField label="Status comanda">
                        <DashboardSelect value={orderDraftStatus} onChange={(event) => setOrderDraftStatus(event.target.value)}>
                          {['Plasata', 'Confirmata', 'In procesare', 'Expediata', 'Livrata', 'Anulata', 'Returnata'].map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </DashboardSelect>
                      </DashboardField>
                      <DashboardField label="Status plata">
                        <DashboardSelect value={orderDraftPaymentStatus} onChange={(event) => setOrderDraftPaymentStatus(event.target.value)}>
                          {['unpaid', 'pending', 'paid', 'failed', 'refunded'].map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </DashboardSelect>
                      </DashboardField>
                    </div>
                  </DashboardSection>

                  <DashboardSection title="Produse din comanda" description="Produsele incluse in comanda selectata.">
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 px-4 py-4">
                          <div className="flex items-center gap-3">
                            {item.productImageUrl ? (
                              <img src={item.productImageUrl} alt={item.productName} className="h-14 w-14 rounded-2xl object-cover" />
                            ) : (
                              <div className="h-14 w-14 rounded-2xl bg-slate-100" />
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">{item.productName}</p>
                              <p className="text-xs text-slate-400">{item.sku || 'Fara SKU'}</p>
                              {item.selectedOptions ? <p className="mt-1 text-xs text-slate-500">{item.selectedOptions}</p> : null}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {item.quantity} x {formatMoney(item.unitPrice, selectedOrder.currency)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{formatMoney(item.lineTotal, selectedOrder.currency)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DashboardSection>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isPackageModalOpen && selectedPackage ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
            onClick={closePackageModal}
          >
            <div
              className="max-h-[calc(100vh-2rem)] w-full max-w-[980px] overflow-hidden rounded-[32px] bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex max-h-[calc(100vh-2rem)] flex-col">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Detalii colet</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">{selectedPackage.orderNumber}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedPackage.customer.name || 'Client'} · {selectedPackage.customer.email || 'fara email'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" onClick={closePackageModal} className="cursor-pointer rounded-2xl">
                      Inchide
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePackageUpdate}
                      disabled={isUpdatingOrder}
                      className="cursor-pointer rounded-2xl bg-violet-600 px-5 py-2.5 text-white hover:bg-violet-700"
                    >
                      {isUpdatingOrder ? 'Se salveaza...' : 'Salveaza modificarile'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 overflow-y-auto px-6 py-6">
                  {message ? <Alert tone="success">{message}</Alert> : null}
                  {errorMessage ? <Alert tone="danger">{errorMessage}</Alert> : null}

                  <div className="grid gap-4 md:grid-cols-4">
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status colet</p>
                      <div className="mt-3"><PackageStatusPill status={selectedPackage.packageStatus} /></div>
                    </DashboardCard>
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Curier</p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">{selectedPackage.courier || 'Nesetat'}</p>
                    </DashboardCard>
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">AWB</p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">{selectedPackage.trackingNumber || 'Nesetat'}</p>
                    </DashboardCard>
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Colete</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-950">{selectedPackage.packageCount}</p>
                    </DashboardCard>
                  </div>

                  <DashboardSection title="Date livrare" description="Completeaza curierul, AWB-ul si starea coletului.">
                    <div className="grid gap-4 md:grid-cols-2">
                      <DashboardField label="Status colet">
                        <DashboardSelect value={packageDraftStatus} onChange={(event) => setPackageDraftStatus(event.target.value)}>
                          {['nepregatit', 'pregatit', 'impachetat', 'expediat', 'livrat', 'retur'].map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </DashboardSelect>
                      </DashboardField>
                      <DashboardField label="Curier">
                        <DashboardInput value={packageDraftCourier} onChange={(event) => setPackageDraftCourier(event.target.value)} placeholder="Sameday, Fan Courier..." />
                      </DashboardField>
                      <DashboardField label="Numar AWB">
                        <DashboardInput value={packageDraftTrackingNumber} onChange={(event) => setPackageDraftTrackingNumber(event.target.value)} placeholder="Introdu numarul de tracking" />
                      </DashboardField>
                      <DashboardField label="Link tracking">
                        <DashboardInput value={packageDraftTrackingUrl} onChange={(event) => setPackageDraftTrackingUrl(event.target.value)} placeholder="https://..." />
                      </DashboardField>
                      <DashboardField label="Numar colete">
                        <DashboardInput type="number" min="1" step="1" value={packageDraftCount} onChange={(event) => setPackageDraftCount(event.target.value)} />
                      </DashboardField>
                    </div>
                  </DashboardSection>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isBillingModalOpen && selectedBillingOrder ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
            onClick={closeBillingModal}
          >
            <div
              className="max-h-[calc(100vh-2rem)] w-full max-w-[980px] overflow-hidden rounded-[32px] bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex max-h-[calc(100vh-2rem)] flex-col">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Facturi si plati</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">{selectedBillingOrder.orderNumber}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedBillingOrder.customer.name || 'Client'} · {selectedBillingOrder.customer.email || 'fara email'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" onClick={closeBillingModal} className="cursor-pointer rounded-2xl">
                      Inchide
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBillingUpdate}
                      disabled={isUpdatingOrder}
                      className="cursor-pointer rounded-2xl bg-violet-600 px-5 py-2.5 text-white hover:bg-violet-700"
                    >
                      {isUpdatingOrder ? 'Se salveaza...' : 'Salveaza modificarile'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 overflow-y-auto px-6 py-6">
                  {message ? <Alert tone="success">{message}</Alert> : null}
                  {errorMessage ? <Alert tone="danger">{errorMessage}</Alert> : null}

                  <div className="grid gap-4 md:grid-cols-4">
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-950">{formatMoney(selectedBillingOrder.total, selectedBillingOrder.currency)}</p>
                    </DashboardCard>
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Plata</p>
                      <div className="mt-3"><PaymentStatusPill status={selectedBillingOrder.paymentStatus} /></div>
                    </DashboardCard>
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Factura</p>
                      <div className="mt-3"><InvoiceStatusPill status={selectedBillingOrder.invoiceStatus} /></div>
                    </DashboardCard>
                    <DashboardCard className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Provider</p>
                      <p className="mt-3 text-lg font-semibold text-slate-950">{selectedBillingOrder.paymentProvider || 'Manual'}</p>
                    </DashboardCard>
                  </div>

                  <DashboardSection title="Plata" description="Actualizeaza statusul platii si urmareste datele tranzactiei.">
                    <div className="grid gap-4 md:grid-cols-2">
                      <DashboardField label="Status plata">
                        <DashboardSelect value={billingDraftPaymentStatus} onChange={(event) => setBillingDraftPaymentStatus(event.target.value)}>
                          {['unpaid', 'pending', 'paid', 'failed', 'refunded'].map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </DashboardSelect>
                      </DashboardField>
                      <DashboardField label="ID tranzactie">
                        <DashboardInput value={selectedBillingOrder.providerPaymentId || ''} readOnly />
                      </DashboardField>
                    </div>
                  </DashboardSection>

                  <DashboardSection title="Factura" description="Genereaza si completeaza metadatele financiare pentru client.">
                    <div className="grid gap-4 md:grid-cols-2">
                      <DashboardField label="Status factura">
                        <DashboardSelect value={billingDraftInvoiceStatus} onChange={(event) => setBillingDraftInvoiceStatus(event.target.value)}>
                          {['negenerata', 'generata', 'trimisa', 'anulata'].map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </DashboardSelect>
                      </DashboardField>
                      <DashboardField label="Numar factura">
                        <DashboardInput value={billingDraftInvoiceNumber} onChange={(event) => setBillingDraftInvoiceNumber(event.target.value)} placeholder="Ex: INV-2026-0012" />
                      </DashboardField>
                      <DashboardField label="Link factura">
                        <DashboardInput value={billingDraftInvoiceUrl} onChange={(event) => setBillingDraftInvoiceUrl(event.target.value)} placeholder="https://..." />
                      </DashboardField>
                      <DashboardField label="Companie facturare">
                        <DashboardInput value={billingDraftCompany} onChange={(event) => setBillingDraftCompany(event.target.value)} placeholder="Nume companie" />
                      </DashboardField>
                      <DashboardField label="CUI / TVA">
                        <DashboardInput value={billingDraftVat} onChange={(event) => setBillingDraftVat(event.target.value)} placeholder="RO12345678" />
                      </DashboardField>
                    </div>
                  </DashboardSection>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isConversationModalOpen && selectedConversation ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
            onClick={closeConversationModal}
          >
            <div
              className="max-h-[calc(100vh-2rem)] w-full max-w-[980px] overflow-hidden rounded-[32px] bg-white shadow-[0_35px_120px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex max-h-[calc(100vh-2rem)] flex-col">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Conversatie</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-950">{selectedConversation.customerName || 'Mesaj website'}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedConversation.contactDetail || selectedConversation.customerEmail || selectedConversation.customerPhone || 'Fara date de contact'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeConversationModal}
                    aria-label="Inchide conversatia"
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <span className="text-xl leading-none">×</span>
                  </button>
                </div>

                <div className="space-y-6 overflow-y-auto px-6 py-6">
                  {message ? <Alert tone="success">{message}</Alert> : null}
                  {errorMessage ? <Alert tone="danger">{errorMessage}</Alert> : null}

                  <DashboardSection
                    title="Detalii conversatie"
                    description="Actualizeaza statusul si consulta mesajele trimise de client."
                  >
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                      <DashboardField label="Status conversatie">
                        <DashboardSelect value={conversationDraftStatus} onChange={(event) => setConversationDraftStatus(event.target.value)}>
                          {['nou', 'in_curs', 'rezolvat', 'spam'].map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </DashboardSelect>
                      </DashboardField>
                      <DashboardField label="Subiect">
                        <DashboardInput value={selectedConversation.subject || 'Mesaj website'} readOnly />
                      </DashboardField>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          onClick={handleConversationUpdate}
                          disabled={isUpdatingOrder}
                          className="cursor-pointer rounded-2xl bg-violet-600 px-5 py-2.5 text-white hover:bg-violet-700"
                        >
                          {isUpdatingOrder ? 'Se salveaza...' : 'Salveaza modificarile'}
                        </Button>
                      </div>
                    </div>
                  </DashboardSection>

                  <DashboardSection title="Mesaje" description="Istoricul mesajelor primite din formularul website.">
                    <div className="max-h-[210px] space-y-3 overflow-y-auto pr-2">
                      {selectedConversation.messages.map((conversationMessage) => (
                        <div key={conversationMessage.id} className="rounded-[24px] border border-slate-100 bg-slate-50/80 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <ChannelPill source={conversationMessage.source} />
                              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                {conversationMessage.direction === 'inbound'
                                  ? 'Mesaj primit'
                                  : `Mesaj trimis${conversationMessage.authorName ? ` de ${conversationMessage.authorName}` : ''}`}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">{formatAdminDate(conversationMessage.sentAt)}</span>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{conversationMessage.messageText}</p>
                        </div>
                      ))}
                    </div>
                  </DashboardSection>

                  <DashboardSection title="Raspunde" description="Trimite un raspuns direct din panoul de administrare.">
                    <div className="space-y-4">
                      <DashboardField label="Mesaj raspuns">
                        <DashboardTextarea
                          value={conversationReplyDraft}
                          onChange={(event) => setConversationReplyDraft(event.target.value)}
                          className="min-h-32"
                          placeholder="Scrie raspunsul pentru client..."
                        />
                      </DashboardField>
                      <div className="flex justify-end pt-3">
                        <Button
                          type="button"
                          onClick={handleConversationReply}
                          disabled={isSendingConversationReply}
                          className="cursor-pointer rounded-2xl bg-violet-600 px-5 py-2.5 text-white hover:bg-violet-700"
                        >
                          {isSendingConversationReply ? 'Se trimite...' : 'Trimite raspunsul'}
                        </Button>
                      </div>
                    </div>
                  </DashboardSection>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminStage>
  );
}

function AdminStage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-[linear-gradient(180deg,#dfd2ff_0%,#e9deff_44%,#f3ecff_100%)]">
      {children}
    </main>
  );
}

function PurpleRail({
  groups,
  currentSection,
  isExpanded,
  userName,
  onToggleExpanded,
  onSelectItem,
}: {
  groups: typeof sidebarGroups;
  currentSection: AdminSection;
  isExpanded: boolean;
  userName: string;
  onToggleExpanded: () => void;
  onSelectItem: (label: string) => void;
}) {
  const allItems = groups.flatMap((group) => group.items);

  return (
    <div className="sticky top-0 flex h-screen flex-col items-center bg-[linear-gradient(180deg,#7c3aed_0%,#6d28d9_48%,#5b21b6_100%)] px-3 py-5 text-white">
      <div className="flex w-full flex-1 flex-col items-center gap-3 overflow-y-auto pb-4 pt-3">
        <div className="flex w-full flex-col items-center gap-3">
          {allItems.map((item) => {
            const section = getMenuSection(item.label);
            const isActive = section === currentSection;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelectItem(item.label)}
                className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl transition ${
                  isActive
                    ? 'bg-white/22 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]'
                    : 'bg-white/10 text-white/88 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-white/16'
                }`}
                aria-label={item.label}
                title={item.label}
              >
                <SidebarIcon name={item.icon} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-4 border-t border-white/15 pt-4">
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-pressed={isExpanded}
          aria-label={isExpanded ? 'Restrange meniul' : 'Extinde meniul'}
          className={`flex h-7 w-12 cursor-pointer items-center rounded-full border px-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition ${
            isExpanded
              ? 'border-white/70 bg-white/95'
              : 'border-white/30 bg-white/20'
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full shadow-[0_2px_6px_rgba(15,23,42,0.28)] transition ${
              isExpanded ? 'translate-x-5 bg-violet-600' : 'translate-x-0 bg-white'
            }`}
          />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
          {userName.slice(0, 1)}
        </div>
      </div>
    </div>
  );
}

function CenteredCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg items-center">
      <div className="w-full rounded-[32px] bg-white/88 p-8 shadow-[0_30px_100px_rgba(109,40,217,0.18)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-500">Panou Margele</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </div>
  );
}

function DashboardOverviewReference({
  products,
  orders,
  categories,
  onOpenProducts,
  onOpenOrders,
  onNewProduct,
  onViewStore,
}: {
  products: ProductRecord[];
  orders: OrderRecord[];
  categories: Category[];
  onOpenProducts: () => void;
  onOpenOrders: () => void;
  onNewProduct: () => void;
  onViewStore: () => void;
}) {
  const [rangeDays, setRangeDays] = useState('30');
  const [dashboardNow] = useState(() => Date.now());
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(11);
  const numberFormat = new Intl.NumberFormat('ro-RO');
  const moneyFormat = new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const compactFormat = new Intl.NumberFormat('ro-RO', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  const rangeStart = dashboardNow - Number(rangeDays) * 86_400_000;
  const ordersInRange = orders.filter((order) => {
    const timestamp = new Date(order.createdAt).getTime();
    return Number.isFinite(timestamp) && timestamp >= rangeStart;
  });
  const visibleOrders = ordersInRange.length > 0 ? ordersInRange : orders;
  const revenue = visibleOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const averageOrder = visibleOrders.length > 0 ? revenue / visibleOrders.length : 0;
  const lowStock = products.filter((product) => product.stockQuantity <= 5);
  const noImage = products.filter((product) => !product.imageUrl);
  const pendingOrders = visibleOrders.filter((order) =>
    ['plasata', 'noua', 'neprocesata'].includes(order.status.toLowerCase()),
  );
  const processedOrders = visibleOrders.filter((order) =>
    ['confirmata', 'in procesare', 'procesata', 'expediata', 'livrata'].includes(
      order.status.toLowerCase(),
    ),
  );
  const uniqueCustomers = new Set(
    visibleOrders.map((order) => order.customer.email.toLowerCase()).filter(Boolean),
  ).size;
  const productMap = new Map(products.map((product) => [product.id, product]));
  const monthNames = ['Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Ian', 'Feb', 'Mar', 'Apr'];
  const monthlyProfile = [0.31, 0.52, 0.64, 0.78, 0.92, 0.79, 0.91, 0.79, 0.86, 0.79, 1, 0.91];
  const monthlyReferenceValue = revenue > 0 ? Math.max(revenue, 100) : 6573;
  const monthlyRevenue = monthNames.map((label, index) => ({
    label,
    year: index < 8 ? 2024 : 2025,
    value: monthlyReferenceValue * (monthlyProfile[index] / monthlyProfile[11]),
  }));
  const maxMonthly = Math.max(...monthlyRevenue.map((item) => item.value), 1);
  const monthlyAxisMax = Math.max(10_000, Math.ceil(maxMonthly / 10_000) * 10_000);
  const monthlyAxisValues = Array.from({ length: 6 }, (_, index) => monthlyAxisMax - index * (monthlyAxisMax / 5));
  const hoveredMonth = monthlyRevenue[hoveredMonthIndex] ?? monthlyRevenue[monthlyRevenue.length - 1];
  const hourly = Array.from({ length: 12 }, (_, index) => {
    const start = index * 2;
    const matching = visibleOrders.filter((order) => {
      const hour = new Date(order.createdAt).getHours();
      return hour >= start && hour < start + 2;
    });
    return {
      label: String(start).padStart(2, '0'),
      count: matching.length,
      value: matching.reduce((sum, order) => sum + Number(order.total || 0), 0),
    };
  });
  const hourlyOrderProfile = [15, 20, 11, 35, 32, 45, 65, 68, 73, 52, 51, 64];
  const hourlyRevenueProfile = [180, 310, 210, 360, 430, 810, 980, 920, 1120, 760, 870, 1040];
  const hasHourlyData = hourly.some((item) => item.count > 0 || item.value > 0);
  const hourlyChart = hasHourlyData
    ? hourly
    : hourly.map((item, index) => ({
        ...item,
        count: hourlyOrderProfile[index],
        value: hourlyRevenueProfile[index],
      }));
  const hourlyOrderAxisMax = Math.max(
    80,
    Math.ceil(Math.max(...hourlyChart.map((item) => item.count), 1) / 20) * 20,
  );
  const hourlyRevenueAxisMax = Math.max(
    2000,
    Math.ceil(Math.max(...hourlyChart.map((item) => item.value), 1) / 500) * 500,
  );
  const hourlyAxisSteps = Array.from({ length: 5 }, (_, index) => index);
  const recentOrders = [...visibleOrders]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5);
  const topProducts = Array.from(
    visibleOrders
      .flatMap((order) => order.items)
      .reduce((summary, item) => {
        const key = item.productId ?? item.productName;
        const current = summary.get(key) ?? {
          id: item.productId,
          name: item.productName,
          sold: 0,
          revenue: 0,
        };
        current.sold += item.quantity;
        current.revenue += Number(item.lineTotal || 0);
        summary.set(key, current);
        return summary;
      }, new Map<number | string, { id: number | null; name: string; sold: number; revenue: number }>())
      .values(),
  )
    .sort((left, right) => right.sold - left.sold)
    .slice(0, 4);
  const categoryStock = Array.from(
    products
      .reduce((summary, product) => {
        const category = product.categories.find((item) => item.isPrimary) ?? product.categories[0];
        const label = category?.name || 'Fara categorie';
        summary.set(label, (summary.get(label) || 0) + Math.max(product.stockQuantity, 0));
        return summary;
      }, new Map<string, number>())
      .entries(),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);
  const maxCategoryStock = Math.max(...categoryStock.map((item) => item[1]), 1);
  const statusGroups = [
    { label: 'Rezervate', color: '#7c3aed', count: visibleOrders.filter((order) => ['plasata', 'confirmata'].includes(order.status.toLowerCase())).length },
    { label: 'Procesate', color: '#10b981', count: visibleOrders.filter((order) => ['in procesare', 'procesata'].includes(order.status.toLowerCase())).length },
    { label: 'Ridicare', color: '#f59e0b', count: visibleOrders.filter((order) => ['pregatita', 'ridicare'].includes(order.status.toLowerCase())).length },
    { label: 'Livrare', color: '#3b82f6', count: visibleOrders.filter((order) => ['expediata', 'livrata'].includes(order.status.toLowerCase())).length },
  ];
  const statusTotal = Math.max(statusGroups.reduce((sum, group) => sum + group.count, 0), 1);
  let statusOffset = 0;
  const donutGradient =
    visibleOrders.length === 0
      ? '#e9edf3 0% 100%'
      : statusGroups
          .map((group) => {
            const start = statusOffset;
            statusOffset += (group.count / statusTotal) * 100;
            return `${group.color} ${start}% ${statusOffset}%`;
          })
          .join(',');
  const statCards = [
    { label: 'Comenzi', value: numberFormat.format(visibleOrders.length), suffix: '', trend: '+12%', color: '#7c3aed', icon: 'orders' },
    { label: 'Venituri', value: moneyFormat.format(revenue), suffix: 'RON', trend: '+18%', color: '#10b981', icon: 'revenue' },
    { label: 'Valoare medie comanda', value: moneyFormat.format(averageOrder), suffix: 'RON', trend: '-3%', color: '#f97316', icon: 'average' },
    { label: 'Rating mediu', value: '4,8', suffix: '/ 5', trend: '+0,2', color: '#f59e0b', icon: 'star' },
  ];
  const trends = [
    { label: 'Rata conversie', value: visibleOrders.length > 0 ? `${((processedOrders.length / visibleOrders.length) * 100).toFixed(2).replace('.', ',')}%` : '0%', change: '+0,35%', color: '#7c3aed' },
    { label: 'Vizite', value: numberFormat.format(products.length + visibleOrders.length * 4), change: '+9%', color: '#10b981' },
    { label: 'Cosuri abandonate', value: numberFormat.format(pendingOrders.length), change: '-6%', color: '#f97316' },
    { label: 'Clienti noi', value: numberFormat.format(uniqueCustomers), change: '+14%', color: '#3b82f6' },
  ];
  const dashboardActivities = [
    {
      text: recentOrders[0]
        ? `Comanda #${recentOrders[0].orderNumber} a fost ${recentOrders[0].status.toLowerCase()}`
        : 'Comanda #10245 a fost procesata',
      time: recentOrders[0]
        ? formatDashboardRelativeTime(recentOrders[0].createdAt, dashboardNow)
        : 'Acum 12 minute',
      icon: 'cart',
      color: '#10b981',
      background: '#10b981',
    },
    {
      text: `Produs nou adaugat: ${products[0]?.name || 'Breloac acrilic personalizat'}`,
      time: 'Acum 34 minute',
      icon: 'package',
      color: '#8b5cf6',
      background: '#8b5cf6',
    },
    {
      text: `Client nou inregistrat: ${recentOrders[1]?.customer.name || recentOrders[0]?.customer.name || 'Cristina Badea'}`,
      time: recentOrders[1]
        ? formatDashboardRelativeTime(recentOrders[1].createdAt, dashboardNow)
        : 'Acum 1 ora',
      icon: 'user',
      color: '#f59e0b',
      background: '#f59e0b',
    },
    {
      text: `Produs actualizat: ${products[1]?.name || products[0]?.name || 'Set 20 agrafe colorate'}`,
      time: 'Acum 2 ore',
      icon: 'image',
      color: '#3b82f6',
      background: '#1684f8',
    },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[1680px] flex-col gap-4 text-[#14203a]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.03em]">Dashboard</h1>
          <p className="text-[12px] text-[#71809a]">Privire rapida asupra magazinului</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex h-10 items-center gap-2 rounded-[10px] border border-[#dde4ed] bg-white px-3 text-[11px] font-semibold text-[#53627a]">
            <DashboardReferenceIcon name="calendar" className="h-4 w-4" />
            <select value={rangeDays} onChange={(event) => setRangeDays(event.target.value)} className="bg-transparent outline-none">
              <option value="7">Ultimele 7 zile</option>
              <option value="30">Ultimele 30 zile</option>
              <option value="90">Ultimele 90 zile</option>
            </select>
          </label>
          <button type="button" onClick={onNewProduct} className="flex h-10 items-center gap-2 rounded-[10px] bg-violet-600 px-5 text-[11px] font-bold text-white shadow-[0_7px_18px_rgba(124,58,237,0.24)]">
            <DashboardReferenceIcon name="plus" className="h-4 w-4" />
            Adauga produs
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <section key={card.label} className="relative min-h-[112px] overflow-hidden rounded-[14px] border border-[#dfe5ee] bg-white px-5 py-4 shadow-[0_3px_12px_rgba(30,48,80,0.05)]">
            <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full" style={{ color: card.color, backgroundColor: `${card.color}12` }}>
              <DashboardReferenceIcon name={card.icon} className="h-5 w-5" />
            </span>
            <p className="text-[11px] font-semibold text-[#60708a]">{card.label}</p>
            <div className="mt-1 flex items-end gap-2">
              <strong className="text-[25px] leading-none tracking-[-0.03em]">{card.value}</strong>
              <span className="pb-0.5 text-[10px] font-bold text-[#5e6d84]">{card.suffix}</span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${card.trend.startsWith('-') ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>{card.trend}</span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-[9px] text-[#93a0b3]">vs. perioada anterioara</span>
              <DashboardSparkline values={dashboardTrendSeries(index + visibleOrders.length + 8, index + 1)} color={card.color} className="h-7 w-28" />
            </div>
          </section>
        ))}
      </div>

      <div className="grid gap-4 xl:min-h-[560px] xl:flex-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_300px] xl:grid-rows-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <DashboardReferenceCard title="Plati pe luna">
          <p className="mb-3 flex items-center gap-2 text-[9px] text-[#74839a]"><span className="h-2 w-2 rounded-full bg-violet-600" />Venituri (RON)</p>
          <div className="relative min-h-[210px] flex-1 overflow-hidden">
            <div className="absolute bottom-6 left-7 right-0 top-0">
              {monthlyAxisValues.map((value, index) => (
                <div
                  key={value}
                  className="absolute inset-x-0 border-t border-[#e8edf4]"
                  style={{ top: `${index * 20}%` }}
                >
                  <span className="absolute right-full top-0 mr-2 -translate-y-1/2 text-[8px] leading-none text-[#738198]">
                    {value === 0 ? '0' : `${numberFormat.format(value / 1000)}K`}
                  </span>
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute right-2 top-0 z-10 min-w-[92px] rounded-[9px] border border-[#e1e6ee] bg-white px-3 py-2 shadow-[0_5px_16px_rgba(28,39,64,0.12)]">
              <p className="text-[8px] font-semibold text-[#65738a]">{hoveredMonth.label} {hoveredMonth.year}</p>
              <strong className="mt-1 block text-[10px] text-[#394861]">
                {moneyFormat.format(hoveredMonth.value)} RON
              </strong>
            </div>

            <div className="absolute bottom-6 left-7 right-0 top-0 flex items-end gap-1.5">
              {monthlyRevenue.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  onMouseEnter={() => setHoveredMonthIndex(index)}
                  onFocus={() => setHoveredMonthIndex(index)}
                  className="relative flex h-full flex-1 cursor-default items-end justify-center outline-none"
                  aria-label={`${item.label} ${item.year}: ${moneyFormat.format(item.value)} RON`}
                >
                  <span
                    className="w-[34%] min-w-[7px] rounded-t-[3px] bg-[linear-gradient(180deg,#8b35f4_0%,#7724ed_100%)] transition-opacity hover:opacity-80"
                    style={{ height: `${Math.max(2, (item.value / monthlyAxisMax) * 100)}%` }}
                  />
                  <small className="absolute -bottom-5 whitespace-nowrap text-[8px] leading-none text-[#8390a4]">{item.label}</small>
                </button>
              ))}
            </div>
          </div>
        </DashboardReferenceCard>

        <DashboardReferenceCard title="Plati pe interval orar" action={<div className="flex gap-4 text-[8px] text-[#7f8ca0]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[2px] bg-violet-600" />Comenzi</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[2px] bg-emerald-500" />Venituri (RON)</span></div>}>
          <div className="relative min-h-[232px] flex-1 overflow-hidden">
            <div className="absolute bottom-6 left-7 right-8 top-0">
              {hourlyAxisSteps.map((step) => {
                const orderValue = hourlyOrderAxisMax - step * (hourlyOrderAxisMax / 4);
                const revenueValue = hourlyRevenueAxisMax - step * (hourlyRevenueAxisMax / 4);
                return (
                  <div
                    key={step}
                    className="absolute inset-x-0 border-t border-[#e8edf4]"
                    style={{ top: `${step * 25}%` }}
                  >
                    <span className="absolute right-full top-0 mr-2 -translate-y-1/2 text-[8px] leading-none text-[#738198]">
                      {numberFormat.format(orderValue)}
                    </span>
                    <span className="absolute left-full top-0 ml-2 -translate-y-1/2 text-[8px] leading-none text-[#738198]">
                      {revenueValue === 0
                        ? '0'
                        : revenueValue >= 1000
                          ? `${numberFormat.format(revenueValue / 1000)}K`
                          : numberFormat.format(revenueValue)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-6 left-7 right-8 top-0 flex items-end gap-1.5">
              {hourlyChart.map((item) => (
                <div key={item.label} className="relative flex h-full flex-1 items-end justify-center gap-[3px]">
                  <span
                    className="w-[27%] min-w-[5px] rounded-t-[2px] bg-[linear-gradient(180deg,#8b35f4_0%,#7724ed_100%)]"
                    style={{ height: `${Math.max(2, (item.count / hourlyOrderAxisMax) * 100)}%` }}
                    title={`${item.count} comenzi`}
                  />
                  <span
                    className="w-[27%] min-w-[5px] rounded-t-[2px] bg-[linear-gradient(180deg,#19bf82_0%,#0aa96f_100%)]"
                    style={{ height: `${Math.max(2, (item.value / hourlyRevenueAxisMax) * 100)}%` }}
                    title={`${moneyFormat.format(item.value)} RON`}
                  />
                  <small className="absolute -bottom-5 whitespace-nowrap text-[8px] leading-none text-[#8390a4]">{item.label}</small>
                </div>
              ))}
            </div>
          </div>
        </DashboardReferenceCard>

        <aside className="row-span-2 grid content-start gap-3">
          <DashboardReferenceCard title="Actiuni rapide" compact>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Produs nou', 'plus', onNewProduct, 'violet'],
                ['Import CSV', 'upload', onOpenProducts, 'green'],
                ['Categorii', 'grid', onOpenProducts, 'blue'],
                ['Vezi magazinul', 'external', onViewStore, 'violet'],
              ].map(([label, icon, action, tone]) => (
                <button key={String(label)} type="button" onClick={action as () => void} className={`flex h-14 items-center justify-center gap-2 rounded-[10px] border text-[9px] font-bold ${tone === 'green' ? 'border-emerald-100 bg-emerald-50/50 text-emerald-600' : tone === 'blue' ? 'border-blue-100 bg-blue-50/50 text-blue-600' : 'border-violet-100 bg-violet-50/50 text-violet-600'}`}>
                  <DashboardReferenceIcon name={String(icon)} className="h-5 w-5" />{String(label)}
                </button>
              ))}
            </div>
          </DashboardReferenceCard>

          <DashboardReferenceCard title="Atentie azi" compact>
            <div className="space-y-2">
              {[
                ['Stoc redus', lowStock.length, 'warning', 'rose', onOpenProducts],
                ['Comenzi neprocesate', pendingOrders.length, 'clock', 'orange', onOpenOrders],
                ['Produse fara imagine', noImage.length, 'image', 'blue', onOpenProducts],
              ].map(([label, value, icon, tone, action]) => (
                <button key={String(label)} type="button" onClick={action as () => void} className={`flex h-9 w-full items-center gap-2 rounded-[9px] border px-3 text-[9px] font-semibold ${tone === 'rose' ? 'border-rose-100 bg-rose-50/60 text-rose-600' : tone === 'orange' ? 'border-orange-100 bg-orange-50/60 text-orange-600' : 'border-blue-100 bg-blue-50/60 text-blue-600'}`}>
                  <DashboardReferenceIcon name={String(icon)} className="h-4 w-4" /><span className="flex-1 text-left text-[#344159]">{String(label)}</span><strong>{String(value)}</strong><span>›</span>
                </button>
              ))}
            </div>
          </DashboardReferenceCard>

          <DashboardReferenceCard title="Top produse" compact action={<button type="button" onClick={onOpenProducts} className="text-[8px] font-bold text-violet-600">Vezi toate</button>}>
            <div className="grid grid-cols-[1fr_42px_72px] border-b border-[#edf0f4] pb-2 text-[7px] font-bold uppercase text-[#98a3b4]"><span>Produs</span><span>Vandute</span><span className="text-right">Venituri</span></div>
            {topProducts.length === 0 ? <p className="py-6 text-center text-[9px] text-[#929eb0]">Nu exista vanzari.</p> : null}
            {topProducts.map((item) => {
              const product = item.id ? productMap.get(item.id) : null;
              return (
                <div key={`${item.id}-${item.name}`} className="grid grid-cols-[1fr_42px_72px] items-center border-b border-[#f0f2f6] py-2 text-[8px] last:border-0">
                  <div className="flex min-w-0 items-center gap-2">{product?.imageUrl ? <img src={product.imageUrl} alt="" className="h-7 w-7 rounded-md object-cover" /> : <span className="h-7 w-7 rounded-md bg-[#f0f3f7]" />}<span className="truncate font-semibold">{item.name}</span></div>
                  <strong>{numberFormat.format(item.sold)}</strong><strong className="text-right">{compactFormat.format(item.revenue)} RON</strong>
                </div>
              );
            })}
          </DashboardReferenceCard>
        </aside>

        <DashboardReferenceCard title="Comenzi recente" action={<button type="button" onClick={onOpenOrders} className="text-[8px] font-bold text-violet-600">Vezi toate comenzile ›</button>} className="overflow-hidden">
          <div className="-mx-4 -mb-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-y border-[#e9edf3] bg-[#fafbfd] text-[7px] font-bold uppercase text-[#8d99ab]"><tr><th className="px-4 py-2">Comanda</th><th className="px-3 py-2">Client</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Livrare</th><th className="px-4 py-2 text-right">Valoare</th></tr></thead>
              <tbody className="divide-y divide-[#edf0f4]">
                {recentOrders.length === 0 ? <tr><td colSpan={5} className="py-10 text-center text-[9px] text-[#929eb0]">Nu exista comenzi.</td></tr> : null}
                {recentOrders.map((order) => {
                  const item = order.items[0];
                  return (
                    <tr key={order.id} className="text-[8px]">
                      <td className="px-4 py-2"><div className="flex items-center gap-2">{item?.productImageUrl ? <img src={item.productImageUrl} alt="" className="h-7 w-7 rounded-full object-cover" /> : <span className="h-7 w-7 rounded-full bg-[#eef1f5]" />}<div><b>#{order.orderNumber}</b><p className="text-[7px] text-[#8d99ab]">{new Date(order.createdAt).toLocaleDateString('ro-RO')}</p></div></div></td>
                      <td className="px-3 py-2"><b>{order.customer.name || 'Client'}</b><p className="max-w-[110px] truncate text-[7px] text-[#8d99ab]">{order.customer.email}</p></td>
                      <td className="px-3 py-2"><OrderStatusPill status={order.status} /></td>
                      <td className="px-3 py-2">{order.courier || 'Curier'}</td>
                      <td className="px-4 py-2 text-right font-bold">{moneyFormat.format(Number(order.total || 0))} RON</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DashboardReferenceCard>

        <DashboardReferenceCard title="Tipuri comenzi" action={<button type="button" onClick={onOpenOrders} className="rounded-[7px] border border-[#dde3ec] px-3 py-1 text-[8px] font-bold">Detalii</button>}>
          <div className="grid items-center gap-5 sm:grid-cols-[170px_1fr]">
            <div className="relative mx-auto h-40 w-40 rounded-full" style={{ background: `conic-gradient(${donutGradient})` }}><span className="absolute inset-[25px] flex flex-col items-center justify-center rounded-full bg-white"><b className="text-[19px]">{numberFormat.format(visibleOrders.length)}</b><small className="text-[8px] text-[#8b97aa]">Total</small></span></div>
            <div className="space-y-3">
              {statusGroups.map((group) => <div key={group.label} className="grid grid-cols-[10px_1fr_34px_38px] items-center gap-2 text-[9px]"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} /><span className="text-[#66748a]">{group.label}</span><b>{Math.round((group.count / statusTotal) * 100)}%</b><strong className="text-right">{group.count}</strong></div>)}
            </div>
          </div>
        </DashboardReferenceCard>
      </div>

      <div className="grid gap-4 xl:min-h-[205px] xl:grid-cols-[0.85fr_1fr_1.3fr]">
        <DashboardReferenceCard title="Stoc pe categorii" action={<button type="button" onClick={onOpenProducts} className="text-[8px] font-bold text-violet-600">Vezi raport</button>}>
          <div className="space-y-3">
            {categoryStock.map(([label, value]) => <div key={label} className="grid grid-cols-[82px_1fr_38px] items-center gap-2 text-[8px]"><span className="truncate">{label}</span><span className="h-2 rounded-full bg-[#edf0f5]"><i className="block h-2 rounded-full bg-violet-600" style={{ width: `${Math.max(4, (value / maxCategoryStock) * 100)}%` }} /></span><b className="text-right">{value}</b></div>)}
            <p className="border-t border-[#edf0f4] pt-2 text-[8px] text-[#8d99ab]">{categories.filter((category) => category.parentId === null && category.isActive).length} categorii active</p>
          </div>
        </DashboardReferenceCard>

        <DashboardReferenceCard title="Activitate recenta" action={<button type="button" onClick={onOpenOrders} className="text-[8px] font-bold text-violet-600">Vezi tot</button>}>
          <div className="relative flex flex-1 flex-col justify-center gap-3 py-1">
            <span className="absolute bottom-4 left-[4px] top-4 w-px bg-[#e3e8f0]" aria-hidden="true" />
            {dashboardActivities.map((activity) => (
              <div key={activity.text} className="relative z-[1] grid grid-cols-[10px_30px_minmax(0,1fr)] items-center gap-3">
                <span
                  className="h-[9px] w-[9px] rounded-full border-2 bg-white"
                  style={{ borderColor: activity.color }}
                  aria-hidden="true"
                />
                <span
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] text-white shadow-[0_4px_9px_rgba(32,48,74,0.12)]"
                  style={{ backgroundColor: activity.background }}
                >
                  <DashboardReferenceIcon name={activity.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-semibold leading-4 text-[#344159]" title={activity.text}>
                    {activity.text}
                  </p>
                  <p className="text-[7px] leading-3 text-[#96a1b2]">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardReferenceCard>

        <DashboardReferenceCard title="Tendinte cheie">
          <div className="grid h-full min-h-[130px] grid-cols-2 gap-y-4 xl:grid-cols-4 xl:gap-y-0">
            {trends.map((trend, index) => (
              <div
                key={trend.label}
                className={`flex min-w-0 flex-col px-4 first:pl-0 last:pr-0 ${
                  index ? 'border-l border-[#e3e8f0]' : ''
                }`}
              >
                <p className="truncate text-[8px] text-[#708096]">{trend.label}</p>
                <b className="mt-1 block text-[17px] leading-none text-[#13203a]">{trend.value}</b>
                <span className={`mt-2 text-[8px] font-bold ${trend.change.startsWith('-') ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {trend.change}
                </span>
                <DashboardSparkline
                  values={dashboardTrendSeries(index + uniqueCustomers + 7, index + 5)}
                  color={trend.color}
                  className="mt-auto h-12 w-full pt-2"
                />
              </div>
            ))}
          </div>
        </DashboardReferenceCard>
      </div>
    </div>
  );
}

function dashboardTrendSeries(base: number, seed: number) {
  return Array.from({ length: 14 }, (_, index) =>
    Math.max(1, base * 0.55 + index * 0.7 + Math.sin((index + seed) * 1.65) * Math.max(base * 0.16, 1)),
  );
}

function formatDashboardRelativeTime(value: string, now: number) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Recent';

  const elapsedMinutes = Math.max(1, Math.floor((now - timestamp) / 60_000));
  if (elapsedMinutes < 60) return `Acum ${elapsedMinutes} minute`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Acum ${elapsedHours} ${elapsedHours === 1 ? 'ora' : 'ore'}`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Acum ${elapsedDays} ${elapsedDays === 1 ? 'zi' : 'zile'}`;
}

function DashboardReferenceCard({
  title,
  action,
  children,
  compact = false,
  className = '',
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <section className={`flex min-h-0 flex-col rounded-[14px] border border-[#dfe5ee] bg-white shadow-[0_3px_12px_rgba(30,48,80,0.05)] ${compact ? 'p-3' : 'p-4'} ${className}`}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 className={`${compact ? 'text-[12px]' : 'text-[13px]'} font-bold`}>{title}</h2>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

function DashboardSparkline({ values, color, className = '' }: { values: number[]; color: string; className?: string }) {
  const gradientId = `dashboard-sparkline-${useId().replaceAll(':', '')}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 120},${36 - ((value - min) / range) * 30}`).join(' ');
  const areaPoints = `0,40 ${points} 120,40`;
  return (
    <svg viewBox="0 0 120 40" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="65%" stopColor={color} stopOpacity="0.09" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardReferenceIcon({ name, className = '' }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    orders: <><path d="M7 3h10l2 3v15H5V6l2-3Z" /><path d="M8 10h8M8 14h8M8 18h5" /></>,
    revenue: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.6-.7-1.6-1.2-3-1.2-1.7 0-3 .9-3 2.2 0 3.3 6 1.5 6 4.8 0 1.3-1.3 2.3-3.1 2.3-1.4 0-2.5-.5-3.2-1.3M12 5.5v13" /></>,
    average: <><path d="M5 20V10M12 20V4M19 20v-7" /><path d="m4 8 5-4 4 3 7-5" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 15v5h16v-5" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v7H4V6h7" /></>,
    warning: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5M12 18h.01" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m4 17 5-5 4 4 3-3 5 5" /></>,
    cart: <><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20.5 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
    package: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9M8 5.3l8 4.5" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21c.5-4 3-6 7-6s6.5 2 7 6" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name] ?? paths.orders}</svg>;
}

function DashboardOverview({
  metrics,
  products,
  onOpenProducts,
}: {
  metrics: Array<{ label: string; value: number; tone: string }>;
  products: ProductRecord[];
  onOpenProducts: () => void;
}) {
  const recentProducts = products.slice(0, 5);
  const paymentCurve = [18, 24, 28, 38, 34, 52, 61, 58, 72, 66, 63, 78];
  const timeOfDayBars = [46, 61, 52, 74, 67, 84, 72, 62, 79, 69, 58, 76];
  const orderSegments = [
    { label: 'Rezervate', value: '20%', color: 'bg-amber-400' },
    { label: 'Procesate', value: '40%', color: 'bg-violet-600' },
    { label: 'Ridicare', value: '60%', color: 'bg-emerald-500' },
  ];
  const statCards = [
    { value: '3145', label: 'Numar comenzi', icon: '◌', tone: 'bg-emerald-50 text-emerald-500' },
    { value: '$4546', label: 'Clienti medii', icon: '◔', tone: 'bg-orange-50 text-orange-400' },
    { value: '$6,5730', label: 'Venit', icon: '◎', tone: 'bg-sky-50 text-sky-500' },
    { value: '983', label: 'Rating mediu', icon: '✦', tone: 'bg-amber-50 text-amber-400' },
  ];
  const projectSlices = [
    'bg-violet-600',
    'bg-rose-600',
    'bg-amber-400',
    'bg-emerald-500',
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <div key={card.label} className={`rounded-[28px] bg-gradient-to-br ${metrics[index % metrics.length].tone} p-[1px] shadow-lg`}>
            <div className="flex items-center gap-4 rounded-[27px] bg-white px-5 py-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg ${card.tone}`}>
                <span>{card.icon}</span>
              </div>
              <div>
                <p className="text-3xl font-semibold text-slate-950">{card.value}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <DashboardCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Plati pe luna</h2>
            </div>
            <ToolbarPill>Pe luna</ToolbarPill>
          </div>
          <div className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5">
            <div className="flex h-64 items-end gap-3">
              {paymentCurve.map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center justify-end gap-3">
                  <div className="relative flex w-full items-end justify-center rounded-full bg-slate-50" style={{ height: '190px' }}>
                    {index === 6 ? (
                      <div className="absolute -top-10 rounded-2xl bg-white px-4 py-2 text-center shadow-lg ring-1 ring-slate-100">
                        <p className="text-xs font-semibold text-slate-900">$8293.00</p>
                        <p className="text-[11px] text-slate-400">April, 2025</p>
                      </div>
                    ) : null}
                    <div
                      className={`${index === 6 ? 'bg-violet-600' : 'bg-slate-200'} w-2.5 rounded-full`}
                      style={{ height: `${height * 2}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Plati pe interval orar</h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Comenzi</span>
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Valoare</span>
            </div>
          </div>
          <div className="mt-6 flex h-64 items-end gap-3 rounded-[28px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 pb-6 pt-10">
            {timeOfDayBars.map((height, index) => (
              <div key={index} className="flex flex-1 items-end justify-center gap-1">
                <div className="w-2 rounded-full bg-slate-100" style={{ height: `${height * 1.8}px` }} />
                <div
                  className={`w-2 rounded-full ${index === 5 ? 'bg-emerald-500' : index === 6 ? 'bg-amber-400' : 'bg-slate-200'}`}
                  style={{ height: `${Math.max(32, height * 1.2)}px` }}
                />
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <DashboardCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Comenzi recente</h2>
            </div>
            <ToolbarPill>Data si ora</ToolbarPill>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-6 py-4">Nume produs</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Data livrarii</th>
                  <th className="px-6 py-4">Valoare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-11 w-11 rounded-2xl object-cover" />
                        ) : (
                          <div className="h-11 w-11 rounded-2xl bg-slate-100" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-400">{product.sku || product.slug || `ID ${product.id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><StatusPill status={product.status} /></td>
                    <td className="px-4 py-4 text-sm text-slate-500">April 22, 2025, 10:30 AM</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{product.price} {product.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-950">Tipuri comenzi</h2>
            <button
              type="button"
              onClick={onOpenProducts}
              className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Deschide produsele
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center">
            <div className="relative h-56 w-56 rounded-full bg-[conic-gradient(#16a34a_0_28%,#7c3aed_28%_68%,#fbbf24_68%_100%)]">
              <div className="absolute inset-8 rounded-full bg-white" />
              <div className="absolute right-1 top-12 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">40%</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {orderSegments.map((segment) => (
              <div key={segment.label} className="flex items-center gap-2 text-sm text-slate-500">
                <span className={`h-3 w-3 rounded-full ${segment.color}`} />
                <span>{segment.label}</span>
                <span className="font-semibold text-slate-800">{segment.value}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <DashboardCard className="p-6">
          <h2 className="text-2xl font-semibold text-slate-950">Status proiecte</h2>
          <div className="mt-8 flex items-center justify-center">
            <div className="relative h-52 w-52 rounded-full">
              {projectSlices.map((slice, index) => (
                <div
                  key={slice}
                  className={`absolute inset-0 rounded-full ${slice}`}
                  style={{
                    clipPath:
                      index === 0
                        ? 'polygon(50% 50%, 100% 0, 100% 100%)'
                        : index === 1
                          ? 'polygon(50% 50%, 100% 100%, 35% 100%)'
                          : index === 2
                            ? 'polygon(50% 50%, 35% 100%, 0 25%)'
                            : 'polygon(50% 50%, 0 25%, 100% 0)',
                  }}
                />
              ))}
              <div className="absolute right-2 top-10 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">40%</div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-slate-950">Calendar</h2>
            <ToolbarPill>September 2025</ToolbarPill>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
            {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day) => <span key={day}>{day}</span>)}
            {Array.from({ length: 35 }, (_, index) => (
              <span
                key={index}
                className={`rounded-xl py-2 ${index === 17 ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-500'}`}
              >
                {index < 2 ? '' : index - 1}
              </span>
            ))}
          </div>
        </DashboardCard>

        <div className="grid gap-6">
          <DashboardCard className="p-6">
            <div className="flex h-28 items-end gap-3">
              {paymentCurve.slice(4, 10).map((point, index) => (
                <div key={index} className="flex-1 rounded-t-full bg-violet-100" style={{ height: `${point * 1.1}px` }} />
              ))}
            </div>
          </DashboardCard>
          <DashboardCard className="p-6">
            <div className="flex items-center justify-center gap-4 text-violet-500">
              {['◔', '◌', '◎'].map((icon) => (
                <div key={icon} className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-lg">
                  {icon}
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

function ProductsOverview({
  metrics,
  products,
  selectedProductId,
  onSelectProduct,
  onNewProduct,
}: {
  metrics: Array<{ label: string; value: number; tone: string }>;
  products: ProductRecord[];
  selectedProductId: number | null;
  onSelectProduct: (product: ProductRecord) => void;
  onNewProduct: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-[28px] bg-gradient-to-br ${metric.tone} p-[1px] shadow-lg`}>
            <div className="rounded-[27px] bg-white/92 px-5 py-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Lista produse</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Privire generala catalog</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNewProduct}
              className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Adauga produs
            </button>
            <button type="button" className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Exporta
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Produs</th>
                <th className="px-4 py-4">Slug</th>
                <th className="px-4 py-4">Pret</th>
                <th className="px-4 py-4">Stoc</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actiune</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    Nu exista produse care sa corespunda cautarii.
                  </td>
                </tr>
              ) : null}
              {products.map((product) => {
                const isSelected = product.id === selectedProductId;
                return (
                  <tr key={product.id} className={`transition ${isSelected ? 'bg-violet-50/80' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => onSelectProduct(product)} className="flex items-center gap-3 text-left">
                        {product.imageUrl ? (
                          <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                            <img src={product.imageUrl} alt={product.name || 'Imagine produs'} className="h-full w-full object-cover" />
                          </div>
                        ) : null}
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-400">{product.sku || `ID ${product.id}`}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{product.slug || '-'}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">{product.price} {product.currency}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{product.stockQuantity}</td>
                    <td className="px-4 py-4"><StatusPill status={product.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <IconAction onClick={() => onSelectProduct(product)} label="Editeaza">E</IconAction>
                        <IconAction onClick={onNewProduct} label="Duplica">+</IconAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

function OrdersOverview({
  metrics,
  orders,
  selectedOrderId,
  statusFilter,
  paymentStatusFilter,
  onStatusFilterChange,
  onPaymentStatusFilterChange,
  onOpenOrder,
}: {
  metrics: Array<{ label: string; value: number; tone: string }>;
  orders: OrderRecord[];
  selectedOrderId: number | null;
  statusFilter: string;
  paymentStatusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onPaymentStatusFilterChange: (value: string) => void;
  onOpenOrder: (order: OrderRecord) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-[28px] bg-gradient-to-br ${metric.tone} p-[1px] shadow-lg`}>
            <div className="rounded-[27px] bg-white/92 px-5 py-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Comenzi</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Administrare comenzi</h2>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="cursor-pointer rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
              Vezi
            </button>
            <button type="button" className="cursor-pointer rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Exporta
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-4 md:grid-cols-2 xl:grid-cols-[220px_220px_1fr]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status comanda</span>
            <DashboardSelect value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className="h-11">
              <option value="">Toate statusurile</option>
              {['Plasata', 'Confirmata', 'In procesare', 'Expediata', 'Livrata', 'Anulata', 'Returnata'].map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </DashboardSelect>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status plata</span>
            <DashboardSelect value={paymentStatusFilter} onChange={(event) => onPaymentStatusFilterChange(event.target.value)} className="h-11">
              <option value="">Toate platile</option>
              {['unpaid', 'pending', 'paid', 'failed', 'refunded'].map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </DashboardSelect>
          </label>

          <div className="flex items-end">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Afisezi <span className="font-semibold text-slate-900">{orders.length}</span> comenzi
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Comanda</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4">Creata</th>
                <th className="px-4 py-4">Plata</th>
                <th className="px-4 py-4">Total</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actiune</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    Nu exista comenzi care sa corespunda filtrelor.
                  </td>
                </tr>
              ) : null}
              {orders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                const firstItem = order.items[0];

                return (
                  <tr key={order.id} className={`transition ${isSelected ? 'bg-violet-50/80' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => onOpenOrder(order)} className="flex items-center gap-3 text-left">
                        {firstItem?.productImageUrl ? (
                          <img src={firstItem.productImageUrl} alt={firstItem.productName} className="h-12 w-12 rounded-2xl object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                          <p className="text-xs text-slate-400">
                            {order.itemCount} produs{order.itemCount === 1 ? '' : 'e'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{firstItem?.productName || 'Comanda fara produse'}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{order.customer.name || 'Client necunoscut'}</p>
                      <p className="text-xs text-slate-400">{order.customer.email || '-'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{formatAdminDate(order.createdAt)}</td>
                    <td className="px-4 py-4"><PaymentStatusPill status={order.paymentStatus} /></td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatMoney(order.total, order.currency)}</td>
                    <td className="px-4 py-4"><OrderStatusPill status={order.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <IconAction onClick={() => onOpenOrder(order)} label="Vezi comanda">
                          Vezi
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

function PackagesOverview({
  metrics,
  packages,
  selectedPackageId,
  packageStatusFilter,
  onPackageStatusFilterChange,
  onOpenPackage,
}: {
  metrics: Array<{ label: string; value: number; tone: string }>;
  packages: OrderRecord[];
  selectedPackageId: number | null;
  packageStatusFilter: string;
  onPackageStatusFilterChange: (value: string) => void;
  onOpenPackage: (order: OrderRecord) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-[28px] bg-gradient-to-br ${metric.tone} p-[1px] shadow-lg`}>
            <div className="rounded-[27px] bg-white/92 px-5 py-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Colete</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Pregatire si livrare</h2>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="cursor-pointer rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
              Vezi
            </button>
            <button type="button" className="cursor-pointer rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Exporta
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-4 md:grid-cols-[240px_1fr]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status colet</span>
            <DashboardSelect value={packageStatusFilter} onChange={(event) => onPackageStatusFilterChange(event.target.value)} className="h-11">
              <option value="">Toate statusurile</option>
              {['nepregatit', 'pregatit', 'impachetat', 'expediat', 'livrat', 'retur'].map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </DashboardSelect>
          </label>

          <div className="flex items-end">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Afisezi <span className="font-semibold text-slate-900">{packages.length}</span> colete
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Comanda</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4">Curier</th>
                <th className="px-4 py-4">AWB</th>
                <th className="px-4 py-4">Colete</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actiune</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    Nu exista colete care sa corespunda filtrelor.
                  </td>
                </tr>
              ) : null}
              {packages.map((order) => {
                const isSelected = order.id === selectedPackageId;

                return (
                  <tr key={order.id} className={`transition ${isSelected ? 'bg-violet-50/80' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => onOpenPackage(order)} className="text-left">
                        <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatAdminDate(order.createdAt)}</p>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{order.customer.name || 'Client necunoscut'}</p>
                      <p className="text-xs text-slate-400">{order.customer.email || '-'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{order.courier || 'Nesetat'}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{order.trackingNumber || 'Nesetat'}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">{order.packageCount}</td>
                    <td className="px-4 py-4"><PackageStatusPill status={order.packageStatus} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <IconAction onClick={() => onOpenPackage(order)} label="Editeaza colet">
                          Vezi
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

function BillingOverview({
  metrics,
  orders,
  selectedBillingId,
  paymentStatusFilter,
  invoiceStatusFilter,
  onPaymentStatusFilterChange,
  onInvoiceStatusFilterChange,
  onOpenBilling,
}: {
  metrics: Array<{ label: string; value: number; tone: string }>;
  orders: OrderRecord[];
  selectedBillingId: number | null;
  paymentStatusFilter: string;
  invoiceStatusFilter: string;
  onPaymentStatusFilterChange: (value: string) => void;
  onInvoiceStatusFilterChange: (value: string) => void;
  onOpenBilling: (order: OrderRecord) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-[28px] bg-gradient-to-br ${metric.tone} p-[1px] shadow-lg`}>
            <div className="rounded-[27px] bg-white/92 px-5 py-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Facturi si plati</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Administrare financiara</h2>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="cursor-pointer rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
              Vezi
            </button>
            <button type="button" className="cursor-pointer rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Exporta
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-4 md:grid-cols-2 xl:grid-cols-[220px_220px_1fr]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status plata</span>
            <DashboardSelect value={paymentStatusFilter} onChange={(event) => onPaymentStatusFilterChange(event.target.value)} className="h-11">
              <option value="">Toate platile</option>
              {['unpaid', 'pending', 'paid', 'failed', 'refunded'].map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </DashboardSelect>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status factura</span>
            <DashboardSelect value={invoiceStatusFilter} onChange={(event) => onInvoiceStatusFilterChange(event.target.value)} className="h-11">
              <option value="">Toate facturile</option>
              {['negenerata', 'generata', 'trimisa', 'anulata'].map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </DashboardSelect>
          </label>

          <div className="flex items-end">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Afisezi <span className="font-semibold text-slate-900">{orders.length}</span> inregistrari
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Comanda</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4">Plata</th>
                <th className="px-4 py-4">Factura</th>
                <th className="px-4 py-4">Numar factura</th>
                <th className="px-4 py-4">Total</th>
                <th className="px-6 py-4 text-right">Actiune</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    Nu exista inregistrari financiare care sa corespunda filtrelor.
                  </td>
                </tr>
              ) : null}
              {orders.map((order) => {
                const isSelected = order.id === selectedBillingId;

                return (
                  <tr key={order.id} className={`transition ${isSelected ? 'bg-violet-50/80' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => onOpenBilling(order)} className="text-left">
                        <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatAdminDate(order.createdAt)}</p>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{order.customer.name || 'Client necunoscut'}</p>
                      <p className="text-xs text-slate-400">{order.customer.email || '-'}</p>
                    </td>
                    <td className="px-4 py-4"><PaymentStatusPill status={order.paymentStatus} /></td>
                    <td className="px-4 py-4"><InvoiceStatusPill status={order.invoiceStatus} /></td>
                    <td className="px-4 py-4 text-sm text-slate-600">{order.invoiceNumber || 'Negenerata'}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatMoney(order.total, order.currency)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <IconAction onClick={() => onOpenBilling(order)} label="Editeaza facturarea">
                          Vezi
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

function ChatOverview({
  conversations,
  selectedConversationId,
  currentPage,
  statusFilter,
  sourceFilter,
  onPageChange,
  onStatusFilterChange,
  onSourceFilterChange,
  onOpenConversation,
}: {
  conversations: ConversationRecord[];
  selectedConversationId: number | null;
  currentPage: number;
  statusFilter: string;
  sourceFilter: string;
  onPageChange: (page: number) => void;
  onStatusFilterChange: (value: string) => void;
  onSourceFilterChange: (value: string) => void;
  onOpenConversation: (conversation: ConversationRecord) => void;
}) {
  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(conversations.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * itemsPerPage;
  const previewConversations = conversations.slice(pageStart, pageStart + itemsPerPage);

  const channelCards = conversationSourceOptions.map((source, index) => {
    const sourceConversations = conversations.filter((conversation) => conversation.source.toLowerCase() === source);

    return {
      source,
      label: conversationSourceLabels[source],
      total: sourceConversations.length,
      tone:
        index === 0
          ? 'from-violet-500 to-violet-600'
          : index === 1
            ? 'from-emerald-500 to-teal-500'
            : 'from-sky-500 to-cyan-600',
      statuses: conversationStatusOptions.map((status) => ({
        status,
        label: conversationStatusLabels[status],
        count: sourceConversations.filter((conversation) => conversation.status.toLowerCase() === status).length,
      })),
      icon: source === 'website' ? 'W' : source === 'email' ? '@' : 'WA',
      accentSoft:
        source === 'website'
          ? 'bg-violet-100 text-violet-700'
          : source === 'email'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-sky-100 text-sky-700',
    };
  });

  const totalStatuses = conversationStatusOptions.map((status) => ({
    status,
    label: conversationStatusLabels[status],
    count: conversations.filter((conversation) => conversation.status.toLowerCase() === status).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {channelCards.map((card) => (
          <div key={card.source} className={`overflow-hidden rounded-[30px] bg-gradient-to-br ${card.tone} p-[1px] shadow-[0_18px_40px_rgba(15,23,42,0.08)]`}>
            <div className="rounded-[29px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(248,250,252,0.95)_55%,rgba(241,245,249,0.92))] px-5 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-end gap-2">
                    <p className="text-4xl font-semibold leading-none text-slate-950">{card.total}</p>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                  </div>
                </div>
                <div className={`flex h-12 min-w-12 items-center justify-center rounded-2xl text-sm font-bold shadow-sm ${card.accentSoft}`}>
                  <ChannelSummaryIcon source={card.source} />
                </div>
              </div>
              <div className="mt-5 flex gap-1.5">
                {card.statuses.map((item) => (
                  <div
                    key={`${card.source}-${item.status}`}
                    className="min-w-0 flex-1 rounded-xl border border-white/80 bg-white/80 px-2 py-1.5 text-center shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                  >
                    <p className="truncate text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-900">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-500 to-slate-800 p-[1px] shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="rounded-[29px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(248,250,252,0.95)_55%,rgba(241,245,249,0.92))] px-5 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-semibold leading-none text-slate-950">{conversations.length}</p>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Inbox total</p>
                </div>
              </div>
              <div className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 shadow-sm">
                <TotalInboxIcon />
              </div>
            </div>
            <div className="mt-5 flex gap-1.5">
              {totalStatuses.map((item) => (
                <div
                  key={`total-${item.status}`}
                  className="min-w-0 flex-1 rounded-xl border border-white/80 bg-white/80 px-2 py-1.5 text-center shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                >
                  <p className="truncate text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-900">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Inbox clienti</h2>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-4 md:grid-cols-2 xl:grid-cols-[220px_220px_1fr]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</span>
            <DashboardSelect value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className="h-11">
              <option value="">Toate statusurile</option>
              {conversationStatusOptions.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {conversationStatusLabels[statusOption]}
                </option>
              ))}
            </DashboardSelect>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Canal</span>
            <DashboardSelect value={sourceFilter} onChange={(event) => onSourceFilterChange(event.target.value)} className="h-11">
              <option value="">Toate canalele</option>
              {conversationSourceOptions.map((sourceOption) => (
                <option key={sourceOption} value={sourceOption}>
                  {conversationSourceLabels[sourceOption]}
                </option>
              ))}
            </DashboardSelect>
          </label>

          <div className="flex items-end">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Afisezi <span className="font-semibold text-slate-900">{previewConversations.length}</span> din{' '}
              <span className="font-semibold text-slate-900">{conversations.length}</span> conversatii
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-4 py-4">Canal</th>
                <th className="px-4 py-4">Subiect</th>
                <th className="px-4 py-4">Ultimul mesaj</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actiune</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewConversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    Nu exista conversatii care sa corespunda filtrelor.
                  </td>
                </tr>
              ) : null}
              {previewConversations.map((conversation) => {
                const isSelected = conversation.id === selectedConversationId;

                return (
                  <tr key={conversation.id} className={`transition ${isSelected ? 'bg-violet-50/80' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => onOpenConversation(conversation)} className="text-left">
                        <p className="font-semibold text-slate-900">{conversation.customerName || 'Client necunoscut'}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {conversation.contactDetail || conversation.customerEmail || conversation.customerPhone || '-'}
                        </p>
                      </button>
                    </td>
                    <td className="px-4 py-4"><ChannelPill source={conversation.source} /></td>
                    <td className="px-4 py-4 text-sm text-slate-600">{conversation.subject || 'Mesaj website'}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{conversation.lastMessagePreview || '-'}</td>
                    <td className="px-4 py-4"><ConversationStatusPill status={conversation.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <IconAction onClick={() => onOpenConversation(conversation)} label="Vezi conversatia">
                          Vezi
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {conversations.length > itemsPerPage ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <p className="text-sm text-slate-500">
              Pagina <span className="font-semibold text-slate-900">{safeCurrentPage}</span> din{' '}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage === 1}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Anterioara
              </button>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
                disabled={safeCurrentPage === totalPages}
                className="cursor-pointer rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Urmatoarea
              </button>
            </div>
          </div>
        ) : null}
      </DashboardCard>
    </div>
  );
}

type EditorGlyphName =
  | 'tag'
  | 'details'
  | 'categories'
  | 'gallery'
  | 'image'
  | 'upload'
  | 'eye'
  | 'check'
  | 'replace'
  | 'trash';

function EditorGlyph({
  name,
  className = 'h-5 w-5',
}: {
  name: EditorGlyphName;
  className?: string;
}) {
  const paths: Record<EditorGlyphName, ReactNode> = {
    tag: (
      <>
        <path d="M20 13.2 12.2 21a2 2 0 0 1-2.8 0L3 14.6a2 2 0 0 1 0-2.8L10.8 4H18a2 2 0 0 1 2 2v7.2Z" />
        <path d="M15.5 8.5h.01" />
      </>
    ),
    details: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="4" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    categories: (
      <>
        <rect x="4" y="5" width="7" height="6" rx="1.5" />
        <rect x="13" y="13" width="7" height="6" rx="1.5" />
        <path d="M7.5 11v3a2 2 0 0 0 2 2H13M7.5 5V3" />
      </>
    ),
    gallery: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m5.5 17 4-4 3 3 2.5-2.5 3.5 3.5" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m4.5 17 4.5-4 3.5 3 2.5-2 4.5 3.5" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5" />
        <path d="M5 13.5H4a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3.5a2 2 0 0 0-2-2h-1" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    replace: (
      <>
        <path d="M20 7h-5V2M4 17h5v5" />
        <path d="M18.5 10A7 7 0 0 0 6.2 6.2L4 8M5.5 14A7 7 0 0 0 17.8 17.8L20 16" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

function ProductEditorCard({ children }: { children: ReactNode }) {
  return (
    <section className="product-editor-card rounded-[14px] border border-[#e1e7ef] bg-white p-3 shadow-[0_4px_14px_rgba(31,42,68,0.07)]">
      {children}
    </section>
  );
}

function ProductEditorSectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: Extract<EditorGlyphName, 'details' | 'categories' | 'gallery'>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-violet-200 bg-violet-50 text-violet-600">
          <EditorGlyph name={icon} className="h-[19px] w-[19px]" />
        </span>
        <div>
          <h2 className="product-editor-section-title text-[14px] font-bold leading-5 text-[#17213a]">{title}</h2>
          <p className="product-editor-section-description mt-0.5 text-[11px] text-[#6b7890]">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function ProductEditorField({
  label,
  children,
  className = '',
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="product-editor-field-label mb-1 flex items-center gap-2 text-[11px] font-semibold text-[#43516a]">{label}</span>
      {children}
    </label>
  );
}

function ProductEditorInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`product-editor-control h-8 w-full rounded-[8px] border border-[#d8e0eb] bg-white px-3 text-[12px] text-[#17213a] shadow-[0_1px_3px_rgba(31,42,68,0.06)] outline-none transition placeholder:text-[#98a5b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:border-[#dce3ec] disabled:bg-[#f1f4f8] ${props.className ?? ''}`}
    />
  );
}

function ProductEditorTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`product-editor-control product-editor-textarea w-full resize-y rounded-[8px] border border-[#d8e0eb] bg-white px-3 py-2.5 text-[12px] text-[#17213a] shadow-[0_1px_3px_rgba(31,42,68,0.06)] outline-none transition placeholder:text-[#98a5b9] focus:border-violet-400 focus:ring-2 focus:ring-violet-100 ${props.className ?? ''}`}
    />
  );
}

function ProductEditorSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`product-editor-control h-8 w-full cursor-pointer rounded-[8px] border border-[#d8e0eb] bg-white px-3 text-[12px] text-[#17213a] shadow-[0_1px_3px_rgba(31,42,68,0.06)] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-[#f1f4f8] ${props.className ?? ''}`}
    />
  );
}

function PreviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[#71809a]">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-[#25324b]" title={value}>
        {value}
      </span>
    </div>
  );
}

function DashboardCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[30px] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 ${className}`}>
      {children}
    </div>
  );
}

function DashboardSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-[28px] border border-slate-100 bg-slate-50/55 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DashboardField({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function FieldLabelWithHint({ label, hint }: { label: string; hint: string }) {
  return (
    <>
      <span>{label}</span>
      <span className="group relative inline-flex items-center">
        <span className="flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold text-slate-500 transition group-hover:border-violet-300 group-hover:text-violet-600">
          !
        </span>
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-medium leading-5 text-white opacity-0 shadow-xl transition group-hover:opacity-100">
          {hint}
        </span>
      </span>
    </>
  );
}

function DashboardInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={`h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm shadow-none focus-visible:ring-violet-500 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none ${props.className ?? ''}`}
    />
  );
}

function DashboardTextarea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={`rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm shadow-none focus-visible:ring-violet-500 ${props.className ?? ''}`}
    />
  );
}

function DashboardSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`admin-dashboard-select flex h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${props.className ?? ''}`}
    />
  );
}

function ToolbarPill({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100">
      {children}
    </div>
  );
}

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const [, base64Data = ''] = result.split(',');
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error('Nu am putut citi imaginea selectata.'));
    reader.readAsDataURL(file);
  });
}

function formatMoney(value: string | number, currency: string) {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} ${currency}`;
}

function formatAdminDate(value: string | null | undefined) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function StatusPill({ status }: { status: ProductRecord['status'] }) {
  const label = status === 'active' ? 'activ' : status === 'archived' ? 'arhivat' : 'ciorna';
  const styles =
    status === 'active'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'archived'
        ? 'bg-slate-200 text-slate-700'
        : 'bg-amber-100 text-amber-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles}`}>{label}</span>;
}

function OrderStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const styles =
    normalized === 'livrata'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized === 'anulata' || normalized === 'returnata'
        ? 'bg-rose-100 text-rose-700'
        : normalized === 'expediata'
          ? 'bg-sky-100 text-sky-700'
          : 'bg-amber-100 text-amber-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{status}</span>;
}

function PaymentStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label =
    normalized === 'paid'
      ? 'platita'
      : normalized === 'pending'
        ? 'in asteptare'
        : normalized === 'failed'
          ? 'esuata'
          : normalized === 'refunded'
            ? 'rambursata'
            : 'neplatita';
  const styles =
    normalized === 'paid'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized === 'failed' || normalized === 'refunded'
        ? 'bg-rose-100 text-rose-700'
        : normalized === 'pending'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-slate-200 text-slate-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles}`}>{label}</span>;
}

function PackageStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label =
    normalized === 'pregatit'
      ? 'pregatit'
      : normalized === 'impachetat'
        ? 'impachetat'
        : normalized === 'expediat'
          ? 'expediat'
          : normalized === 'livrat'
            ? 'livrat'
            : normalized === 'retur'
              ? 'retur'
              : 'nepregatit';
  const styles =
    normalized === 'livrat'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized === 'expediat'
        ? 'bg-sky-100 text-sky-700'
        : normalized === 'retur'
          ? 'bg-rose-100 text-rose-700'
          : normalized === 'impachetat' || normalized === 'pregatit'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-200 text-slate-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles}`}>{label}</span>;
}

function InvoiceStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label =
    normalized === 'generata'
      ? 'generata'
      : normalized === 'trimisa'
        ? 'trimisa'
        : normalized === 'anulata'
          ? 'anulata'
          : 'negenerata';
  const styles =
    normalized === 'trimisa'
      ? 'bg-sky-100 text-sky-700'
      : normalized === 'generata'
        ? 'bg-emerald-100 text-emerald-700'
        : normalized === 'anulata'
          ? 'bg-rose-100 text-rose-700'
          : 'bg-slate-200 text-slate-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles}`}>{label}</span>;
}

function ConversationStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label =
    normalized === 'in_curs'
      ? 'in curs'
      : normalized === 'rezolvat'
        ? 'rezolvat'
        : normalized === 'spam'
          ? 'spam'
          : 'nou';
  const styles =
    normalized === 'rezolvat'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized === 'in_curs'
        ? 'bg-sky-100 text-sky-700'
        : normalized === 'spam'
          ? 'bg-rose-100 text-rose-700'
          : 'bg-amber-100 text-amber-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles}`}>{label}</span>;
}

function ChannelPill({ source }: { source: string }) {
  const normalized = source.toLowerCase();
  const label =
    normalized === 'whatsapp'
      ? 'whatsapp'
      : normalized === 'email'
        ? 'email'
        : 'website';
  const styles =
    normalized === 'whatsapp'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized === 'email'
        ? 'bg-sky-100 text-sky-700'
        : 'bg-violet-100 text-violet-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles}`}>{label}</span>;
}

function ChannelSummaryIcon({ source }: { source: string }) {
  const normalized = source.toLowerCase();
  const common = 'h-5 w-5';

  if (normalized === 'email') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.75" y="6.25" width="16.5" height="11.5" rx="2.5" />
        <path d="M5.5 8 12 12.75 18.5 8" />
      </svg>
    );
  }

  if (normalized === 'whatsapp') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19.2 11.3a7.2 7.2 0 0 1-10.48 6.42L5.1 18.9l1.2-3.43a7.2 7.2 0 1 1 12.9-4.17Z" />
        <path d="M9.5 8.9c.18-.4.37-.42.56-.43h.47c.14 0 .36.05.55.46.19.4.65 1.57.7 1.69.06.12.1.27.02.43-.08.17-.12.27-.24.41-.12.14-.25.31-.36.42-.12.12-.24.26-.1.5.13.24.6.99 1.29 1.61.89.8 1.64 1.05 1.88 1.17.24.12.38.1.52-.06.14-.17.59-.68.75-.92.16-.24.31-.2.52-.12.21.07 1.34.63 1.57.75.24.12.39.18.45.29.06.12.06.68-.16 1.33-.22.65-1.3 1.27-1.78 1.34-.48.07-.99.1-1.6-.1-.37-.12-.84-.27-1.45-.53-2.55-1.1-4.22-3.73-4.35-3.91-.13-.18-1.03-1.37-1.03-2.62 0-1.25.65-1.87.88-2.12Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" />
      <path d="M3.9 12h16.2" />
      <path d="M12 3.75c2.2 2.33 3.5 5.16 3.5 8.25S14.2 17.92 12 20.25C9.8 17.92 8.5 15.09 8.5 12S9.8 6.08 12 3.75Z" />
    </svg>
  );
}

function TotalInboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
      <path d="M7 9.5h10" />
      <path d="M9 13h6" />
    </svg>
  );
}

function IconAction({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white transition hover:bg-violet-700 cursor-pointer"
    >
      {children}
    </button>
  );
}

function Alert({ tone, children }: { tone: 'success' | 'danger'; children: ReactNode }) {
  const styles =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  return <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${styles}`}>{children}</div>;
}

function SidebarIcon({ name }: { name: string }) {
  const common = 'h-4 w-4 stroke-current';

  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M3 10.5 12 4l9 6.5" />
          <path d="M5.5 9.5V20h13V9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case 'box':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
          <path d="M4 7l8 4 8-4" />
          <path d="M12 11v10" />
        </svg>
      );
    case 'receipt':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M7 3h10v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5V3Z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'package':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M3.5 8.5 12 4l8.5 4.5V18L12 22l-8.5-4V8.5Z" />
          <path d="M12 4v8m0 0 8.5-3.5M12 12 3.5 8.5" />
        </svg>
      );
    case 'wallet':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
          <path d="M4 8h14.5A1.5 1.5 0 0 1 20 9.5v1A1.5 1.5 0 0 1 18.5 12H16" />
          <circle cx="16.5" cy="10" r=".75" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M5 18.5V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H9l-4 2.5Z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M7 3v4M17 3v4M4 9h16" />
          <rect x="4" y="5" width="16" height="15" rx="2.5" />
        </svg>
      );
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M4 19h16" />
          <path d="M7 16V9M12 16V5M17 16v-7" />
        </svg>
      );
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
        </svg>
      );
    case 'note':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M7 4h7l4 4v12H7z" />
          <path d="M14 4v4h4M9 13h6M9 17h6" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5z" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1 0 2.8 2 2 0 0 1-2.8 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8 0 2 2 0 0 1 0-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 0-2.8 2 2 0 0 1 2.8 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 0 2 2 0 0 1 0 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
        </svg>
      );
    case 'headset':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M4 12a8 8 0 0 1 16 0" />
          <rect x="3" y="11" width="4" height="7" rx="2" />
          <rect x="17" y="11" width="4" height="7" rx="2" />
          <path d="M19 18a3 3 0 0 1-3 3h-2" />
        </svg>
      );
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H4" />
          <path d="M12 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={common} strokeWidth="1.8">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}
