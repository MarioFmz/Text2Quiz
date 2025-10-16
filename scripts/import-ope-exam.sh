#!/bin/bash

# Script to import OPE exams into Text2Quiz
# Usage: ./import-ope-exam.sh <pdf-path> <user-email> [title] [category] [tags] [source]

set -e

echo "📚 OPE Exam Import Tool"
echo "======================="
echo ""

# Check arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <pdf-path> <user-email> [title] [category] [tags] [source]"
    echo ""
    echo "Examples:"
    echo "  $0 exam.pdf user@example.com"
    echo "  $0 exam.pdf user@example.com \"OPE Navarra 2025\" \"Oposiciones\" \"OPE,TCAE,2025\""
    echo ""
    exit 1
fi

PDF_PATH="$1"
USER_EMAIL="$2"
TITLE="${3:-OPE Exam}"
CATEGORY="${4:-Oposiciones}"
TAGS="${5:-OPE,Examen Oficial}"
SOURCE="${6:-Examen Oficial OPE}"

# Check if PDF exists
if [ ! -f "$PDF_PATH" ]; then
    echo "❌ Error: PDF file not found: $PDF_PATH"
    exit 1
fi

# Get user ID from Supabase using email
echo "🔍 Looking up user ID for: $USER_EMAIL"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Query Supabase for user ID
USER_ID=$(curl -s "${VITE_SUPABASE_URL}/rest/v1/users?email=eq.${USER_EMAIL}&select=id" \
    -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
    | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data[0]?.id || '')")

if [ -z "$USER_ID" ]; then
    echo "⚠️  Could not find user automatically. Please provide your user ID:"
    read -p "User ID: " USER_ID
fi

if [ -z "$USER_ID" ]; then
    echo "❌ Error: User ID is required"
    exit 1
fi

echo "✅ User ID: $USER_ID"
echo ""

# Run the import script
echo "🚀 Starting import..."
echo "   PDF: $PDF_PATH"
echo "   Title: $TITLE"
echo "   Category: $CATEGORY"
echo "   Tags: $TAGS"
echo ""

node scripts/importExam.js "$PDF_PATH" "$USER_ID" "$TITLE" "$CATEGORY" "$TAGS" "$SOURCE"

echo ""
echo "✅ Done!"
