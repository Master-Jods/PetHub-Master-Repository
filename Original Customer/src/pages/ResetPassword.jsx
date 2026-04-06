import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../backend/supabaseClient';
import { useAuth } from '../backend/context/AuthContext';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingRecovery, setIsLoadingRecovery] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeRecoverySession = async () => {
      if (!supabase) {
        if (!mounted) return;
        setError('Supabase is not configured. Update your .env file.');
        setIsLoadingRecovery(false);
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get('token_hash');
        const type = params.get('type');

        if (tokenHash && type === 'recovery') {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          });

          if (verifyError) {
            throw verifyError;
          }

          params.delete('token_hash');
          params.delete('type');
          const nextSearch = params.toString();
          const cleanedUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
          window.history.replaceState({}, document.title, cleanedUrl);
        }

        let { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        // Allow a short delay for auth state propagation when arriving from email link.
        if (!data?.session) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const retry = await supabase.auth.getSession();
          data = retry.data;
          sessionError = retry.error;
          if (sessionError) throw sessionError;
        }

        if (!mounted) return;
        if (data?.session) {
          setIsRecoveryReady(true);
        } else {
          setError('This reset link is invalid or expired. Please request a new password reset email.');
          setIsRecoveryReady(false);
        }
      } catch (recoveryError) {
        if (!mounted) return;
        setError(recoveryError?.message || 'Unable to verify reset link. Please request a new one.');
        setIsRecoveryReady(false);
      } finally {
        if (mounted) {
          setIsLoadingRecovery(false);
        }
      }
    };

    void initializeRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return !isSubmitting && isRecoveryReady && newPassword.length >= 8 && confirmPassword.length >= 8;
  }, [isSubmitting, isRecoveryReady, newPassword.length, confirmPassword.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(newPassword);
      const { data } = await supabase.auth.getSession();
      const hasSession = Boolean(data?.session?.user);
      const destination = hasSession ? '/profile' : '/';

      setSuccess('Password updated successfully. Redirecting now...');
      setNewPassword('');
      setConfirmPassword('');

      window.setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1200);
    } catch (submitError) {
      setError(submitError?.message || 'Unable to reset password right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <h1>Set New Password</h1>
        <p className="reset-password-subtitle">
          Choose a new password for your account.
        </p>

        {isLoadingRecovery ? (
          <div className="reset-password-info">Verifying reset link...</div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-password-form">
            <label htmlFor="reset-password-new">New Password</label>
            <input
              id="reset-password-new"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />

            <label htmlFor="reset-password-confirm">Confirm Password</label>
            <input
              id="reset-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              required
            />

            {error && <div className="reset-password-error">{error}</div>}
            {success && <div className="reset-password-success">{success}</div>}

            <button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="reset-password-links">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
