import { expect } from '@playwright/test'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { test } from './fixtures/electron-app'

test.beforeAll(() => {
  process.env.OPEN_SCIENCE_E2E_CONNECTOR_MARKETPLACE = '1'
})
test.afterAll(() => {
  delete process.env.OPEN_SCIENCE_E2E_CONNECTOR_MARKETPLACE
})

test('reviews, installs and probes signed stdio and HTTP Connectors with Main disabled', async ({
  app
}) => {
  const mcp = new McpServer({ name: 'demo', version: '1.0.0' })
  mcp.registerTool('hello', {}, async () => ({ content: [{ type: 'text', text: 'Hello' }] }))
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: randomUUID })
  await mcp.connect(transport)
  const http = createServer((request, response) => {
    void transport.handleRequest(request, response)
  })
  try {
    await new Promise<void>((resolve, reject) =>
      http.once('error', reject).listen(7876, '127.0.0.1', resolve)
    )
    const page = await app.completeOnboarding()
    await page.getByRole('button', { name: 'Resource center', exact: true }).click()
    await page
      .getByRole('navigation', { name: 'Resource center' })
      .getByRole('button', { name: 'Connectors', exact: true })
      .click()
    await page.getByRole('tab', { name: 'Marketplace', exact: true }).click()
    for (const [name, target] of [
      ['Demo Greeting', 'python3'],
      ['Demo HTTP', 'http://127.0.0.1:7876/mcp']
    ]) {
      const card = page
        .getByRole('listitem')
        .filter({ has: page.getByRole('button', { name, exact: true }) })
      await card.getByRole('button', { name: 'Install', exact: true }).click()
      const review = page.getByRole('dialog')
      await expect(review).toContainText(target)
      await review.getByRole('button', { name: 'Continue', exact: true }).click()
      await page.getByRole('checkbox', { name: 'I trust this connector', exact: true }).check()
      await page.getByRole('button', { name: 'Add connector', exact: true }).click()
      await expect(page.getByText('Connected', { exact: true })).toBeVisible()
      const receipt = await page.evaluate(
        async (name) =>
          (await window.api.settings.listConnectors()).customServers.find(
            (server) => server.displayName === name
          ),
        name
      )
      expect(receipt).toMatchObject({
        enabled: false,
        marketplace: { version: '1.0.0', digest: expect.stringMatching(/^[0-9a-f]{64}$/) }
      })
    }
  } finally {
    await mcp.close()
    http.closeAllConnections()
    http.close()
  }
})
