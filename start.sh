#!/bin/bash

# ============================================================
#  FreshFlow — Start Script
#  Run this from the project root: ./start.sh
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
PID_FILE="$PROJECT_DIR/.freshflow.pids"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       FreshFlow — Starting Up        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Cleanup old PIDs if any ───────────────────────────────
if [ -f "$PID_FILE" ]; then
  echo -e "${YELLOW}⚠ Found previous session. Stopping old processes...${NC}"
  while IFS= read -r pid; do
    kill "$pid" 2>/dev/null || true
  done < "$PID_FILE"
  rm -f "$PID_FILE"
  sleep 1
fi

# ── Start Backend ─────────────────────────────────────────
echo -e "${BLUE}▶ Starting Backend API (port 8000)...${NC}"

cd "$BACKEND_DIR"
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 --log-level warning &
BACKEND_PID=$!
echo "$BACKEND_PID" >> "$PID_FILE"

echo -e "${GREEN}  ✓ Backend running (PID: $BACKEND_PID)${NC}"

# ── Wait for backend to be ready ─────────────────────────
echo -e "${YELLOW}  Waiting for backend to be ready...${NC}"
for i in {1..20}; do
  if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1 || \
     curl -s http://localhost:8000/api/v1/auth/me > /dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
echo -e "${GREEN}  ✓ Backend is ready!${NC}"
echo ""

# ── Start Frontend ────────────────────────────────────────
echo -e "${BLUE}▶ Starting Frontend (port 3000)...${NC}"

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >> "$PID_FILE"

echo -e "${GREEN}  ✓ Frontend running (PID: $FRONTEND_PID)${NC}"
echo ""

# ── Done ─────────────────────────────────────────────────
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🚀 FreshFlow is Live!       ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Admin Portal:  http://localhost:3000 ║${NC}"
echo -e "${GREEN}║  Customer App:  http://localhost:3000 ║${NC}"
echo -e "${GREEN}║  API Docs:      http://localhost:8000/docs ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  To stop: run  ./stop.sh             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Keep script alive (show logs) ────────────────────────
wait
