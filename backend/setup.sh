#!/bin/bash

# Install dependencies
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOL
PORT=3000
MONGODB_URI=mongodb://localhost:27017/supplysync
FRONTEND_URL=http://localhost:4200
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
EOL
fi

# Create dist directory if it doesn't exist
mkdir -p dist

# Build the project
npm run build

echo "Backend setup complete! Run 'npm run dev' to start the development server." 