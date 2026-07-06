#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================="
echo "🚀 Starting Deployment Process"
echo "========================================="

# 1. Pull the latest code (Uncomment if you use Git on your server)
# echo "📦 Pulling latest code from Git..."
# git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Prisma Database Setup
echo "🗄️ Generating Prisma Client & Updating Database..."
npx prisma generate

# Use `db push` for prototyping or `migrate deploy` for production
npx prisma db push 
# npx prisma migrate deploy

# 4. Build the application
echo "🏗️ Building Next.js application..."
npm run build

# 5. Start / Restart application using PM2
echo "🔄 Starting/Restarting application with PM2..."

# Check if PM2 is installed globally, if not, recommend installing it
if ! command -v pm2 &> /dev/null
then
    echo "⚠️ PM2 could not be found. Please install it using: npm install -g pm2"
    echo "Running with standard npm start instead..."
    npm start
    exit
fi

# Check if app is already managed by PM2
if pm2 show practice-lab > /dev/null; then
  echo "Restarting existing PM2 process..."
  pm2 restart practice-lab
else
  echo "Starting new PM2 process..."
  pm2 start npm --name "practice-lab" -- run start -- -p 8080
fi

echo "========================================="
echo "✅ Deployment Completed Successfully!"
echo "========================================="
