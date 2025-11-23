#!/bin/bash
# Stop all services (LiveKit server, backend, frontend)

echo "=========================================="
echo "Stopping All Services"
echo "=========================================="
echo ""

# Stop LiveKit server (port 7880)
echo "Stopping LiveKit server..."
if netstat -ano 2>/dev/null | grep -q ":7880.*LISTENING"; then
    # Windows: Find PID using netstat and kill
    PIDS=$(netstat -ano | grep ":7880.*LISTENING" | awk '{print $5}' | sort -u)
    for PID in $PIDS; do
        if [ ! -z "$PID" ] && [ "$PID" != "0" ]; then
            echo "  Killing LiveKit server process (PID: $PID)..."
            taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
        fi
    done
    echo "  ✅ LiveKit server stopped"
else
    echo "  ℹ️  LiveKit server not running"
fi

# Stop backend (Python/uv processes running agent.py)
echo ""
echo "Stopping backend agent..."
PIDS=$(ps aux 2>/dev/null | grep -E "[p]ython.*agent.py|[u]v.*agent" | awk '{print $2}' | sort -u)
if [ ! -z "$PIDS" ]; then
    for PID in $PIDS; do
        echo "  Killing backend process (PID: $PID)..."
        taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
    done
    echo "  ✅ Backend stopped"
else
    echo "  ℹ️  Backend not running"
fi

# Stop frontend (Node/pnpm processes on port 3000)
echo ""
echo "Stopping frontend..."
if netstat -ano 2>/dev/null | grep -q ":3000.*LISTENING"; then
    PIDS=$(netstat -ano | grep ":3000.*LISTENING" | awk '{print $5}' | sort -u)
    for PID in $PIDS; do
        if [ ! -z "$PID" ] && [ "$PID" != "0" ]; then
            echo "  Killing frontend process (PID: $PID)..."
            taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
        fi
    done
    echo "  ✅ Frontend stopped"
else
    echo "  ℹ️  Frontend not running"
fi

# Also try to kill any remaining node/python processes related to the project
echo ""
echo "Cleaning up any remaining processes..."
pkill -f "livekit-server" 2>/dev/null || true
pkill -f "agent.py" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true

echo ""
echo "=========================================="
echo "All services stopped!"
echo "=========================================="
echo ""
echo "Wait 2-3 seconds for ports to be released, then restart services."

