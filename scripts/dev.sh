#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
export PATH="${HOME}/.dotnet:${PATH}"
export DOTNET_ROOT="${HOME}/.dotnet"
dotnet run --project "${root}/backend/ExpertWeb.Api" &
api=$!
trap 'kill "$api"' EXIT INT TERM
npm run dev --prefix "${root}/frontend"
