import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Access token required',
          timestamp: new Date().toISOString()
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const user = await this.authService.verifyToken(token);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          timestamp: new Date().toISOString()
        });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        timestamp: new Date().toISOString()
      });
    }
  };

  requireRole = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  };

  requireAdmin = this.requireRole(['admin']);
  requireUser = this.requireRole(['admin', 'user']);
} 