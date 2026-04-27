#!/usr/bin/env bash
# SaaS multi-tenancy smoke test.
#
# Runs end-to-end against a *test* Minasa server (NOT production) to verify:
#   1. Default tenant exists and existing admin can still log in (back-compat).
#   2. POST /api/tenants/signup creates a brand-new tenant + admin atomically.
#   3. The new admin's token is scoped — they can't see the default tenant's
#      data, and the default tenant's admin can't see theirs.
#   4. Per-tenant uniqueness — the same username "admin" exists in both
#      tenants without collision.
#
# Usage:
#   API_URL=https://test.example.com \
#   API_KEY=... \
#   DEFAULT_ADMIN_PASSWORD=... \
#   ./scripts/test-saas-flow.sh
#
# Defaults: API_URL=http://localhost:3000, API_KEY from env, DEFAULT_ADMIN_PASSWORD=admin

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
API_KEY="${API_KEY:?Set API_KEY env var}"
DEFAULT_ADMIN_PW="${DEFAULT_ADMIN_PASSWORD:-admin}"

# Random slug so re-runs don't collide. Stored in a temp file the test cleans up.
TEST_SLUG="acme-$(date +%s)-$RANDOM"
TEST_TENANT_NAME="ACME Test Co"
TEST_ADMIN_USER="admin"   # same username as default tenant — this is the point
TEST_ADMIN_PW="testpassword123"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { printf "\n${YELLOW}▶ %s${NC}\n" "$*"; }
ok()   { printf "${GREEN}  ✓ %s${NC}\n" "$*"; }
fail() { printf "${RED}  ✗ %s${NC}\n" "$*" >&2; exit 1; }

curl_json() {
  curl -sS -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" "$@"
}

step "1. Health check"
HEALTH=$(curl -sS "$API_URL/health" || true)
echo "  $HEALTH"
[[ "$HEALTH" == *"ok"* ]] || fail "Server not responding at $API_URL"
ok "server is up"

step "2. Login to default tenant (back-compat — no tenant_slug sent)"
DEFAULT_LOGIN=$(curl_json -X POST "$API_URL/api/auth/login" \
  -d "{\"username\":\"admin\",\"password\":\"$DEFAULT_ADMIN_PW\"}")
