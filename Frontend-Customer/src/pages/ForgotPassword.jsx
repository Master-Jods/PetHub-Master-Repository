import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../backend/context/AuthContext';
import './ForgotPassword.css';

const GENERIC_SUCCESS_MESSAGE =
  'If an account exists for this email, we sent a password reset link. Please check your inbox and spam folder.';

const ForgotPassword = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextEmail = email.trim();

    if (!nextEmail) {
      setError('Please enter your email address.');
      setSuccess('');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await requestPasswordReset(nextEmail);
      setSuccess(GENERIC_SUCCESS_MESSAGE);
    } catch (submitError) {
      setError(submitError?.message || 'Unable to request password reset right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <h1>Forgot Password</h1>
        <p className="forgot-password-subtitle">
          Enter your account email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <label htmlFor="forgot-password-email">Email</label>
          <input
            id="forgot-password-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          {error && <div className="forgot-password-error">{error}</div>}
          {success && <div className="forgot-password-success">{success}</div>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="forgot-password-links">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
