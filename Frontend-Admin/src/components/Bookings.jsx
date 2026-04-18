import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import './Bookings.css';
import NotificationBell from './shared/NotificationBell';
import EditTotalModal from './shared/EditTotalModal';

const SERVICE_TABS = ['All', 'Grooming', 'Boarding', 'Birthday Party'];
const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Refunded'];
const BOOKING_STATUS_OPTIONS = ['Pending Approval', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const POLL_INTERVAL_MS = 60000;
const RECORDS_PER_PAGE = 10;

const formatCurrency = (amount) => `PHP ${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const getBookingStatusClass = (status) => `bookings-status-badge bookings-status-${String(status || 'pending-approval').toLowerCase().replace(/\s+/g, '-')}`;
const getPetPhotoUrl = (petInfo = {}) => petInfo.photoUrl || petInfo.photo || petInfo.imageUrl || petInfo.image || '';
const getPetPhotoFilename = (booking) => {
  const rawName = booking.petInfo?.name || booking.bookingId || 'pet-photo';
  return `${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'pet-photo'}-${booking.bookingId}.jpg`;
};

const formatDateTime = (dateValue, timeValue) => {
  const hasDate = Boolean(dateValue);
  const hasTime = Boolean(timeValue);

  if (!hasDate && !hasTime) return 'Not scheduled';
  if (!hasDate) return timeValue;
  if (!hasTime) return new Date(dateValue).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  const parsedDate = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(parsedDate.getTime())) {
    return `${dateValue} ${timeValue}`;
  }

  return parsedDate.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatPetBirthday = (petInfo = {}) => {
  const rawBirthday = petInfo.birthday || petInfo.birthDate || petInfo.dateOfBirth || petInfo.dob || '';

  if (!rawBirthday) return 'N/A';

  const parsedDate = new Date(rawBirthday);
  if (Number.isNaN(parsedDate.getTime())) {
    return rawBirthday;
  }

  return parsedDate.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const mapBooking = (booking) => ({
  id: String(booking.id),
  serviceType: booking.serviceType || booking.service_type || 'Unknown',
  customer: booking.customer || booking.customer_name || booking.contactInfo?.owner || 'Unknown Customer',
  bookingId: booking.bookingId || booking.booking_id || String(booking.id),
  appointmentDate: booking.appointmentDate || booking.appointment_date || '',
  appointmentTime: booking.appointmentTime || booking.appointment_time || '',
  serviceTotal: Number(booking.serviceTotal ?? booking.service_total ?? 0),
  paymentMethod: ['Cash', 'GCash'].includes(booking.paymentMethod || booking.payment_method)
    ? (booking.paymentMethod || booking.payment_method)
    : 'Cash',
  paymentStatus: booking.paymentStatus || booking.payment_status || 'Pending',
  bookingStatus: booking.bookingStatus || booking.booking_status || 'Pending Approval',
  petInfo: booking.petInfo || booking.pet_info || {
    name: 'N/A',
    type: 'N/A',
    size: 'N/A',
    breed: 'N/A'
  },
  appointmentInfo: booking.appointmentInfo || booking.appointment_info || {
    date: booking.appointmentDate || booking.appointment_date || '',
    time: booking.appointmentTime || booking.appointment_time || ''
  },
  contactInfo: booking.contactInfo || booking.contact_info || {
    phone: '',
    owner: booking.customer || booking.customer_name || '',
    email: ''
  },
  groomingSummary: booking.groomingSummary || booking.grooming_summary || {
    services: [],
    addOns: [],
    includes: []
  },
  totalPriceHistory: booking.totalPriceHistory || booking.total_price_history || [],
  paymentProof: booking.paymentProof || booking.payment_proof || '',
  paymentProofName: booking.paymentProofName || booking.payment_proof_name || '',
  note: booking.note || '',
  specialRequests: booking.specialRequests || booking.special_requests || '',
  hasScheduleConflict: Boolean(booking.hasScheduleConflict || booking.has_schedule_conflict),
  scheduleConflictCount: Number(booking.scheduleConflictCount ?? booking.schedule_conflict_count ?? 0),
  conflictingBookingIds: booking.conflictingBookingIds || booking.conflicting_booking_ids || [],
  conflictingBookingCodes: booking.conflictingBookingCodes || booking.conflicting_booking_codes || [],
});

function Bookings({ onNotificationCountChange }) {
  const [bookings, setBookings] = useState([]);
  const [notificationItems, setNotificationItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [savingBookingId, setSavingBookingId] = useState('');
  const [totalEditModal, setTotalEditModal] = useState({ open: false, bookingId: '', value: '' });
  const [currentPage, setCurrentPage] = useState(1);

  const syncNotificationCount = (count) => {
    setUnreadCount(count);
    if (onNotificationCountChange) {
      onNotificationCountChange(count);
    }
  };

  const loadBookings = async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`);
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings (${response.status})`);
      }

      const payload = await response.json();
      const nextBookings = Array.isArray(payload.bookings) ? payload.bookings.map(mapBooking) : [];

      setBookings(nextBookings);
      setNotificationItems(Array.isArray(payload.notifications) ? payload.notifications.slice(0, 10) : []);
      syncNotificationCount(Number(payload.unreadCount || 0));
      setError('');
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load bookings.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings({ showLoader: true });

    const poller = window.setInterval(() => {
      loadBookings();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(poller);
  }, []);

  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query
      || booking.customer.toLowerCase().includes(query)
      || booking.bookingId.toLowerCase().includes(query)
      || booking.serviceType.toLowerCase().includes(query);

    const matchesService = serviceFilter === 'All' || booking.serviceType === serviceFilter;
    const matchesStatus = statusFilter === 'All Status' || booking.bookingStatus === statusFilter;

    return matchesSearch && matchesService && matchesStatus;
  }), [bookings, searchTerm, serviceFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serviceFilter, statusFilter, bookings]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / RECORDS_PER_PAGE));
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  }, [filteredBookings, currentPage]);
  const pageStart = filteredBookings.length === 0 ? 0 : (currentPage - 1) * RECORDS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * RECORDS_PER_PAGE, filteredBookings.length);

  const getDraftValues = (booking) => drafts[booking.id] || {
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.bookingStatus,
    serviceTotal: booking.serviceTotal
  };

  const hasPendingChanges = (booking) => {
    const draft = drafts[booking.id];
    if (!draft) return false;

    return draft.paymentStatus !== booking.paymentStatus
      || draft.bookingStatus !== booking.bookingStatus
      || Number(draft.serviceTotal) !== Number(booking.serviceTotal);
  };

  const handleDraftChange = (booking, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [booking.id]: {
        paymentStatus: prev[booking.id]?.paymentStatus ?? booking.paymentStatus,
        bookingStatus: prev[booking.id]?.bookingStatus ?? booking.bookingStatus,
        serviceTotal: prev[booking.id]?.serviceTotal ?? booking.serviceTotal,
        [key]: value
      }
    }));
  };

  const handleEditTotalStart = (booking) => {
    const draft = getDraftValues(booking);
    setTotalEditModal({ open: true, bookingId: booking.id, value: String(draft.serviceTotal) });
  };

  const handleSaveTotalDraft = () => {
    if (!totalEditModal.bookingId) return;
    const booking = bookings.find((item) => item.id === totalEditModal.bookingId);
    if (!booking) return;

    const parsed = Number(totalEditModal.value);
    if (Number.isNaN(parsed) || parsed < 0) return;

    handleDraftChange(booking, 'serviceTotal', parsed);
    setTotalEditModal({ open: false, bookingId: '', value: '' });
  };

  const handleSaveChanges = async (booking) => {
    const draft = getDraftValues(booking);
    if (!hasPendingChanges(booking)) return;

    setSavingBookingId(booking.id);

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${booking.bookingId || booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentStatus: draft.paymentStatus,
          bookingStatus: draft.bookingStatus,
          serviceTotal: Number(draft.serviceTotal)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update booking (${response.status})`);
      }

      const payload = await response.json();
      const updatedBooking = mapBooking(payload.booking);

      setBookings((prev) => prev.map((item) => (item.id === booking.id ? updatedBooking : item)));
      setSelectedBooking((prev) => (prev && prev.id === booking.id ? updatedBooking : prev));
      setDrafts((prev) => {
        const nextDrafts = { ...prev };
        delete nextDrafts[booking.id];
        return nextDrafts;
      });

      if (Array.isArray(payload.notifications)) {
        setNotificationItems(payload.notifications.slice(0, 10));
      }

      if (typeof payload.unreadCount === 'number') {
        syncNotificationCount(payload.unreadCount);
      }
    } catch (saveError) {
      setError(saveError.message || 'Unable to update booking.');
    } finally {
      setSavingBookingId('');
    }
  };

  const handleViewDetails = async (booking) => {
    setDetailsLoading(true);
    setSelectedBooking(booking);

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${booking.bookingId || booking.id}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || `Failed to fetch booking details (${response.status})`);
      }

      if (payload.booking) {
        setSelectedBooking(mapBooking(payload.booking));
      }
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load booking details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleNotificationClick = (notificationId) => {
    const matchingBooking = bookings.find((booking) => booking.id === String(notificationId) || booking.bookingId === String(notificationId));
    if (matchingBooking) {
      void handleViewDetails(matchingBooking);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/notifications/read-all`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error(`Failed to clear notifications (${response.status})`);
      }

      const payload = await response.json();
      setNotificationItems(Array.isArray(payload.notifications) ? payload.notifications.slice(0, 10) : []);
      syncNotificationCount(0);
    } catch (markError) {
      setError(markError.message || 'Unable to clear notifications.');
    }
  };

  return (
    <div className="bookings-wrapper">
      <div className="bookings-header bookings-header--with-actions">
        <div>
          <h1 className="bookings-header__title">Bookings</h1>
          <p className="bookings-header__subtitle">Review bookings, update payment and booking statuses, and inspect full appointment details.</p>
        </div>
        <NotificationBell
          notifications={notificationItems}
          unreadCount={unreadCount}
          title="Recent Bookings"
          emptyMessage="No recent bookings yet."
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </div>

      <div className="bookings-tabs" role="tablist" aria-label="Service categories">
        {SERVICE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`bookings-tab ${serviceFilter === tab ? 'active' : ''}`}
            onClick={() => setServiceFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bookings-search-section">
        <input
          type="text"
          className="bookings-search__input"
          placeholder="Search by customer, booking ID, or service..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select className="bookings-filter__select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All Status</option>
          {BOOKING_STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      {error && <div className="bookings-feedback bookings-feedback--error">{error}</div>}
      {loading && <div className="bookings-feedback">Loading bookings...</div>}

      {!loading && (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead className="bookings-table__header">
              <tr>
                <th className="bookings-table__header-cell">Service Type</th>
                <th className="bookings-table__header-cell">Customer</th>
                <th className="bookings-table__header-cell">Booking ID</th>
                <th className="bookings-table__header-cell">Date &amp; Time</th>
                <th className="bookings-table__header-cell">Service Total</th>
                <th className="bookings-table__header-cell">Payment Method</th>
                <th className="bookings-table__header-cell">Payment Status</th>
                <th className="bookings-table__header-cell">Booking Status</th>
                <th className="bookings-table__header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.length > 0 ? (
                paginatedBookings.map((booking) => {
                  const draft = getDraftValues(booking);
                  const pendingChanges = hasPendingChanges(booking);

                  return (
                    <tr
                      key={booking.id}
                      className={`bookings-table__row ${booking.hasScheduleConflict ? 'bookings-table__row--conflict' : ''}`}
                    >
                      <td className="bookings-table__cell">{booking.serviceType}</td>
                      <td className="bookings-table__cell">{booking.customer}</td>
                      <td className="bookings-table__cell">{booking.bookingId}</td>
                      <td className="bookings-table__cell">
                        <div className="bookings-slot-cell">
                          <span>{formatDateTime(booking.appointmentDate, booking.appointmentTime)}</span>
                          {booking.hasScheduleConflict && (
                            <span className="bookings-conflict-badge">
                              Conflict{booking.scheduleConflictCount > 1 ? ` (${booking.scheduleConflictCount})` : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="bookings-table__cell">
                        <button
                          type="button"
                          className="bookings-total-trigger"
                          onClick={() => handleEditTotalStart(booking)}
                        >
                          {formatCurrency(draft.serviceTotal)}
                        </button>
                      </td>
                      <td className="bookings-table__cell">
                        <span className="bookings-payment-method-fixed">{booking.paymentMethod}</span>
                      </td>
                      <td className="bookings-table__cell">
                        <select
                          className="bookings-payment-select"
                          value={draft.paymentStatus}
                          onChange={(event) => handleDraftChange(booking, 'paymentStatus', event.target.value)}
                        >
                          {PAYMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="bookings-table__cell">
                        <select
                          className={`bookings-status-select ${getBookingStatusClass(draft.bookingStatus)}`}
                          value={draft.bookingStatus}
                          onChange={(event) => handleDraftChange(booking, 'bookingStatus', event.target.value)}
                        >
                          {BOOKING_STATUS_OPTIONS.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="bookings-table__cell">
                        <div className="bookings-table-actions">
                          <button type="button" className="bookings-view-btn" onClick={() => handleViewDetails(booking)}>
                            View Details
                          </button>
                          {pendingChanges && (
                            <button
                              type="button"
                              className="bookings-update-btn"
                              onClick={() => handleSaveChanges(booking)}
                              disabled={savingBookingId === booking.id}
                            >
                              {savingBookingId === booking.id ? 'Saving...' : 'Update'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="bookings-empty-state">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="records-footer">
            <div className="customers-results-count">
              Showing {pageStart}-{pageEnd} of {filteredBookings.length} bookings
            </div>
            {filteredBookings.length > RECORDS_PER_PAGE && (
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

      {selectedBooking && (
        <div className="bookings-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="bookings-modal" onClick={(event) => event.stopPropagation()}>
            <div className="bookings-modal__header">
              <h3>Booking Details</h3>
              <button type="button" className="bookings-modal__close" onClick={() => setSelectedBooking(null)}>x</button>
            </div>

            <div className="bookings-modal__body">
              {detailsLoading && (
                <div className="bookings-feedback">Loading booking details...</div>
              )}
              <div className="bookings-modal__summary-grid">
                <div className="bookings-summary-card">
                  <h4>Pet Info</h4>
                  <div className={`bookings-pet-info-layout ${selectedBooking.serviceType === 'Birthday Party' && getPetPhotoUrl(selectedBooking.petInfo) ? 'has-photo' : ''}`}>
                    <div className="bookings-pet-info-copy">
                      <p><strong>Name:</strong> {selectedBooking.petInfo.name || 'N/A'}</p>
                      <p><strong>Type:</strong> {selectedBooking.petInfo.type || 'N/A'}</p>
                      <p><strong>Size:</strong> {selectedBooking.petInfo.size || 'N/A'}</p>
                      <p><strong>Breed:</strong> {selectedBooking.petInfo.breed || 'N/A'}</p>
                      <p><strong>Birthday:</strong> {formatPetBirthday(selectedBooking.petInfo)}</p>
                    </div>
                    {selectedBooking.serviceType === 'Birthday Party' && getPetPhotoUrl(selectedBooking.petInfo) && (
                      <div className="bookings-pet-photo">
                        <span className="bookings-pet-photo__label">Uploaded Pet Photo</span>
                        <img
                          src={getPetPhotoUrl(selectedBooking.petInfo)}
                          alt={`${selectedBooking.petInfo.name || 'Pet'} reference`}
                          className="bookings-pet-photo__image"
                        />
                        <a
                          href={getPetPhotoUrl(selectedBooking.petInfo)}
                          download={getPetPhotoFilename(selectedBooking)}
                          className="bookings-pet-photo__download"
                        >
                          Download Photo
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bookings-summary-card">
                  <h4>Appointment Info</h4>
                  <p><strong>Date:</strong> {selectedBooking.appointmentInfo.date || 'N/A'}</p>
                  <p><strong>Time:</strong> {selectedBooking.appointmentInfo.time || 'N/A'}</p>
                  {selectedBooking.hasScheduleConflict && (
                    <p className="bookings-conflict-note">
                      This booking shares the same day and time with other customer bookings.
                    </p>
                  )}
                </div>

                {(selectedBooking.note || selectedBooking.specialRequests) && (
                  <div className="bookings-summary-card">
                    <h4>Special Notes</h4>
                    {selectedBooking.note && <p><strong>Booking Note:</strong> {selectedBooking.note}</p>}
                    {selectedBooking.specialRequests && (
                      <p><strong>Special Requests:</strong> {selectedBooking.specialRequests}</p>
                    )}
                  </div>
                )}

                <div className="bookings-summary-card">
                  <h4>Contact Info</h4>
                  <p><strong>Phone:</strong> {selectedBooking.contactInfo.phone || 'N/A'}</p>
                  <p><strong>Owner:</strong> {selectedBooking.contactInfo.owner || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedBooking.contactInfo.email || 'N/A'}</p>
                </div>

                <div className="bookings-summary-card">
                  <h4>Grooming Summary</h4>
                  <p><strong>Services:</strong> {selectedBooking.groomingSummary.services?.join(', ') || 'None'}</p>
                  <p><strong>Add-ons:</strong> {selectedBooking.groomingSummary.addOns?.join(', ') || 'None'}</p>
                  <p><strong>Includes:</strong> {selectedBooking.groomingSummary.includes?.join(', ') || 'None'}</p>
                </div>
              </div>

              <div className="bookings-modal__section">
                <strong>Total Price History</strong>
                <div className="bookings-history-list">
                  {selectedBooking.totalPriceHistory.length > 0 ? (
                    selectedBooking.totalPriceHistory.map((entry, index) => (
                      <div key={`${entry.loggedAt || entry.timestamp || index}`} className="bookings-history-item">
                        <span>{formatCurrency(entry.amount)}</span>
                        <span>{entry.note || 'Updated total'} | {entry.loggedAt || entry.timestamp || 'Unknown time'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bookings-history-item">
                      <span>{formatCurrency(selectedBooking.serviceTotal)}</span>
                      <span>Current total</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedBooking.serviceType === 'Birthday Party' && (
                <div className="bookings-modal__section">
                  <strong>Payment Proof</strong>
                  <div className="bookings-history-list">
                    {selectedBooking.paymentProof ? (
                      <div className="bookings-history-item bookings-history-item--proof">
                        <a
                          href={selectedBooking.paymentProof}
                          target="_blank"
                          rel="noreferrer"
                          className="bookings-pet-photo__download"
                        >
                          View {selectedBooking.paymentProofName || 'Uploaded Proof'}
                        </a>
                      </div>
                    ) : (
                      <div className="bookings-history-item">
                        <span>No proof uploaded yet.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <EditTotalModal
        open={totalEditModal.open}
        title="Edit Service Total"
        description="Update the booking total before saving changes to the database."
        value={totalEditModal.value}
        onChange={(value) => setTotalEditModal((prev) => ({ ...prev, value }))}
        onClose={() => setTotalEditModal({ open: false, bookingId: '', value: '' })}
        onSave={handleSaveTotalDraft}
      />
    </div>
  );
}

Bookings.propTypes = {
  onNotificationCountChange: PropTypes.func
};

export default Bookings;
