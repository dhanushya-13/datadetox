import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, ArrowRight, Lock, User, Sparkles, CheckCircle2, Mail, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface AuthProps {
  onLogin: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);

  React.useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;

      if (event.data?.type === 'OAUTH_LOGIN_SUCCESS') {
        const { token, user } = event.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('last_login_email', user.username);
        setSuccess('Neural Link Established via Google. Accessing Dashboard...');
        setTimeout(() => onLogin(user), 1000);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onLogin]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const lastEmail = localStorage.getItem('last_login_email');
      const url = lastEmail ? `/api/auth/google/login/url?login_hint=${encodeURIComponent(lastEmail)}` : '/api/auth/google/login/url';
      const data = await apiFetch<{ url: string }>(url);
      if (data?.url) {
        window.open(data.url, 'google_login', 'width=600,height=700');
      }
    } catch (err: any) {
      setError('Failed to initiate Google Sign-In.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && strength < 3) {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const data = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (data && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('last_login_email', data.user.username);
        setSuccess('Neural Link Established. Accessing Dashboard...');
        setTimeout(() => onLogin(data.user), 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-200/30 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-[3rem] p-12 relative z-10 bg-white/80 backdrop-blur-xl border-none shadow-2xl shadow-zinc-200"
      >
        <div className="flex flex-col items-center text-center space-y-6 mb-10">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-zinc-300">
            <Wind size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter text-zinc-900 font-serif italic">
              {isLogin ? 'Welcome Back' : 'Join DataDetox'}
            </h1>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest">
              {isLogin ? 'Neural Intelligence Awaits' : 'Start Your Digital Wellness Journey'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-200 transition-all outline-none"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-200 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {!isLogin && password && (
              <div className="px-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Strength</span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    strength <= 2 ? "text-red-500" : strength <= 4 ? "text-amber-500" : "text-emerald-500"
                  )}>
                    {strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong'}
                  </span>
                </div>
                <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i}
                      className={cn(
                        "h-full flex-1 transition-all duration-500",
                        i <= strength 
                          ? (strength <= 2 ? "bg-red-500" : strength <= 4 ? "bg-amber-500" : "bg-emerald-500")
                          : "bg-zinc-100"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-bold text-red-500 text-center uppercase tracking-widest"
            >
              {error}
            </motion.p>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-500 text-center uppercase tracking-widest"
            >
              <CheckCircle2 size={14} />
              {success}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-200 flex items-center justify-center gap-3 group"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-white px-4 text-zinc-300">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 bg-white border border-zinc-100 text-zinc-900 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-100 text-center space-y-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
          
          {isLogin && (
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Demo Access</p>
              <p className="text-xs font-medium text-zinc-600">
                User: <span className="font-bold text-zinc-900">demo</span> • 
                Pass: <span className="font-bold text-zinc-900">password123</span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-[0.3em]">
          <Sparkles size={12} />
          Neural Link Secured
        </div>
      </motion.div>
    </div>
  );
};
