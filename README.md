# SupplySync - Warehouse Management System

SupplySync is a modern, full-stack warehouse management system built with Angular and .NET Core. It provides real-time monitoring of inventory levels, warehouse capacity, and supply chain operations, with an intuitive natural language query interface.

## Features

### Natural Language Query Interface
- Ask questions about your inventory in plain English
- Intelligent query processing using Mistral LLM
- Real-time query conversion to MongoDB queries
- Rich, interactive results display
- Examples:
  - "Find all products with price greater than 100"
  - "Show me products with low stock"
  - "List products in warehouse A"
  - "Find electronics with price between 50 and 200"

### Dashboard
- Real-time metrics display
  - Total products and inventory levels
  - Warehouse utilization
  - Supplier statistics
  - Average product costs
- Low stock alerts with reorder thresholds
- Warehouse capacity warnings
- Natural language query interface
- Clean, intuitive interface

### Inventory Management
- Product tracking across multiple warehouses
- Stock level monitoring
- Reorder threshold management
- Product categorization
- SKU management
- Detailed product views with:
  - Stock levels per warehouse
  - Supplier information
  - Price history
  - Reorder thresholds

### Warehouse Management
- Multi-warehouse support
- Capacity tracking
- Utilization monitoring
- Location management
- Real-time capacity alerts
- Stock distribution visualization

### Supplier Management
- Supplier profile management
- Product-supplier relationships
- Contact information tracking
- Supply chain visibility
- Product catalog per supplier

### Security
- Role-based access control
- Secure authentication
- Protected API endpoints
- User session management
- Activity logging

## Technology Stack

### Frontend
- Angular 17+
- Angular Material UI
- RxJS for state management
- TypeScript
- Responsive design
- Material Design components

### Backend
- .NET Core 8
- MongoDB
- RESTful API
- JWT Authentication
- Mistral LLM integration
- Ollama for local LLM hosting

## Getting Started

### Prerequisites
- Node.js (v18+)
- .NET Core SDK 8.0
- MongoDB
- Angular CLI
- Ollama (for LLM support)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SupplySync.git
cd SupplySync
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
dotnet restore
```

4. Configure the database:
- Create a MongoDB database
- Update the connection string in `appsettings.json`

5. Install and start Ollama:
```bash
# Install Ollama (Linux)
curl https://ollama.ai/install.sh | sh
# Start Ollama service
ollama serve
# Pull the Mistral model
ollama pull mistral
```

6. Start the backend:
```bash
dotnet run
```

7. Start the frontend:
```bash
ng serve
```

8. Access the application at `http://localhost:4200`

## Usage

1. **Login**: Use your credentials to access the system
2. **Dashboard**: 
   - View key metrics and alerts
   - Use natural language queries to search inventory
   - Monitor real-time warehouse status
3. **Products**: 
   - Manage inventory and stock levels
   - Track product locations
   - Set reorder thresholds
4. **Warehouses**: 
   - Monitor capacity and locations
   - View stock distribution
   - Track utilization
5. **Suppliers**: 
   - Manage supplier relationships
   - View product catalogs
   - Track contact information

## Natural Language Query Examples

The system supports a wide range of natural language queries, such as:

1. Inventory queries:
   - "Show all products with less than 10 items in stock"
   - "Find products that need reordering"
   - "List products with price above $100"

2. Warehouse queries:
   - "Show warehouses near full capacity"
   - "Find products in Warehouse A"
   - "List warehouses with available space"

3. Supplier queries:
   - "Show products from Supplier X"
   - "Find suppliers with electronics products"
   - "List all suppliers in New York"

4. Complex queries:
   - "Find electronics with price between $50 and $200 and stock below 20"
   - "Show products that need reordering in Warehouse B"
   - "List high-value items (over $500) with low stock"

## Architecture

The system follows a clean architecture pattern:
- Frontend: 
  - Component-based architecture with services for data management
  - Material Design for consistent UI/UX
  - Reactive forms for user input
  - Real-time updates using RxJS
- Backend: 
  - RESTful API with repository pattern
  - LLM integration for natural language processing
  - Efficient MongoDB query generation
  - Robust error handling
- Database: 
  - MongoDB for flexible document storage
  - Optimized indexes for query performance
  - Structured collections for products, warehouses, and suppliers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.