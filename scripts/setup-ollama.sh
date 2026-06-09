#!/usr/bin/env bash
set -euo pipefail

CHAT_MODEL="${OLLAMA_CHAT_MODEL:-qwen2.5:3b}"
EMBED_MODEL="${OLLAMA_EMBED_MODEL:-nomic-embed-text}"

# Resolve ollama binary: PATH, then macOS app bundle
OLLAMA_BIN=""
if command -v ollama &>/dev/null; then
  OLLAMA_BIN="ollama"
elif [[ -x "/Applications/Ollama.app/Contents/Resources/ollama" ]]; then
  OLLAMA_BIN="/Applications/Ollama.app/Contents/Resources/ollama"
fi

if [[ -z "$OLLAMA_BIN" ]]; then
  echo "Ollama is not installed."
  echo "Install from https://ollama.com/download then re-run: npm run setup:ollama"
  exit 1
fi

# Ensure server is running (macOS app or background serve)
if ! curl -sf http://localhost:11434/api/tags &>/dev/null; then
  echo "Starting Ollama..."
  if [[ -d "/Applications/Ollama.app" ]]; then
    open -a Ollama
    echo "Waiting for Ollama to start..."
    for i in {1..30}; do
      if curl -sf http://localhost:11434/api/tags &>/dev/null; then
        break
      fi
      sleep 1
    done
  else
    "$OLLAMA_BIN" serve &
    sleep 2
  fi
fi

if ! curl -sf http://localhost:11434/api/tags &>/dev/null; then
  echo "Ollama did not start. Open the Ollama app manually, then re-run this script."
  exit 1
fi

echo "Pulling chat model: $CHAT_MODEL"
"$OLLAMA_BIN" pull "$CHAT_MODEL"

echo "Pulling embedding model: $EMBED_MODEL"
"$OLLAMA_BIN" pull "$EMBED_MODEL"

echo ""
echo "Ollama is ready. Start the app with: npm run dev"
