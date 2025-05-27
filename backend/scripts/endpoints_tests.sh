#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # no color
BLUE='\033[0;34m'
YELLOW='\033[1;33m'

# api base url
API_URL="http://localhost:5021/api"

# function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# function to check if a request worked
check_response() {
    local response=$1
    local expected_status=$2
    local message=$3
    local actual_status=$4

    if [ $actual_status -eq $expected_status ]; then
        echo -e "${GREEN}✓ $message${NC}"
        return 0
    else
        echo -e "${RED}✗ $message (Expected status: $expected_status, got: $actual_status)${NC}"
        echo -e "${RED}Response: $response${NC}"
        return 1
    fi
}

# store ids for stuff
SUPPLIER_ID=""
WAREHOUSE1_ID=""
WAREHOUSE2_ID=""
PRODUCT1_ID=""
PRODUCT2_ID=""
ADMIN_TOKEN=""
STAFF_TOKEN=""

# cleanup on ctrl+c
cleanup() {
    print_header "Cleaning up resources"

    if [ ! -z "$PRODUCT1_ID" ]; then
        curl -s -H "Authorization: Bearer $ADMIN_TOKEN" -X DELETE "$API_URL/products/$PRODUCT1_ID" > /dev/null
    fi
    if [ ! -z "$PRODUCT2_ID" ]; then
        curl -s -H "Authorization: Bearer $ADMIN_TOKEN" -X DELETE "$API_URL/products/$PRODUCT2_ID" > /dev/null
    fi
    if [ ! -z "$WAREHOUSE1_ID" ]; then
        curl -s -H "Authorization: Bearer $ADMIN_TOKEN" -X DELETE "$API_URL/warehouses/$WAREHOUSE1_ID" > /dev/null
    fi
    if [ ! -z "$WAREHOUSE2_ID" ]; then
        curl -s -H "Authorization: Bearer $ADMIN_TOKEN" -X DELETE "$API_URL/warehouses/$WAREHOUSE2_ID" > /dev/null
    fi
    if [ ! -z "$SUPPLIER_ID" ]; then
        curl -s -H "Authorization: Bearer $ADMIN_TOKEN" -X DELETE "$API_URL/suppliers/$SUPPLIER_ID" > /dev/null
    fi

    echo -e "${YELLOW}Test interrupted. Resources cleaned up.${NC}"
    exit 1
}

trap cleanup SIGINT

print_header "Setting up authentication"

# Register admin user
REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
    "username": "testadmin",
    "email": "testadmin@supplysync.com",
    "password": "TestAdmin123!",
    "roleCode": "ADMIN123"
}')

HTTP_STATUS="${REGISTER_RESPONSE: -3}"
REGISTER_BODY="${REGISTER_RESPONSE:0:${#REGISTER_RESPONSE}-3}"

check_response "$REGISTER_BODY" 201 "Register admin user" "$HTTP_STATUS"

# Register staff user
REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
    "username": "teststaff",
    "email": "teststaff@supplysync.com",
    "password": "TestStaff123!",
    "roleCode": "STAFF123"
}')

HTTP_STATUS="${REGISTER_RESPONSE: -3}"
REGISTER_BODY="${REGISTER_RESPONSE:0:${#REGISTER_RESPONSE}-3}"

check_response "$REGISTER_BODY" 201 "Register staff user" "$HTTP_STATUS"

# Login as admin
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
    "email": "testadmin@supplysync.com",
    "password": "TestAdmin123!"
}')

HTTP_STATUS="${LOGIN_RESPONSE: -3}"
LOGIN_BODY="${LOGIN_RESPONSE:0:${#LOGIN_RESPONSE}-3}"

check_response "$LOGIN_BODY" 200 "Login with admin user" "$HTTP_STATUS"

ADMIN_TOKEN=$(echo $LOGIN_BODY | sed 's/.*"token":"\([^"]*\)".*/\1/')

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}Failed to get admin token${NC}"
    exit 1
fi

# Login as staff
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
    "email": "teststaff@supplysync.com",
    "password": "TestStaff123!"
}')

HTTP_STATUS="${LOGIN_RESPONSE: -3}"
LOGIN_BODY="${LOGIN_RESPONSE:0:${#LOGIN_RESPONSE}-3}"

check_response "$LOGIN_BODY" 200 "Login with staff user" "$HTTP_STATUS"

STAFF_TOKEN=$(echo $LOGIN_BODY | sed 's/.*"token":"\([^"]*\)".*/\1/')

if [ -z "$STAFF_TOKEN" ]; then
    echo -e "${RED}Failed to get staff token${NC}"
    exit 1
fi

print_header "Testing Role Endpoint"

