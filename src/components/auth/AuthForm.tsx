import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, Loader } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot';

const isPasswordRequired = (mode: AuthMode): boolean => {
  return mode === 'signin' || mode === 'signup';
};

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsername = async (username: string) => {
    if (!username) {
      setUsernameAvailable(true);
      return;
    }

    try {
      setCheckingUsername(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      setUsernameAvailable(!data);
    } catch (err) {
      console.error('Error checking username:', err);
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
    checkUsername(value);
  };

  const createProfile = async (userId: string, email: string, username: string) => {
    try {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      console.log('Attempting to create profile with:', { userId, email, username });
      const { data, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: email,
            username: username,
            full_name: username,
            avatar_url: null,
            bio: null,
            playing_style: null,
            preferred_hand: null,
            is_coach: false,
            coach_hourly_rate: null,
            coach_specialization: null,
            skill_level: null,
            location_id: null,
            current_ranking_points_singles: 1000,
            current_ranking_points_doubles: 1000,
            rating_status: 'Provisional',
            singles_matches_played: 0,
            doubles_matches_played: 0,
            singles_matches_won: 0,
            doubles_matches_won: 0
          }
        ])
        .select();

      if (profileError) {
        console.error('Profile creation error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        if (profileError.code === '23505') { // Unique violation
          if (profileError.message.includes('email')) {
            throw new Error('Email already in use');
          }
          if (profileError.message.includes('username')) {
            throw new Error('Username already taken');
          }
        }
        
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('Profile created successfully:', data);
      return data;
    } catch (err) {
      console.error('Error creating profile - full error:', err);
      throw err instanceof Error ? err : new Error('Failed to create profile. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        alert('Password reset instructions sent to your email');
      } else if (mode === 'signup') {
        if (!username) {
          throw new Error('Username is required');
        }
        if (!usernameAvailable) {
          throw new Error('Username is already taken');
        }

        // First sign up the user
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            }
          },
        });

        if (signUpError) {
          if (signUpError.message === 'User already registered') {
            setMode('signin');
            throw new Error('An account with this email already exists. Please sign in instead.');
          }
          throw signUpError;
        }

        if (!user) {
          throw new Error('Failed to create user account.');
        }

        // Log the signup response
        console.log('Signup response:', { user });

        try {
          // Create profile with username
          await createProfile(user.id, email, username);
          // Sign in immediately after successful signup
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            throw signInError;
          }
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          throw new Error('Failed to complete account setup. Please try signing in.');
        }
      } else {
        // Handle sign in
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message === 'Invalid login credentials') {
            throw new Error('Incorrect email or password. Please try again.');
          }
          throw signInError;
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md p-8 glass rounded-xl shadow-lg"
    >
      <h2 className="text-2xl font-bold text-center mb-8">
        {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          {mode === 'signup' && (
            <div className="relative flex items-center bg-surface rounded-lg focus-within:ring-2 focus-within:ring-accent transition-all">
              <User className="ml-3 text-gray-400" size={20} />
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className={`w-full pl-2 pr-4 py-2 bg-transparent focus:outline-none border-none ${
                  checkingUsername
                    ? 'ring-yellow-500'
                    : usernameAvailable
                    ? ''
                    : 'ring-2 ring-red-500'
                }`}
                placeholder="Username"
                required={mode === 'signup'}
              />
              {mode === 'signup' && !usernameAvailable && (
                <p className="text-sm text-red-500 mt-1">Username is already taken</p>
              )}
              {mode === 'signup' && checkingUsername && (
                <p className="text-sm text-yellow-500 mt-1">Checking username availability...</p>
              )}
            </div>
          )}

          <div className="relative flex items-center bg-surface rounded-lg focus-within:ring-2 focus-within:ring-accent transition-all">
            <Mail className="ml-3 text-gray-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-2 pr-4 py-2 bg-transparent focus:outline-none border-none"
              placeholder="Email"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div className="relative flex items-center bg-surface rounded-lg focus-within:ring-2 focus-within:ring-accent transition-all">
              <Lock className="ml-3 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-2 pr-4 py-2 bg-transparent focus:outline-none border-none"
                placeholder="Password"
                required={isPasswordRequired(mode)}
              />
            </div>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm text-center"
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={loading || (mode === 'signup' && (!usernameAvailable || checkingUsername))}
          className="w-full py-2 px-4 bg-accent text-primary font-medium rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader className="animate-spin mx-auto" size={20} />
          ) : mode === 'signin' ? (
            'Sign In'
          ) : mode === 'signup' ? (
            'Sign Up'
          ) : (
            'Send Reset Instructions'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        {mode === 'signin' ? (
          <>
            <button
              onClick={() => setMode('forgot')}
              className="text-accent hover:underline"
            >
              Forgot password?
            </button>
            <p className="mt-2">
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-accent hover:underline"
              >
                Sign up
              </button>
            </p>
          </>
        ) : mode === 'signup' ? (
          <p>
            Already have an account?{' '}
            <button
              onClick={() => setMode('signin')}
              className="text-accent hover:underline"
            >
              Sign in
            </button>
          </p>
        ) : (
          <button
            onClick={() => setMode('signin')}
            className="text-accent hover:underline"
          >
            Back to sign in
          </button>
        )}
      </div>
    </motion.div>
  );
}