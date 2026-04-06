import React, { useState } from 'react';
import './Login.css';
import logo from '../assets/Ht-logo.png';
import { supabase } from '../supabaseClient'; // Ensure this matches your file location

const AUTH_ROLE_STORAGE_KEY = 'happytails_admin_role';
const AUTH_ROLE_INTENT_STORAGE_KEY = 'happytails_auth_role_intent';
const AUTH_ERROR_STORAGE_KEY = 'happytails_auth_error';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('staff');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const pendingError = sessionStorage.getItem(AUTH_ERROR_STORAGE_KEY);
    if (pendingError) {
      setErrorMessage(pendingError);
      sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);
    sessionStorage.setItem(AUTH_ROLE_INTENT_STORAGE_KEY, userType);
    sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY);

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Fetch the role from your custom 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Account permissions not found. Please contact an admin.");
      }

      // 3. RBAC Check: Does the DB role match the toggle button?
      if (profile.role !== userType) {
        // Sign out immediately if it's a mismatch to clear the session
        await supabase.auth.signOut();
        sessionStorage.removeItem(AUTH_ROLE_INTENT_STORAGE_KEY);
        throw new Error('Invalid login credential for the selected role');
      }

      // 4. Success: Pass the actual database role back to App.jsx
      sessionStorage.removeItem(AUTH_ROLE_INTENT_STORAGE_KEY);
      localStorage.setItem(AUTH_ROLE_STORAGE_KEY, profile.role);
      onLogin(profile.role, data.user.id);
      
    } catch (err) {
      sessionStorage.removeItem(AUTH_ROLE_INTENT_STORAGE_KEY);
      await supabase.auth.signOut().catch(() => {});
      setErrorMessage(err.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-layout">
        <section className="login-visual-panel">
          <img src={logo} alt="Happy Tails Logo" className="login-hero-logo" />
        </section>

        <section className="login-form-panel">
          <div className="login-card">
            <h1 className="login-title">Happy Tails Admin</h1>
            
            {/* Display errors if they occur */}
            {errorMessage && (
              <div style={{ color: '#dc3545', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem' }}>
                {errorMessage}
              </div>
            )}

            <div className="user-type-selector">
              <button
                type="button"
                className={`type-btn ${userType === 'owner' ? 'active' : ''}`}
                onClick={() => setUserType('owner')}
              >
                Owner
              </button>
              <button
                type="button"
                className={`type-btn ${userType === 'staff' ? 'active' : ''}`}
                onClick={() => setUserType('staff')}
              >
                Staff
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@happytails.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button type="submit" className="signin-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
