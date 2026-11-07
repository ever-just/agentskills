---
name: daytona-mcp
description: Use when creating, listing, inspecting, deleting, or running shell commands in Daytona workspaces (sandboxes) through the daytona-mcp MCP server hosted at https://daytona-mcp.vercel.app/mcp. Covers the five tools, their arguments, JSON-RPC calls, and common errors.
---

# daytona-mcp

A lightweight MCP server that wraps the Daytona REST API (https://app.daytona.io/api). It exposes five tools for workspaces (Daytona sandboxes). It is stateless and uses JSON-RPC over HTTP POST.

## Endpoint

- URL: `https://daytona-mcp.vercel.app/mcp`
- Method: POST only, body is a JSON-RPC 2.0 message with `Content-Type: application/json`.
- GET returns 405. There is no SSE stream.
- Auth: none on the MCP endpoint itself. The server holds the Daytona API key in its own environment (`DAYTONA_API_KEY`).

## Tools

| Tool | Arguments | Purpose |
|---|---|---|
| `create_workspace` | `name` (optional string), `image` (optional string: snapshot or image) | Creates a workspace and returns its record, including its id. |
| `list_workspaces` | none | Lists all workspaces in the Daytona account. |
| `get_workspace` | `workspace_id` (required) | Returns one workspace's details and state. |
| `delete_workspace` | `workspace_id` (required) | Deletes a workspace. Irreversible. |
| `execute_command` | `workspace_id` (required), `command` (required string), `cwd` (optional), `timeout` (optional, seconds) | Runs a shell command inside a workspace and returns its output. |

Each tool returns its result as a text content block containing JSON. A failure returns `isError: true` with the Daytona error text.

## Procedure

1. Confirm the endpoint is live with `tools/list`. It should return the five tools above.
2. To work in a workspace, call `list_workspaces` first and reuse an existing id if one fits. Create a new one only when needed.
3. Create with `create_workspace`. Save the returned `id` from the result. Do not guess ids.
4. Run work with `execute_command`, passing the saved `workspace_id`. Set `cwd` and `timeout` for long jobs.
5. Clean up with `delete_workspace` once the work is done, unless the user asks to keep it. Confirm the id before deleting.

## JSON-RPC examples

List tools:

```bash
curl -s -X POST https://daytona-mcp.vercel.app/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

List workspaces:

```bash
curl -s -X POST https://daytona-mcp.vercel.app/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_workspaces","arguments":{}}}'
```

Run a command:

```bash
curl -s -X POST https://daytona-mcp.vercel.app/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"execute_command","arguments":{"workspace_id":"WORKSPACE_ID","command":"echo hello"}}}'
```

## Errors

- `DAYTONA_API_KEY is not configured in Vercel environment variables`: the key is missing from the Vercel project. Add it under Settings, then Environment Variables, then redeploy.
- `Daytona <METHOD> <path> failed: 401` or `403`: the key is invalid or lacks access. Rotate the key in Vercel.
- `Daytona ... failed: 404`: the workspace id is wrong, or the server's Daytona path is out of date. Verify the id with `list_workspaces` first.
- `Unknown tool: <name>` (JSON-RPC error -32602): the tool name is misspelled. Use the names in the table.

## Notes

- The server's Daytona endpoint paths were written without a check against Daytona's current API documentation. If calls return 404 for valid ids, check the paths in the server's source before trusting this skill.
- Treat `delete_workspace` as destructive. Do not run it on a workspace the user did not name.
