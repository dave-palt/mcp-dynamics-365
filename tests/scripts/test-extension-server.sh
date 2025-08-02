#!/bin/bash

echo "🔍 Testing VS Code Extension Server..."
echo "ℹ️  Make sure you've started the server via the VS Code extension first:"
echo "   1. Open Command Palette (Cmd+Shift+P)"
echo "   2. Run: 'MCP Dynamics 365: Start HTTP Server'"
echo "   3. Check the 'MCP Dynamics 365' output channel"
echo ""

# Wait for user confirmation
read -p "Press Enter when the extension server is running..."

echo ""
echo "🧪 Testing server connection..."

# Get port from environment variable or default to 3300
PORT=${MCP_HTTP_PORT:-3300}

# Test if port is open
if nc -z localhost $PORT 2>/dev/null; then
    echo "✅ Port $PORT is open"
    
    echo ""
    echo "🔗 Testing MCP initialization..."
    
    response=$(curl -s -X POST http://localhost:$PORT/mcp \
      -H "Content-Type: application/json" \
      -H "Accept: application/json, text/event-stream" \
      -d '{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
          "protocolVersion": "2024-11-05",
          "capabilities": {},
          "clientInfo": {
            "name": "test-client",
            "version": "1.0.0"
          }
        }
      }')
    
    if [[ $response == *"result"* ]]; then
        echo "✅ Server responded successfully!"
        echo "📋 Response: $response"
    else
        echo "❌ Server responded with error:"
        echo "📋 Response: $response"
    fi
else
    echo "❌ Port $PORT is not open"
    echo "🔧 Make sure the extension server is running"
fi

echo ""
echo "🎯 Next steps:"
echo "   - Check the 'MCP Dynamics 365' output channel in VS Code"
echo "   - Look for enhanced logging with emojis"
echo "   - The server should show transport mode and URLs"
