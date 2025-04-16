import { supabase } from './supabase';

interface SessionValidationResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    // Add other user fields as needed
  };
}

export async function validateSession(sessionToken: string): Promise<SessionValidationResponse> {
  try {
    // First, verify the session token with Supabase
    const { error: sessionError } = await supabase.auth.getSession();
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