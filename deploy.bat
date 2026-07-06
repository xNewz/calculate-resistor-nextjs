@echo off
echo =========================================
echo 🚀 Starting Deployment Process
echo =========================================

REM Uncomment below if you use Git
REM echo 📦 Pulling latest code from Git...
REM git pull origin main

echo 📦 Installing dependencies...
call npm install

echo 🗄️ Generating Prisma Client ^& Updating Database...
call npx prisma generate
call npx prisma db push

echo 🏗️ Building Next.js application...
call npm run build

echo 🔄 Starting/Restarting application with PM2...
call pm2 restart resistor-lab
if %ERRORLEVEL% neq 0 (
  echo Starting new PM2 process...
  call pm2 start npm --name "resistor-lab" -- run start -- -p 8080
)

echo =========================================
echo ✅ Deployment Completed Successfully!
echo =========================================
