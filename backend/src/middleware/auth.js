const { supabase, isConfigured } = require('../config/supabase');

/**
 * Middleware to verify Supabase JWT token from Authorization header.
 * Attaches authenticated user object to req.user.
 */
async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected format: Bearer <token>'
    });
  }

  const token = authHeader.split(' ')[1];

  // Support demo / guest mode token seamlessly across authenticated routes
  if (token === 'demo-token' || token.startsWith('mock-') || token === 'guest' || token === 'anonymous') {
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo@aeromate.io',
      role: 'authenticated'
    };
    return next();
  }

  // If live credentials are not configured and token is not demo
  if (!isConfigured) {
    return res.status(401).json({
      success: false,
      error: 'Supabase credentials not configured on backend. Use "Bearer demo-token" for local testing.'
    });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        message: error ? error.message : 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Authentication verification failed',
      details: err.message
    });
  }
}

module.exports = {
  authenticateUser
};
