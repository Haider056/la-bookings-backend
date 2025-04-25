/**
 * Admin middleware to verify user has admin role
 */
const adminMiddleware = (req, res, next) => {
  // Check if user exists and has admin role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  // User is an admin, proceed to the next middleware
  next();
};

module.exports = adminMiddleware; 