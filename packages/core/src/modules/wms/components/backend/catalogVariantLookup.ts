"use client"

import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { raiseCrudError } from '@open-mercato/ui/backend/utils/serverErrors'

export type WmsCatalogVariant = {
  id: string
  sku?: string | null
  name?: string | null
  is_active?: boolean | null
  created_at?: string | null
}

type CatalogVariantPage = { items?: WmsCatalogVariant[] }

// Catalog details only label WMS views, so a WMS-only user without catalog access still
// gets the stock data: a 403 resolves to the bare variant id, and the access-denied
// flash is suppressed because the user never asked for catalog data.
export async function fetchWmsCatalogVariant(
  catalogVariantId: string,
  fallbackErrorMessage: string,
): Promise<WmsCatalogVariant | null> {
  const params = new URLSearchParams({ id: catalogVariantId, page: '1', pageSize: '1' })
  const call = await apiCall<CatalogVariantPage>(`/api/catalog/variants?${params.toString()}`, {
    headers: { 'x-om-forbidden-redirect': '0' },
  })
  if (call.status === 403) return { id: catalogVariantId }
  if (!call.ok) await raiseCrudError(call.response, fallbackErrorMessage)
  return call.result?.items?.[0] ?? null
}