# Test role endpoint with admin token
ROLE_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/auth/role" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS="${ROLE_RESPONSE: -3}"
ROLE_BODY="${ROLE_RESPONSE:0:${#ROLE_RESPONSE}-3}"

check_response "$ROLE_BODY" 200 "Get admin role" "$HTTP_STATUS"

if [[ $ROLE_BODY == *"Admin"* ]]; then
    echo -e "${GREEN}✓ Admin role verified${NC}"
else
    echo -e "${RED}✗ Admin role not found in response${NC}"
fi

# Test role endpoint with staff token
ROLE_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/auth/role" \
    -H "Authorization: Bearer $STAFF_TOKEN")

HTTP_STATUS="${ROLE_RESPONSE: -3}"
ROLE_BODY="${ROLE_RESPONSE:0:${#ROLE_RESPONSE}-3}"

check_response "$ROLE_BODY" 200 "Get staff role" "$HTTP_STATUS"

if [[ $ROLE_BODY == *"Staff"* ]]; then
    echo -e "${GREEN}✓ Staff role verified${NC}"
else
    echo -e "${RED}✗ Staff role not found in response${NC}"
fi

print_header "Testing Role-Based Access"

# Test staff access to POST endpoint (should fail)
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/suppliers" \
    -H "Authorization: Bearer $STAFF_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Test Supplier",
    "contactEmail": "test@supplier.com",
    "phone": "123-456-7890",
    "address": {
        "street": "123 Test St",
        "city": "Test City",
        "state": "TS",
        "zip": "12345"
    }
}')

HTTP_STATUS="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE:0:${#RESPONSE}-3}"

check_response "$RESPONSE_BODY" 403 "Staff cannot create supplier" "$HTTP_STATUS"

print_header "Testing Supplier Endpoints (Admin)"

# Create test supplier using admin token
SUPPLIER_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/suppliers" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Test Supplier",
    "contactEmail": "test@supplier.com",
    "phone": "123-456-7890",
    "address": {
        "street": "123 Test St",
        "city": "Test City",
        "state": "TS",
        "zip": "12345"
    }
}')

HTTP_STATUS="${SUPPLIER_RESPONSE: -3}"
SUPPLIER_BODY="${SUPPLIER_RESPONSE:0:${#SUPPLIER_RESPONSE}-3}"

check_response "$SUPPLIER_BODY" 201 "Admin can create supplier" "$HTTP_STATUS"

SUPPLIER_ID=$(echo $SUPPLIER_BODY | sed 's/.*"id":"\([^"]*\)".*/\1/')

if [ -z "$SUPPLIER_ID" ]; then
    echo -e "${RED}Failed to get supplier ID${NC}"
    exit 1
fi

print_header "Testing Supplier Endpoints (Staff)"

# Test staff access to GET endpoint (should succeed)
RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/suppliers/$SUPPLIER_ID" \
    -H "Authorization: Bearer $STAFF_TOKEN")

HTTP_STATUS="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE:0:${#RESPONSE}-3}"

check_response "$RESPONSE_BODY" 200 "Staff can read supplier" "$HTTP_STATUS"

print_header "Testing Warehouse Endpoints"

# Create first warehouse
WAREHOUSE1_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/warehouses" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Main Warehouse",
    "locationCode": "WH-001",
    "address": {
        "street": "456 Storage Ave",
        "city": "Warehouse City",
        "state": "WS",
        "zip": "67890"
    },
    "capacity": 1000,
    "currentUtilization": 0
}')

HTTP_STATUS="${WAREHOUSE1_RESPONSE: -3}"
WAREHOUSE1_BODY="${WAREHOUSE1_RESPONSE:0:${#WAREHOUSE1_RESPONSE}-3}"

check_response "$WAREHOUSE1_BODY" 201 "Create warehouse 1" "$HTTP_STATUS"

WAREHOUSE1_ID=$(echo $WAREHOUSE1_BODY | sed 's/.*"id":"\([^"]*\)".*/\1/')

if [ -z "$WAREHOUSE1_ID" ]; then
    echo -e "${RED}Failed to get warehouse 1 ID${NC}"
    cleanup
fi

echo -e "${GREEN}✓ Created warehouse 1 with ID: $WAREHOUSE1_ID${NC}"

# Test duplicate location code
echo "Testing duplicate location code validation..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/warehouses" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Duplicate Warehouse",
    "locationCode": "WH-001",
    "capacity": 800,
    "currentUtilization": 300,
    "address": {
        "street": "789 Other Ave",
        "city": "Other City",
        "state": "OC",
        "zip": "98765"
    }
}')

HTTP_STATUS="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE:0:${#RESPONSE}-3}"

check_response "$RESPONSE_BODY" 400 "Rejected duplicate warehouse location code" "$HTTP_STATUS"

