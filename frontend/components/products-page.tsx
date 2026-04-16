'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  categoryId: number | null;
  createdAt: string;
};

type ProductsPageProps = {
  products: Product[];
};

const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function ProductsPage({ products }: ProductsPageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(products.map((product) => product.categoryId ?? 0)),
    );
    return values.map((value) => ({
      id: value,
      label: value === 0 ? 'Uncategorized' : `Category ${value}`,
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const text = `${product.name} ${product.description ?? ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .filter((product) => {
        if (category === 'all') return true;
        return String(product.categoryId ?? '0') === category;
      })
      .sort((a, b) => {
        if (sort === 'price-asc') {
          return Number(a.price) - Number(b.price);
        }
        if (sort === 'price-desc') {
          return Number(b.price) - Number(a.price);
        }
        return a.id - b.id;
      });
  }, [products, search, category, sort]);

  return (
    <div className="space-y-8">
      <Card className="bg-slate-50 p-8 shadow-sm">
        <div className="sm:flex sm:items-end sm:justify-between sm:space-x-8">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Curated Supplies</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              The Craft Essentials
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Every material is an artifact of inspiration, selected for its tactile quality and artistic potential.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:mt-0 sm:grid-cols-2">
            <Card className="rounded-3xl bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Search
              </label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search our collection..."
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </Card>
            <Card className="rounded-3xl bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Filters
              </label>
              <div className="mt-3 space-y-3">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </Card>
          </div>
        </div>
      </Card>

      <section>
        <div className="flex items-center justify-between gap-4 sm:flex-row sm:gap-0">
          <div>
            <p className="text-sm font-medium text-slate-500">Showing {filteredProducts.length} products</p>
          </div>
          <div className="text-sm text-slate-500">
            {filteredProducts.length === 0 ? 'No products match your search.' : `Filtered from ${products.length} total products.`}
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden rounded-[2rem] border-slate-200 transition hover:-translate-y-1 hover:shadow-md">
              <Link href={`/products/${product.id}`} className="group block">
                <div className="relative aspect-[4/3] bg-slate-100">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No image available
                    </div>
                  )}
                </div>
              </Link>
              <div className="space-y-4 p-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.35em] text-slate-500">
                    <span>{product.categoryId ? `Category ${product.categoryId}` : 'Uncategorized'}</span>
                    {Number(product.price) > 20 ? <Badge>Popular</Badge> : null}
                  </div>
                  <Link href={`/products/${product.id}`} className="text-lg font-semibold text-slate-900 transition hover:text-indigo-600">
                    {product.name}
                  </Link>
                  <p className="text-sm leading-6 text-slate-600">{product.description ?? 'High-quality craft material.'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
                <p className="text-lg font-semibold text-slate-900">{numberFormatter.format(Number(product.price))}</p>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    View details
                  </Link>
                  <Button>Add to Cart</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
