import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

export function createAuthRoutes(authService: AuthService, authMiddleware: AuthMiddleware) {
  const router = Router();

  // Register new user
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username, email, and password are required'
        });
      }

      const user = await authService.createUser({
        username,
        email,
        password,
        firstName,
        lastName
      });

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  });

  // Login user
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
      }

      const result = await authService.login({ username, password });

      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role
          },
          token: result.token,
          expiresIn: '24h'
        }
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      
      if (error.message.includes('Invalid credentials')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  });

  // Get current user profile
  router.get('/profile', authMiddleware.authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await authService.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  });

  // Update user profile
  router.put('/profile', authMiddleware.authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { firstName, lastName, email } = req.body;

      const updatedUser = await authService.updateUser(userId, {
        firstName,
        lastName,
        email
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user profile'
      });
    }
  });

  // Change password
  router.put('/change-password', authMiddleware.authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      logger.error('Change password error:', error);
      
      if (error.message.includes('Invalid current password')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid current password'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  });

  // Get all users (admin only)
  router.get('/users', authMiddleware.authenticate, authMiddleware.requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const users = await authService.getAllUsers();

      res.json({
        success: true,
        data: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }))
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users'
      });
    }
  });

  // Update user role (admin only)
  router.put('/users/:id/role', authMiddleware.authenticate, authMiddleware.requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Valid role (user or admin) is required'
        });
      }

      const updatedUser = await authService.updateUser(id, { role });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user role'
      });
    }
  });

  // Delete user (admin only)
  router.delete('/users/:id', authMiddleware.authenticate, authMiddleware.requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await authService.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      });
    }
  });

  return router;
} 