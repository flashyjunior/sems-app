#!/bin/bash

# Post-build script to prepare files for Tauri bundling
# Copies the built Next.js files to the public directory

echo "[SEMS Build] Preparing files for Tauri..."

# Create public directory if it doesn't exist
mkdir -p public

# Copy the built Next.js files to public
# Note: We copy the .next folder and package.json so the server can serve them
echo "[SEMS Build] Copying Next.js build output..."

# Copy static files
if [ -d ".next/static" ]; then
  cp -r .next/static public/
  echo "[SEMS Build] Copied static files"
fi

# Copy standalone server files if available
if [ -d ".next/standalone" ]; then
  echo "[SEMS Build] Standalone mode detected"
fi

# Create a simple index.html that loads the app
echo "[SEMS Build] Creating index.html..."
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEMS - Smart Dispensing System</title>
  <script>
    // Redirect to the Next.js app
    window.location.href = '/index.html';
  </script>
</head>
<body>
  <p>Loading SEMS...</p>
</body>
</html>
EOF

echo "[SEMS Build] Done!"
