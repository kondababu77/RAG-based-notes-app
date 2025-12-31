/**
 * Global Error Handler Middleware
 * Production-Ready Error Handling
 */

const logger = require('../utils/logger');

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error details
  const errorLog = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
    timestamp: new Date().toISOString()
  };
  
  if (err.statusCode >= 500) {
    logger.error(JSON.stringify(errorLog));
  } else {
    logger.warn(JSON.stringify(errorLog));
  }

  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack,
      details: err.details || null
    });
  }

  // Production error responses - don't leak error details
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `${field} already exists`
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid resource ID format'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Your session has expired. Please log in again.'
    });
  }

  // NVIDIA/AI API errors
  if (err.message?.includes('NVIDIA') || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable. Please try again later.'
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.'
    });
  }

  // Operational errors (trusted errors we created)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Programming or unknown errors - don't leak details in production
  return res.status(500).json({
    success: false,
    error: 'Something went wrong. Please try again later.'
  });
};

module.exports = errorHandler;
module.exports.AppError = AppError;
