#!/usr/bin/env bash

# Source this file from the project root:
#   source scripts/activate-local-node.sh
# It only changes PATH for the current shell session.
# The project-root assumption keeps this script compatible with both bash and zsh.

PROJECT_ROOT="${PROJECT_ROOT:-$PWD}"
export PATH="$PROJECT_ROOT/.tools/node/bin:$PATH"

echo "Local Node environment enabled:"
node --version
npm --version
