import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';

function ForgotPassword() {
  const { resetPassword, loading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      await resetPassword(email);
      const successMessage = 'Check your inbox for instructions to reset your password.';
      showToast(successMessage, 'success');
    } catch (err) {
      const errorMessage = err?.message || 'Unable to send password reset instructions. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
      <div className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold text-white">Forgot your password?</h2>
          <p className="mt-2 text-slate-300">Enter your email and we’ll send you a link to reset it.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button variant="primary" type="submit" className="w-full" disabled={loading}>Send reset link</Button>
        </form>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <p className="text-center text-sm text-slate-300">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-white hover:text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}

export default ForgotPassword;
