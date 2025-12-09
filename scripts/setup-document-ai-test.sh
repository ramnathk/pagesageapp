#!/bin/bash
# Setup script for Document AI OCR testing

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Document AI OCR Test - Setup                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Check prerequisites
echo "📦 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"
echo ""

# 2. Install dependencies
echo "📦 Installing @google-cloud/documentai..."
npm install @google-cloud/documentai

echo "📦 Installing tsx (if not already installed)..."
npm install -D tsx

echo ""

# 3. Check for service account key
echo "🔑 Checking authentication..."
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "❌ GOOGLE_APPLICATION_CREDENTIALS not set"
    echo ""
    echo "To set up authentication:"
    echo "  1. Visit: https://console.cloud.google.com/iam-admin/serviceaccounts"
    echo "  2. Create a service account (or use existing)"
    echo "  3. Grant 'Document AI API Editor' role"
    echo "  4. Create and download a JSON key"
    echo "  5. Export the path:"
    echo "     export GOOGLE_APPLICATION_CREDENTIALS='/path/to/key.json'"
    echo ""
    exit 1
else
    if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        echo "❌ Service account key file not found: $GOOGLE_APPLICATION_CREDENTIALS"
        exit 1
    fi
    echo "✅ Service account key found: $GOOGLE_APPLICATION_CREDENTIALS"
fi

echo ""

# 4. Check for project ID
echo "🏗️  Checking project configuration..."
if [ -z "$GOOGLE_CLOUD_PROJECT_ID" ] && [ -z "$GCP_PROJECT_ID" ]; then
    echo "❌ GOOGLE_CLOUD_PROJECT_ID not set"
    echo ""
    echo "Set your Google Cloud project ID:"
    echo "  export GOOGLE_CLOUD_PROJECT_ID='your-project-id'"
    echo ""
    exit 1
else
    PROJECT_ID="${GOOGLE_CLOUD_PROJECT_ID:-$GCP_PROJECT_ID}"
    echo "✅ Project ID: $PROJECT_ID"
fi

echo ""

# 5. Check for processor ID
echo "🔧 Checking Document AI processor..."
if [ -z "$DOCUMENT_AI_PROCESSOR_ID" ]; then
    echo "⚠️  DOCUMENT_AI_PROCESSOR_ID not set"
    echo ""
    echo "To create an OCR processor:"
    echo "  1. Visit: https://console.cloud.google.com/ai/document-ai/processors"
    echo "  2. Click 'CREATE PROCESSOR'"
    echo "  3. Select 'Document OCR' → 'Enterprise Document OCR'"
    echo "  4. Choose region (us or eu)"
    echo "  5. Copy the Processor ID from the details page"
    echo "  6. Export it:"
    echo "     export DOCUMENT_AI_PROCESSOR_ID='your-processor-id'"
    echo ""
    echo "⚠️  You'll need to set this before running the test!"
else
    echo "✅ Processor ID: ${DOCUMENT_AI_PROCESSOR_ID:0:10}...${DOCUMENT_AI_PROCESSOR_ID: -4}"
fi

echo ""

# 6. Check location
LOCATION="${DOCUMENT_AI_LOCATION:-us}"
echo "🌍 Location: $LOCATION"
if [ "$LOCATION" != "us" ] && [ "$LOCATION" != "eu" ]; then
    echo "⚠️  Warning: Location should be 'us' or 'eu'"
    echo "   Current value: $LOCATION"
    echo "   To change: export DOCUMENT_AI_LOCATION='us'"
fi

echo ""

# 7. Verify test samples exist
echo "📁 Checking test samples..."
if [ ! -d "test-samples" ]; then
    echo "⚠️  Warning: test-samples directory not found"
    echo "   Run scripts/setup-test.sh first to extract PDF pages"
else
    echo "✅ test-samples directory exists"

    # Check for sample images
    SAMPLE_COUNT=$(find test-samples -name "*.png" -type f | wc -l | tr -d ' ')
    if [ "$SAMPLE_COUNT" -eq 0 ]; then
        echo "⚠️  No PNG images found in test-samples/"
        echo "   Run scripts/setup-test.sh to extract sample pages"
    else
        echo "✅ Found $SAMPLE_COUNT sample image(s)"
    fi
fi

echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Show what's configured
echo "Configuration Summary:"
echo "  Project ID: ${PROJECT_ID}"
echo "  Location: ${LOCATION}"
echo "  Processor ID: ${DOCUMENT_AI_PROCESSOR_ID:-'NOT SET'}"
echo "  Credentials: ${GOOGLE_APPLICATION_CREDENTIALS}"
echo ""

if [ -z "$DOCUMENT_AI_PROCESSOR_ID" ]; then
    echo "⚠️  Set DOCUMENT_AI_PROCESSOR_ID before running tests!"
    echo ""
fi

echo "To run the test:"
echo "  npx tsx scripts/test-document-ai-ocr.ts test-samples/kalika-page-8-08.png"
echo ""