# Create second warehouse
WAREHOUSE2_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/warehouses" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Secondary Warehouse",
    "locationCode": "WH-002",
    "address": {
        "street": "789 Storage Blvd",
        "city": "Warehouse City",
        "state": "WS",
        "zip": "67890"
    },
    "capacity": 500,
    "currentUtilization": 0
}')

HTTP_STATUS="${WAREHOUSE2_RESPONSE: -3}"
WAREHOUSE2_BODY="${WAREHOUSE2_RESPONSE:0:${#WAREHOUSE2_RESPONSE}-3}"

check_response "$WAREHOUSE2_BODY" 201 "Create warehouse 2" "$HTTP_STATUS"

WAREHOUSE2_ID=$(echo $WAREHOUSE2_BODY | sed 's/.*"id":"\([^"]*\)".*/\1/')

if [ -z "$WAREHOUSE2_ID" ]; then
    echo -e "${RED}Failed to get warehouse 2 ID${NC}"
    cleanup
fi

echo -e "${GREEN}✓ Created warehouse 2 with ID: $WAREHOUSE2_ID${NC}"

print_header "Testing Product Endpoints"

# Create first product
PRODUCT1_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
    \"name\": \"Test Product 1\",
    \"sku\": \"TP-001\",
    \"category\": \"Test Category\",
    \"supplierId\": \"$SUPPLIER_ID\",
    \"warehouses\": [
        {
            \"warehouseId\": \"$WAREHOUSE1_ID\",
            \"quantity\": 50,
            \"reorderThreshold\": 20
        },
        {
            \"warehouseId\": \"$WAREHOUSE2_ID\",
            \"quantity\": 30,
            \"reorderThreshold\": 15
        }
    ]
}")

HTTP_STATUS="${PRODUCT1_RESPONSE: -3}"
PRODUCT1_BODY="${PRODUCT1_RESPONSE:0:${#PRODUCT1_RESPONSE}-3}"

check_response "$PRODUCT1_BODY" 201 "Create product 1" "$HTTP_STATUS"

PRODUCT1_ID=$(echo $PRODUCT1_BODY | sed 's/.*"id":"\([^"]*\)".*/\1/')

if [ -z "$PRODUCT1_ID" ]; then
    echo -e "${RED}Failed to get product 1 ID${NC}"
    cleanup
fi

echo -e "${GREEN}✓ Created product 1 with ID: $PRODUCT1_ID${NC}"

# Test duplicate SKU
echo "Testing duplicate SKU validation..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Duplicate Product",
    "sku": "TP-001",
    "category": "Test Category",
    "supplierId": "'$SUPPLIER_ID'",
    "warehouses": [
        {
            "warehouseId": "'$WAREHOUSE1_ID'",
            "quantity": 50,
            "reorderThreshold": 10
        }
    ]
}')

HTTP_STATUS="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE:0:${#RESPONSE}-3}"

check_response "$RESPONSE_BODY" 400 "Rejected duplicate SKU" "$HTTP_STATUS"

# Create second product with low stock
PRODUCT2_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
    \"name\": \"Test Product 2\",
    \"sku\": \"TP-002\",
    \"category\": \"Test Category\",
    \"supplierId\": \"$SUPPLIER_ID\",
    \"warehouses\": [
        {
            \"warehouseId\": \"$WAREHOUSE1_ID\",
            \"quantity\": 10,
            \"reorderThreshold\": 25
        }
    ]
}")

HTTP_STATUS="${PRODUCT2_RESPONSE: -3}"
PRODUCT2_BODY="${PRODUCT2_RESPONSE:0:${#PRODUCT2_RESPONSE}-3}"

check_response "$PRODUCT2_BODY" 201 "Create product 2" "$HTTP_STATUS"

PRODUCT2_ID=$(echo $PRODUCT2_BODY | sed 's/.*"id":"\([^"]*\)".*/\1/')

if [ -z "$PRODUCT2_ID" ]; then
    echo -e "${RED}Failed to get product 2 ID${NC}"
    cleanup
fi

echo -e "${GREEN}✓ Created product 2 with ID: $PRODUCT2_ID${NC}"

print_header "Testing Query Endpoints"

# Test low stock products endpoint
LOW_STOCK_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/products/low-stock" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS="${LOW_STOCK_RESPONSE: -3}"
LOW_STOCK_BODY="${LOW_STOCK_RESPONSE:0:${#LOW_STOCK_RESPONSE}-3}"

check_response "$LOW_STOCK_BODY" 200 "Get low stock products" "$HTTP_STATUS"

if [[ $LOW_STOCK_BODY == *"$PRODUCT2_ID"* ]]; then
    echo -e "${GREEN}✓ Low stock query returned expected product${NC}"
else
    echo -e "${RED}✗ Low stock query did not return expected product${NC}"
fi

