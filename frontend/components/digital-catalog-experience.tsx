'use client';

import { useMemo, useState } from 'react';
import type { CatalogProductGroup } from '@/components/catalog-page-product-groups';
import EmbeddedCatalogViewer from '@/components/embedded-catalog-viewer';

type DigitalCatalogExperienceProps = {
  title: string;
  description: string;
  embedUrl: string;
  externalUrl: string;
  documentTitle: string;
  updatedLabel?: string;
  pageCount: number;
  productGroups: CatalogProductGroup[];
};

export default function DigitalCatalogExperience({
  title,
  description,
  embedUrl,
  externalUrl,
  documentTitle,
  updatedLabel,
  pageCount,
  productGroups,
}: DigitalCatalogExperienceProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const anchoredEmbedUrl = useMemo(() => `${embedUrl}#${currentPage}`, [currentPage, embedUrl]);
  const currentProducts = useMemo(
    () => productGroups.find((group) => group.page === currentPage)?.products ?? [],
    [currentPage, productGroups],
  );

  return (
    <EmbeddedCatalogViewer
      title={title}
      description={description}
      embedUrl={anchoredEmbedUrl}
      externalUrl={externalUrl}
      documentTitle={documentTitle}
      updatedLabel={updatedLabel}
      pageCount={pageCount}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      products={currentProducts}
    />
  );
}
