#!/usr/bin/env bash
echo "=== 1. CHECKING ENVIRONMENT DATABASE CONFIG ==="
if [ -f .env ]; then
    echo "Found .env file. Extracting database credentials..."
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found in current directory. Checking PM2 environment..."
fi

echo -e "\n=== 2. QUERYING TOKEN LIQUIDITY & STBL POOLS ==="
if command -v mysql &> /dev/null && [ -n "$DB_DATABASE" ]; then
    mysql -h "${DB_HOST:-localhost}" -u "${DB_USERNAME:-root}" -p"${DB_PASSWORD}" "${DB_DATABASE}" -e "
        SELECT 'Liquidity Pools' AS category, COUNT(*) AS total_rows FROM liquidity_pools;
        SELECT pool_address, token_a, token_b, reserve_a, reserve_b, updated_at FROM liquidity_pools LIMIT 5;
    " 2>/dev/null || echo "MySQL query failed or table name differs."
elif command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -c "
        SELECT 'Liquidity Pools' AS category, COUNT(*) AS total_rows FROM liquidity_pools;
        SELECT pool_address, token_a, token_b, reserve_a, reserve_b, updated_at FROM liquidity_pools LIMIT 5;
    " 2>/dev/null || echo "PostgreSQL query failed via DATABASE_URL."
else
    echo "CLI DB client not found or credentials not exported in env. Checking via Node.js ORM connection..."
    node -e "
        const fs = require('fs');
        console.log('Inspecting project directory for database configuration files...');
        if (fs.existsSync('src/config') || fs.existsSync('prisma')) {
            console.log('Database schema or ORM config detected. Check your ORM migration status.');
        }
    "
fi

echo -e "\n=== 3. QUERYING MARKET PRICES & STBL VALUES ==="
if command -v mysql &> /dev/null && [ -n "$DB_DATABASE" ]; then
    mysql -h "${DB_HOST:-localhost}" -u "${DB_USERNAME:-root}" -p"${DB_PASSWORD}" "${DB_DATABASE}" -e "
        SELECT 'Market Prices' AS category, COUNT(*) AS total_rows FROM market_prices;
        SELECT symbol, price_usd, source, updated_at FROM market_prices LIMIT 10;
    " 2>/dev/null || echo "MySQL market_prices query skipped."
elif command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -c "
        SELECT 'Market Prices' AS category, COUNT(*) AS total_rows FROM market_prices;
        SELECT symbol, price_usd, source, updated_at FROM market_prices LIMIT 10;
    " 2>/dev/null || echo "Postgres market_prices query skipped."
fi

echo -e "\n=== 4. VERIFICATION COMPLETE ==="
