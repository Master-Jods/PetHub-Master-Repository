import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './Orders.css';
import NotificationBell from './shared/NotificationBell';
import EditTotalModal from './shared/EditTotalModal';
import { getRiders } from '../data/riders';

const CATEGORY_TABS = ['All', 'Pet Shop', 'Pet Menu'];
const STATUS_OPTIONS = ['Pending', 'Order Placed', 'Preparing Order', 'Rider Picked Up', 'Out for Delivery', 'Delivered', 'Order Received', 'Cancelled'];
const PAYMENT_METHOD_OPTIONS = ['Cash', 'GCash'];
const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Refunded'];
const DELIVERY_METHOD_OPTIONS = ['Store Pickup', 'Delivery'];
const DELIVERY_ZONE_RATES = {
  Pleasantville: 0,
  'Ibabang Iyam/Ilayang Iyam': 50,
  'Brgy. 1-11 (Town proper area)': 70,
  'Gulang-gulang/Bocohan': 120,
  'Domoit/Ibabang Dupay/Red-V/Marketview/Ilayang Dupay/Silangang Mayao/Mayao Parada/Cotta/Isabang': 150
};
const REJECTION_REASONS = [
  'Payment not received',
  'Location out of reach',
  'Incomplete booking details',
  'Service unavailable',
  'Item unavailable',
  'Invalid request',
  'Duplicate request',
  'Outside service hours',
  'Other'
];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const RECORDS_PER_PAGE = 10;

const deliveryTimelineTemplate = [
  { key: 'placed', title: 'Order Placed', description: 'Order request has been placed by customer.', timestamp: '', completed: false },
  { key: 'preparing', title: 'Preparing Order', description: 'Order is being prepared and packed.', timestamp: '', completed: false },
  { key: 'picked_up', title: 'Rider Picked Up', description: 'Assigned rider picked up the package.', timestamp: '', completed: false },
  { key: 'out_for_delivery', title: 'Out for Delivery', description: 'Rider is on the way to customer address.', timestamp: '', completed: false },
  { key: 'delivered', title: 'Delivered', description: 'Order delivered successfully to customer.', timestamp: '', completed: false }
];

const pickupTimelineTemplate = [
  { key: 'placed', title: 'Order Placed', description: 'Order request has been placed by customer.', timestamp: '', completed: false },
  { key: 'preparing', title: 'Preparing Order', description: 'Order is being prepared for pickup.', timestamp: '', completed: false },
  { key: 'received', title: 'Order Received', description: 'Customer has received the order at the store.', timestamp: '', completed: false }
];

const createTimelineTemplate = (deliveryMethod) => (
  deliveryMethod === 'Delivery' ? deliveryTimelineTemplate : pickupTimelineTemplate
);

const normalizeTimeline = (timeline, deliveryMethod, status) => {
  const template = createTimelineTemplate(deliveryMethod);
  const source = Array.isArray(timeline) ? timeline : [];
  const statusLower = String(status || '').toLowerCase();

  return template.map((step, index) => {
    const matchingStep = source.find((item) => item.key === step.key);

    if (matchingStep) {
      return {
        ...step,
        timestamp: matchingStep.timestamp || '',
        completed: Boolean(matchingStep.completed)
      };
    }

    if (deliveryMethod === 'Store Pickup' && step.key === 'received') {
      const deliveredStep = source.find((item) => item.key === 'delivered');
      if (deliveredStep) {
        return {
          ...step,
          timestamp: deliveredStep.timestamp || '',
          completed: Boolean(deliveredStep.completed)
        };
      }
    }

    if (deliveryMethod === 'Store Pickup' && statusLower === 'order received' && index === template.length - 1) {
      return {
        ...step,
        completed: true,
        timestamp: step.timestamp || ''
      };
    }

    return { ...step };
  });
};

const getStatusFromTimeline = (timeline) => {
  const latestCompletedStep = [...timeline].reverse().find((step) => step.completed);
  return latestCompletedStep ? latestCompletedStep.title : 'Pending';
};

