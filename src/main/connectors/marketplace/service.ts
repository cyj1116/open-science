import { z } from 'zod'
import {
  parseMarketplaceSignature,
  verifyMarketplaceRoot,
  sha256
} from '../../specialist/marketplace/protocol'
import type {
  ConnectorMarketplaceListing,
  ConnectorMarketplaceReceipt
} from '../../../shared/connector-marketplace'
import type { AddCustomServerRequest } from '../../../shared/settings-types'
import fixture from './demo.json'

const demoKey = 'MCowBQYDK2VwAyEABeYsdJGUsAMR7QDNF+KG4uaf2+Yzg2k7NI4fPLyan0Q='
const releaseSchema = z
  .object({
    version: z.string(),
    tools: z.array(z.string()),
    template: z
      .object({
        schemaVersion: z.literal(1),
        kind: z.literal('open-science.connector'),
        name: z.string(),
        displayName: z.string(),
        description: z.string(),
        transport: z.enum(['stdio', 'streamable_http']),
        command: z.string().optional(),
        args: z.array(z.string()).optional(),
        requiredSecrets: z
          .object({
            environment: z.array(z.string()).optional(),
            headers: z.array(z.string()).optional()
          })
          .strict()
          .optional(),
        url: z.string().url().optional()
      })
      .strict()
  })
  .strict()

type SignedCatalog = { root: string; signature: string; releases: Record<string, string> }
export function verifyConnectorCatalog(
  catalog: SignedCatalog,
  trustedKey: string
): ConnectorMarketplaceListing[] {
  const signature = parseMarketplaceSignature(Buffer.from(catalog.signature))
  if (
    signature.public_key !== trustedKey ||
    !verifyMarketplaceRoot(Buffer.from(catalog.root), signature)
  )
    throw new Error('Marketplace signature verification failed')
  const root = z
    .object({
      schema_version: z.literal(1),
      revision: z.string(),
      marketplace: z.object({ id: z.string(), name: z.string() }),
      connectors: z.array(
        z.object({
          id: z.string(),
          latest: z.object({
            version: z.string(),
            release: z.object({ path: z.string(), sha256: z.string() })
          })
        })
      )
    })
    .parse(JSON.parse(catalog.root))
  return root.connectors.map((entry) => {
    const bytes = catalog.releases[entry.latest.release.path]
    if (typeof bytes !== 'string' || sha256(Buffer.from(bytes)) !== entry.latest.release.sha256)
      throw new Error('Marketplace digest verification failed')
    const release = releaseSchema.parse(JSON.parse(bytes))
    if (release.template.name !== entry.id || release.version !== entry.latest.version)
      throw new Error('Marketplace release identity mismatch')
    return {
      ...release,
      source: root.marketplace.name,
      name: entry.id,
      digest: entry.latest.release.sha256
    }
  })
}

export function connectorMarketplaceListings(): ConnectorMarketplaceListing[] {
  return process.env.NODE_ENV === 'development' ||
    process.env.OPEN_SCIENCE_E2E_CONNECTOR_MARKETPLACE === '1'
    ? verifyConnectorCatalog(fixture, demoKey)
    : []
}

function sameNames(required: string[] = [], bindings: Record<string, string> = {}): boolean {
  return (
    required.length === Object.keys(bindings).length && required.every((name) => !!bindings[name])
  )
}

export function reviewConnectorMarketplaceInstall(
  request: AddCustomServerRequest
): ConnectorMarketplaceReceipt {
  const entry = connectorMarketplaceListings().find(
    (item) => item.digest === request.marketplaceDigest
  )
  if (!entry) throw new Error('Marketplace release unavailable')
  const { template, source, name, version, digest } = entry
  if (
    request.name !== name ||
    request.transport !== template.transport ||
    request.command !== template.command ||
    request.url !== template.url ||
    JSON.stringify(request.args ?? []) !== JSON.stringify(template.args ?? []) ||
    !sameNames(template.requiredSecrets?.environment, request.envCredentialIds) ||
    !sameNames(template.requiredSecrets?.headers, request.headerCredentialIds) ||
    request.oauthCredentialId
  )
    throw new Error('Marketplace configuration changed')
  return { source, name, version, digest }
}
