import { createServer } from 'node:http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

// Each MCP connection test starts a new session. Keep the demo stateless between requests.
const http = createServer(async (request, response) => {
  if (request.url !== '/mcp') {
    response.writeHead(404).end()
    return
  }
  const mcp = new McpServer({ name: 'demo-greeting', version: '1.0.0' })
  mcp.registerTool('hello', {}, async () => ({ content: [{ type: 'text', text: 'Hello' }] }))
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  })
  response.once('close', () => {
    void mcp.close()
  })
  await mcp.connect(transport)
  await transport.handleRequest(request, response)
})
http.listen(7876, '127.0.0.1', () =>
  console.log('Demo MCP server listening on http://127.0.0.1:7876/mcp')
)