DEFAULT_TOKEN=$(echo "$DEFAULT_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[[ -n "$DEFAULT_TOKEN" ]] || fail "default-tenant login returned no token: $DEFAULT_LOGIN"
ok "logged in as default-tenant admin"

step "3. Default admin lists customers (count baseline)"
DEFAULT_CUSTOMERS=$(curl_json -H "Authorization: Bearer $DEFAULT_TOKEN" \
  "$API_URL/api/customers?pageSize=1")
DEFAULT_COUNT=$(echo "$DEFAULT_CUSTOMERS" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
ok "default tenant sees $DEFAULT_COUNT customers"

step "4. Sign up a new tenant: $TEST_SLUG"
SIGNUP=$(curl_json -X POST "$API_URL/api/tenants/signup" -d "{
  \"tenant_name\":\"$TEST_TENANT_NAME\",
  \"tenant_slug\":\"$TEST_SLUG\",
  \"admin_username\":\"$TEST_ADMIN_USER\",
  \"admin_password\":\"$TEST_ADMIN_PW\",
  \"admin_display_name\":\"ACME Admin\"
}")
TEST_TOKEN=$(echo "$SIGNUP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[[ -n "$TEST_TOKEN" ]] || fail "signup returned no token: $SIGNUP"
ok "new tenant created, admin token issued"

step "5. New admin lists customers (must be ZERO — fresh tenant)"
TEST_CUSTOMERS=$(curl_json -H "Authorization: Bearer $TEST_TOKEN" \
  "$API_URL/api/customers?pageSize=1")
TEST_COUNT=$(echo "$TEST_CUSTOMERS" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
[[ "$TEST_COUNT" == "0" ]] || fail "new tenant should see 0 customers, saw $TEST_COUNT — tenant scoping leaks!"
ok "isolation verified — new tenant sees 0 customers"

step "6. Login again with explicit tenant_slug should match new admin"
RELOGIN=$(curl_json -X POST "$API_URL/api/auth/login" -d "{
  \"username\":\"$TEST_ADMIN_USER\",
  \"password\":\"$TEST_ADMIN_PW\",
  \"tenant_slug\":\"$TEST_SLUG\"
}")
RELOGIN_TOKEN=$(echo "$RELOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[[ -n "$RELOGIN_TOKEN" ]] || fail "re-login with slug failed: $RELOGIN"
ok "explicit-slug login works"

step "7. Same username in default tenant must still resolve to default admin (composite uniqueness)"
LOGIN_BACK=$(curl_json -X POST "$API_URL/api/auth/login" -d "{
  \"username\":\"admin\",
  \"password\":\"$DEFAULT_ADMIN_PW\",
  \"tenant_slug\":\"default\"
}")
LOGIN_BACK_TOKEN=$(echo "$LOGIN_BACK" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[[ -n "$LOGIN_BACK_TOKEN" ]] || fail "default-tenant explicit login failed: $LOGIN_BACK"
ok "two 'admin' usernames coexist across tenants"

step "8. Wrong password against new tenant must reject"
BAD=$(curl_json -X POST "$API_URL/api/auth/login" -d "{
  \"username\":\"$TEST_ADMIN_USER\",
  \"password\":\"wrong\",
  \"tenant_slug\":\"$TEST_SLUG\"
}")
[[ "$BAD" == *"error"* ]] || fail "bad-password login should error: $BAD"
ok "bad password rejected"

step "9. Unknown tenant_slug must reject"
GHOST=$(curl_json -X POST "$API_URL/api/auth/login" -d "{
  \"username\":\"admin\",
  \"password\":\"$DEFAULT_ADMIN_PW\",
  \"tenant_slug\":\"does-not-exist-xyz\"
}")
[[ "$GHOST" == *"error"* ]] || fail "unknown-slug login should error: $GHOST"
ok "unknown tenant rejected"

step "10. Tenant /me returns the new tenant for the new admin"
ME=$(curl_json -H "Authorization: Bearer $TEST_TOKEN" "$API_URL/api/tenants/me")
[[ "$ME" == *"\"slug\":\"$TEST_SLUG\""* ]] || fail "tenants/me wrong slug: $ME"
ok "tenants/me reflects correct slug"

step "11. New tenant creates a customer; default tenant must NOT see it"
NEW_CUST=$(curl_json -X POST "$API_URL/api/customers" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"full_name":"ACME Test Customer","platform_name":"","phone_number":"0700-0000000"}')
NEW_CUST_ID=$(echo "$NEW_CUST" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
[[ -n "$NEW_CUST_ID" ]] || fail "create customer failed: $NEW_CUST"
ok "ACME tenant created customer #$NEW_CUST_ID"

# Default admin's count should be unchanged
NEW_DEFAULT_LIST=$(curl_json -H "Authorization: Bearer $DEFAULT_TOKEN" \
  "$API_URL/api/customers?pageSize=1")
NEW_DEFAULT_COUNT=$(echo "$NEW_DEFAULT_LIST" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
[[ "$NEW_DEFAULT_COUNT" == "$DEFAULT_COUNT" ]] || fail "default tenant count changed ($DEFAULT_COUNT → $NEW_DEFAULT_COUNT) — leak!"
ok "default tenant didn't see the ACME customer"

# Default admin tries to fetch the ACME customer by id directly
DIRECT=$(curl_json -H "Authorization: Bearer $DEFAULT_TOKEN" \
  "$API_URL/api/customers/$NEW_CUST_ID")
[[ "$DIRECT" == *"not found"* ]] || fail "direct cross-tenant fetch should 404, got: $DIRECT"
ok "direct cross-tenant fetch returns 404"

printf "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
printf "${GREEN}  ALL CHECKS PASSED  —  SaaS isolation verified${NC}\n"
printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo ""
echo "Test tenant slug: $TEST_SLUG"
echo "Default tenant customer count: $DEFAULT_COUNT (unchanged)"
echo "New tenant created customer: #$NEW_CUST_ID"
