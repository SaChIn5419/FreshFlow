#!/bin/bash

# ============================================================
#  FreshFlow — Stop Script
#  Run this from the project root: ./stop.sh
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$PROJECT_DIR/.freshflow.pids"

echo ""
echo -e "${YELLOW}Stopping FreshFlow...${NC}"

if [ ! -f "$PID_FILE" ]; then
  echo -e "${RED}  No running session found. (Is FreshFlow running?)${NC}"
  exit 0
fi

while IFS= read -r pid; do
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    echo -e "${GREEN}  ✓ Stopped process $pid${NC}"
  fi
done < "$PID_FILE"

rm -f "$PID_FILE"

echo -e "${GREEN}  FreshFlow stopped.${NC}"
echo ""
