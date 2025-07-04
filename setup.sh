#!/bin/bash

# Alerting Web Application Setup Script
# This script will help you set up and run the complete alerting application

set -e

echo "🚀 Alerting Web Application Setup"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ Environment file created. You can edit .env to customize settings."
else
    echo "✅ Environment file already exists"
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p backend/logs
echo "✅ Logs directory created"

# Build shared types
echo "🔨 Building shared types..."
cd shared-types
npm install
npm run build
cd ..
echo "✅ Shared types built"

# Build backend
echo "🔨 Building backend..."
cd backend
npm install
npm run build
cd ..
echo "✅ Backend built"

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm install
cd ..
echo "✅ Frontend dependencies installed"

# Start the application
echo "🚀 Starting the application with Docker Compose..."
echo "This may take a few minutes on first run..."

docker-compose up -d

echo ""
echo "🎉 Application is starting up!"
echo ""
echo "📊 Services:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:4000"
echo "  • Kafka UI: http://localhost:8080"
echo "  • pgAdmin: http://localhost:5050 (admin@alerting.com / admin123)"
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo "🔍 Health Checks:"
echo "  • Backend Health: http://localhost:4000/health"
echo "  • Frontend Health: http://localhost:3000/health"
echo ""
echo "📝 Useful Commands:"
echo "  • View logs: docker-compose logs -f [service-name]"
echo "  • Stop services: docker-compose down"
echo "  • Restart services: docker-compose restart"
echo "  • View all logs: docker-compose logs -f"
echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for services to be ready
echo "Waiting for backend to be ready..."
until curl -f http://localhost:4000/health > /dev/null 2>&1; do
    echo "  Backend not ready yet, waiting..."
    sleep 5
done

echo "Waiting for frontend to be ready..."
until curl -f http://localhost:3000 > /dev/null 2>&1; do
    echo "  Frontend not ready yet, waiting..."
    sleep 5
done

echo ""
echo "✅ All services are ready!"
echo ""
echo "🌐 Open your browser and navigate to:"
echo "   http://localhost:3000"
echo ""
echo "📚 For more information, see the README.md file"
echo ""
echo "🔧 To stop the application, run: docker-compose down" 