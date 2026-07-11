import React, { useEffect, useState, useMemo } from 'react';
import './Orders.css';
import { supabaseCafe } from '../supabaseCafe';

const STATUS_OPTIONS = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'refunded'];
const RECORDS_PER_PAGE = 10;

function CafeOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [paymentDraft, setPaymentDraft] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabaseCafe
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching Cafe orders:', err);
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        order.code?.toLowerCase().includes(query) ||
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_email?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'All Status' ||
        order.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / RECORDS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const pageStart = filteredOrders.length === 0 ? 0 : (currentPage - 1) * RECORDS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * RECORDS_PER_PAGE, filteredOrders.length);

  // Stats Card data
  const stats = useMemo(() => {
    return [
      { label: 'Total Cafe Orders', value: orders.length.toString().padStart(2, '0') },
      { label: 'Pending Orders', value: orders.filter((o) => o.status === 'pending').length.toString().padStart(2, '0') },
      { label: 'Preparing / Ready', value: orders.filter((o) => ['preparing', 'ready'].includes(o.status)).length.toString().padStart(2, '0') },
      { label: 'Completed Orders', value: orders.filter((o) => ['completed', 'delivered'].includes(o.status)).length.toString().padStart(2, '0') },
    ];
  }, [orders]);

  const formatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;
  const getStatusClass = (status) => `order-status-badge status-${(status || '').toLowerCase().replace(/\s+/g, '-')}`;

  // View Details Modal
  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setStatusDraft(order.status);
    setPaymentDraft(order.payment_status);
    setIsModalOpen(true);
    setLoadingItems(true);
    setSelectedOrderItems([]);

    try {
      const { data, error: err } = await supabaseCafe
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (err) throw err;
      setSelectedOrderItems(data || []);
    } catch (err) {
      console.error('Error fetching order items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    setError('');
    try {
      const { data, error: err } = await supabaseCafe
        .from('orders')
        .update({
          status: statusDraft,
          payment_status: paymentDraft,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id)
        .select('*')
        .single();

      if (err) throw err;

      // Update local state
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? data : o)));
      setSelectedOrder(data);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err.message || 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDeliveryAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    try {
      const fields = [];
      if (addr.street) fields.push(addr.street);
      if (addr.barangay) fields.push(addr.barangay);
      if (addr.city) fields.push(addr.city);
      return fields.join(', ') || 'N/A';
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Cafe Orders</h1>
        <p>Manage cafe order fulfillment, updates, and payments.</p>
      </div>

      <div className="orders-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <h3>{stat.label}</h3>
            <div className="stat-number">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="orders-filters">
        <input
          type="text"
          className="orders-search-input"
          placeholder="Search by code or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="orders-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="orders-error">{error}</div>}
      {loading && <div className="orders-loading">Loading orders...</div>}

      {!loading && (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order Code</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Type</th>
                <th>Total</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.code}</strong></td>
                    <td>{order.customer_name || 'Guest'}</td>
                    <td>{order.placed_at ? new Date(order.placed_at).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{order.order_type || 'takeout'}</td>
                    <td>{formatCurrency(order.total_amount)}</td>
                    <td style={{ textTransform: 'uppercase' }}>{order.payment_method || 'Cash'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{order.payment_status || 'Pending'}</td>
                    <td>
                      <span className={getStatusClass(order.status)}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div className="orders-table-actions">
                        <button
                          className="view-details-btn"
                          onClick={() => handleViewDetails(order)}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="orders-empty-row">
                    No orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="records-footer">
            <div className="customers-results-count">
              Showing {pageStart}-{pageEnd} of {filteredOrders.length} orders
            </div>
            {filteredOrders.length > RECORDS_PER_PAGE && (
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

      {isModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content orders-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.code}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="modal-body orders-modal-scroll-body">
              <div className="orders-details-layout">
                <div>
                  <div className="order-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Customer</span>
                      <span className="detail-value">{selectedOrder.customer_name || 'Guest'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{selectedOrder.customer_email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{selectedOrder.customer_phone || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Order Type</span>
                      <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                        {selectedOrder.order_type || 'takeout'}
                      </span>
                    </div>
                    {selectedOrder.order_type === 'delivery' && (
                      <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                        <span className="detail-label">Delivery Address</span>
                        <span className="detail-value">
                          {formatDeliveryAddress(selectedOrder.delivery_address)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="orders-acceptance-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Order Status
                        </label>
                        <select
                          className="orders-filter-select"
                          style={{ width: '100%', margin: 0 }}
                          value={statusDraft}
                          onChange={(e) => setStatusDraft(e.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Payment Status
                        </label>
                        <select
                          className="orders-filter-select"
                          style={{ width: '100%', margin: 0 }}
                          value={paymentDraft}
                          onChange={(e) => setPaymentDraft(e.target.value)}
                        >
                          {PAYMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        className="update-status-btn"
                        style={{ marginTop: '8px', padding: '12px' }}
                        onClick={handleUpdateStatus}
                        disabled={updating}
                      >
                        {updating ? 'Saving Changes...' : 'Save Order Changes'}
                      </button>
                    </div>
                  </div>

                  {selectedOrder.receipt_image_url && (
                    <div className="orders-proof-card">
                      <strong>GCash Proof of Payment</strong>
                      <img
                        src={selectedOrder.receipt_image_url}
                        alt="Proof of payment"
                        className="orders-proof-preview"
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="order-items-section">
                    <h3>Items Ordered</h3>
                    {loadingItems && <div style={{ padding: '20px', textAlign: 'center' }}>Loading order items...</div>}
                    {!loadingItems && (
                      <table className="order-items-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrderItems.map((item) => (
                            <tr key={item.id}>
                              <td>
                                {item.item_name}
                                {item.option_label && (
                                  <div style={{ fontSize: '11px', color: '#666' }}>
                                    Option: {item.option_label}
                                  </div>
                                )}
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.unit_price)}</td>
                              <td className="item-total">
                                {formatCurrency(item.line_total || item.quantity * item.unit_price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="orders-items-summary">
                    <div>
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.total_amount)}</span>
                    </div>
                    {selectedOrder.discount_total > 0 && (
                      <div>
                        <span>Discount</span>
                        <span>-{formatCurrency(selectedOrder.discount_total)}</span>
                      </div>
                    )}
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ffd0e5' }}>
                      <strong>Grand Total</strong>
                      <strong>{formatCurrency(selectedOrder.total_amount)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CafeOrders;
