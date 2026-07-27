'use client';

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

type CategoryGroup = {
  id: string;
  label: string;
  categoryIds: number[];
  categorySlugs: string[];
  children: {
    id: string;
    label: string;
    categoryIds: number[];
    categorySlugs: string[];
  }[];
};

type CatalogFiltersFormProps = {
  categoryGroups: CategoryGroup[];
  search: string;
  category: string;
  subcategory: string;
  sort: string;
  colorOptions: string[];
  selectedColors: string[];
  sizeOptions: string[];
  selectedSizes: string[];
  sortOptions: ReadonlyArray<{
    value: string;
    label: string;
  }>;
  totalProducts: number;
};

export default function CatalogFiltersForm({
  categoryGroups,
  search,
  category,
  subcategory,
  sort,
  colorOptions,
  selectedColors,
  sizeOptions,
  selectedSizes,
  sortOptions,
  totalProducts,
}: CatalogFiltersFormProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategory);
  const [selectedSort, setSelectedSort] = useState(sort);
  const [activeColors, setActiveColors] = useState(selectedColors);
  const [activeSizes, setActiveSizes] = useState(selectedSizes);

  const selectedGroup = useMemo(
    () => categoryGroups.find((group) => group.id === selectedCategory) ?? categoryGroups[0],
    [categoryGroups, selectedCategory],
  );
  const selectedSortLabel =
    sortOptions.find((option) => option.value === selectedSort)?.label ?? 'Relevante';
  const selectedCategoryLabel = selectedGroup?.label ?? 'Toate categoriile';
  const activeFilterCount =
    Number(Boolean(searchValue.trim())) +
    Number(selectedCategory !== 'Toate') +
    Number(selectedSort !== 'featured') +
    activeColors.length +
    activeSizes.length;

  const resetFilters = () => {
    flushSync(() => {
      setSearchValue('');
      setSelectedCategory('Toate');
      setSelectedSubcategory('Toate');
      setSelectedSort('featured');
      setActiveColors([]);
      setActiveSizes([]);
    });
  };

  useEffect(() => {
    if (!isMobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscrollBehavior;
    };
  }, [isMobileOpen]);

  const sharedProps = {
    searchValue,
    selectedCategory,
    selectedSubcategory,
    selectedSort,
    activeColors,
    activeSizes,
    colorOptions,
    sizeOptions,
    categoryGroups,
    selectedGroup,
    sortOptions,
    selectedSortLabel,
    selectedCategoryLabel,
    totalProducts,
    resetFilters,
    setSearchValue,
    setSelectedCategory,
    setSelectedSubcategory,
    setSelectedSort,
    setActiveColors,
    setActiveSizes,
  };

  return (
    <>
      <form id="catalog-filter-reset" action="/catalog" method="get" />

      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="group flex w-full flex-col gap-3 rounded-2xl border border-[#4f2048]/20 bg-white px-4 py-3 text-left shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition hover:border-[#4f2048]/35 hover:shadow-[0_14px_34px_rgba(79,32,72,0.14)] min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between lg:hidden"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7edf7] text-[#4f2048]">
            <FilterIcon name="filter" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold leading-5 text-slate-950">Filtreaza produsele</span>
            <span className="mt-0.5 block text-xs font-medium text-slate-500">
              {totalProducts} produse disponibile
            </span>
          </span>
        </span>
        <span className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#4f2048] px-4 py-2 text-xs font-bold text-white shadow-[0_8px_18px_rgba(79,32,72,0.24)] transition group-hover:bg-[#401839] min-[380px]:w-auto">
          {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Alege filtre'}
          <span aria-hidden="true">&gt;</span>
        </span>
      </button>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 touch-none bg-slate-950/35 lg:hidden">
          <button
            type="button"
            aria-label="Inchide filtrele"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] touch-auto overflow-hidden rounded-t-[28px] bg-white shadow-[0_-24px_70px_rgba(15,23,42,0.22)]">
            <CatalogFilterFields
              {...sharedProps}
              variant="mobile"
              onClose={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="hidden lg:block">
        <CatalogFilterFields {...sharedProps} variant="desktop" />
      </div>
    </>
  );
}

