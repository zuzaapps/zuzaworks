#!/bin/bash

# Production Database Setup for ZuZaWorksOS
# This script creates the users table in production

echo "🚀 Setting up production database..."

# Create users table
echo "📊 Creating users table..."
npx wrangler d1 execute zuzaworksos-production --remote --command="
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('executive', 'manager', 'employee', 'officer')),
  employee_id INTEGER,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
"

if [ $? -eq 0 ]; then
    echo "✅ Users table created successfully!"
else
    echo "❌ Failed to create users table"
    exit 1
fi

echo ""
echo "🎉 Production database setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy to production: npm run deploy:prod"
echo "2. Create your first user via API:"
echo "   curl -X POST https://zuzaworksos.pages.dev/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\": \"admin@yourcompany.com\", \"password\": \"YourSecurePass123!\", \"first_name\": \"Admin\", \"last_name\": \"User\", \"role\": \"executive\"}'"
echo ""
echo "3. Login at: https://zuzaworksos.pages.dev/login"
