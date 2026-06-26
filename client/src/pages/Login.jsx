import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';

function Login() {
  const { user, login, emailLogin, loading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(returnPath, { replace: true });
    }
  }, [user, navigate, returnPath]);

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await login();
      showToast('Signed in successfully.', 'success');
    } catch (err) {
      const errorMessage = err?.message || 'Unable to sign in. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      await emailLogin(email, password);
      showToast('Signed in successfully.', 'success');
    } catch (err) {
      const errorMessage = err?.message || 'Unable to sign in with email. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleAdminShortcut = () => {
    setEmail('manoit2005@gmail.com');
  };

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
      <div className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold text-white">Welcome back</h2>
          <p className="mt-2 text-slate-300">Sign in to access your saved concepts, progress, and AI search history.</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-accent hover:text-white">
              Forgot password?
            </Link>
          </div>

          <Button variant="primary" type="submit" className="w-full">Sign in</Button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
          <div className="relative mx-auto w-max bg-panel/80 px-4 text-xs uppercase tracking-[0.35em] text-slate-400">
            Or continue with
          </div>
        </div>

        <Button
          variant="ghost"
          type="button"
          onClick={handleGoogleLogin}
          className="w-full justify-center gap-3"
          disabled={loading}
        >
          Continue with Google
        </Button>
        
        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={handleAdminShortcut}
            className="text-xs text-slate-500 hover:text-white transition"
          >
            Log in as Administrator
          </button>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <p className="text-center text-sm text-slate-300">
          Don’t have an account?{' '}
          <Link to="/signup" className="font-semibold text-white hover:text-accent">
            Sign up
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
