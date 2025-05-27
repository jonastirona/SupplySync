#!/bin/bash

# MongoDB connection string
MONGO_URI="mongodb://localhost:27017/SupplySyncDb"

# Test user data
mongosh "$MONGO_URI" --eval '
db.Users.insertOne({
  username: "testadmin",
  email: "admin@supplysync.com",
  passwordHash: "PLACEHOLDER_HASH",  // This should be properly hashed in production
  role: "Admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
' 