#!/bin/bash

# Configuration
API_URL="http://localhost:5021/api"
TOKEN=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jonas@jonas.com","password":"jonasjon"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get authentication token"
  exit 1
fi

# Function to add a supplier
add_supplier() {
  local name="$1"
  local contactEmail="$2"
  local phone="$3"
  local street="$4"
  local city="$5"
  local state="$6"
  local zip="$7"
  local country="$8"

  # First check if supplier exists
  local EXISTING=$(curl -s -X GET "${API_URL}/suppliers" \
    -H "Authorization: Bearer ${TOKEN}" | grep -o "\"name\":\"$name\"")

  if [ ! -z "$EXISTING" ]; then
    # Get the ID of the existing supplier
    local ID=$(curl -s -X GET "${API_URL}/suppliers" \
      -H "Authorization: Bearer ${TOKEN}" | grep -o "\"id\":\"[^\"]*\".*\"name\":\"$name\"" | cut -d'"' -f4)
    echo "$ID"
    return
  fi

  local RESPONSE=$(curl -s -X POST "${API_URL}/suppliers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{
      \"name\": \"$name\",
      \"contactEmail\": \"$contactEmail\",
      \"phone\": \"$phone\",
      \"address\": {
        \"street\": \"$street\",
        \"city\": \"$city\",
        \"state\": \"$state\",
        \"zip\": \"$zip\",
        \"country\": \"$country\"
      }
    }")
  
  local ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "$ID"
}

# Function to add a warehouse
add_warehouse() {
  local name="$1"
  local locationCode="$2"
  local street="$3"
  local city="$4"
  local state="$5"
  local zip="$6"
  local country="$7"
  local capacity="$8"
  local currentUtilization="$9"

  # First check if warehouse exists
  local EXISTING=$(curl -s -X GET "${API_URL}/warehouses" \
    -H "Authorization: Bearer ${TOKEN}" | grep -o "\"locationCode\":\"$locationCode\"")

  if [ ! -z "$EXISTING" ]; then
    # Get the ID of the existing warehouse
    local ID=$(curl -s -X GET "${API_URL}/warehouses" \
      -H "Authorization: Bearer ${TOKEN}" | grep -o "\"id\":\"[^\"]*\".*\"locationCode\":\"$locationCode\"" | cut -d'"' -f4)
    echo "$ID"
    return
  fi

  local RESPONSE=$(curl -s -X POST "${API_URL}/warehouses" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{
      \"name\": \"$name\",
      \"locationCode\": \"$locationCode\",
      \"address\": {
        \"street\": \"$street\",
        \"city\": \"$city\",
        \"state\": \"$state\",
        \"zip\": \"$zip\",
        \"country\": \"$country\"
      },
      \"capacity\": $capacity,
      \"currentUtilization\": $currentUtilization
    }")
  
  local ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo "$ID"
}

# Function to add a product
add_product() {
  local name="$1"
  local description="$2"
  local price="$3"
  local category="$4"
  local sku="$5"
  local supplierId="$6"
  local warehouseIds="$7"
  local baseQuantity="$8"
  local reorderThreshold="$9"

  echo "Adding product: $name (SKU: $sku)"

  # First check if product exists
  local EXISTING=$(curl -s -X GET "${API_URL}/products" \
    -H "Authorization: Bearer ${TOKEN}" | grep -o "\"sku\":\"$sku\"")

  if [ ! -z "$EXISTING" ]; then
    echo "Product with SKU '$sku' already exists, skipping..."
    return
  fi

  # Convert warehouse IDs string into proper warehouse inventory objects
  # Remove the quotes and brackets, then split into array
  local warehouse_array=($(echo "$warehouseIds" | tr -d '[]"' | tr ',' ' '))
  local warehouse_inventory="["
  local first=true
  
  for id in "${warehouse_array[@]}"; do
    if [ "$first" = true ]; then
      first=false
    else
      warehouse_inventory="$warehouse_inventory,"
    fi
    warehouse_inventory="$warehouse_inventory{\"warehouseId\":\"$id\",\"quantity\":$baseQuantity,\"reorderThreshold\":$reorderThreshold}"
  done
  warehouse_inventory="$warehouse_inventory]"

  # Prepare the JSON payload
  local json_payload="{
    \"name\": \"$name\",
    \"description\": \"$description\",
    \"price\": $price,
    \"category\": \"$category\",
    \"sku\": \"$sku\",
    \"supplierId\": \"$supplierId\",
    \"warehouses\": $warehouse_inventory
  }"

  echo "Sending request with payload:"
  echo "$json_payload"

  # Make the API call and capture the full response
  local RESPONSE=$(curl -s -X POST "${API_URL}/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "$json_payload")

  # Check if the response contains an error
  if echo "$RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo "Error adding product:"
    echo "$RESPONSE"
    return 1
  fi

  # Check if we got a valid response with an ID
  if echo "$RESPONSE" | grep -q "\"id\":"; then
    echo "Successfully added product: $name"
    echo "Response: $RESPONSE"
  else
    echo "Unexpected response when adding product:"
    echo "$RESPONSE"
    return 1
  fi
}

