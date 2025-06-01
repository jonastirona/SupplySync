# SupplySync - Warehouse Management System

SupplySync is a modern, full-stack warehouse management system built with Angular and .NET Core. It provides real-time monitoring of inventory levels, warehouse capacity, and supply chain operations.

## Features

### Dashboard
- Real-time metrics display
  - Total products and inventory levels
  - Warehouse utilization
  - Supplier statistics
  - Average product costs
- Low stock alerts with reorder thresholds
- Warehouse capacity warnings
- Clean, intuitive interface

### Inventory Management
- Product tracking across multiple warehouses
- Stock level monitoring
- Reorder threshold management
- Product categorization
- SKU management

### Warehouse Management
- Multi-warehouse support
- Capacity tracking
- Utilization monitoring
- Location management

### Supplier Management
- Supplier profile management
- Product-supplier relationships
- Contact information tracking
- Supply chain visibility

### Security
- Role-based access control
- Secure authentication
- Protected API endpoints
- User session management

## Technology Stack

### Frontend
- Angular 17+
- Angular Material UI
- RxJS for state management
- TypeScript
- Responsive design

### Backend
- .NET Core 8
- MongoDB
- RESTful API
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js (v18+)
- .NET Core SDK 8.0
- MongoDB
- Angular CLI

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

5. Start the backend:
```bash
dotnet run
```

6. Start the frontend:
```bash
ng serve
```

7. Access the application at `http://localhost:4200`

## Usage

1. **Login**: Use your credentials to access the system
2. **Dashboard**: View key metrics and alerts
3. **Products**: Manage inventory and stock levels
4. **Warehouses**: Monitor capacity and locations
5. **Suppliers**: Manage supplier relationships

## Architecture

The system follows a clean architecture pattern:
- Frontend: Component-based architecture with services for data management
- Backend: RESTful API with repository pattern
- Database: MongoDB for flexible document storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.