import { afterEach, describe, expect, it, vi } from 'vitest'
import fixture from './demo.json'
import {
  connectorMarketplaceListings,
  reviewConnectorMarketplaceInstall,
  verifyConnectorCatalog
} from './service'

const trustedKey: string = JSON.parse(fixture.signature).public_key

afterEach(() => vi.unstubAllEnvs())

describe('development Connector Marketplace', () => {
  it('verifies both transports and rejects unsigned or modified content', () => {
    expect(
      verifyConnectorCatalog(fixture, trustedKey).map((entry) => entry.template.transport)
    ).toContain('stdio')
    expect(
      verifyConnectorCatalog(fixture, trustedKey).map((entry) => entry.template.transport)
    ).toContain('streamable_http')
    expect(() =>
      verifyConnectorCatalog(
        {
          ...fixture,
          signature: JSON.stringify({ ...JSON.parse(fixture.signature), signature: '' })
        },
        trustedKey
      )
    ).toThrow(/signature/)
    const changed = structuredClone(fixture)
    changed.releases['releases/demo-greeting.json'] += ' '
    expect(() => verifyConnectorCatalog(changed, trustedKey)).toThrow(/digest/)
  })

  it('binds installation to reviewed fields and declared credential names', () => {
    vi.stubEnv('OPEN_SCIENCE_E2E_CONNECTOR_MARKETPLACE', '1')
    for (const entry of connectorMarketplaceListings()) {
      const request = {
        ...entry.template,
        marketplaceDigest: entry.digest,
        ...(entry.template.requiredSecrets
          ? { headerCredentialIds: { Authorization: 'local-binding' } }
          : {})
      }
      expect(reviewConnectorMarketplaceInstall(request)).toEqual({
        source: entry.source,
        name: entry.name,
        version: entry.version,
        digest: entry.digest
      })
      expect(() => reviewConnectorMarketplaceInstall({ ...request, args: ['changed'] })).toThrow(
        /changed/
      )
      expect(() =>
        reviewConnectorMarketplaceInstall({ ...request, marketplaceDigest: '' })
      ).toThrow(/unavailable/)
      expect(() =>
        reviewConnectorMarketplaceInstall({
          ...request,
          headerCredentialIds: { Unexpected: 'binding' }
        })
      ).toThrow(/changed/)
    }
  })

  it('keeps the development key outside the production catalog', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('OPEN_SCIENCE_E2E_CONNECTOR_MARKETPLACE', '')
    expect(connectorMarketplaceListings()).toEqual([])
  })
})
