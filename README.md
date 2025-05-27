# SupplySync

A modern warehouse inventory management system with role-based access control and real-time stock monitoring.

## Project Status
- ✅ Backend: Completed and fully tested
- 🚧 Frontend: In progress
- 📱 Mobile App: Planned

## Features
- Product inventory management (CRUD operations)
- Supplier management and tracking
- Multi-warehouse support with location codes
- Role-based authentication (Admin/Staff)
- Low-stock alerts and monitoring
- Detailed inventory tracking
- RESTful API with Swagger documentation

## Tech Stack
### Backend (Completed)
- ASP.NET Core 8.0 Web API
- MongoDB for flexible document storage
- JWT Authentication
- Swagger/OpenAPI documentation
- Integration tests for all endpoints

### Frontend (In Progress)
- Angular 17
- Material UI
- TypeScript
- Responsive design

## Getting Started

### Backend
1. Install .NET 8.0 SDK
2. Install MongoDB
3. Clone the repository
4. Navigate to `backend/src/SupplySync.Api`
5. Run `dotnet run`
6. Access Swagger UI at `http://localhost:5021/swagger`

### API Documentation
The API documentation is available through Swagger UI when running the backend. All endpoints are documented with:
- Request/response schemas
- Authentication requirements
- Role-based access control
- Example requests