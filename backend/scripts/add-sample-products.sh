#!/bin/bash

# Base URL for the API
API_URL="http://localhost:5021/api/products"

# Function to get product ID by SKU and delete it
delete_product_by_sku() {
    local sku=$1
    # First, get all products and find the ID for the given SKU
    product_id=$(curl -s "${API_URL}" | grep -o "\"id\":\"[^\"]*\",\"name\":\"[^\"]*\",\"sku\":\"${sku}\"" | grep -o "\"id\":\"[^\"]*\"" | cut -d'"' -f4)
    
    if [ ! -z "$product_id" ]; then
        echo "Deleting product with SKU: ${sku} (ID: ${product_id})"
        curl -X DELETE "${API_URL}/${product_id}"
        echo -e "\n"
    else
        echo "Product with SKU ${sku} not found"
    fi
}

# List of SKUs to delete
skus=(
    "LAP-TP-001"
    "FUR-CH-001"
    "ACC-MS-001"
    "ACC-DK-001"
    "FUR-DS-001"
    "DSP-MN-001"
    "ACC-KB-001"
    "ACC-WC-001"
    "FUR-FC-001"
    "NET-SW-001"
)

# Delete each product
for sku in "${skus[@]}"; do
    delete_product_by_sku "$sku"
done

echo "All sample products have been deleted!"