import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';

function Signup() {
  const { signup, login, loading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailSignup = async (event) => {
    event.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await signup(email, password);
      showToast('Account created successfully.', 'success');
      navigate('/');
    } catch (err) {
      const errorMessage = err?.message || 'Unable to create your account. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      await login();
      showToast('Signed in successfully.', 'success');
      navigate('/');
    } catch (err) {
      const errorMessage = err?.message || 'Unable to sign up with Google. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
      <div className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold text-white">Create your account</h2>
          <p className="mt-2 text-slate-300">Start saving concepts and tracking your learning progress with a free account.</p>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Create a password"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Re-enter password"
            />
          </label>

          <Button variant="primary" type="submit" className="w-full">Create account</Button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
          <div className="relative mx-auto w-max bg-panel/80 px-4 text-xs uppercase tracking-[0.35em] text-slate-400">
            Or sign up with
          </div>
        </div>

        <Button
          variant="ghost"
          type="button"
          onClick={handleGoogleSignup}
          className="w-full justify-center gap-3"
          disabled={loading}
        >
          Continue with Google
        </Button>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <p className="text-center text-sm text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-white hover:text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Signup;
