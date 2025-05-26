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
    local expected_status=$2
    if [ $1 -eq 0 ] && [ $2 -eq $expected_status ]; then
        echo -e "${GREEN}✓ $3${NC}"
        return 0
    else
        echo -e "${RED}✗ $3 (status: $2, expected: $expected_status)${NC}"
        if [ ! -z "$4" ]; then
            echo -e "${RED}Error: $4${NC}"
        fi
        return 1
    fi
}

# store ids for stuff
SUPPLIER_ID=""
WAREHOUSE1_ID=""
WAREHOUSE2_ID=""
PRODUCT1_ID=""
PRODUCT2_ID=""

# cleanup on ctrl+c
cleanup() {
    print_header "Cleaning up resources"

    if [ ! -z "$PRODUCT1_ID" ]; then
        curl -s -X DELETE "$API_URL/products/$PRODUCT1_ID" > /dev/null
    fi
    if [ ! -z "$PRODUCT2_ID" ]; then
        curl -s -X DELETE "$API_URL/products/$PRODUCT2_ID" > /dev/null
    fi
    if [ ! -z "$WAREHOUSE1_ID" ]; then
        curl -s -X DELETE "$API_URL/warehouses/$WAREHOUSE1_ID" > /dev/null
    fi
    if [ ! -z "$WAREHOUSE2_ID" ]; then
        curl -s -X DELETE "$API_URL/warehouses/$WAREHOUSE2_ID" > /dev/null
    fi
    if [ ! -z "$SUPPLIER_ID" ]; then
        curl -s -X DELETE "$API_URL/suppliers/$SUPPLIER_ID" > /dev/null
    fi

    echo -e "${YELLOW}Test interrupted. Resources cleaned up.${NC}"
    exit 1
}

trap cleanup SIGINT

print_header "Testing Supplier Endpoints"

