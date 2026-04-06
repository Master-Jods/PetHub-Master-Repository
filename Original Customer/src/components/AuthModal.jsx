import React, { useMemo, useState } from "react";
import { Modal, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../backend/context/AuthContext";
import "./AuthModal.css";

const AuthModal = ({ show, onClose, onSuccess }) => {
  const { login, signup, loading: authLoading } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (mode === "login") {
      return email.trim() && password.trim();
    }
    return (
      firstName.trim() &&
      lastName.trim() &&
      phone.trim() &&
      email.trim() &&
      password.trim() &&
      confirmPassword.trim()
    );
  }, [mode, email, password, firstName, lastName, phone, confirmPassword]);

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setConfirmPassword("");
    setError("");
    setSubmitting(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      resetFields();
      onClose?.();
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await signup({
        firstName,
        lastName,
        phone,
        email,
        password,
      });
      resetFields();
      setMode("login");
    } catch (err) {
      setError(err?.message || "Sign up failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={false}
      contentClassName="ht-auth-modal"
      backdropClassName="ht-auth-backdrop"
    >
      <Modal.Header closeButton className="ht-auth-header">
        <Modal.Title className="ht-auth-title">
          {mode === "login" ? "Login" : "Create Account"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {mode === "login" ? (
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label className="ht-auth-label">Email</Form.Label>
              <div className="ht-auth-field">
                <span className="ht-auth-icon bi bi-envelope"></span>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="ht-auth-label">Password</Form.Label>
              <div className="ht-auth-field">
                <span className="ht-auth-icon bi bi-lock"></span>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  className={`ht-auth-eye bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <span className="visually-hidden">Toggle password</span>
                </button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="ht-auth-remember"
                label="Remember me"
                className="ht-auth-remember"
              />
            </Form.Group>

            <div className="mb-3 text-end">
              <Link to="/forgot-password" className="ht-auth-link">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-100 ht-auth-submit"
              disabled={!canSubmit || submitting || authLoading}
            >
              {submitting ? <Spinner size="sm" animation="border" /> : "Login"}
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handleSignup}>
            <Form.Group className="mb-3">
              <Form.Label className="ht-auth-label">First Name</Form.Label>
              <Form.Control
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="ht-auth-label">Last Name</Form.Label>
              <Form.Control
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="ht-auth-label">Phone</Form.Label>
              <Form.Control
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXXX"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="ht-auth-label">Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="ht-auth-label">Password</Form.Label>
              <div className="ht-auth-field">
                <span className="ht-auth-icon bi bi-lock"></span>
                <Form.Control
                  type={showSignupPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  className={`ht-auth-eye bi ${showSignupPassword ? "bi-eye-slash" : "bi-eye"}`}
                  onClick={() => setShowSignupPassword((v) => !v)}
                >
                  <span className="visually-hidden">Toggle password</span>
                </button>
              </div>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="ht-auth-label">Confirm Password</Form.Label>
              <div className="ht-auth-field">
                <span className="ht-auth-icon bi bi-lock-fill"></span>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  className={`ht-auth-eye bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  <span className="visually-hidden">Toggle password</span>
                </button>
              </div>
            </Form.Group>

            <Button
              type="submit"
              className="w-100 ht-auth-submit"
              disabled={!canSubmit || submitting || authLoading}
            >
              {submitting ? (
                <Spinner size="sm" animation="border" />
              ) : (
                "Create Account"
              )}
            </Button>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer className="ht-auth-footer">
        {mode === "login" ? (
          <span>
            Don’t have an account?{" "}
            <button
              type="button"
              className="ht-auth-link"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              Create Account
            </button>
          </span>
        ) : (
          <span>
            Already have an account?{" "}
            <button
              type="button"
              className="ht-auth-link"
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Login
            </button>
          </span>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default AuthModal;
