#!/bin/bash
# Clean Database Restore Script
# Drops all existing tables/schema, then restores from backup

set -e

echo "🧹 Clean Database Restore"
echo "=========================="
echo ""

# Check if dump file exists
if [ -z "$1" ]; then
    echo "Usage: ./clean_restore_db.sh <NEON_CONNECTION_STRING>"
    echo ""
    echo "Example:"
    echo "  ./clean_restore_db.sh 'postgresql://user:pass@host/db?sslmode=require'"
    echo ""
    echo "Get your connection string from:"
    echo "  https://console.neon.tech"
    exit 1
fi

NEON_CONNECTION_STRING="$1"

if [ ! -f "latest_from_heroku.dump" ]; then
    echo "❌ Error: latest_from_heroku.dump not found!"
    echo "Make sure you're in the project root directory."
    exit 1
fi

echo "✅ Found dump file: latest_from_heroku.dump"
echo ""
echo "⚠️  WARNING: This will DELETE ALL existing data and tables!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled."
    exit 0
fi

echo ""
echo "🗑️  Step 1: Dropping all existing tables and schema..."
echo ""

# Drop everything in the public schema
psql "$NEON_CONNECTION_STRING" << EOF
-- Drop all tables in public schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO public;
SET search_path TO public;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database cleaned successfully!"
else
    echo "❌ Error cleaning database!"
    exit 1
fi

echo ""
echo "📦 Step 2: Restoring from backup..."
echo ""

# Restore the database
pg_restore -v --no-owner --no-acl -d "$NEON_CONNECTION_STRING" latest_from_heroku.dump

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Restore complete!"
    echo ""
    echo "🔍 Verifying restore..."
    
    # Quick verification
    psql "$NEON_CONNECTION_STRING" -c "SELECT COUNT(*) as user_count FROM accounts_user;" 2>/dev/null || echo "Note: Could not verify - but restore may have worked"
    psql "$NEON_CONNECTION_STRING" -c "SELECT COUNT(*) as event_count FROM ufc_event;" 2>/dev/null || echo "Note: Could not verify - but restore may have worked"
    
    echo ""
    echo "🎉 Done! Your database has been restored."
    echo ""
    echo "Next steps:"
    echo "  1. Test your app"
    echo "  2. Try logging in with your old credentials"
else
    echo ""
    echo "❌ Restore failed. Check the errors above."
    exit 1
fi

