import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../backend/context/AuthContext";
import AuthModal from "./AuthModal";

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) setShowModal(true);
    else setShowModal(false);
  }, [loading, user]);

  // Keep page content visible while auth state is resolving to avoid blank screens.
  if (loading) return children;

  return (
    <>
      {children}
      {!user && (
        <AuthModal
          show={showModal}
          onClose={() => {
            // Go back to the previous page; if none, go home
            if (window.history.length > 1) navigate(-1);
            else navigate("/");
          }}
        />
      )}
    </>
  );
};

export default RequireAuth;
