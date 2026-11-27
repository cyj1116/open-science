// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ConnectorMarketplaceListing } from '../../../../shared/connector-marketplace'
import { createInitialSettingsState, useSettingsStore } from '@/stores/settings-store'
import { ConnectorMarketplace } from './ConnectorMarketplace'

const entry: ConnectorMarketplaceListing = {
  name: 'example',
  source: 'Example catalog',
  version: '2.0.0',
  digest: 'b'.repeat(64),
  template: {
    schemaVersion: 1,
    kind: 'open-science.connector',
    name: 'example',
    displayName: 'Example service',
    transport: 'streamable_http',
    url: 'https://example.test/mcp',
    requiredSecrets: { headers: ['Authorization'] }
  },
  tools: ['lookup']
}

beforeEach(() => {
  useSettingsStore.setState({ ...createInitialSettingsState(), marketplaceListings: [entry] })
  window.api = { settings: { addCustomServer: vi.fn() } } as never
})
afterEach(cleanup)

it('shows the endpoint, credentials and declared tools before continuing to setup', () => {
  const navigate = vi.fn()
  render(<ConnectorMarketplace onNavigate={navigate} />)
  const install = screen.getByRole('button', { name: 'Install' })
  fireEvent.click(install)
  const review = within(screen.getByRole('dialog'))
  expect(review.getByText('Community')).toBeTruthy()
  expect(review.getByText(/example.test\/mcp/)).toBeTruthy()
  expect(review.getByText(/Authorization/)).toBeTruthy()
  expect(review.getByText(/lookup/)).toBeTruthy()
  fireEvent.click(review.getByRole('button', { name: 'Cancel' }))
  expect(navigate).not.toHaveBeenCalled()
  fireEvent.click(install)
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(navigate).toHaveBeenCalledWith({
    kind: 'add',
    transport: 'remote',
    marketplaceDigest: entry.digest,
    template: entry.template
  })
})

it('requires confirmation after showing both installed and proposed endpoints', () => {
  const update = vi.fn().mockResolvedValue(undefined)
  const oldDigest = 'a'.repeat(64)
  useSettingsStore.setState({
    updateCustomServer: update,
    customServers: [
      {
        id: 'local-id',
        name: entry.name,
        displayName: entry.template.displayName,
        enabled: false,
        transport: 'streamable_http',
        url: 'https://old.example.test/mcp',
        marketplace: { source: entry.source, name: entry.name, version: '1.0.0', digest: oldDigest }
      }
    ]
  })
  render(<ConnectorMarketplace onNavigate={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'View details' }))
  const review = within(screen.getByRole('dialog'))
  expect(review.getByText(/old.example.test/)).toBeTruthy()
  expect(review.getByText(/URL.*https:\/\/example.test/)).toBeTruthy()
  expect(update).not.toHaveBeenCalled()
  fireEvent.click(review.getByRole('button', { name: 'Confirm update' }))
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'local-id',
      marketplaceUpdate: { expectedDigest: oldDigest, digest: entry.digest }
    })
  )
})