const mapOrder = (order) => ({
  id: order.orderId || order.order_id || String(order.id),
  category: order.category || 'Pet Shop',
  customer: order.customer || order.customer_name || 'Unknown Customer',
  email: order.email || '',
  phone: order.phone || '',
  date: order.date || order.order_date || '',
  items: Array.isArray(order.items) ? order.items : [],
  baseTotal: Number(order.baseTotal ?? order.base_total ?? 0),
  total: Number(order.total ?? 0),
  status: order.status || 'Pending',
  requestStatus: order.requestStatus || order.request_status || 'Pending Request',
  rejectionReason: order.rejectionReason || order.rejection_reason || '',
  paymentMethod: PAYMENT_METHOD_OPTIONS.includes(order.paymentMethod || order.payment_method)
    ? (order.paymentMethod || order.payment_method)
    : 'Cash',
  paymentStatus: PAYMENT_STATUS_OPTIONS.includes(order.paymentStatus || order.payment_status)
    ? (order.paymentStatus || order.payment_status)
    : 'Pending',
  deliveryMethod: DELIVERY_METHOD_OPTIONS.includes(order.deliveryMethod || order.delivery_method)
    ? (order.deliveryMethod || order.delivery_method)
    : 'Store Pickup',
  deliveryZone: order.deliveryZone || order.delivery_zone || '',
  deliveryFee: Number(order.deliveryFee ?? order.delivery_fee ?? 0),
  shippingAddress: order.shippingAddress || order.shipping_address || '',
  eta: order.eta || '',
  rider: order.rider || null,
  timeline: normalizeTimeline(order.timeline, order.deliveryMethod || order.delivery_method || 'Store Pickup', order.status),
  proofOfPayment: order.proofOfPayment || order.proof_of_payment || ''
});

