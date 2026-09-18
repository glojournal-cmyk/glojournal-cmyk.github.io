#!/bin/bash
# Skip Vercel deployments unless the serverless Gemini backend or its runtime config changed.
# Vercel Ignored Build Step semantics:
#   exit 0 = skip deployment
#   exit 1 = continue deployment

set -e

# First deployment / shallow history: build safely.
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "No parent commit available; building."
  exit 1
fi

# Only these files affect the Vercel-hosted Ask AI backend.
if git diff --quiet HEAD^ HEAD --   api/   vercel.json   package.json   package-lock.json   pnpm-lock.yaml   yarn.lock   ignore-build-step.sh
then
  echo "No Vercel backend changes; skipping deployment."
  exit 0
fi

echo "Vercel backend change detected; building."
exit 1
