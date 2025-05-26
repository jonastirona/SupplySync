#!/bin/bash

# Base URL for the API
API_URL="http://localhost:5021/api/products"

# Function to make POST request
add_product() {
    curl -X POST "${API_URL}" \
        -H "Content-Type: application/json" \
        -d "$1"
    echo -e "\n"
}

# Sample products
add_product '{
    "name": "Laptop ThinkPad X1",
    "sku": "LAP-TP-001",
    "category": "Electronics",
    "quantity": 50,
    "description": "High-performance business laptop with 16GB RAM",
    "reorderThreshold": 10
}'

add_product '{
    "name": "Office Desk Chair",
    "sku": "FUR-CH-001",
    "category": "Furniture",
    "quantity": 25,
    "description": "Ergonomic office chair with lumbar support",
    "reorderThreshold": 5
}'

add_product '{
    "name": "Wireless Mouse",
    "sku": "ACC-MS-001",
    "category": "Accessories",
    "quantity": 100,
    "description": "Bluetooth wireless mouse with long battery life",
    "reorderThreshold": 20
}'

add_product '{
    "name": "USB-C Dock",
    "sku": "ACC-DK-001",
    "category": "Accessories",
    "quantity": 30,
    "description": "Universal USB-C docking station with 4K support",
    "reorderThreshold": 8
}'

add_product '{
    "name": "Standing Desk",
    "sku": "FUR-DS-001",
    "category": "Furniture",
    "quantity": 15,
    "description": "Electric height-adjustable standing desk",
    "reorderThreshold": 3
}'

add_product '{
    "name": "27-inch Monitor",
    "sku": "DSP-MN-001",
    "category": "Displays",
    "quantity": 40,
    "description": "4K IPS monitor with USB-C",
    "reorderThreshold": 8
}'

add_product '{
    "name": "Mechanical Keyboard",
    "sku": "ACC-KB-001",
    "category": "Accessories",
    "quantity": 60,
    "description": "Mechanical keyboard with Cherry MX switches",
    "reorderThreshold": 12
}'

add_product '{
    "name": "Webcam Pro",
    "sku": "ACC-WC-001",
    "category": "Accessories",
    "quantity": 45,
    "description": "1080p webcam with built-in microphone",
    "reorderThreshold": 10
}'

add_product '{
    "name": "Filing Cabinet",
    "sku": "FUR-FC-001",
    "category": "Furniture",
    "quantity": 20,
    "description": "3-drawer metal filing cabinet",
    "reorderThreshold": 4
}'

add_product '{
    "name": "Network Switch",
    "sku": "NET-SW-001",
    "category": "Networking",
    "quantity": 35,
    "description": "24-port Gigabit managed switch",
    "reorderThreshold": 7
}'

echo "All sample products have been added!" 