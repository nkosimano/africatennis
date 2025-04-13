import { supabase } from './supabase';
import express from 'express';

const router = express.Router();

interface SessionValidationResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    // Add other user fields as needed
  };
}

async function validateSession(sessionToken: string): Promise<SessionValidationResponse> {
  try {
    // First, verify the session token with Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return {
        success: false,
        error: 'Invalid session token'
      };
    }

    // If the session is valid, get the user data
    const { data: { user }, error: userError } = await supabase.auth.getUser(sessionToken);

    if (userError || !user) {
      return {
        success: false,
        error: 'Failed to get user data'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        // Add other user fields as needed
      }
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

// Session validation endpoint
router.post('/api/auth/session', async (req, res) => {
  const { session_token } = req.body;

  if (!session_token) {
    return res.status(400).json({ error: 'Session token is required' });
  }

  const result = await validateSession(session_token);

  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  // If validation is successful, set the session cookie
  res.cookie('session', session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  return res.status(200).json({
    success: true,
    user: result.user
  });
});

export default router; 