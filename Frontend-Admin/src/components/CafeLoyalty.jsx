import React, { useEffect, useState, useMemo } from 'react';
import './Customers.css';
import { supabaseCafe } from '../supabaseCafe';
import { supabase } from '../supabaseClient';

const RECORDS_PER_PAGE = 10;

function CafeLoyalty() {
  const [accounts, setAccounts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [stampCountInput, setStampCountInput] = useState(1);
  const [reasonInput, setReasonInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch loyalty accounts from cafe schema
      const { data: accountsData, error: accountsErr } = await supabaseCafe
        .from('loyalty_accounts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (accountsErr) throw accountsErr;

      const customerIds = (accountsData || []).map((acc) => acc.customer_id).filter(Boolean);

      // 2. Fetch profiles from public schema to get names and contact details
      if (customerIds.length > 0) {
        const { data: profilesData, error: profilesErr } = await supabase
          .from('profiles')
          .select('id, name, email, phone')
          .in('id', customerIds);

        if (profilesErr) throw profilesErr;

        const profileMap = {};
        (profilesData || []).forEach((p) => {
          profileMap[p.id] = p;
        });
        setProfiles(profileMap);
      }

      setAccounts(accountsData || []);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setError(err.message || 'Failed to load loyalty accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const profile = profiles[acc.customer_id] || {};
      const name = profile.name || 'Unknown Customer';
      const email = profile.email || '';
      const phone = profile.phone || '';
      const query = searchTerm.toLowerCase();

      return (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        phone.includes(query) ||
        acc.customer_id.toLowerCase().includes(query)
      );
    });
  }, [accounts, profiles, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / RECORDS_PER_PAGE));
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredAccounts.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  }, [filteredAccounts, currentPage]);

  const pageStart = filteredAccounts.length === 0 ? 0 : (currentPage - 1) * RECORDS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * RECORDS_PER_PAGE, filteredAccounts.length);

  const handleAwardClick = (account) => {
    setSelectedAccount(account);
    setStampCountInput(1);
    setReasonInput('');
    setIsAwardModalOpen(true);
  };

  const handleAwardSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setSaving(true);
    setError('');

    try {
      // Call award stamps RPC in cafe schema
      const { data, error: err } = await supabaseCafe.rpc('award_manual_loyalty_stamps', {
        p_customer_id: selectedAccount.customer_id,
        p_stamp_count: Number(stampCountInput),
        p_reason: reasonInput || null,
      });

      if (err) throw err;

      // Update local stamp count
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.customer_id === selectedAccount.customer_id
            ? { ...acc, stamp_count: (acc.stamp_count || 0) + Number(stampCountInput) }
            : acc
        )
      );
      setIsAwardModalOpen(false);
    } catch (err) {
      console.error('Error awarding stamps:', err);
      setError(err.message || 'Failed to award stamps.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetCard = async (account) => {
    if (!window.confirm('Are you sure you want to reset this customer\'s stamp card to 0?')) return;
    setError('');
    try {
      const { error: err } = await supabaseCafe.rpc('reset_customer_loyalty_card', {
        p_customer_id: account.customer_id,
        p_reason: 'Admin manual reset',
      });

      if (err) throw err;

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.customer_id === account.customer_id
            ? { ...acc, stamp_count: 0 }
            : acc
        )
      );
      alert('Loyalty card reset successfully!');
    } catch (err) {
      console.error('Error resetting loyalty card:', err);
      setError(err.message || 'Failed to reset loyalty card.');
    }
  };

  return (
    <div className="customers-wrapper">
      <div className="customers-header">
        <h1 className="customers-header__title">Cafe Loyalty Cards</h1>
        <p className="customers-header__subtitle">Manage customer loyalty stamp cards and award manual stamps.</p>
      </div>

      <div className="customers-search-section">
        <input
          type="text"
          placeholder="Search by name, email, or customer ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="customers-search__input"
          style={{ flex: 1 }}
        />
      </div>

      {error && <div className="customers-error">{error}</div>}
      {loading && <div className="customers-loading">Loading loyalty accounts...</div>}

      {!loading && (
        <div className="customers-table-container">
          <table className="customers-table">
            <thead className="customers-table__header">
              <tr>
                <th className="customers-table__header-cell">Customer ID</th>
                <th className="customers-table__header-cell">Name</th>
                <th className="customers-table__header-cell">Email</th>
                <th className="customers-table__header-cell" style={{ textAlign: 'center' }}>Stamps</th>
                <th className="customers-table__header-cell">Last Updated</th>
                <th className="customers-table__header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAccounts.length > 0 ? (
                paginatedAccounts.map((acc) => {
                  const profile = profiles[acc.customer_id] || {};
                  return (
                    <tr key={acc.customer_id} className="customers-table__row">
                      <td className="customers-table__cell">
                        <span className="customers-id-badge">{acc.customer_id}</span>
                      </td>
                      <td className="customers-table__cell">{profile.name || 'Unknown Customer'}</td>
                      <td className="customers-table__cell">{profile.email || 'N/A'}</td>
                      <td className="customers-table__cell" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {acc.stamp_count || 0}
                      </td>
                      <td className="customers-table__cell">
                        {acc.updated_at ? new Date(acc.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="customers-table__cell">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="customers-view-btn"
                            onClick={() => handleAwardClick(acc)}
                          >
                            Award Stamps
                          </button>
                          <button
                            className="customers-view-btn"
                            style={{ background: '#fce4ec', color: '#c2185b', border: '1px solid #f8bbd0' }}
                            onClick={() => handleResetCard(acc)}
                          >
                            Reset Card
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="customers-table__cell customers-empty-state">
                    No loyalty accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="records-footer">
            <div className="customers-results-count">
              Showing {pageStart}-{pageEnd} of {filteredAccounts.length} accounts
            </div>
            {filteredAccounts.length > RECORDS_PER_PAGE && (
              <div className="records-pagination records-pagination--inline">
                <button
                  type="button"
                  className="records-pagination__btn records-pagination__btn--small"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <div className="records-pagination__info">Page {currentPage} of {totalPages}</div>
                <button
                  type="button"
                  className="records-pagination__btn records-pagination__btn--small"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Award stamps modal */}
      {isAwardModalOpen && selectedAccount && (
        <div className="modal-overlay" onClick={() => setIsAwardModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '450px' }}>
            <div className="modal-header">
              <h2>Award Stamps</h2>
              <button className="close-btn" onClick={() => setIsAwardModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAwardSubmit} style={{ padding: '24px' }}>
              <p style={{ marginBottom: '14px', fontSize: '14px', color: '#666' }}>
                Award stamps to <strong>{profiles[selectedAccount.customer_id]?.name || 'Customer'}</strong>.
              </p>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: '600' }}>Number of Stamps *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={stampCountInput}
                  onChange={(e) => setStampCountInput(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600' }}>Reason</label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                  placeholder="e.g. Purchase reward"
                />
              </div>

              <button type="submit" className="add-first-btn" disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Awarding...' : 'Award Stamps'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CafeLoyalty;
