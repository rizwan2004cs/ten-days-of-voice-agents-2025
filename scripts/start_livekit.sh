#!/bin/bash
# Start LiveKit Server for local development

echo "=========================================="
echo "Starting LiveKit Server"
echo "=========================================="
echo ""

# Check if livekit-server is available
if ! command -v livekit-server &> /dev/null; then
    echo "ERROR: livekit-server is not installed or not in PATH"
    echo ""
    echo "Please install livekit-server:"
    echo "  Windows: Download from https://github.com/livekit/livekit/releases"
    echo "  Or use: curl -sSL https://get.livekit.io | bash"
    exit 1
fi

# Check if port 7880 is already in use
if netstat -ano 2>/dev/null | grep -q ":7880.*LISTENING" || lsof -i :7880 2>/dev/null | grep -q LISTEN; then
    echo "⚠️  Port 7880 is already in use. LiveKit server may already be running."
    echo "   If you want to restart, stop the existing process first."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Starting LiveKit server on port 7880..."
echo "Server will be available at: ws://localhost:7880"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

# Start the server
livekit-server --dev

