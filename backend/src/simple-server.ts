import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = process.env['PORT'] || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env['POSTGRES_HOST'] || 'localhost',
  port: parseInt(process.env['POSTGRES_PORT'] || '5432'),
  database: process.env['POSTGRES_DB'] || 'alerting_app',
  user: process.env['POSTGRES_USER'] || 'postgres',
  password: process.env['POSTGRES_PASSWORD'] || 'password123',
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] || 'development',
      version: '1.0.0'
    }
  });
});

// Test database connection
app.get('/health/database', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Database connection failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Basic inventory endpoints
app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory_items ORDER BY created_at DESC LIMIT 10');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory items'
    });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { name, description, currentCount, lowStockThreshold, itemType, category, unit } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory_items (name, description, current_count, low_stock_threshold, item_type, category, unit, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [name, description, currentCount, lowStockThreshold, itemType, category, unit]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory item'
    });
  }
});

// Basic alerts endpoints
app.get('/api/alerts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

// Get active alerts only
app.get('/api/alerts/active', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM alerts WHERE status = 'active' ORDER BY created_at DESC");
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active alerts'
    });
  }
});

// Static users for demo
const staticUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  {
    id: '2',
    username: 'user',
    email: 'user@example.com',
    password: 'user123',
    firstName: 'Regular',
    lastName: 'User',
    role: 'user'
  }
];

// Basic auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Simple password hashing (in production, use bcrypt)
    const hashedPassword = Buffer.from(password).toString('base64');
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'user', true, NOW(), NOW()) RETURNING id, username, email, first_name, last_name, role`,
      [username, email, hashedPassword, firstName, lastName]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check static users first
    const staticUser = staticUsers.find(user => 
      user.username === username && user.password === password
    );
    
    if (staticUser) {
      // Simple token (in production, use JWT)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      return res.json({
        success: true,
        data: {
          user: {
            id: staticUser.id,
            username: staticUser.username,
            email: staticUser.email,
            firstName: staticUser.firstName,
            lastName: staticUser.lastName,
            role: staticUser.role
          },
          token: token,
          expiresIn: '24h'
        }
      });
    }
    
    // Check database users
    const hashedPassword = Buffer.from(password).toString('base64');
    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE username = $1 AND password_hash = $2 AND is_active = true',
      [username, hashedPassword]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    // Simple token (in production, use JWT)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        user: result.rows[0],
        token: token,
        expiresIn: '24h'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    // For demo purposes, decode token to get username
    const decoded = Buffer.from(token, 'base64').toString();
    const username = decoded.split(':')[0];
    
    // Check static users
    const staticUser = staticUsers.find(user => user.username === username);
    if (staticUser) {
      return res.json({
        success: true,
        data: {
          id: staticUser.id,
          username: staticUser.username,
          email: staticUser.email,
          firstName: staticUser.firstName,
          lastName: staticUser.lastName,
          role: staticUser.role
        }
      });
    }
    
    // Check database users
    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
});

export default app; 