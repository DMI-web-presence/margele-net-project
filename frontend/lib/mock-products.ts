export type MockProduct = {
  id: number;
  name: string;
  description: string | null;
  tag?: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number | null;
  createdAt: string;
};

export const mockProducts: MockProduct[] = [
  {
    id: 9001,
    name: 'Globuri lemn pentru decor de Craciun',
    description: 'Set de ornamente din lemn pentru pictura, decupaj si decoratiuni festive.',
    tag: 'craciun, lemn, decoratiuni',
    price: '12.90',
    imageUrl: '/landing-page-image.webp',
    categoryId: 1,
    createdAt: '2026-07-13T08:00:00.000Z',
  },
  {
    id: 9002,
    name: 'Margele rosii pentru decoratiuni festive',
    description: 'Margele sticla in nuante de rosu pentru globuri, bratari si ornamente handmade.',
    tag: 'craciun, rosu, margele',
    price: '16.90',
    imageUrl: '/landing-page-image.webp',
    categoryId: 1,
    createdAt: '2026-07-13T08:05:00.000Z',
  },
  {
    id: 9003,
    name: 'Clopotei metalici aurii',
    description: 'Accesorii mici si luminoase pentru coronite, ambalaje cadou si decoratiuni de iarna.',
    tag: 'craciun, auriu, metal',
    price: '8.50',
    imageUrl: '/landing-page-image.webp',
    categoryId: 1,
    createdAt: '2026-07-13T08:10:00.000Z',
  },
  {
    id: 9004,
    name: 'Panglica satinata verde',
    description: 'Panglica decorativa pentru funde, ambalaje si proiecte handmade de sezon.',
    tag: 'craciun, verde, ambalaj',
    price: '6.40',
    imageUrl: '/landing-page-image.webp',
    categoryId: 1,
    createdAt: '2026-07-13T08:15:00.000Z',
  },
  {
    id: 9005,
    name: 'Figurine brad din lemn natur',
    description: 'Figurine usoare din lemn, potrivite pentru pictura, gravare si decoratiuni pentru brad.',
    tag: 'craciun, natural, figurine',
    price: '10.00',
    imageUrl: '/landing-page-image.webp',
    categoryId: 1,
    createdAt: '2026-07-13T08:20:00.000Z',
  },
  {
    id: 9006,
    name: 'Mix paiete argintii si aurii',
    description: 'Paiete stralucitoare pentru ornamente, felicitari si accesorii de sarbatoare.',
    tag: 'craciun, argintiu, auriu',
    price: '9.70',
    imageUrl: '/landing-page-image.webp',
    categoryId: 1,
    createdAt: '2026-07-13T08:25:00.000Z',
  },
];
