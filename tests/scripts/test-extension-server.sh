#!/bin/bash

echo "🔍 Testing VS Code Extension Server..."
echo "ℹ️  Make sure you've started the server via the VS Code extension first:"
echo "   1. Open Command Palette (Cmd+Shift+P)"
echo "   2. Run: 'MCP Dynamics 365: Start HTTP Server'"
echo "   3. Check the 'MCP Dynamics 365' output channel"
echo ""

echo "ℹ️  Loading environment variables from: $(realpath .env)"
# Wait for user confirmation
read -p "Press Enter when the extension server is running..."

echo ""
echo "🧪 Testing server connection..."

# Get port from environment variable or default to 3300
PORT=${MCP_HTTP_PORT:-3300}

# Load .env if present
if [ -f ".env" ]; then
    echo "📂 Loading environment variables from .env file..."
    set -a
    source .env
    set +a
fi


# Test if port is open
if nc -z localhost $PORT 2>/dev/null; then
    echo "✅ Port $PORT is open"
    
    echo ""
    echo "🔗 Testing MCP initialization..."
    
    response=$(curl -s -D headers.txt -X POST http://localhost:$PORT/mcp \
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

    if grep -q "WWW-Authenticate" headers.txt; then
        echo "🔒 Server requires OAuth authentication."
        # If using GitHub OAuth, use authorization code flow
        if [ -n "${OAUTH_CLIENT_ID}" ] && [ -n "${OAUTH_CLIENT_SECRET}" ] && [ "${OAUTH_AUTH_URL}" = "https://github.com/login/oauth/authorize" ]; then
            REDIRECT_URI="http://localhost:8080" # You can change this to your registered redirect URI
            echo "🌐 Please open the following URL in your browser to authorize:"
            echo "${OAUTH_AUTH_URL}?client_id=${OAUTH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo,user"
            echo "After authorizing, you will be redirected to a URL like: ${REDIRECT_URI}?code=YOUR_CODE"
            read -p "Paste the 'code' value from the URL here: " OAUTH_AUTH_CODE
            echo "🔑 Exchanging code for access token..."
            token_response=$(curl -s -X POST "${OAUTH_TOKEN_URL}" \
                -H "Accept: application/json" \
                -d "client_id=${OAUTH_CLIENT_ID}" \
                -d "client_secret=${OAUTH_CLIENT_SECRET}" \
                -d "code=${OAUTH_AUTH_CODE}" \
                -d "redirect_uri=${REDIRECT_URI}")
            MCP_ACCESS_TOKEN=$(echo "$token_response" | grep -o '"access_token":"[^"]*' | grep -o '[^\"]*$')
            echo "Found access token: ${MCP_ACCESS_TOKEN}"
        fi
        # If not, prompt for token
        if [ -z "$MCP_ACCESS_TOKEN" ]; then
            read -p "Enter a valid OAuth access token: " MCP_ACCESS_TOKEN
        fi
        echo "🔁 Retrying with Authorization header..."
        response=$(curl -s -X POST http://localhost:$PORT/mcp \
          -H "Content-Type: application/json" \
          -H "Accept: application/json, text/event-stream" \
          -H "Authorization: Bearer $MCP_ACCESS_TOKEN" \
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
    fi
    rm -f headers.txt

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