# Test the token before proceeding
echo "Testing authentication..."
TEST_RESPONSE=$(curl -s -X GET "${API_URL}/products" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$TEST_RESPONSE" | grep -q "error\|Error\|ERROR\|Unauthorized"; then
  echo "Authentication failed. Response:"
  echo "$TEST_RESPONSE"
  exit 1
fi

echo "Authentication successful, proceeding with data import..."

echo "Adding suppliers..."
SUPPLIER1=$(add_supplier \
  "Office Essentials Inc." \
  "contact@officeessentials.com" \
  "+1-555-0123" \
  "123 Business Park" \
  "Chicago" \
  "IL" \
  "60601" \
  "USA")

SUPPLIER2=$(add_supplier \
  "Tech Solutions Ltd." \
  "sales@techsolutions.com" \
  "+1-555-0124" \
  "456 Innovation Drive" \
  "San Jose" \
  "CA" \
  "95110" \
  "USA")

SUPPLIER3=$(add_supplier \
  "Workplace Comfort Co." \
  "orders@workplacecomfort.com" \
  "+1-555-0125" \
  "789 Industrial Ave" \
  "Boston" \
  "MA" \
  "02110" \
  "USA")

# Additional suppliers
SUPPLIER4=$(add_supplier \
  "Global Industrial Supply" \
  "orders@globalindustrial.com" \
  "+1-555-0126" \
  "444 Commerce Drive" \
  "Atlanta" \
  "GA" \
  "30303" \
  "USA")

SUPPLIER5=$(add_supplier \
  "Smart Electronics Co." \
  "sales@smartelectronics.com" \
  "+1-555-0127" \
  "555 Innovation Blvd" \
  "Austin" \
  "TX" \
  "78701" \
  "USA")

SUPPLIER6=$(add_supplier \
  "Safety First Equipment" \
  "info@safetyfirst.com" \
  "+1-555-0128" \
  "666 Security Road" \
  "Denver" \
  "CO" \
  "80202" \
  "USA")

echo "Adding warehouses..."
WAREHOUSE1=$(add_warehouse \
  "Main Distribution Center" \
  "CHI-001" \
  "1000 Logistics Way" \
  "Chicago" \
  "IL" \
  "60601" \
  "USA" \
  10000 \
  0)

WAREHOUSE2=$(add_warehouse \
  "East Coast Facility" \
  "NWK-001" \
  "2000 Harbor Drive" \
  "Newark" \
  "NJ" \
  "07101" \
  "USA" \
  8000 \
  0)

WAREHOUSE3=$(add_warehouse \
  "West Coast Hub" \
  "LAX-001" \
  "3000 Pacific Route" \
  "Los Angeles" \
  "CA" \
  "90001" \
  "USA" \
  12000 \
  0)

# Additional warehouses
WAREHOUSE4=$(add_warehouse \
  "Midwest Distribution Hub" \
  "CHI-002" \
  "4000 Logistics Park" \
  "Indianapolis" \
  "IN" \
  "46201" \
  "USA" \
  15000 \
  0)

WAREHOUSE5=$(add_warehouse \
  "Southwest Facility" \
  "PHX-001" \
  "5000 Desert Route" \
  "Phoenix" \
  "AZ" \
  "85001" \
  "USA" \
  9000 \
  0)

WAREHOUSE6=$(add_warehouse \
  "Southeast Distribution Center" \
  "ATL-001" \
  "6000 Peachtree Street" \
  "Atlanta" \
  "GA" \
  "30301" \
  "USA" \
  11000 \
  0)

# Create warehouse arrays for different product categories
OFFICE_WAREHOUSES="[\"$WAREHOUSE1\",\"$WAREHOUSE2\"]"
TECH_WAREHOUSES="[\"$WAREHOUSE1\",\"$WAREHOUSE3\"]"
FURNITURE_WAREHOUSES="[\"$WAREHOUSE1\",\"$WAREHOUSE2\",\"$WAREHOUSE3\"]"
CLEANING_WAREHOUSES="[\"$WAREHOUSE2\"]"
BREAKROOM_WAREHOUSES="[\"$WAREHOUSE1\"]"

# Create additional warehouse arrays for different distribution patterns
ALL_WAREHOUSES="[\"$WAREHOUSE1\",\"$WAREHOUSE2\",\"$WAREHOUSE3\",\"$WAREHOUSE4\",\"$WAREHOUSE5\",\"$WAREHOUSE6\"]"
SOUTHEAST_WAREHOUSES="[\"$WAREHOUSE2\",\"$WAREHOUSE6\"]"
SOUTHWEST_WAREHOUSES="[\"$WAREHOUSE3\",\"$WAREHOUSE5\"]"
MIDWEST_WAREHOUSES="[\"$WAREHOUSE1\",\"$WAREHOUSE4\"]"

echo "Adding products..."

# Office Supplies (Supplier 1)
add_product "Premium Ballpoint Pen" "Smooth writing experience with quick-drying ink" 2.99 "Office Supplies" "PEN-001" "$SUPPLIER1" "$OFFICE_WAREHOUSES" 75 10
add_product "Sticky Notes Pack" "Pack of 12 colorful sticky note pads" 4.99 "Office Supplies" "NOTE-002" "$SUPPLIER1" "$OFFICE_WAREHOUSES" 100 20
add_product "Professional Stapler" "Heavy-duty stapler with 20-sheet capacity" 12.99 "Office Supplies" "STPL-003" "$SUPPLIER1" "$OFFICE_WAREHOUSES" 35 8
add_product "Document Organizer" "5-compartment mesh document organizer" 24.99 "Office Supplies" "ORG-004" "$SUPPLIER1" "$OFFICE_WAREHOUSES" 25 5

# Electronics (Supplier 2)
add_product "Wireless Mouse" "Ergonomic wireless mouse with long battery life" 29.99 "Electronics" "MOUSE-001" "$SUPPLIER2" "$TECH_WAREHOUSES" 50 10
add_product "USB-C Hub" "7-in-1 USB-C hub with HDMI and power delivery" 45.99 "Electronics" "HUB-002" "$SUPPLIER2" "$TECH_WAREHOUSES" 30 8
add_product "Webcam HD Pro" "1080p webcam with built-in microphone" 79.99 "Electronics" "CAM-003" "$SUPPLIER2" "$TECH_WAREHOUSES" 20 5
add_product "Mechanical Keyboard" "RGB mechanical keyboard with blue switches" 89.99 "Electronics" "KEY-004" "$SUPPLIER2" "$TECH_WAREHOUSES" 15 5

# Furniture (Supplier 3)
add_product "Ergonomic Chair" "Adjustable office chair with lumbar support" 199.99 "Furniture" "CHAIR-001" "$SUPPLIER3" "$FURNITURE_WAREHOUSES" 7 3
add_product "Standing Desk" "Electric height-adjustable standing desk" 399.99 "Furniture" "DESK-002" "$SUPPLIER3" "$FURNITURE_WAREHOUSES" 5 2
add_product "Filing Cabinet" "3-drawer metal filing cabinet" 149.99 "Furniture" "CAB-003" "$SUPPLIER3" "$FURNITURE_WAREHOUSES" 8 3
add_product "Bookshelf" "5-shelf modern bookshelf" 129.99 "Furniture" "SHELF-004" "$SUPPLIER3" "$FURNITURE_WAREHOUSES" 10 4

# Cleaning Supplies (Supplier 1)
add_product "All-Purpose Cleaner" "Eco-friendly all-purpose cleaning solution" 5.99 "Cleaning" "CLEAN-001" "$SUPPLIER1" "$CLEANING_WAREHOUSES" 100 20
add_product "Paper Towels Bulk" "Case of 12 paper towel rolls" 19.99 "Cleaning" "PAPER-002" "$SUPPLIER1" "$CLEANING_WAREHOUSES" 50 15
add_product "Hand Sanitizer" "70% alcohol hand sanitizer, 16oz bottle" 4.99 "Cleaning" "SAN-003" "$SUPPLIER1" "$CLEANING_WAREHOUSES" 150 30
add_product "Disinfectant Wipes" "Pack of 75 disinfectant wipes" 6.99 "Cleaning" "WIPE-004" "$SUPPLIER1" "$CLEANING_WAREHOUSES" 125 25

# Break Room (Supplier 3)
add_product "Coffee Maker" "12-cup programmable coffee maker" 49.99 "Break Room" "COFFEE-001" "$SUPPLIER3" "$BREAKROOM_WAREHOUSES" 12 3
add_product "Water Dispenser" "Hot and cold water dispenser" 159.99 "Break Room" "WATER-002" "$SUPPLIER3" "$BREAKROOM_WAREHOUSES" 5 2
add_product "Microwave Oven" "1.2 cu. ft. stainless steel microwave" 129.99 "Break Room" "MICRO-003" "$SUPPLIER3" "$BREAKROOM_WAREHOUSES" 7 2
add_product "Mini Fridge" "3.3 cu. ft. mini refrigerator" 179.99 "Break Room" "FRIDGE-004" "$SUPPLIER3" "$BREAKROOM_WAREHOUSES" 6 2

# Additional products with complex relationships

# Product in multiple warehouses with quantity below reorder threshold
add_product "Enterprise Network Switch" "48-port managed network switch with PoE+" 899.99 "Electronics" "NETSW-001" "$SUPPLIER2" "$ALL_WAREHOUSES" 2 5

# Products from existing supplier (Tech Solutions Ltd. - SUPPLIER2) in multiple warehouses
add_product "Server Rack Cabinet" "42U server rack with cooling" 1299.99 "Electronics" "RACK-001" "$SUPPLIER2" "$MIDWEST_WAREHOUSES" 3 2
add_product "UPS Battery Backup" "1500VA rack-mounted UPS" 449.99 "Electronics" "UPS-001" "$SUPPLIER2" "$SOUTHEAST_WAREHOUSES" 8 4

# Safety equipment distributed across different regions
add_product "Emergency First Aid Kit" "OSHA compliant workplace first aid kit" 89.99 "Safety" "SAFE-001" "$SUPPLIER6" "$ALL_WAREHOUSES" 15 10
add_product "Fire Extinguisher Set" "Class ABC fire extinguishers, set of 2" 129.99 "Safety" "SAFE-002" "$SUPPLIER6" "$MIDWEST_WAREHOUSES" 12 8
add_product "Safety Glasses Bulk Pack" "ANSI Z87.1 certified, pack of 24" 179.99 "Safety" "SAFE-003" "$SUPPLIER6" "$SOUTHEAST_WAREHOUSES" 20 15

# Industrial equipment with varied distribution
add_product "Industrial Air Compressor" "60-gallon vertical air compressor" 799.99 "Industrial" "COMP-001" "$SUPPLIER4" "$MIDWEST_WAREHOUSES" 4 3
add_product "Welding Machine Pro" "220V MIG welder with digital display" 1499.99 "Industrial" "WELD-001" "$SUPPLIER4" "$SOUTHWEST_WAREHOUSES" 3 2

# Electronics with strategic placement
add_product "Smart Security Camera System" "4-camera NVR system with AI detection" 599.99 "Electronics" "CAM-004" "$SUPPLIER5" "$SOUTHEAST_WAREHOUSES" 10 5
add_product "Digital Conference System" "All-in-one conference room solution" 1299.99 "Electronics" "CONF-001" "$SUPPLIER5" "$SOUTHWEST_WAREHOUSES" 4 2

echo "Script completed! Any existing items were skipped." 