import { User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
  // ... existing code ...
} 