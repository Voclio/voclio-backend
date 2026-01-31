import jwt from 'jsonwebtoken';
import { User } from '../models/orm/index.js';
import config from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const user = await User.findOne({
      where: { 
        user_id: decoded.userId,
        is_active: true
      },
      attributes: ['user_id', 'email', 'name']
    });

    if (!user) {
      throw new UnauthorizedError('User not found or inactive');
    }

    req.user = user.toJSON();
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'));
    }
    
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const user = await User.findOne({
      where: { 
        user_id: decoded.userId,
        is_active: true
      },
      attributes: ['user_id', 'email', 'name']
    });

    if (user) {
      req.user = user.toJSON();
    }
    
    next();
  } catch (error) {
    next();
  }
};

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await User.findOne({
      where: { 
        user_id: req.user.user_id,
        is_active: true
      },
      attributes: ['user_id', 'email', 'name', 'is_admin']
    });

    if (!user || !user.is_admin) {
      throw new UnauthorizedError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export { authMiddleware, optionalAuth, adminMiddleware };
