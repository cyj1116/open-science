import type { ConnectorTemplateDefinition } from './settings-types'

export type ConnectorMarketplaceReceipt = {
  source: string
  name: string
  version: string
  digest: string
}

export type ConnectorMarketplaceListing = ConnectorMarketplaceReceipt & {
  template: ConnectorTemplateDefinition
  tools: string[]
}
