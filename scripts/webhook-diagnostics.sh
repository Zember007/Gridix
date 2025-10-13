#!/bin/bash

# Webhook Diagnostics Script
# This script helps diagnose webhook configuration issues

set -e

echo "🔍 Webhook Diagnostics Script"
echo "=============================="

# Check if webhook is installed
if ! command -v webhook &> /dev/null; then
    echo "❌ Webhook is not installed"
    echo "📦 Install with: sudo apt install webhook"
    exit 1
else
    echo "✅ Webhook is installed"
fi

# Check webhook service status
if systemctl is-active --quiet webhook; then
    echo "✅ Webhook service is running"
else
    echo "❌ Webhook service is not running"
    echo "🔧 Start with: sudo systemctl start webhook"
fi

# Check webhook configuration
CONFIG_FILE="/etc/webhook/hooks.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Webhook configuration file exists: $CONFIG_FILE"
    
    # Validate JSON
    if python3 -m json.tool "$CONFIG_FILE" > /dev/null 2>&1; then
        echo "✅ Webhook configuration is valid JSON"
    else
        echo "❌ Webhook configuration contains invalid JSON"
    fi
else
    echo "❌ Webhook configuration file not found: $CONFIG_FILE"
    echo "📝 Create configuration file with webhook-config.json"
fi

# Check if auto-ssl-nginx.sh script exists and is executable
SCRIPT_PATH="/usr/local/bin/auto-ssl-nginx.sh"
if [ -f "$SCRIPT_PATH" ]; then
    echo "✅ Auto SSL script exists: $SCRIPT_PATH"
    if [ -x "$SCRIPT_PATH" ]; then
        echo "✅ Auto SSL script is executable"
    else
        echo "❌ Auto SSL script is not executable"
        echo "🔧 Fix with: sudo chmod +x $SCRIPT_PATH"
    fi
else
    echo "❌ Auto SSL script not found: $SCRIPT_PATH"
    echo "📝 Copy script with: sudo cp scripts/auto-ssl-nginx.sh $SCRIPT_PATH"
fi

# Check webhook port
WEBHOOK_PORT=${WEBHOOK_PORT:-9000}
if netstat -tlnp 2>/dev/null | grep -q ":$WEBHOOK_PORT "; then
    echo "✅ Webhook is listening on port $WEBHOOK_PORT"
else
    echo "❌ Webhook is not listening on port $WEBHOOK_PORT"
    echo "🔧 Check webhook service status and configuration"
fi

# Test webhook endpoint
WEBHOOK_URL=${WEBHOOK_URL:-"http://localhost:9000"}
echo ""
echo "🌐 Testing webhook endpoint: $WEBHOOK_URL"

# Test GET request
if curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" | grep -q "200\|404"; then
    echo "✅ Webhook endpoint is accessible"
else
    echo "❌ Webhook endpoint is not accessible"
    echo "🔧 Check if webhook server is running and port is correct"
fi

# Test specific webhook
WEBHOOK_SECRET=${WEBHOOK_SECRET:-"6365ef2da7cbb1fa5d440764867f81c3557c7de795d4aca556898af850a72941"}
TEST_DOMAIN="test.example.com"

echo ""
echo "🧪 Testing webhook with test domain: $TEST_DOMAIN"

# Test status webhook
STATUS_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"domain\":\"$TEST_DOMAIN\",\"action\":\"status\",\"webhook_secret\":\"$WEBHOOK_SECRET\"}" \
    -o /dev/null)

if [ "$STATUS_RESPONSE" = "200" ]; then
    echo "✅ Status webhook test passed"
else
    echo "❌ Status webhook test failed (HTTP $STATUS_RESPONSE)"
fi

# Check webhook logs
echo ""
echo "📋 Recent webhook logs:"
if [ -f "/var/log/webhook.log" ]; then
    tail -10 /var/log/webhook.log
else
    echo "No webhook logs found at /var/log/webhook.log"
    echo "Check systemd logs with: sudo journalctl -u webhook -f"
fi

echo ""
echo "🔧 Troubleshooting steps:"
echo "1. Check webhook service: sudo systemctl status webhook"
echo "2. Check webhook logs: sudo journalctl -u webhook -f"
echo "3. Verify configuration: cat $CONFIG_FILE"
echo "4. Test script manually: sudo $SCRIPT_PATH status example.com"
echo "5. Check firewall: sudo ufw status"
echo "6. Check if port is open: netstat -tlnp | grep $WEBHOOK_PORT"

echo ""
echo "📝 Configuration checklist:"
echo "- [ ] Webhook service is running"
echo "- [ ] Configuration file exists and is valid JSON"
echo "- [ ] Auto SSL script exists and is executable"
echo "- [ ] Webhook is listening on correct port"
echo "- [ ] Firewall allows webhook port"
echo "- [ ] Webhook secret is configured correctly"
