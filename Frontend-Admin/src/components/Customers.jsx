import React, { useEffect, useMemo, useState } from 'react';
import './Customers.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pethub-customer-api.onrender.com/api';
const RECORDS_PER_PAGE = 10;

const mapCustomer = (customer) => ({
  id: customer.customerId || customer.customer_id || String(customer.id),
  name: customer.name || customer.full_name || 'Unknown Customer',
  contact: customer.contact || customer.phone || '',
  email: customer.email || '',
  status: customer.status || 'Active',
  accountCreated: customer.accountCreated || customer.account_created || customer.created_at || '',
  lastActive: customer.lastActive || customer.last_active || '',
  totalOrders: Number(customer.totalOrders ?? customer.total_orders ?? 0),
  totalSpent: Number(customer.totalSpent ?? customer.total_spent ?? 0),
  pets: Array.isArray(customer.pets) ? customer.pets : [],
  recentOrders: Array.isArray(customer.recentOrders || customer.recent_orders)
    ? (customer.recentOrders || customer.recent_orders).map((order) => ({
        id: order.id || order.orderCode || order.order_code || 'Order',
        date: order.date || order.orderDate || order.order_date || '',
        amount: Number(order.amount ?? order.total ?? 0),
        status: order.status || '',
      }))
    : []
});

function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/customers`);
        if (!response.ok) {
          throw new Error(`Failed to fetch customers (${response.status})`);
        }

        const payload = await response.json();
        const nextCustomers = Array.isArray(payload.customers) ? payload.customers.map(mapCustomer) : [];
        setCustomers(nextCustomers);
        setError('');
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load customers.');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch = !query
        || customer.name.toLowerCase().includes(query)
        || customer.id.toLowerCase().includes(query)
        || customer.email.toLowerCase().includes(query)
        || customer.contact.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all'
        || customer.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, customers]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / RECORDS_PER_PAGE));
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredCustomers.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  }, [filteredCustomers, currentPage]);
  const pageStart = filteredCustomers.length === 0 ? 0 : (currentPage - 1) * RECORDS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * RECORDS_PER_PAGE, filteredCustomers.length);

  return (
    <div className="customers-wrapper">
      <div className="customers-header">
        <h1 className="customers-header__title">Customer Management</h1>
        <p className="customers-header__subtitle">Manage and view customer information, pets, and order history.</p>
      </div>

      <div className="customers-search-section">
        <input
          type="text"
          placeholder="Search by name, ID, email, or contact..."
          value={searchTerm}
          onChange={handleSearch}
          className="customers-search__input"
        />

        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="customers-filter__select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="customers-error">{error}</div>}
      {loading && <div className="customers-loading">Loading customers...</div>}

      {!loading && (
        <div className="customers-table-container">
          <table className="customers-table">
            <thead className="customers-table__header">
              <tr>
                <th className="customers-table__header-cell">Customer ID</th>
                <th className="customers-table__header-cell">Name</th>
                <th className="customers-table__header-cell">Contact</th>
                <th className="customers-table__header-cell">Email</th>
                <th className="customers-table__header-cell">Status</th>
                <th className="customers-table__header-cell">Account Created</th>
                <th className="customers-table__header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="customers-table__row">
                    <td className="customers-table__cell">
                      <span className="customers-id-badge">{customer.id}</span>
                    </td>
                    <td className="customers-table__cell">{customer.name}</td>
                    <td className="customers-table__cell">{customer.contact || 'N/A'}</td>
                    <td className="customers-table__cell">{customer.email || 'N/A'}</td>
                    <td className="customers-table__cell">
                      <span className={`customers-status-badge customers-status-badge--${customer.status.toLowerCase()}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="customers-table__cell">{formatDate(customer.accountCreated)}</td>
                    <td className="customers-table__cell">
                      <button
                        className="customers-view-btn"
                        onClick={() => handleViewDetails(customer)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="customers-table__cell customers-empty-state">
                    No customers found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="records-footer">
            <div className="customers-results-count">
              Showing {pageStart}-{pageEnd} of {filteredCustomers.length} customers
            </div>
            {filteredCustomers.length > RECORDS_PER_PAGE && (
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

      {showModal && selectedCustomer && (
        <div className="customers-modal-overlay" onClick={handleCloseModal}>
          <div className="customers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="customers-modal__header">
              <h2 className="customers-modal__title">Customer Details</h2>
              <button className="customers-modal__close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="customers-modal__body">
              <div className="customers-profile-card">
                <div className="customers-profile__header">
                  <div className="customers-profile__id">{selectedCustomer.id}</div>
                  <span className={`customers-status-badge customers-status-badge--${selectedCustomer.status.toLowerCase()}`}>
                    {selectedCustomer.status}
                  </span>
                </div>

                <div className="customers-profile__info">
                  <div className="customers-profile__row">
                    <div className="customers-profile__group">
                      <span className="customers-profile__label">Full Name</span>
                      <span className="customers-profile__value">{selectedCustomer.name}</span>
                    </div>
                    <div className="customers-profile__group">
                      <span className="customers-profile__label">Contact</span>
                      <span className="customers-profile__value">{selectedCustomer.contact || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="customers-profile__row">
                    <div className="customers-profile__group">
                      <span className="customers-profile__label">Email</span>
                      <span className="customers-profile__value">{selectedCustomer.email || 'N/A'}</span>
                    </div>
                    <div className="customers-profile__group">
                      <span className="customers-profile__label">Member Since</span>
                      <span className="customers-profile__value">{formatDate(selectedCustomer.accountCreated)}</span>
                    </div>
                  </div>
                </div>

                <div className="customers-profile__stats">
                  <div className="customers-profile__stat">
                    <span className="customers-profile__stat-label">Orders</span>
                    <span className="customers-profile__stat-value">{selectedCustomer.totalOrders}</span>
                  </div>
                  <div className="customers-profile__stat">
                    <span className="customers-profile__stat-label">Pets</span>
                    <span className="customers-profile__stat-value">{selectedCustomer.pets.length}</span>
                  </div>
                </div>
              </div>

              <div className="customers-section">
                <h3 className="customers-section__title">Registered Pets</h3>
                {selectedCustomer.pets.length > 0 ? (
                  <div className="customers-pets-list">
                    {selectedCustomer.pets.map((pet, index) => (
                      <div key={pet.id || index} className="customers-pet-item">
                        <span className="customers-pet__name">{pet.name}</span>
                        <span className="customers-pet__details">
                          {[pet.species || pet.type, pet.breed, pet.age ? `${pet.age} yrs` : null].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="customers-no-data">No registered pets</div>
                )}
              </div>

              <div className="customers-section">
                <h3 className="customers-section__title">Recent Orders</h3>
                {selectedCustomer.recentOrders.length > 0 ? (
                  <div className="customers-orders-list">
                    {selectedCustomer.recentOrders.slice(0, 3).map((order, index) => (
                      <div key={order.id || index} className="customers-order-item">
                        <div className="customers-order__info">
                          <span className="customers-order__id">{order.id || 'Order'}</span>
                          <span className="customers-order__date">{formatDate(order.date)}</span>
                        </div>
                        <div className="customers-order__amount">₱{Number(order.amount || 0).toFixed(2)}</div>
                      </div>
                    ))}
                    {selectedCustomer.recentOrders.length > 3 && (
                      <div className="customers-more-orders">
                        +{selectedCustomer.recentOrders.length - 3} more orders
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="customers-no-data">No recent orders</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
