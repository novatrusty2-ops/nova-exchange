#!/bin/sh
set -eu
app_password=$(cat /run/secrets/app_password)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres --set=app_password="$app_password" <<'SQL'
CREATE ROLE pouchpay_local LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE pouchpay_local OWNER pouchpay_local;
CREATE DATABASE pouchpay_shadow OWNER pouchpay_local;
SQL