function Orders({ onNotificationCountChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('details');
  const [riders, setRiders] = useState([]);
  const [totalEditModal, setTotalEditModal] = useState({ open: false, orderId: '', value: '' });
  const [rejectionModal, setRejectionModal] = useState({ open: false, reason: 'Payment not received', otherReason: '' });
  const [orders, setOrders] = useState([]);
  const [notificationItems, setNotificationItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [savingOrderId, setSavingOrderId] = useState('');
  const [savingModalChanges, setSavingModalChanges] = useState(false);
  const [savingRiderAssignment, setSavingRiderAssignment] = useState(false);
  const [savingDeliveryInfo, setSavingDeliveryInfo] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadRiders = async () => {
      try {
        const nextRiders = await getRiders();
        setRiders(nextRiders);
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load riders.');
      }
    };

    loadRiders();
  }, []);

  const syncNotificationCount = (count) => {
    setUnreadCount(count);
    if (onNotificationCountChange) {
      onNotificationCountChange(count);
    }
  };

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) {
          throw new Error(`Failed to fetch orders (${response.status})`);
        }

        const payload = await response.json();
        const nextOrders = Array.isArray(payload.orders) ? payload.orders.map(mapOrder) : [];
        setOrders(nextOrders);
        setNotificationItems(Array.isArray(payload.notifications) ? payload.notifications.slice(0, 10) : []);
        syncNotificationCount(Number(payload.unreadCount || 0));
        setError('');
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load orders.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(query)
      || order.customer.toLowerCase().includes(query)
      || order.email.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All Status' || order.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || order.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  }), [orders, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, orders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / RECORDS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  }, [filteredOrders, currentPage]);
  const pageStart = filteredOrders.length === 0 ? 0 : (currentPage - 1) * RECORDS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * RECORDS_PER_PAGE, filteredOrders.length);

  const stats = [
    { label: 'Total Orders', value: orders.length.toString().padStart(2, '0') },
    { label: 'Pending Requests', value: orders.filter((order) => order.requestStatus === 'Pending Request').length.toString().padStart(2, '0') },
    { label: 'Out for Delivery', value: orders.filter((order) => order.status === 'Out for Delivery').length.toString().padStart(2, '0') },
    { label: 'Delivered', value: orders.filter((order) => order.status === 'Delivered').length.toString().padStart(2, '0') }
  ];

  const formatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;
  const getStatusClass = (status) => `order-status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`;

  const getDraftValues = (order) => drafts[order.id] || {
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus
  };

  const hasPendingPaymentChanges = (order) => {
    const draft = drafts[order.id];
    if (!draft) return false;
    return draft.paymentMethod !== order.paymentMethod || draft.paymentStatus !== order.paymentStatus;
  };

  const handleDraftChange = (order, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [order.id]: {
        paymentMethod: prev[order.id]?.paymentMethod ?? order.paymentMethod,
        paymentStatus: prev[order.id]?.paymentStatus ?? order.paymentStatus,
        [key]: value
      }
    }));
  };

  const persistOrderPatch = async (orderId, patch) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patch)
    });

    if (!response.ok) {
      throw new Error(`Failed to update order (${response.status})`);
    }

    const payload = await response.json();
    const mapped = mapOrder(payload.order);
    setOrders((prev) => prev.map((order) => (order.id === mapped.id ? mapped : order)));
    setSelectedOrder((prev) => (prev && prev.id === mapped.id ? mapped : prev));
    if (Array.isArray(payload.notifications)) {
      setNotificationItems(payload.notifications.slice(0, 10));
    }
    if (typeof payload.unreadCount === 'number') {
      syncNotificationCount(payload.unreadCount);
    }
    return mapped;
  };

  const handleSavePaymentChanges = async (order) => {
    const draft = getDraftValues(order);
    if (!hasPendingPaymentChanges(order)) return;

    setSavingOrderId(order.id);

    try {
      await persistOrderPatch(order.id, {
        paymentMethod: draft.paymentMethod,
        paymentStatus: draft.paymentStatus
      });

      setDrafts((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
      setError('');
    } catch (saveError) {
      setError(saveError.message || 'Unable to update payment details.');
    } finally {
      setSavingOrderId('');
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder({ ...order });
    setActiveModalTab('details');
    setIsModalOpen(true);
  };

  const handleNotificationClick = (notificationId) => {
    const relatedOrder = orders.find((order) => order.id === notificationId);
    if (!relatedOrder) return;
    handleViewDetails(relatedOrder);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/notifications/read-all`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error(`Failed to clear order notifications (${response.status})`);
      }

      const payload = await response.json();
      setNotificationItems(Array.isArray(payload.notifications) ? payload.notifications.slice(0, 10) : []);
      syncNotificationCount(0);
      setError('');
    } catch (markError) {
      setError(markError.message || 'Unable to clear order notifications.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const updateSelectedOrderDraft = (updater) => {
    setSelectedOrder((prev) => (prev ? updater(prev) : prev));
  };

  const handleAssignRider = async (riderName) => {
    if (!selectedOrder) return;
    const rider = riders.find((item) => item.name === riderName) || null;
    updateSelectedOrderDraft((prev) => ({ ...prev, rider }));

    setSavingRiderAssignment(true);

    try {
      await persistOrderPatch(selectedOrder.id, { rider });
      setError('');
    } catch (saveError) {
      setError(saveError.message || 'Unable to assign rider.');
    } finally {
      setSavingRiderAssignment(false);
    }
  };

  const handleUpdateEta = (eta) => {
    updateSelectedOrderDraft((prev) => ({ ...prev, eta }));
  };

  const handleDeliveryMethodChange = async (deliveryMethod) => {
    if (!selectedOrder) return;

    const nextDeliveryZone = deliveryMethod === 'Delivery' ? (selectedOrder.deliveryZone || Object.keys(DELIVERY_ZONE_RATES)[0]) : '';
    const nextDeliveryFee = deliveryMethod === 'Delivery' ? DELIVERY_ZONE_RATES[nextDeliveryZone] : 0;
    const nextTimeline = normalizeTimeline(selectedOrder.timeline, deliveryMethod, selectedOrder.status);
    const nextStatus = deliveryMethod === 'Store Pickup' && ['Rider Picked Up', 'Out for Delivery', 'Delivered'].includes(selectedOrder.status)
      ? getStatusFromTimeline(nextTimeline)
      : selectedOrder.status;
    const nextRider = deliveryMethod === 'Delivery' ? selectedOrder.rider : null;
    const nextEta = deliveryMethod === 'Delivery' ? selectedOrder.eta : '';

    updateSelectedOrderDraft((prev) => ({
      ...prev,
      deliveryMethod,
      deliveryZone: nextDeliveryZone,
      deliveryFee: nextDeliveryFee,
      rider: nextRider,
      eta: nextEta,
      timeline: nextTimeline,
      status: nextStatus
    }));

    setSavingDeliveryInfo(true);

    try {
      await persistOrderPatch(selectedOrder.id, {
        deliveryMethod,
        deliveryZone: nextDeliveryZone,
        deliveryFee: nextDeliveryFee,
        rider: nextRider,
        eta: nextEta,
        timeline: nextTimeline,
        status: nextStatus
      });
      setError('');
    } catch (saveError) {
      setError(saveError.message || 'Unable to update fulfillment details.');
    } finally {
      setSavingDeliveryInfo(false);
    }
  };

  const handleDeliveryZoneChange = async (deliveryZone) => {
    if (!selectedOrder) return;
    const deliveryFee = DELIVERY_ZONE_RATES[deliveryZone] ?? 0;

    updateSelectedOrderDraft((prev) => ({
      ...prev,
      deliveryMethod: 'Delivery',
      deliveryZone,
      deliveryFee
    }));

    setSavingDeliveryInfo(true);

    try {
      await persistOrderPatch(selectedOrder.id, {
        deliveryMethod: 'Delivery',
        deliveryZone,
        deliveryFee
      });
      setError('');
    } catch (saveError) {
      setError(saveError.message || 'Unable to update delivery zone.');
    } finally {
      setSavingDeliveryInfo(false);
    }
  };

  const handleTimelineUpdate = (index, key, value) => {
    updateSelectedOrderDraft((prev) => ({
      ...prev,
      timeline: prev.timeline.map((step, stepIndex) => (stepIndex === index ? { ...step, [key]: value } : step))
    }));
  };

  const handleSetTimelineProgress = (targetIndex) => {
    updateSelectedOrderDraft((prev) => {
      const timeline = prev.timeline.map((step, index) => ({
        ...step,
        completed: index <= targetIndex,
        timestamp: index === targetIndex && !step.timestamp ? new Date().toLocaleString() : step.timestamp
      }));

      return {
        ...prev,
        timeline,
        status: getStatusFromTimeline(timeline),
        requestStatus: prev.requestStatus === 'Pending Request' ? 'Accepted' : prev.requestStatus
      };
    });
  };

  const saveSelectedOrderChanges = async (buildNextOrder) => {
    if (!selectedOrder) return;

    const nextOrder = buildNextOrder(selectedOrder);
    setSavingModalChanges(true);

    try {
      const saved = await persistOrderPatch(selectedOrder.id, {
        status: nextOrder.status,
        requestStatus: nextOrder.requestStatus,
        rejectionReason: nextOrder.rejectionReason,
        rider: nextOrder.rider,
        eta: nextOrder.eta,
        timeline: nextOrder.timeline,
        total: nextOrder.total
      });
      setSelectedOrder(saved);
      setError('');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save order changes.');
    } finally {
      setSavingModalChanges(false);
    }
  };

  const handleAcceptOrderRequest = () => {
    saveSelectedOrderChanges((currentOrder) => {
      const acceptedTimeline = currentOrder.timeline.map((step, index) => (
        index === 0
          ? { ...step, completed: true, timestamp: step.timestamp || new Date().toLocaleString() }
          : step
      ));

      return {
        ...currentOrder,
        requestStatus: 'Accepted',
        timeline: acceptedTimeline,
        status: getStatusFromTimeline(acceptedTimeline),
        rejectionReason: ''
      };
    });
  };

  const confirmRejectOrder = () => {
    if (!selectedOrder) return;
    const finalReason = rejectionModal.reason === 'Other' ? rejectionModal.otherReason.trim() : rejectionModal.reason;
    if (!finalReason) return;

    saveSelectedOrderChanges((currentOrder) => ({
      ...currentOrder,
      requestStatus: 'Rejected',
      status: 'Cancelled',
      rejectionReason: finalReason
    }));
    setRejectionModal({ open: false, reason: 'Payment not received', otherReason: '' });
  };

  const handleSaveTotal = async (orderId) => {
    const parsed = Number(totalEditModal.value);
    if (Number.isNaN(parsed) || parsed < 0) return;

    setSavingModalChanges(true);

    try {
      await persistOrderPatch(orderId, { total: parsed });
      setTotalEditModal({ open: false, orderId: '', value: '' });
      setError('');
    } catch (saveError) {
      setError(saveError.message || 'Unable to update order total.');
    } finally {
      setSavingModalChanges(false);
    }
  };

  const handleSaveTrackingChanges = () => {
    saveSelectedOrderChanges((currentOrder) => currentOrder);
  };

  return (
    <div className="orders-container">
      <div className="orders-header orders-header--with-actions">
        <div>
          <h1>Orders</h1>
          <p>Manage order requests, payment details, rider assignment, and delivery tracking.</p>
        </div>
        <NotificationBell
          notifications={notificationItems}
          unreadCount={unreadCount}
          title="Order Requests"
          emptyMessage="No recent order requests."
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </div>

      <div className="orders-tabs" role="tablist" aria-label="Order source category">
        {CATEGORY_TABS.map((tab) => (
          <button key={tab} type="button" className={`orders-tab ${categoryFilter === tab ? 'active' : ''}`} onClick={() => setCategoryFilter(tab)}>
            {tab}
          </button>
        ))}
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
        <input type="text" className="orders-search-input" placeholder="Search orders..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        <select className="orders-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All Status</option>
          {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>

      {error && <div className="orders-error">{error}</div>}
      {loading && <div className="orders-loading">Loading orders...</div>}

      {!loading && (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Category</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const draft = getDraftValues(order);
                  const hasChanges = hasPendingPaymentChanges(order);

                  return (
                    <tr key={order.id}>
                      <td><strong>{order.id}</strong></td>
                      <td>{order.category}</td>
                      <td>{order.customer}</td>
                      <td>{order.date}</td>
                      <td>
                        <button
                          type="button"
                          className="orders-total-trigger"
                          onClick={() => setTotalEditModal({ open: true, orderId: order.id, value: String(order.total) })}
                        >
                          {formatCurrency(order.total)}
                        </button>
                      </td>
                      <td>
                        <select
                          className="orders-inline-select"
                          value={draft.paymentMethod}
                          onChange={(event) => handleDraftChange(order, 'paymentMethod', event.target.value)}
                        >
                          {PAYMENT_METHOD_OPTIONS.map((method) => <option key={method}>{method}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          className="orders-inline-select"
                          value={draft.paymentStatus}
                          onChange={(event) => handleDraftChange(order, 'paymentStatus', event.target.value)}
                        >
                          {PAYMENT_STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                      <td><span className={getStatusClass(order.status)}>{order.status}</span></td>
                      <td>
                        <div className="orders-table-actions">
                          <button className="view-details-btn" onClick={() => handleViewDetails(order)}>View Details</button>
                          {hasChanges && (
                            <button
                              type="button"
                              className="orders-save-btn"
                              onClick={() => handleSavePaymentChanges(order)}
                              disabled={savingOrderId === order.id}
                            >
                              {savingOrderId === order.id ? 'Saving...' : 'Update'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="9" className="orders-empty-row">No orders found matching your criteria.</td></tr>
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content orders-modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.id}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <div className="orders-modal-tabs">
              <button type="button" className={`orders-modal-tab ${activeModalTab === 'details' ? 'active' : ''}`} onClick={() => setActiveModalTab('details')}>Details</button>
              <button type="button" className={`orders-modal-tab ${activeModalTab === 'tracking' ? 'active' : ''}`} onClick={() => setActiveModalTab('tracking')}>Track Order</button>
            </div>

            <div className="modal-body orders-modal-scroll-body">
              {activeModalTab === 'details' && (
                <div className="orders-details-layout">
                  <div>
                    <div className="order-details-grid">
                      <div className="detail-item"><span className="detail-label">Customer</span><span className="detail-value">{selectedOrder.customer}</span></div>
                      <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{selectedOrder.email}</span></div>
                      <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{selectedOrder.phone}</span></div>
                      <div className="detail-item"><span className="detail-label">Order Date</span><span className="detail-value">{selectedOrder.date}</span></div>
                      <div className="detail-item"><span className="detail-label">Category</span><span className="detail-value">{selectedOrder.category}</span></div>
                      <div className="detail-item"><span className="detail-label">Fulfillment</span><span className="detail-value">{selectedOrder.deliveryMethod}</span></div>
                      <div className="detail-item"><span className="detail-label">Delivery Fee</span><span className="detail-value">{formatCurrency(selectedOrder.deliveryFee)}</span></div>
                      <div className="detail-item">
                        <span className="detail-label">Status</span>
                        <span className={getStatusClass(selectedOrder.status)}>{selectedOrder.status}</span>
                      </div>
                      <div className="detail-item"><span className="detail-label">Payment Method</span><span className="detail-value">{selectedOrder.paymentMethod}</span></div>
                      <div className="detail-item"><span className="detail-label">Payment Status</span><span className="detail-value">{selectedOrder.paymentStatus}</span></div>
                    </div>

                    <div className="orders-acceptance-card">
                      <p><strong>Request Status:</strong> {selectedOrder.requestStatus}</p>
                      {selectedOrder.requestStatus === 'Rejected' && selectedOrder.rejectionReason && (
                        <p><strong>Rejection Reason:</strong> {selectedOrder.rejectionReason}</p>
                      )}
                      <div className="orders-fulfillment-card">
                        <div className="orders-rider-row">
                          <label htmlFor="delivery-method-select">Fulfillment:</label>
                          <select
                            id="delivery-method-select"
                            className="orders-inline-select"
                            value={selectedOrder.deliveryMethod}
                            onChange={(event) => handleDeliveryMethodChange(event.target.value)}
                            disabled={savingDeliveryInfo}
                          >
                            {DELIVERY_METHOD_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </div>
                        {selectedOrder.deliveryMethod === 'Delivery' && (
                          <>
                            <div className="orders-rider-row">
                              <label htmlFor="delivery-zone-select">Lucena Area:</label>
                              <select
                                id="delivery-zone-select"
                                className="orders-inline-select"
                                value={selectedOrder.deliveryZone}
                                onChange={(event) => handleDeliveryZoneChange(event.target.value)}
                                disabled={savingDeliveryInfo}
                              >
                                {Object.keys(DELIVERY_ZONE_RATES).map((zone) => <option key={zone}>{zone}</option>)}
                              </select>
                            </div>
                            <p><strong>Delivery Fee:</strong> {formatCurrency(selectedOrder.deliveryFee)}</p>
                            <p><strong>Address:</strong> {selectedOrder.shippingAddress || 'No delivery address provided.'}</p>
                            <p className="orders-delivery-note">Delivery is limited to supported Lucena City areas only.</p>
                          </>
                        )}
                        {selectedOrder.deliveryMethod === 'Store Pickup' && (
                          <p className="orders-delivery-note">Customer will pick up the order in-store.</p>
                        )}
                        {savingDeliveryInfo && <span className="orders-rider-saving">Saving fulfillment info...</span>}
                      </div>
                      {selectedOrder.paymentMethod === 'GCash' && (
                        <div className="orders-proof-card">
                          <strong>GCash Proof of Payment</strong>
                          <div className="orders-proof-placeholder">
                            <span className="orders-proof-icon">IMG</span>
                            <p>{selectedOrder.proofOfPayment || 'Awaiting uploaded proof of payment screenshot.'}</p>
                          </div>
                        </div>
                      )}
                      {selectedOrder.deliveryMethod === 'Delivery' && (
                        <div className="orders-rider-row">
                          <label htmlFor="rider-select">Assign Rider:</label>
                          <select id="rider-select" className="orders-inline-select" value={selectedOrder.rider?.name || ''} onChange={(event) => handleAssignRider(event.target.value)} disabled={savingRiderAssignment}>
                            <option value="">Select rider</option>
                            {riders.map((rider) => <option key={rider.id} value={rider.name}>{rider.name}</option>)}
                          </select>
                          {savingRiderAssignment && <span className="orders-rider-saving">Saving rider...</span>}
                        </div>
                      )}
                      {selectedOrder.requestStatus === 'Pending Request' && (
                        <div className="orders-request-actions">
                          <button type="button" className="update-status-btn" onClick={handleAcceptOrderRequest} disabled={savingModalChanges}>Accept Order Request</button>
                          <button type="button" className="orders-reject-btn" onClick={() => setRejectionModal({ open: true, reason: 'Payment not received', otherReason: '' })}>
                            Reject Request
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="order-items-section">
                    <h3>Order Items</h3>
                    <table className="order-items-table">
                      <thead>
                        <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.price)}</td>
                            <td className="item-total">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="orders-items-summary">
                      <div><span>Order Total</span><strong>{formatCurrency(selectedOrder.total)}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'tracking' && (
                <div className="delivery-tracker-card">
                  <div className="tracker-header">
                    <div>
                      <span className="detail-label">{selectedOrder.deliveryMethod === 'Delivery' ? 'Current Status' : 'Pickup Status'}</span>
                      <span className={getStatusClass(selectedOrder.status)}>{selectedOrder.status}</span>
                    </div>
                    {selectedOrder.deliveryMethod === 'Delivery' && (
                      <div>
                        <span className="detail-label">ETA</span>
                        <input type="text" className="orders-inline-input" value={selectedOrder.eta} onChange={(event) => handleUpdateEta(event.target.value)} />
                      </div>
                    )}
                  </div>

                  {selectedOrder.deliveryMethod === 'Delivery' && (
                    <div className="tracker-rider">
                      <h4>Rider Details</h4>
                      {selectedOrder.rider ? (
                        <div className="tracker-rider-grid">
                          <div><strong>Rider Name:</strong> {selectedOrder.rider.name}</div>
                          <div><strong>Contact Number:</strong> {selectedOrder.rider.contact}</div>
                          <div><strong>Vehicle Type:</strong> {selectedOrder.rider.vehicle}</div>
                          <div><strong>Plate Number:</strong> {selectedOrder.rider.plateNumber}</div>
                        </div>
                      ) : (
                        <p className="tracker-no-rider">No rider assigned yet.</p>
                      )}
                    </div>
                  )}

                  <div className="tracker-timeline">
                    <h4>Order Timeline</h4>
                    {selectedOrder.timeline.map((step, index) => (
                      <div key={step.key} className={`tracker-step ${step.completed ? 'done' : ''}`}>
                        <button
                          type="button"
                          className={`tracker-step-dot ${step.completed ? 'done' : ''}`}
                          onClick={() => handleSetTimelineProgress(index)}
                          aria-label={`Set ${step.title} as current status`}
                        />
                        <div className="tracker-step-content">
                          <strong>{step.title}</strong>
                          <p>{step.description}</p>
                          <input type="text" className="orders-inline-input" placeholder="Timestamp" value={step.timestamp} onChange={(event) => handleTimelineUpdate(index, 'timestamp', event.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="orders-tracking-actions">
                    <button type="button" className="orders-save-btn" onClick={handleSaveTrackingChanges} disabled={savingModalChanges}>
                      {savingModalChanges ? 'Saving...' : 'Save Tracking Updates'}
                    </button>
                  </div>
                </div>
              )}

              <div className="modal-actions"><button className="close-modal-btn" onClick={handleCloseModal}>Close</button></div>
            </div>
          </div>
        </div>
      )}

      {rejectionModal.open && selectedOrder && (
        <div className="modal-overlay" onClick={() => setRejectionModal({ open: false, reason: 'Payment not received', otherReason: '' })}>
          <div className="orders-rejection-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Reject Request - {selectedOrder.id}</h3>
            <p>Select a rejection reason:</p>
            <select
              className="orders-inline-select"
              value={rejectionModal.reason}
              onChange={(event) => setRejectionModal((prev) => ({ ...prev, reason: event.target.value }))}
            >
              {REJECTION_REASONS.map((reason) => <option key={reason}>{reason}</option>)}
            </select>
            {rejectionModal.reason === 'Other' && (
              <textarea
                className="orders-reason-input"
                placeholder="Enter custom reason"
                value={rejectionModal.otherReason}
                onChange={(event) => setRejectionModal((prev) => ({ ...prev, otherReason: event.target.value }))}
              />
            )}
            <div className="orders-rejection-actions">
              <button type="button" className="close-modal-btn" onClick={() => setRejectionModal({ open: false, reason: 'Payment not received', otherReason: '' })}>
                Cancel
              </button>
              <button type="button" className="orders-reject-btn" onClick={confirmRejectOrder}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <EditTotalModal
        open={totalEditModal.open}
        title="Edit Order Total"
        description="Update admin total while keeping the customer/base total as reference."
        value={totalEditModal.value}
        onChange={(value) => setTotalEditModal((prev) => ({ ...prev, value }))}
        onClose={() => setTotalEditModal({ open: false, orderId: '', value: '' })}
        onSave={() => handleSaveTotal(totalEditModal.orderId)}
      />
    </div>
  );
}

Orders.propTypes = {
  onNotificationCountChange: PropTypes.func
};

export default Orders;
