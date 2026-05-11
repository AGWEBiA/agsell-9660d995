#!/bin/bash

# Script to check all Edge Functions for syntax/type errors before publish
# Usage: ./scripts/check-edge-functions.sh

echo "Starting Edge Function validation check..."
FAILED=0
FUNCTIONS_DIR="supabase/functions"

# Check if deno is installed
if ! command -v deno &> /dev/null; then
    echo "Error: deno is not installed."
    exit 1
fi

# Iterate through each directory in supabase/functions
for dir in $FUNCTIONS_DIR/*/; do
    # Skip _shared directory
    if [[ "$dir" == *"_shared"* ]]; then
        continue
    fi

    func_name=$(basename "$dir")
    echo "----------------------------------------------------"
    echo "Checking function: $func_name..."

    # Check index.ts if it exists
    if [ -f "$dir/index.ts" ]; then
        echo "Running deno check..."
        # In Deno 2.x, deno check is the standard way to validate types and syntax.
        # We use --no-lock to avoid issues with lockfiles in the temporary build environment.
        deno check "$dir/index.ts" --no-lock
        
        if [ $? -ne 0 ]; then
            echo "❌ Validation failed for $func_name"
            FAILED=1
        else
            echo "✅ $func_name is valid"
        fi
    else
        echo "⚠️ No index.ts found in $dir, skipping."
    fi
done

echo "----------------------------------------------------"
if [ $FAILED -eq 1 ]; then
    echo "FAILED: One or more Edge Functions have validation errors."
    exit 1
else
    echo "SUCCESS: All Edge Functions passed validation checks."
    exit 0
fi