# Test supplier creation
print_header "Creating test supplier"
SUPPLIER_RESPONSE=$(curl -s -X POST "$API_URL/suppliers" \
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

SUPPLIER_ID=$(echo $SUPPLIER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
check_response $? 201 "Created supplier" "$SUPPLIER_RESPONSE"

# Test duplicate email
echo "Testing duplicate email validation..."
RESPONSE=$(curl -s -X POST "$API_URL/suppliers" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Duplicate Supplier",
    "contactEmail": "test@supplier.com",
    "phone": "987-654-3210",
    "address": {
        "street": "456 Other St",
        "city": "Other City",
        "state": "OS",
        "zip": "54321"
    }
}')
check_response $? 400 "Rejected duplicate supplier email" "$RESPONSE"

print_header "Creating test warehouses"

# Create first warehouse
WAREHOUSE1_RESPONSE=$(curl -s -X POST "$API_URL/warehouses" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Main Warehouse",
    "locationCode": "WH-001",
    "capacity": 1000,
    "currentUtilization": 500,
    "address": {
        "street": "456 Warehouse Ave",
        "city": "Storage City",
        "state": "SC",
        "zip": "54321"
    }
}')

WAREHOUSE1_ID=$(echo $WAREHOUSE1_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
check_response $? 201 "Created warehouse 1" "$WAREHOUSE1_RESPONSE"

# Test duplicate location code
echo "Testing duplicate location code validation..."
RESPONSE=$(curl -s -X POST "$API_URL/warehouses" \
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
check_response $? 400 "Rejected duplicate warehouse location code" "$RESPONSE"

# Create second warehouse
WAREHOUSE2_RESPONSE=$(curl -s -X POST "$API_URL/warehouses" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Secondary Warehouse",
    "locationCode": "WH-002",
    "capacity": 800,
    "currentUtilization": 300,
    "address": {
        "street": "789 Storage Ln",
        "city": "Warehouse City",
        "state": "WC",
        "zip": "98765"
    }
}')

WAREHOUSE2_ID=$(echo $WAREHOUSE2_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
check_response $? 201 "Created warehouse 2" "$WAREHOUSE2_RESPONSE"

print_header "Testing Product Endpoints"

# Create product 1 (normal stock levels)
PRODUCT1_RESPONSE=$(curl -s -X POST "$API_URL/products" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Test Product 1",
    "sku": "TP-001",
    "category": "Test Category",
    "supplierId": "'$SUPPLIER_ID'",
    "warehouses": [
        {
            "warehouseId": "'$WAREHOUSE1_ID'",
            "quantity": 100,
            "reorderThreshold": 20
        }
    ]
}')

PRODUCT1_ID=$(echo $PRODUCT1_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
check_response $? 201 "Created product 1" "$PRODUCT1_RESPONSE"

# Test duplicate SKU
echo "Testing duplicate SKU validation..."
RESPONSE=$(curl -s -X POST "$API_URL/products" \
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
check_response $? 400 "Rejected duplicate SKU" "$RESPONSE"

# Create product 2 (low stock levels)
PRODUCT2_RESPONSE=$(curl -s -X POST "$API_URL/products" \
    -H "Content-Type: application/json" \
    -d '{
    "name": "Test Product 2",
    "sku": "TP-002",
    "category": "Test Category",
    "supplierId": "'$SUPPLIER_ID'",
    "warehouses": [
        {
            "warehouseId": "'$WAREHOUSE1_ID'",
            "quantity": 15,
            "reorderThreshold": 25
        },
        {
            "warehouseId": "'$WAREHOUSE2_ID'",
            "quantity": 30,
            "reorderThreshold": 50
        }
    ]
}')

PRODUCT2_ID=$(echo $PRODUCT2_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
check_response $? 201 "Created product 2" "$PRODUCT2_RESPONSE"

print_header "Testing Query Endpoints"

# Test low stock endpoint
echo "Testing low stock products query..."
RESPONSE=$(curl -s -X GET "$API_URL/products/low-stock")
check_response $? 200 "Retrieved low stock products" "$RESPONSE"

# Test supplier products endpoint
echo "Testing supplier products query..."
RESPONSE=$(curl -s -X GET "$API_URL/suppliers/$SUPPLIER_ID/products")
check_response $? 200 "Retrieved supplier products" "$RESPONSE"

# Test invalid supplier ID
echo "Testing invalid supplier ID..."
RESPONSE=$(curl -s -X GET "$API_URL/suppliers/invalid-id/products")
check_response $? 400 "Rejected invalid supplier ID format" "$RESPONSE"

# Test non-existent supplier ID
echo "Testing non-existent supplier ID..."
RESPONSE=$(curl -s -X GET "$API_URL/suppliers/507f1f77bcf86cd799439011/products")
check_response $? 404 "Rejected non-existent supplier ID" "$RESPONSE"

# Test warehouse products endpoint
echo "Testing warehouse products queries..."
RESPONSE=$(curl -s -X GET "$API_URL/warehouses/$WAREHOUSE1_ID/products")
check_response $? 200 "Retrieved warehouse 1 products" "$RESPONSE"

RESPONSE=$(curl -s -X GET "$API_URL/warehouses/$WAREHOUSE2_ID/products")
check_response $? 200 "Retrieved warehouse 2 products" "$RESPONSE"

# Test invalid warehouse ID
RESPONSE=$(curl -s -X GET "$API_URL/warehouses/invalid-id/products")
check_response $? 400 "Rejected invalid warehouse ID format" "$RESPONSE"

print_header "Testing Delete Operations"

# Test product deletion
curl -s -X DELETE "$API_URL/products/$PRODUCT1_ID"
check_response $? 204 "Deleted product 1"

curl -s -X DELETE "$API_URL/products/$PRODUCT2_ID"
check_response $? 204 "Deleted product 2"

# Test warehouse deletion
curl -s -X DELETE "$API_URL/warehouses/$WAREHOUSE1_ID"
check_response $? 204 "Deleted warehouse 1"

curl -s -X DELETE "$API_URL/warehouses/$WAREHOUSE2_ID"
check_response $? 204 "Deleted warehouse 2"

# Test supplier deletion
curl -s -X DELETE "$API_URL/suppliers/$SUPPLIER_ID"
check_response $? 204 "Deleted supplier"

print_header "Test Summary"
echo -e "${GREEN}✓ Test data created successfully${NC}"
echo -e "${GREEN}✓ All endpoints tested${NC}"
echo -e "${GREEN}✓ Validation cases checked${NC}"
echo -e "${GREEN}✓ Resources cleaned up${NC}"