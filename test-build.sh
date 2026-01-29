#!/bin/bash

set -e

echo "🔨 Building all components..."

echo ""
echo "1. Building MCP Server..."
cd figma-mcp-server
npm run build
cd ..

echo ""
echo "2. Building Control Center..."
cd control-center
npm run build
cd ..

echo ""
echo "3. Building Plugin..."
cd figma-plugin-bridge
npm run build
cd ..

echo ""
echo "✅ All builds completed successfully!"

echo ""
echo "🧪 Running quick tests..."

# Test 1: Check app-config source exists
if [ -f "figma-mcp-server/src/app-config.ts" ]; then
    echo "✓ app-config.ts source exists"
else
    echo "✗ app-config.ts source missing"
    exit 1
fi

# Test 2: Check app-config compiled exists
if [ -f "figma-mcp-server/dist/app-config.js" ]; then
    echo "✓ app-config.js compiled exists"
else
    echo "✗ app-config.js compiled missing - run: cd figma-mcp-server && npm run build"
    exit 1
fi

# Test 3: Check APP_CONFIG name in source
if grep -q 'name: "FigYah"' figma-mcp-server/src/app-config.ts; then
    echo "✓ App name is FigYah (source)"
else
    echo "✗ App name incorrect in source"
    exit 1
fi

# Test 4: Check APP_CONFIG name in compiled
if grep -q '"name": "FigYah"' figma-mcp-server/dist/app-config.js || grep -q 'name: "FigYah"' figma-mcp-server/dist/app-config.js; then
    echo "✓ App name is FigYah (compiled)"
else
    echo "✗ App name incorrect in compiled - rebuild needed"
    exit 1
fi

# Test 5: Check storage dir
if grep -q 'storageDir: ".figyah"' figma-mcp-server/src/app-config.ts; then
    echo "✓ Storage directory is .figyah"
else
    echo "✗ Storage directory incorrect"
    exit 1
fi

# Test 4: Check builds succeeded
if [ -f "figma-mcp-server/dist/index.js" ]; then
    echo "✓ MCP server built"
else
    echo "✗ MCP server build failed"
    exit 1
fi

# Test 4b: Check app-config.js exists in dist
if [ -f "figma-mcp-server/dist/app-config.js" ]; then
    echo "✓ app-config.js in dist directory"
    # Verify it exports APP_CONFIG
    if grep -q "APP_CONFIG" figma-mcp-server/dist/app-config.js; then
        echo "✓ app-config.js exports APP_CONFIG"
    else
        echo "✗ app-config.js missing APP_CONFIG export"
        exit 1
    fi
else
    echo "✗ app-config.js missing from dist directory"
    exit 1
fi

if [ -d "control-center/dist" ]; then
    echo "✓ Control center built"
else
    echo "✗ Control center build failed"
    exit 1
fi

if [ -f "figma-plugin-bridge/dist/code.js" ]; then
    echo "✓ Plugin built"
else
    echo "✗ Plugin build failed"
    exit 1
fi

# Test 5: Check for any remaining "FigConnect" references (excluding node_modules and .git)
REMAINING=$(grep -r "FigConnect" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 2>/dev/null | grep -v "BUILD_AND_TEST.md" | grep -v "test-build.sh" | wc -l | tr -d ' ')
if [ "$REMAINING" -gt 0 ]; then
    echo "⚠ Found $REMAINING remaining 'FigConnect' references (may be intentional in docs)"
    grep -r "FigConnect" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 2>/dev/null | grep -v "BUILD_AND_TEST.md" | grep -v "test-build.sh" | head -5
else
    echo "✓ No 'FigConnect' references found (except in docs)"
fi

echo ""
echo "✅ All quick tests passed!"
echo ""
echo "Next steps:"
echo "1. Start MCP server: cd figma-mcp-server && npm start"
echo "2. Start control center: cd control-center && npm run dev"
echo "3. Test endpoints: curl http://localhost:3030/api/health"
echo "4. See BUILD_AND_TEST.md for full testing checklist"
