#!/bin/bash

# Script to check all Edge Functions for syntax/type errors and bundle success before publish
# Usage: ./scripts/check-edge-functions.sh

echo "Starting Edge Function validation and bundle check..."
FAILED=0
FUNCTIONS_DIR="supabase/functions"
TEMP_DIR="/tmp/edge-function-bundles"

# Check if deno is installed
if ! command -v deno &> /dev/null; then
    echo "Error: deno is not installed."
    exit 1
fi

mkdir -p "$TEMP_DIR"

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
        echo "1. Running deno check..."
        deno check "$dir/index.ts" --no-lock
        
        if [ $? -ne 0 ]; then
            echo "❌ Validation failed for $func_name"
            FAILED=1
            continue
        fi

        echo "2. Running deno bundle..."
        # Note: deno bundle is deprecated in favor of deno compile/emit in newer versions, 
        # but standard for Supabase Edge Functions bundling checks.
        deno bundle "$dir/index.ts" "$TEMP_DIR/$func_name.js" --no-lock &> "$TEMP_DIR/$func_name.log"
        
        if [ $? -ne 0 ]; then
            echo "❌ Bundle failed for $func_name"
            cat "$TEMP_DIR/$func_name.log"
            FAILED=1
        else
            echo "✅ $func_name is valid and can be bundled"
        fi
    else
        echo "⚠️ No index.ts found in $dir, skipping."
    fi
done

# Cleanup
rm -rf "$TEMP_DIR"

echo "----------------------------------------------------"
if [ $FAILED -eq 1 ]; then
    echo "FAILED: One or more Edge Functions have validation or bundling errors."
    exit 1
else
    echo "SUCCESS: All Edge Functions passed check and bundle tests."
    exit 0
fi

