jest.mock('@open-mercato/ui/backend/utils/apiCall', () => ({
  apiCall: jest.fn(),
}))

import { apiCall, type ApiCallResult } from '@open-mercato/ui/backend/utils/apiCall'
import { fetchWmsCatalogVariant, type WmsCatalogVariant } from '../catalogVariantLookup'

const mockApiCall = apiCall as jest.MockedFunction<typeof apiCall>
const VARIANT_ID = '7c1f2e8a-4b5d-4c3e-9f1a-2b3c4d5e6f70'

function respond(status: number, result: { items?: WmsCatalogVariant[] } | null): ApiCallResult<unknown> {
  return {
    ok: status >= 200 && status < 300,
    status,
    result,
    response: new Response(JSON.stringify(result ?? {}), { status }),
    cacheStatus: null,
  }
}

describe('fetchWmsCatalogVariant', () => {
  beforeEach(() => {
    mockApiCall.mockReset()
  })

  it('returns the catalog variant and suppresses the access-denied flash', async () => {
    mockApiCall.mockResolvedValue(respond(200, { items: [{ id: VARIANT_ID, sku: 'LO-SENS-IND-5M', name: 'Sensor' }] }))

    const variant = await fetchWmsCatalogVariant(VARIANT_ID, 'Failed to load SKU.')

    expect(variant).toEqual({ id: VARIANT_ID, sku: 'LO-SENS-IND-5M', name: 'Sensor' })
    const [url, init] = mockApiCall.mock.calls[0]
    expect(String(url)).toContain(`/api/catalog/variants?id=${VARIANT_ID}`)
    expect(init?.headers).toEqual({ 'x-om-forbidden-redirect': '0' })
  })

  it('falls back to the bare variant id when the user has no catalog access', async () => {
    mockApiCall.mockResolvedValue(respond(403, { items: [] }))

    await expect(fetchWmsCatalogVariant(VARIANT_ID, 'Failed to load SKU.')).resolves.toEqual({ id: VARIANT_ID })
  })

  it('returns null when the variant does not exist', async () => {
    mockApiCall.mockResolvedValue(respond(200, { items: [] }))

    await expect(fetchWmsCatalogVariant(VARIANT_ID, 'Failed to load SKU.')).resolves.toBeNull()
  })

  it('still fails on other errors', async () => {
    mockApiCall.mockResolvedValue(respond(500, null))

    await expect(fetchWmsCatalogVariant(VARIANT_ID, 'Failed to load SKU.')).rejects.toBeTruthy()
  })
})
