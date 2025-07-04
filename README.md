# Web Alerting Application

A comprehensive inventory management and alerting system for tracking medicine supplies and household inventory with real-time notifications.

## 🚀 Features

### Core Features
- **Dashboard Overview**: Real-time statistics and alerts
- **Inventory Management**: Add, edit, and track items
- **Alert System**: Low stock and expiry notifications
- **User Authentication**: Admin and regular user roles
- **Real-time Updates**: WebSocket integration for live alerts
- **Responsive Design**: Works on desktop and mobile devices

### Authentication
- **Admin User**: `admin` / `admin123` - Full access to all features
- **Regular User**: `user` / `user123` - Standard access

## 📸 Screenshots

### Login Page
![Login Page](https://via.placeholder.com/800x500/1976d2/ffffff?text=Login+Page)
*Clean login interface with demo credentials displayed*

### Dashboard
![Dashboard](https://via.placeholder.com/800x500/4caf50/ffffff?text=Dashboard+Overview)
*Comprehensive dashboard showing statistics and recent alerts*

### Inventory Management
![Inventory](https://via.placeholder.com/800x500/ff9800/ffffff?text=Inventory+Management)
*Inventory list with search and filter capabilities*

### Add Item Form
![Add Item](https://via.placeholder.com/800x500/9c27b0/ffffff?text=Add+New+Item)
*Form for adding new inventory items with validation*

### Alerts Page
![Alerts](https://via.placeholder.com/800x500/f44336/ffffff?text=Alerts+Management)
*Alert management with severity indicators*

### Settings Page
![Settings](https://via.placeholder.com/800x500/607d8b/ffffff?text=Settings+Configuration)
*Application settings and user preferences*

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Axios** for API communication
- **WebSocket** for real-time updates

### Backend
- **Node.js** with TypeScript
- **Express.js** for REST API
- **PostgreSQL** for data persistence
- **Redis** for caching and sessions
- **Kafka** for event streaming

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for orchestration
- **Nginx** for reverse proxy

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd web-alerting-application
```

### 2. Start the Application
```bash
# Start all services
docker-compose up -d

# Or start individual services
docker-compose up -d postgres redis kafka zookeeper
```

### 3. Seed the Database
```bash
cd backend
npm install
npx ts-node --transpile-only src/seed-data.ts
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Database**: PostgreSQL on port 5432
- **Redis**: Port 6379
- **Kafka UI**: http://localhost:8080
- **pgAdmin**: http://localhost:5050

## 🔐 Authentication

The application includes two demo users for testing:

### Admin User
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Administrator
- **Permissions**: Full access to all features

### Regular User
- **Username**: `user`
- **Password**: `user123`
- **Role**: User
- **Permissions**: Standard access

> **Note**: These are demo credentials for testing purposes. In production, implement proper user registration and secure authentication.

## 📊 Database Schema

### Inventory Items
```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  current_count INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  item_type VARCHAR(50) NOT NULL, -- 'medicine' or 'kitchen'
  category VARCHAR(100),
  unit VARCHAR(50),
  location VARCHAR(255),
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Alerts
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- 'low_stock', 'expiry', etc.
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  item_id UUID REFERENCES inventory_items(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/active` - Get active alerts only
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /api/alerts/:id/resolve` - Resolve alert

### Health
- `GET /health` - Application health check
- `GET /health/database` - Database connectivity check

## 🎯 Features in Detail

### Dashboard
- **Statistics Cards**: Total items, low stock, expired items, active alerts
- **Category Breakdown**: Medicine vs Kitchen items
- **Recent Alerts**: Latest alerts with severity indicators
- **Real-time Updates**: Live data via WebSocket

### Inventory Management
- **Item Categories**: Medicine and Kitchen items
- **Stock Tracking**: Current count and low stock thresholds
- **Expiry Management**: Track expiration dates
- **Search & Filter**: Find items quickly
- **Bulk Operations**: Add multiple items

### Alert System
- **Low Stock Alerts**: Automatic notifications when items run low
- **Expiry Alerts**: Warnings for items nearing expiration
- **Severity Levels**: Critical, High, Medium, Low
- **Alert Management**: Acknowledge and resolve alerts
- **Real-time Notifications**: Instant updates via WebSocket

### User Management
- **Role-based Access**: Admin and User roles
- **Authentication**: Secure login system
- **Session Management**: Persistent login sessions
- **User Profile**: View and manage user information

## 🐳 Docker Configuration

The application uses Docker Compose for easy deployment:

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: alerting_app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"
```

## 🔍 Monitoring & Logging

### Application Logs
- **Backend Logs**: `backend/logs/combined.log`
- **Error Logs**: `backend/logs/error.log`
- **Access Logs**: Real-time request logging

### Health Checks
- **Application Health**: `GET /health`
- **Database Health**: `GET /health/database`
- **Service Status**: Docker container health checks

## 🚀 Deployment

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
```bash
# Backend
NODE_ENV=production
PORT=4000
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=alerting_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password123

# Frontend
REACT_APP_API_URL=http://localhost:4000
REACT_APP_WS_URL=ws://localhost:4000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added authentication system
- **v1.2.0** - Enhanced dashboard and alerts
- **v1.3.0** - Real-time WebSocket integration

---

**Built with ❤️ using React, Node.js, and PostgreSQL** 