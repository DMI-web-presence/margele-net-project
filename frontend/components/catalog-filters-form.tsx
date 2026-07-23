'use client';

import { useMemo, useState } from 'react';
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
}: CatalogFiltersFormProps) {
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

  return (
    <>
      <form id="catalog-filter-reset" action="/catalog" method="get" />
      <form className="flex flex-col gap-4" action="/catalog" method="get" autoComplete="off">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">Filtre</h2>
          <button
            type="submit"
            form="catalog-filter-reset"
            className="cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="catalog-search" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Cauta produse
          </label>
          <input
            id="catalog-search"
            name="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Cauta in colectie..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="catalog-category" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Categorie
          </label>
          <select
            id="catalog-category"
            name="category"
            value={selectedCategory}
            onChange={(event) => {
              const form = event.currentTarget.form;
              const nextCategory = event.target.value;

              flushSync(() => {
                setSelectedCategory(nextCategory);
                setSelectedSubcategory('Toate');
              });

              form?.requestSubmit();
            }}
            className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          >
            {categoryGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="catalog-sort" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Sortare
          </label>
          <select
            id="catalog-sort"
            name="sort"
            value={selectedSort}
            onChange={(event) => {
              const form = event.currentTarget.form;
              const nextSort = event.target.value;

              flushSync(() => setSelectedSort(nextSort));
              form?.requestSubmit();
            }}
            className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {selectedGroup.children.length > 0 ? (
          <div className="space-y-2">
            <label htmlFor="catalog-subcategory" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Subcategorie
            </label>
            <select
              id="catalog-subcategory"
              name="subcategory"
              value={selectedSubcategory}
              onChange={(event) => {
                const form = event.currentTarget.form;
                const nextSubcategory = event.target.value;

                flushSync(() => setSelectedSubcategory(nextSubcategory));
                form?.requestSubmit();
              }}
              className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              <option value="Toate">Toate</option>
              {selectedGroup.children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="subcategory" value="Toate" />
        )}

        <CheckboxGroup
          title="Culoare"
          inputName="colors"
          options={colorOptions}
          selectedValues={activeColors}
          onToggle={(value, form) => {
            flushSync(() => {
              setActiveColors((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value],
              );
            });

            form?.requestSubmit();
          }}
        />

        <CheckboxGroup
          title="Dimensiune"
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

            form?.requestSubmit();
          }}
        />

        <input type="hidden" name="page" value="1" />
      </form>
    </>
  );
}

function CheckboxGroup({
  title,
  inputName,
  options,
  selectedValues,
  onToggle,
}: {
  title: string;
  inputName: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string, form: HTMLFormElement | null) => void;
}) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {options.map((option) => {
            const checked = selectedValues.includes(option);
            return (
              <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name={inputName}
                  value={option}
                  checked={checked}
                  onChange={(event) => onToggle(option, event.currentTarget.form)}
                  className="h-4 w-4 cursor-pointer accent-indigo-600"
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
