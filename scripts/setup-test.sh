#!/bin/bash
# Setup script for Gemini layout detection test

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Gemini Layout Detection Test - Setup                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Check if tsx is installed
echo "📦 Checking dependencies..."
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npm/npx not found. Please install Node.js first."
    exit 1
fi

# 2. Install dependencies
echo "📦 Installing @google/generative-ai..."
npm install @google/generative-ai

echo "📦 Installing tsx (TypeScript runner)..."
npm install -D tsx

# 3. Check for API key
echo ""
echo "🔑 Checking for API key..."
if [ -z "$GOOGLE_AI_API_KEY" ]; then
    echo "❌ GOOGLE_AI_API_KEY not set"
    echo ""
    echo "To get an API key:"
    echo "  1. Visit: https://aistudio.google.com/app/apikey"
    echo "  2. Click 'Create API Key' (no credit card required)"
    echo "  3. Copy the key"
    echo "  4. Export it:"
    echo "     export GOOGLE_AI_API_KEY='your-key-here'"
    echo ""
    exit 1
else
    echo "✅ API key found: ${GOOGLE_AI_API_KEY:0:10}...${GOOGLE_AI_API_KEY: -4}"
fi

# 4. Create test-samples directory
echo ""
echo "📁 Creating test-samples directory..."
mkdir -p test-samples

# 5. Extract sample pages from PDFs
echo ""
echo "🖼️  Extracting sample pages..."

# Check if pdftoppm is installed
if ! command -v pdftoppm &> /dev/null; then
    echo "⚠️  Warning: pdftoppm not found (install poppler-utils)"
    echo "   macOS: brew install poppler"
    echo "   Ubuntu: apt-get install poppler-utils"
    echo ""
    echo "   Skipping page extraction. You'll need to extract manually."
else
    # Extract page 8 from kalika (complex multi-column)
    if [ -f "sample files/kalika few pgs.pdf" ]; then
        echo "   Extracting page 8 from kalika sample (complex)..."
        pdftoppm -png -r 300 -f 8 -l 8 "sample files/kalika few pgs.pdf" "test-samples/kalika-page-8"
        mv test-samples/kalika-page-8-1.png test-samples/kalika-page-8.png 2>/dev/null || true
        echo "   ✅ Created: test-samples/kalika-page-8.png"
    fi

    # Extract page 5 from simple sample
    if [ -f "sample files/san with hindi-ch4 mahanirvana.pdf" ]; then
        echo "   Extracting page 5 from mahanirvana sample (simple)..."
        pdftoppm -png -r 300 -f 5 -l 5 "sample files/san with hindi-ch4 mahanirvana.pdf" "test-samples/mahanirvana-page-5"
        mv test-samples/mahanirvana-page-5-1.png test-samples/mahanirvana-page-5.png 2>/dev/null || true
        echo "   ✅ Created: test-samples/mahanirvana-page-5.png"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "To run the test:"
echo "  npx tsx scripts/test-gemini-layout.ts test-samples/kalika-page-8.png"
echo ""
echo "Or test the simpler layout:"
echo "  npx tsx scripts/test-gemini-layout.ts test-samples/mahanirvana-page-5.png"
echo ""
