'use client';

import { ChangeEvent, FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

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

type ProductVariant = {
  optionName: string;
  optionValue: string;
  legacyOptionId: string;
  legacyOptionValueId: string;
  combinationId: string;
  model: string;
  sku: string;
  quantity: number;
  priceDelta: number;
  pricePrefix: '+' | '-';
  imageUrl: string;
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
    optionName: string;
    optionValue: string;
    legacyOptionId?: number | null;
    legacyOptionValueId?: number | null;
    combinationId?: string | null;
    model?: string | null;
    sku?: string | null;
    quantity?: number | null;
    priceDelta?: number | string | null;
    pricePrefix?: string | null;
    imageUrl?: string | null;
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
  variants: ProductVariant[];
};

type AdminSection = 'dashboard' | 'products' | 'orders' | 'packages' | 'billing' | 'chat';

type ImageUploadTarget = {
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
    sku: '',
    stockQuantity: '0',
    status: 'draft',
    material: '',
    categoryIds: [],
    images: [{ imageUrl: '', altText: '', sortOrder: 0, isPrimary: true }],
    attributes: [],
    variants: [],
  };
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
    variants: product.variants.map((variant, index) => ({
      optionName: variant.optionName || '',
      optionValue: variant.optionValue || '',
      legacyOptionId: variant.legacyOptionId ? String(variant.legacyOptionId) : '',
      legacyOptionValueId: variant.legacyOptionValueId ? String(variant.legacyOptionValueId) : '',
      combinationId: variant.combinationId || '',
      model: variant.model || '',
      sku: variant.sku || '',
      quantity: Number(variant.quantity ?? 0),
      priceDelta: Number(variant.priceDelta ?? 0),
      pricePrefix: variant.pricePrefix === '-' ? '-' : '+',
      imageUrl: variant.imageUrl || '',
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
  const [productEditorKey, setProductEditorKey] = useState(0);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isCategoryCreatorOpen, setIsCategoryCreatorOpen] = useState(false);
  const [categoryCreatorMode, setCategoryCreatorMode] = useState<'category' | 'subcategory'>('category');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [imageUploadTarget, setImageUploadTarget] = useState<ImageUploadTarget>({ index: null });
  const [imageUploadFile, setImageUploadFile] = useState<File | null>(null);
  const [imageUploadPreview, setImageUploadPreview] = useState('');
  const [imageUploadAltText, setImageUploadAltText] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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

  const topLevelCategories = useMemo(
    () =>
      categories
        .filter((category) => category.parentId === null)
        .sort((left, right) => left.name.localeCompare(right.name, 'ro')),
    [categories],
  );

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
    setProductEditorKey((current) => current + 1);
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
    setIsCategoryCreatorOpen(false);
    setCategoryCreatorMode('category');
    setNewCategoryName('');
    setNewCategorySlug('');
    setNewCategoryParentId('');
    closeImageUploadModal();
    setProductEditorKey((current) => current + 1);
    setIsEditorOpen(true);
    setMessage('');
    setErrorMessage('');
  }

  function closeEditor() {
    setIsCreatingProduct(false);
    setIsEditorOpen(false);
    setMessage('');
    setErrorMessage('');
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
    setDraft((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...patch } : image,
      ),
    }));
  }

  function setPrimaryImage(index: number) {
    setDraft((current) => ({
      ...current,
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
      return {
        ...current,
        images: images.map((image, imageIndex) => ({
          ...image,
          sortOrder: imageIndex,
          isPrimary: image.isPrimary || (imageIndex === 0 && !images.some((item) => item.isPrimary)),
        })),
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

  function addVariant() {
    setDraft((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          optionName: '',
          optionValue: '',
          legacyOptionId: '',
          legacyOptionValueId: '',
          combinationId: '',
          model: '',
          sku: '',
          quantity: 0,
          priceDelta: 0,
          pricePrefix: '+',
          imageUrl: '',
          sortOrder: current.variants.length,
        },
      ],
    }));
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
      setCategoryCreatorMode('subcategory');
      setNewCategoryParentId(String(nextCategoryId));
    } else if (categoryCreatorMode === 'subcategory') {
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
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setErrorMessage('Introdu numele categoriei noi.');
      return;
    }

    const parentId =
      categoryCreatorMode === 'subcategory'
        ? Number(newCategoryParentId || editorCategorySelection.categoryId || 0) || null
        : null;

    if (categoryCreatorMode === 'subcategory' && !parentId) {
      setErrorMessage('Selecteaza categoria parinte pentru subcategorie.');
      return;
    }

    setErrorMessage('');
    setIsCreatingCategory(true);

    try {
      const response = await fetch(`${backendUrl}/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          slug: newCategorySlug.trim(),
          parentId,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(data?.message || 'Categoria nu a putut fi creata.');
        return;
      }

      const createdCategory = data as Category;
      setCategories((current) => [...current, createdCategory]);

      if (createdCategory.parentId) {
        setDraft((current) => ({
          ...current,
          categoryIds: buildProductCategoryIds(createdCategory.parentId, createdCategory.id, current.categoryIds),
        }));
      } else {
        setDraft((current) => ({
          ...current,
          categoryIds: buildProductCategoryIds(createdCategory.id, null, current.categoryIds),
        }));
      }

      setNewCategoryName('');
      setNewCategorySlug('');
      setNewCategoryParentId(createdCategory.parentId ? String(createdCategory.parentId) : '');
      setIsCategoryCreatorOpen(false);
      setMessage(createdCategory.parentId ? 'Subcategoria a fost adaugata.' : 'Categoria a fost adaugata.');
    } catch {
      setErrorMessage('Categoria nu a putut fi creata.');
    } finally {
      setIsCreatingCategory(false);
    }
  }

  function openImageUploadModal(index: number | null) {
    setImageUploadTarget({ index });
    setImageUploadFile(null);
    setImageUploadPreview(index !== null ? draft.images[index]?.imageUrl || '' : '');
    setImageUploadAltText(index !== null ? draft.images[index]?.altText || '' : '');
    setIsImageUploadModalOpen(true);
  }

  function closeImageUploadModal() {
    setIsImageUploadModalOpen(false);
    setImageUploadTarget({ index: null });
    setImageUploadFile(null);
    setImageUploadPreview('');
    setImageUploadAltText('');
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

    if (!nextFile) {
      setImageUploadPreview(imageUploadTarget.index !== null ? draft.images[imageUploadTarget.index]?.imageUrl || '' : '');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUploadPreview(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(nextFile);
  }

  async function handleImageUpload() {
    if (!imageUploadFile) {
      setErrorMessage('Selecteaza o imagine de pe dispozitiv.');
      return;
    }

    setErrorMessage('');
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
        setErrorMessage(data?.message || 'Imaginea nu a putut fi incarcata.');
        return;
      }

      const uploadedImageUrl = String(data?.imageUrl || '').trim();
      if (!uploadedImageUrl) {
        setErrorMessage('Serverul nu a returnat URL-ul imaginii.');
        return;
      }

      if (imageUploadTarget.index === null) {
        setDraft((current) => {
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
      setErrorMessage('Imaginea nu a putut fi incarcata.');
    } finally {
      setIsUploadingImage(false);
    }
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
                  <DashboardField label="Slug">
                    <DashboardInput value={draft.slug} onChange={(event) => updateDraft('slug', event.target.value)} placeholder="se genereaza daca ramane gol" />
                  </DashboardField>
                  <DashboardField label="Pret">
                    <DashboardInput type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} required />
                  </DashboardField>
                  <DashboardField label="Pret vechi">
                    <DashboardInput type="number" min="0" step="0.01" value={draft.compareAtPrice} onChange={(event) => updateDraft('compareAtPrice', event.target.value)} />
                  </DashboardField>
                  <DashboardField label="Moneda">
                    <DashboardInput value={draft.currency} onChange={(event) => updateDraft('currency', event.target.value.toUpperCase())} maxLength={3} />
                  </DashboardField>
                  <DashboardField label="SKU">
                    <DashboardInput value={draft.sku} onChange={(event) => updateDraft('sku', event.target.value)} />
                  </DashboardField>
                  <DashboardField label="Stoc">
                    <DashboardInput type="number" min="0" step="1" value={draft.stockQuantity} onChange={(event) => updateDraft('stockQuantity', event.target.value)} />
                  </DashboardField>
                  <DashboardField label="Status">
                    <DashboardSelect value={draft.status} onChange={(event) => updateDraft('status', event.target.value as ProductDraft['status'])}>
                      <option value="draft">ciorna</option>
                      <option value="active">activ</option>
                      <option value="archived">arhivat</option>
                    </DashboardSelect>
                  </DashboardField>
                  <DashboardField label="Imagine principala">
                    <DashboardInput value={draft.imageUrl} onChange={(event) => updateDraft('imageUrl', event.target.value)} placeholder="https://..." />
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
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsCategoryCreatorOpen((current) => !current);
                      setCategoryCreatorMode(editorCategorySelection.categoryId ? 'subcategory' : 'category');
                      setNewCategoryParentId(editorCategorySelection.categoryId ? String(editorCategorySelection.categoryId) : '');
                    }}
                    className="rounded-2xl"
                  >
                    {isCategoryCreatorOpen ? 'Ascunde formularul' : 'Adauga categorie'}
                  </Button>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <DashboardField label="Categorie">
                    <DashboardSelect
                      value={editorCategorySelection.categoryId ?? ''}
                      onChange={(event) => handleEditorCategoryChange(event.target.value)}
                    >
                      <option value="">Selecteaza categoria</option>
                      {topLevelCategories.map((category) => (
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
                    <div className="grid gap-4 rounded-[24px] border border-dashed border-violet-200 bg-violet-50/50 p-4 md:col-span-2 md:grid-cols-2 xl:grid-cols-[180px_1fr_1fr_220px]">
                      <DashboardField label="Tip">
                        <DashboardSelect
                          value={categoryCreatorMode}
                          onChange={(event) => {
                            const nextMode = event.target.value as 'category' | 'subcategory';
                            setCategoryCreatorMode(nextMode);
                            if (nextMode === 'subcategory' && editorCategorySelection.categoryId) {
                              setNewCategoryParentId(String(editorCategorySelection.categoryId));
                            }
                            if (nextMode === 'category') {
                              setNewCategoryParentId('');
                            }
                          }}
                        >
                          <option value="category">Categorie</option>
                          <option value="subcategory">Subcategorie</option>
                        </DashboardSelect>
                      </DashboardField>

                      <DashboardField label="Nume">
                        <DashboardInput
                          value={newCategoryName}
                          onChange={(event) => setNewCategoryName(event.target.value)}
                          placeholder={categoryCreatorMode === 'subcategory' ? 'Ex: Semimate 2mm' : 'Ex: Margele de nisip'}
                        />
                      </DashboardField>

                      <DashboardField label="Slug">
                        <DashboardInput
                          value={newCategorySlug}
                          onChange={(event) => setNewCategorySlug(event.target.value)}
                          placeholder="optional"
                        />
                      </DashboardField>

                      {categoryCreatorMode === 'subcategory' ? (
                        <DashboardField label="Categorie parinte">
                          <DashboardSelect value={newCategoryParentId} onChange={(event) => setNewCategoryParentId(event.target.value)}>
                            <option value="">Selecteaza categoria parinte</option>
                            {topLevelCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </DashboardSelect>
                        </DashboardField>
                      ) : (
                        <div className="flex items-end justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCreateCategory}
                            disabled={isCreatingCategory}
                            className="w-full rounded-2xl md:w-auto"
                          >
                            {isCreatingCategory ? 'Se adauga...' : 'Creeaza categoria'}
                          </Button>
                        </div>
                      )}

                      {categoryCreatorMode === 'subcategory' ? (
                        <div className="flex justify-end md:col-span-2 xl:col-span-4">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCreateCategory}
                            disabled={isCreatingCategory}
                            className="rounded-2xl"
                          >
                            {isCreatingCategory ? 'Se adauga...' : 'Creeaza subcategoria'}
                          </Button>
                        </div>
                      ) : null}
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

            <div className="flex-1 overflow-y-auto p-6">
              {currentSection === 'dashboard' ? (
                <DashboardOverview
                  metrics={metrics}
                  products={products}
                  onOpenProducts={() => setCurrentSection('products')}
                />
              ) : null}

              {currentSection === 'products' ? (
              isEditorOpen ? renderProductEditorPage() : <div className="space-y-6">
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
                          {topLevelCategories.map((category) => (
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
                      <DashboardField label="Slug">
                        <DashboardInput value={draft.slug} onChange={(event) => updateDraft('slug', event.target.value)} placeholder="se genereaza daca ramane gol" />
                      </DashboardField>
                      <DashboardField label="Pret">
                        <DashboardInput type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} required />
                      </DashboardField>
                      <DashboardField label="Pret vechi">
                        <DashboardInput type="number" min="0" step="0.01" value={draft.compareAtPrice} onChange={(event) => updateDraft('compareAtPrice', event.target.value)} />
                      </DashboardField>
                      <DashboardField label="Moneda">
                        <DashboardInput value={draft.currency} onChange={(event) => updateDraft('currency', event.target.value.toUpperCase())} maxLength={3} />
                      </DashboardField>
                      <DashboardField label="SKU">
                        <DashboardInput value={draft.sku} onChange={(event) => updateDraft('sku', event.target.value)} />
                      </DashboardField>
                      <DashboardField label="Stoc">
                        <DashboardInput type="number" min="0" step="1" value={draft.stockQuantity} onChange={(event) => updateDraft('stockQuantity', event.target.value)} />
                      </DashboardField>
                      <DashboardField label="Status">
                        <DashboardSelect value={draft.status} onChange={(event) => updateDraft('status', event.target.value as ProductDraft['status'])}>
                          <option value="draft">ciorna</option>
                          <option value="active">activ</option>
                          <option value="archived">arhivat</option>
                        </DashboardSelect>
                      </DashboardField>
                      <DashboardField label="Imagine principala">
                        <DashboardInput value={draft.imageUrl} onChange={(event) => updateDraft('imageUrl', event.target.value)} placeholder="https://..." />
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
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Galerie produs</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                    {imageUploadTarget.index === null ? 'Adauga imagine' : 'Inlocuieste imaginea'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Selecteaza o imagine de pe dispozitiv si adaug-o direct in galeria produsului.
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

                <DashboardField label="Alt text">
                  <DashboardInput
                    value={imageUploadAltText}
                    onChange={(event) => setImageUploadAltText(event.target.value)}
                    placeholder="Descriere scurta pentru imagine"
                  />
                </DashboardField>

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

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={closeImageUploadModal} className="rounded-2xl">
                    Anuleaza
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isUploadingImage}
                    className="rounded-2xl bg-violet-600 px-5 py-2.5 text-white hover:bg-violet-700"
                  >
                    {isUploadingImage ? 'Se incarca...' : imageUploadTarget.index === null ? 'Adauga imaginea' : 'Salveaza imaginea'}
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

function DashboardField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function DashboardInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={`h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm shadow-none focus-visible:ring-violet-500 ${props.className ?? ''}`}
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
