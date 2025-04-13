import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../contexts/AuthContext';
import { Trophy } from 'lucide-react';

export function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <Trophy size={48} className="text-accent" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Africa Tennis</h1>
        <p className="text-lg opacity-80">Connect • Compete • Excel</p>
      </motion.div>

      <AuthForm />
    </div>
  );
}