type CatalogFilterFieldsProps = {
  variant: 'mobile' | 'desktop';
  searchValue: string;
  selectedCategory: string;
  selectedSubcategory: string;
  selectedSort: string;
  activeColors: string[];
  activeSizes: string[];
  colorOptions: string[];
  sizeOptions: string[];
  categoryGroups: CategoryGroup[];
  selectedGroup: CategoryGroup;
  sortOptions: ReadonlyArray<{ value: string; label: string }>;
  selectedSortLabel: string;
  selectedCategoryLabel: string;
  totalProducts: number;
  resetFilters: () => void;
  setSearchValue: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  setSelectedSubcategory: (value: string) => void;
  setSelectedSort: (value: string) => void;
  setActiveColors: Dispatch<SetStateAction<string[]>>;
  setActiveSizes: Dispatch<SetStateAction<string[]>>;
  onClose?: () => void;
};

function CatalogFilterFields({
  variant,
  searchValue,
  selectedCategory,
  selectedSubcategory,
  selectedSort,
  activeColors,
  activeSizes,
  colorOptions,
  sizeOptions,
  categoryGroups,
  selectedGroup,
  sortOptions,
  selectedSortLabel,
  selectedCategoryLabel,
  totalProducts,
  resetFilters,
  setSearchValue,
  setSelectedCategory,
  setSelectedSubcategory,
  setSelectedSort,
  setActiveColors,
  setActiveSizes,
  onClose,
}: CatalogFilterFieldsProps) {
  const isMobile = variant === 'mobile';
  const formId = isMobile ? 'catalog-filter-form-mobile' : 'catalog-filter-form-desktop';
  const selectedSubcategoryLabel =
    selectedSubcategory === 'Toate'
      ? 'Toate'
      : selectedGroup?.children.find((child) => child.id === selectedSubcategory)?.label ?? selectedSubcategory;
  const mobileFilterChips = [
    ...(searchValue.trim() ? [{ key: 'search', label: searchValue.trim(), onRemove: () => setSearchValue('') }] : []),
    ...(selectedSort !== 'featured'
      ? [{ key: 'sort', label: selectedSortLabel, onRemove: () => setSelectedSort('featured') }]
      : []),
    ...(selectedCategory !== 'Toate'
      ? [
          {
            key: 'category',
            label: selectedCategoryLabel,
            onRemove: () => {
              setSelectedCategory('Toate');
              setSelectedSubcategory('Toate');
            },
          },
        ]
      : []),
    ...(selectedSubcategory !== 'Toate'
      ? [
          {
            key: 'subcategory',
            label: selectedSubcategoryLabel,
            onRemove: () => setSelectedSubcategory('Toate'),
          },
        ]
      : []),
    ...activeColors.map((color) => ({
      key: `color-${color}`,
      label: color,
      onRemove: () => setActiveColors((current) => current.filter((item) => item !== color)),
    })),
    ...activeSizes.map((size) => ({
      key: `size-${size}`,
      label: size,
      onRemove: () => setActiveSizes((current) => current.filter((item) => item !== size)),
    })),
  ];

  return (
    <form
      id={formId}
      action="/catalog"
      method="get"
      autoComplete="off"
      className={isMobile ? 'flex max-h-[88vh] flex-col' : 'flex flex-col gap-4'}
    >
      <div className={isMobile ? 'overflow-y-auto px-5 pb-24 pt-2' : 'space-y-4'}>
        {isMobile ? <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-slate-300" /> : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h2
              className={
                isMobile
                  ? 'text-xl font-bold text-slate-900'
                  : 'text-sm font-semibold uppercase tracking-[0.24em] text-slate-600'
              }
            >
              Filtre
            </h2>
            {isMobile ? (
              <span className="text-sm font-medium italic text-slate-400">{totalProducts} produse</span>
            ) : null}
          </div>
          {!isMobile ? (
            <button
              type="submit"
              form="catalog-filter-reset"
              className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
              onClick={resetFilters}
            >
              Reset
            </button>
          ) : null}
          {isMobile ? (
            <button
              type="button"
              aria-label="Inchide filtrele"
              className="text-2xl leading-none text-slate-800"
              onClick={onClose}
            >
              x
            </button>
          ) : null}
        </div>

        {isMobile ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {mobileFilterChips.map((chip) => (
              <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
            ))}
          </div>
        ) : null}

        <div className={isMobile ? 'mt-4' : 'space-y-2'}>
          {!isMobile ? (
            <label
              htmlFor={`${formId}-search`}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Cauta produse
            </label>
          ) : null}
          <div className="relative">
            <SearchIcon />
            <input
              id={`${formId}-search`}
              name="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (isMobile && event.key === 'Enter') {
                  event.preventDefault();
                }
              }}
              placeholder="Cauta in colectie..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4f2048] focus:bg-white"
            />
          </div>
        </div>

        <SelectRow
          id={`${formId}-category`}
          name="category"
          title="Categorie"
          icon="category"
          value={selectedCategory}
          displayValue={selectedCategoryLabel}
          count={totalProducts}
          options={categoryGroups.map((group) => ({ value: group.id, label: group.label }))}
          onChange={(value, form) => {
            flushSync(() => {
              setSelectedCategory(value);
              setSelectedSubcategory('Toate');
            });
            if (!isMobile) {
              form?.requestSubmit();
            }
          }}
        />

        {selectedGroup.children.length > 0 ? (
        <SelectRow
          id={`${formId}-subcategory`}
          name="subcategory"
          title="Subcategorie"
          icon="category"
            value={selectedSubcategory}
            displayValue={
              selectedSubcategory === 'Toate'
                ? 'Toate'
                : selectedGroup.children.find((child) => child.id === selectedSubcategory)?.label ?? 'Toate'
            }
            options={[
              { value: 'Toate', label: 'Toate' },
              ...selectedGroup.children.map((child) => ({ value: child.id, label: child.label })),
            ]}
            onChange={(value, form) => {
              flushSync(() => setSelectedSubcategory(value));
              if (!isMobile) {
                form?.requestSubmit();
              }
            }}
          />
        ) : (
          <input type="hidden" name="subcategory" value="Toate" />
        )}

        <SelectRow
          id={`${formId}-sort`}
          name="sort"
          title="Sortare"
          icon="sort"
          value={selectedSort}
          displayValue={selectedSortLabel}
          options={sortOptions}
          onChange={(value, form) => {
            flushSync(() => setSelectedSort(value));
            if (!isMobile) {
              form?.requestSubmit();
            }
          }}
        />

        <CheckboxGroup
          title="Culoare"
          icon="color"
          inputName="colors"
          options={colorOptions}
          selectedValues={activeColors}
          columns={isMobile}
          onToggle={(value, form) => {
            flushSync(() => {
              setActiveColors((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value],
              );
            });
            if (!isMobile) {
              form?.requestSubmit();
            }
          }}
        />

        <CheckboxGroup
          title="Dimensiune"
          icon="size"
          inputName="sizes"
          options={sizeOptions}
          selectedValues={activeSizes}
          onToggle={(value, form) => {
            flushSync(() => {
              setActiveSizes((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value],
              );
            });
            if (!isMobile) {
              form?.requestSubmit();
            }
          }}
        />

        <input type="hidden" name="page" value="1" />
      </div>

      {isMobile ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="mx-auto flex max-w-sm gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="h-12 min-w-[8rem] rounded-xl border border-[#4f2048]/40 bg-white px-5 text-sm font-semibold text-[#4f2048]"
            >
              Reset
            </button>
            <button
              type="submit"
              className="h-12 flex-1 rounded-xl bg-[#4f2048] px-5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(79,32,72,0.28)]"
            >
              Vezi produse
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-lg bg-[#f7edf7] px-3 py-2 text-xs font-medium text-[#4f2048]"
    >
      {label}
      <span aria-hidden="true">x</span>
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-slate-500 stroke-2"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}

function SelectRow({
  id,
  name,
  title,
  icon,
  value,
  displayValue,
  count,
  options,
  onChange,
}: {
  id: string;
  name: string;
  title: string;
  icon: FilterIconName;
  value: string;
  displayValue: string;
  count?: number;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string, form: HTMLFormElement | null) => void;
}) {
  return (
    <div className="relative border-b border-slate-100 py-4">
      <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex min-w-0 items-start gap-3">
          <FilterIcon name={icon} />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-800">{title}</span>
            <span className="mt-0.5 block truncate text-sm text-slate-400">{displayValue}</span>
          </span>
        </span>
        <span className="flex items-center gap-3">
          {count !== undefined ? (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">{count}</span>
          ) : null}
          <span className="text-xl text-slate-700">&gt;</span>
        </span>
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value, event.currentTarget.form)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxGroup({
  title,
  icon,
  inputName,
  options,
  selectedValues,
  columns = false,
  onToggle,
}: {
  title: string;
  icon: FilterIconName;
  inputName: string;
  options: string[];
  selectedValues: string[];
  columns?: boolean;
  onToggle: (value: string, form: HTMLFormElement | null) => void;
}) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-slate-100 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-3 text-sm font-bold text-slate-800">
          <FilterIcon name={icon} />
          {title}
        </p>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
          {options.length}
        </span>
      </div>
      <div
        className={
          columns
            ? 'grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1'
            : 'flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1'
        }
      >
        {options.map((option) => {
          const checked = selectedValues.includes(option);
          return (
            <label
              key={option}
              className={
                columns
                  ? 'flex min-h-9 cursor-pointer items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700'
                  : 'flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700'
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                {inputName === 'colors' ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 rounded-full border border-slate-200"
                    style={{ backgroundColor: getColorSwatch(option) }}
                  />
                ) : null}
                <span className="truncate">{option}</span>
              </span>
              <input
                type="checkbox"
                name={inputName}
                value={option}
                checked={checked}
                onChange={(event) => onToggle(option, event.currentTarget.form)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-[#4f2048]"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function getColorSwatch(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('bordo')) return '#8a0043';
  if (normalized.includes('bronz')) return '#9a6b2f';
  if (normalized.includes('capri')) return '#36aeca';
  if (normalized.includes('caramiz')) return '#e36335';
  if (normalized.includes('ciclam')) return '#b53395';
  if (normalized.includes('corai')) return '#ef6461';
  if (normalized.includes('albastru')) return '#2563eb';
  if (normalized.includes('azur')) return '#38bdf8';
  if (normalized.includes('cobalt')) return '#1d4ed8';
  if (normalized.includes('turcoaz')) return '#14b8a6';
  if (normalized.includes('bleu')) return '#7dd3fc';
  if (normalized.includes('negru')) return '#111827';
  if (normalized.includes('alb')) return '#f8fafc';
  if (normalized.includes('ros')) return '#dc2626';
  if (normalized.includes('verde')) return '#16a34a';
  if (normalized.includes('galben')) return '#facc15';
  if (normalized.includes('mov') || normalized.includes('violet')) return '#7c3aed';
  if (normalized.includes('roz')) return '#f472b6';
  if (normalized.includes('maro')) return '#7c2d12';
  if (normalized.includes('gri')) return '#94a3b8';
  if (normalized.includes('auriu')) return '#d4a017';
  if (normalized.includes('argintiu')) return '#cbd5e1';
  return colorFromText(normalized);
}

type FilterIconName = 'category' | 'sort' | 'color' | 'size' | 'filter';

function FilterIcon({ name }: { name: FilterIconName }) {
  const className = 'mt-0.5 h-5 w-5 shrink-0 fill-none stroke-slate-700 stroke-[1.8]';

  if (name === 'category') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path d="m20 13-7 7a2 2 0 0 1-2.8 0L4 13.8V4h9.8L20 10.2a2 2 0 0 1 0 2.8Z" />
        <circle cx="9" cy="9" r="1.2" />
      </svg>
    );
  }

  if (name === 'filter') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-current stroke-[1.8]">
        <path d="M4 6h16M7 12h10M10 18h4" />
        <circle cx="8" cy="6" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="12" cy="18" r="1.5" />
      </svg>
    );
  }

  if (name === 'sort') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3" />
      </svg>
    );
  }

  if (name === 'color') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 0-4H12a1.5 1.5 0 0 1 0-3h3a5.5 5.5 0 0 0 5.5-5.5C20.5 5.4 16.6 3 12 3Z" />
        <circle cx="7.8" cy="9.3" r="0.9" />
        <circle cx="10.7" cy="6.8" r="0.9" />
        <circle cx="14.4" cy="7" r="0.9" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path d="m4 16 12-12 4 4L8 20H4v-4Z" />
      <path d="m14 6 4 4M7 17l2 2" />
    </svg>
  );
}

function colorFromText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 58% 48%)`;
}
