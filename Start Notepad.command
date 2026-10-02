#!/bin/bash
cd "$(dirname "$0")"
PORT=8765
if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  open "http://127.0.0.1:${PORT}"
  echo "Notepad is already running at http://127.0.0.1:${PORT}"
  exit 0
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 was not found. Open index.html in Chrome instead."
  exit 1
fi
(sleep 0.6 && open "http://127.0.0.1:${PORT}") &
echo "Notepad is running at http://127.0.0.1:${PORT}"
echo "Close this window to stop it."
exec python3 -m http.server "$PORT"
