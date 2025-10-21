#!/bin/bash
# Script to replace all instances of user.name with user.user
# This is needed after database migration from 'name' to 'user' field

# Replace in all TypeScript files
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  # Skip type definition files and node_modules
  if [[ $file != *"node_modules"* ]] && [[ $file != *".d.ts" ]]; then
    # Replace user.name with user.user
    sed -i 's/\.name\b/.user/g' "$file"
    echo "Processed: $file"
  fi
done

echo "Migration complete!"