# Test supplier products endpoint
SUPPLIER_PRODUCTS_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/suppliers/$SUPPLIER_ID/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS="${SUPPLIER_PRODUCTS_RESPONSE: -3}"
SUPPLIER_PRODUCTS_BODY="${SUPPLIER_PRODUCTS_RESPONSE:0:${#SUPPLIER_PRODUCTS_RESPONSE}-3}"

check_response "$SUPPLIER_PRODUCTS_BODY" 200 "Get supplier products" "$HTTP_STATUS"

if [[ $SUPPLIER_PRODUCTS_BODY == *"$PRODUCT1_ID"* ]] && [[ $SUPPLIER_PRODUCTS_BODY == *"$PRODUCT2_ID"* ]]; then
    echo -e "${GREEN}✓ Supplier products query returned both products${NC}"
else
    echo -e "${RED}✗ Supplier products query did not return expected products${NC}"
fi

# Test invalid supplier ID
echo "Testing invalid supplier ID..."
RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/suppliers/invalid-id/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE:0:${#RESPONSE}-3}"

check_response "$RESPONSE_BODY" 400 "Rejected invalid supplier ID format" "$HTTP_STATUS"

# Test non-existent supplier ID
echo "Testing non-existent supplier ID..."
RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/suppliers/507f1f77bcf86cd799439011/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE:0:${#RESPONSE}-3}"

check_response "$RESPONSE_BODY" 404 "Rejected non-existent supplier ID" "$HTTP_STATUS"

# Test warehouse products endpoint
WAREHOUSE_PRODUCTS_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/warehouses/$WAREHOUSE1_ID/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS="${WAREHOUSE_PRODUCTS_RESPONSE: -3}"
WAREHOUSE_PRODUCTS_BODY="${WAREHOUSE_PRODUCTS_RESPONSE:0:${#WAREHOUSE_PRODUCTS_RESPONSE}-3}"

check_response "$WAREHOUSE_PRODUCTS_BODY" 200 "Get warehouse products" "$HTTP_STATUS"

if [[ $WAREHOUSE_PRODUCTS_BODY == *"$PRODUCT1_ID"* ]] && [[ $WAREHOUSE_PRODUCTS_BODY == *"$PRODUCT2_ID"* ]]; then
    echo -e "${GREEN}✓ Warehouse products query returned both products${NC}"
else
    echo -e "${RED}✗ Warehouse products query did not return expected products${NC}"
fi

RESPONSE=$(curl -s -X GET "$API_URL/warehouses/$WAREHOUSE2_ID/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
check_response "$RESPONSE" 200 "Retrieved warehouse 2 products" "$HTTP_STATUS"

# Test invalid warehouse ID
RESPONSE=$(curl -s -w "%{http_code}" -X GET "$API_URL/warehouses/invalid-id/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_STATUS="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE:0:${#RESPONSE}-3}"

check_response "$RESPONSE_BODY" 400 "Rejected invalid warehouse ID format" "$HTTP_STATUS"

print_header "Testing Update Operations"

# Update product
UPDATE_PRODUCT_RESPONSE=$(curl -s -w "%{http_code}" -X PUT "$API_URL/products/$PRODUCT1_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
    \"name\": \"Updated Test Product 1\",
    \"sku\": \"TP-001\",
    \"category\": \"Updated Category\",
    \"supplierId\": \"$SUPPLIER_ID\",
    \"warehouses\": [
        {
            \"warehouseId\": \"$WAREHOUSE1_ID\",
            \"quantity\": 60,
            \"reorderThreshold\": 25
        }
    ]
}")

HTTP_STATUS="${UPDATE_PRODUCT_RESPONSE: -3}"
UPDATE_PRODUCT_BODY="${UPDATE_PRODUCT_RESPONSE:0:${#UPDATE_PRODUCT_RESPONSE}-3}"

check_response "$UPDATE_PRODUCT_BODY" 200 "Update product" "$HTTP_STATUS"

if [[ $UPDATE_PRODUCT_BODY == *"Updated Test Product 1"* ]]; then
    echo -e "${GREEN}✓ Product update successful${NC}"
else
    echo -e "${RED}✗ Product update failed${NC}"
fi

print_header "Testing Delete Operations"

# Delete products
curl -s -X DELETE "$API_URL/products/$PRODUCT1_ID" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
curl -s -X DELETE "$API_URL/products/$PRODUCT2_ID" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

# Delete warehouses
curl -s -X DELETE "$API_URL/warehouses/$WAREHOUSE1_ID" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
curl -s -X DELETE "$API_URL/warehouses/$WAREHOUSE2_ID" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

# Delete supplier
curl -s -X DELETE "$API_URL/suppliers/$SUPPLIER_ID" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

echo -e "${GREEN}✓ Cleanup completed${NC}"

print_header "All tests completed!"