'use client';

type CatalogPerPageSelectProps = {
  value: number;
  options: number[];
  search: string;
  category: string;
  subcategory: string;
  sort: string;
  colors: string[];
  sizes: string[];
};

export default function CatalogPerPageSelect({
  value,
  options,
  search,
  category,
  subcategory,
  sort,
  colors,
  sizes,
}: CatalogPerPageSelectProps) {
  return (
    <form action="/catalog" method="get" className="flex items-center gap-2 text-sm text-slate-500">
      {search ? <input type="hidden" name="search" value={search} /> : null}
      {category && category !== 'Toate' ? <input type="hidden" name="category" value={category} /> : null}
      {subcategory && subcategory !== 'Toate' ? <input type="hidden" name="subcategory" value={subcategory} /> : null}
      {sort && sort !== 'featured' ? <input type="hidden" name="sort" value={sort} /> : null}
      {colors.map((color) => (
        <input key={`color-${color}`} type="hidden" name="colors" value={color} />
      ))}
      {sizes.map((size) => (
        <input key={`size-${size}`} type="hidden" name="sizes" value={size} />
      ))}

      <label htmlFor="catalog-top-per-page" className="font-medium">
        Pe pagina
      </label>
      <select
        id="catalog-top-per-page"
        name="perPage"
        value={value}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </form>
  );
}
