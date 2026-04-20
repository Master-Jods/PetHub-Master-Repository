import React from 'react';

const CUSTOMER_URL = import.meta.env.VITE_CUSTOMER_URL || 'https://pethub-customer.vercel.app';
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'https://pethub-admin-three.vercel.app';

function App() {
  const handleContinue = (href) => {
    window.location.assign(href);
  };

  return (
    <main className="launcher-shell">
      <section className="launcher-card" aria-label="Portal choices">
        <h1>Welcome to PetHub!</h1>
        <div className="launcher-actions">
          <button
            type="button"
            className="launcher-button"
            onClick={() => handleContinue(CUSTOMER_URL)}
          >
            Continue as Customer
          </button>
          <button
            type="button"
            className="launcher-button launcher-button--secondary"
            onClick={() => handleContinue(ADMIN_URL)}
          >
            Continue as Admin
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;
