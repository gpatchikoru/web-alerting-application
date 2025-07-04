import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'user';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export class AuthService {
  private db: Pool;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(db: Pool) {
    this.db = db;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [data.username, data.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this username or email already exists');
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      const id = uuidv4();
      const now = new Date().toISOString();

      const result = await this.db.query(
        `INSERT INTO users (
          id, username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [
          id, data.username, data.email, hashedPassword, data.firstName, data.lastName,
          data.role || 'user', true, now, now
        ]
      );

      const user = this.mapRowToUser(result.rows[0]);
      logger.info(`Created user: ${user.username} (${user.id})`);
      
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const result = await this.db.query(
        'SELECT * FROM users WHERE username = $1 AND is_active = true',
        [data.username]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = this.mapRowToUser(result.rows[0]);
      const passwordHash = result.rows[0].password_hash;

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        this.jwtSecret,
        { expiresIn: this.jwtExpiresIn }
      );

      const expiresIn = this.parseJwtExpiresIn(this.jwtExpiresIn);

      logger.info(`User logged in: ${user.username} (${user.id})`);
      
      return {
        user,
        token,
        expiresIn
      };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      const result = await this.db.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Error verifying token:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw new Error('Failed to get user');
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    try {
      const now = new Date().toISOString();
      
      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (data.firstName !== undefined) {
        paramCount++;
        updateFields.push(`first_name = $${paramCount}`);
        values.push(data.firstName);
      }

      if (data.lastName !== undefined) {
        paramCount++;
        updateFields.push(`last_name = $${paramCount}`);
        values.push(data.lastName);
      }

      if (data.email !== undefined) {
        paramCount++;
        updateFields.push(`email = $${paramCount}`);
        values.push(data.email);
      }

      if (data.role !== undefined) {
        paramCount++;
        updateFields.push(`role = $${paramCount}`);
        values.push(data.role);
      }

      if (data.isActive !== undefined) {
        paramCount++;
        updateFields.push(`is_active = $${paramCount}`);
        values.push(data.isActive);
      }

      // Add updated_at
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(now);

      // Add id parameter
      paramCount++;
      values.push(id);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      const user = this.mapRowToUser(result.rows[0]);
      logger.info(`Updated user: ${user.username} (${user.id})`);
      
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get current password hash
      const result = await this.db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentPasswordHash = result.rows[0].password_hash;

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.db.query(
        'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
        [newPasswordHash, new Date().toISOString(), id]
      );

      logger.info(`Password changed for user: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );

      const deleted = result.rows.length > 0;
      if (deleted) {
        logger.info(`Deleted user: ${id}`);
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.db.query(
        'SELECT * FROM users ORDER BY created_at DESC'
      );

      return result.rows.map(this.mapRowToUser);
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private parseJwtExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 24 * 60 * 60; // Default to 24 hours
    }
  }
} 