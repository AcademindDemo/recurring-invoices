#!/usr/bin/env bash
input=$(cat)
file=$(jq -r '.tool_input.file_path // empty' <<<"$input")
[[ "$file" == *.json ]] || exit 0
[[ -f "$file" ]] || exit 0
if ! jq empty "$file" >/dev/null 2>&1; then
  echo "Invalid JSON in $file" >&2
  exit 2
fi
exit 0
