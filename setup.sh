#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm install
npm run build
if [ ! -f .env.local ]; then cp .env.example .env.local; chmod 600 .env.local; fi
