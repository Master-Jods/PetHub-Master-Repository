import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProfile from '../components/SidebarProfile';
import { useAuth } from '../backend/context/AuthContext';
import {
  cancelProfileBooking,
  cancelProfileOrder,
  deleteProfileReview,
  fetchProfileDashboard,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  saveProfileReview,
} from '../backend/services/profileDataService';
import './Profile.css';
import { siteConfirm } from '../utils/siteConfirm';

const splitFullName = (fullName) => {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };

  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  return { firstName, lastName };
};

function getCustomerOrderStage(order) {
  const requestStatus = String(order?.requestStatus || '').trim();
  const status = String(order?.status || '').trim();

  if (status === 'Cancelled' || order?.deliveryStatus === 'Cancelled') return 'Cancelled';
  if (requestStatus === 'Pending Request') return 'Waiting for Admin Approval';
  if (status === 'Order Received') return 'Order Received';
  if (status === 'Delivered') return 'Delivered';
  if (status === 'Out for Delivery') return 'Out for Delivery';
  if (status === 'Rider Picked Up') return 'Rider Picked Up';
  if (status === 'Preparing Order') return 'Preparing Order';
  if (status === 'Order Placed') return 'Order Placed';
  if (requestStatus === 'Accepted') return 'Order Placed';
  return 'Waiting for Admin Approval';
}

const Profile = () => {
  const navigate = useNavigate();
  const {
    user: authUser,
    profile: authProfile,
    loading: authLoading,
    logout,
    updateProfile,
    updateEmail,
    changePassword,
  } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [expandedTracking, setExpandedTracking] = useState({});
  const [showReviewPicker, setShowReviewPicker] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [profileNotice, setProfileNotice] = useState(null);
  const [user, setUser] = useState({
    name: 'Pet Parent',
    email: '',
    phone: '',
    memberSince: '2023',
    avatar: '/src/assets/user-avatar.jpg',
    petCount: 0,
    pets: []
  });
  const [settingsForm, setSettingsForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    bio: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const firstName = authProfile?.first_name?.trim() || '';
    const lastName = authProfile?.last_name?.trim() || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const fallbackName = authUser?.email ? authUser.email.split('@')[0] : 'Pet Parent';
    const nextName = fullName || fallbackName;
    const nextEmail = authUser?.email || '';
    const nextPhone = authProfile?.phone || '';
    const memberSince = authUser?.created_at
      ? String(new Date(authUser.created_at).getFullYear())
      : '2023';

    setUser((prev) => ({
      ...prev,
      name: nextName,
      email: nextEmail,
      phone: nextPhone,
      memberSince,
      avatar: authProfile?.avatar_url || prev.avatar,
    }));

    setSettingsForm((prev) => ({
      ...prev,
      fullName: nextName,
      email: nextEmail,
      phone: nextPhone,
      username: authProfile?.username || prev.username || fallbackName.toLowerCase().replace(/\s+/g, ''),
      address: authProfile?.address ?? prev.address,
      city: authProfile?.city ?? prev.city,
      bio: authProfile?.bio ?? prev.bio,
    }));
  }, [authLoading, authUser, authProfile]);
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);

  // Upcoming bookings
  const [upcomingBookings, setUpcomingBookings] = useState([]);

  // Past bookings
  const [pastBookings, setPastBookings] = useState([]);
  // Order history
  const [orderHistory, setOrderHistory] = useState([]);
  // User reviews
  const [userReviews, setUserReviews] = useState([]);

  const completedOrders = useMemo(
    () => orderHistory.filter((order) => {
      const stage = getCustomerOrderStage(order);
      return stage === 'Delivered' || stage === 'Order Received';
    }),
    [orderHistory]
  );

  const stats = useMemo(
    () => ({
      upcoming: upcomingBookings.length,
      completed: pastBookings.length,
      orders: completedOrders.length,
      reviews: userReviews.length,
    }),
    [upcomingBookings.length, pastBookings.length, completedOrders.length, userReviews.length]
  );

  useEffect(() => {
    if (authLoading || !authUser?.id) return;

    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const dashboard = await fetchProfileDashboard(authUser.id);
        if (!isMounted || !dashboard) return;

        if (dashboard.profile) {
          const firstName = dashboard.profile.first_name?.trim() || '';
          const lastName = dashboard.profile.last_name?.trim() || '';
          const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
          const fallbackName = authUser.email ? authUser.email.split('@')[0] : 'Pet Parent';
          const resolvedName = fullName || fallbackName;

          setSettingsForm((prev) => ({
            ...prev,
            fullName: resolvedName,
            email: authUser.email || '',
            phone: dashboard.profile.phone || '',
            username: dashboard.profile.username || prev.username || fallbackName.toLowerCase().replace(/\s+/g, ''),
            address: dashboard.profile.address ?? prev.address,
            city: dashboard.profile.city ?? prev.city,
            bio: dashboard.profile.bio ?? prev.bio,
          }));

          setUser((prev) => ({
            ...prev,
            name: resolvedName,
            email: authUser.email || '',
            phone: dashboard.profile.phone || '',
            avatar: dashboard.profile.avatar_url || prev.avatar,
          }));
        }

        setNotifications(dashboard.notifications);
        setUpcomingBookings(dashboard.upcomingBookings);
        setPastBookings(dashboard.pastBookings);
        setOrderHistory(dashboard.orders);
        setUserReviews(dashboard.reviews);
        setRecentActivity(dashboard.recentActivity || []);
        setUser((prev) => ({
          ...prev,
          petCount: dashboard.pets.length,
          pets: dashboard.pets,
        }));
      } catch (error) {
        console.error('Unable to load profile dashboard data:', error?.message || error);
      }
    };

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, authUser]);

  useEffect(() => {
    if (!profileNotice) return undefined;

    const timeoutId = window.setTimeout(() => {
      setProfileNotice(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [profileNotice]);


  // Navigation functions
  const handleReschedule = (bookingId) => {
    const booking = upcomingBookings.find(b => b.id === bookingId);
    if (!booking) return;

    const selectedPet = {
      id: booking.petInfo?.id || booking.petName || booking.id,
      name: booking.petName,
      type: booking.petInfo?.type || 'Dog',
      size: booking.petInfo?.size || 'Medium',
      breed: booking.petBreed,
      birthday: booking.petInfo?.birthday || '',
      parentName: user.name || '',
      parentPhone: user.phone || '',
      parentEmail: user.email || '',
      parentAddress: authProfile?.address || '',
    };

    switch(booking.serviceType) {
      case 'grooming':
        navigate('/schedule', {
          state: {
            mode: 'reschedule',
            booking,
            selectedPets: [selectedPet],
            petCount: 1,
            selectedServices: booking.metadata?.services || [],
            schedule: {
              date: booking.date,
              time: booking.time,
              rawDate: booking.appointmentInfo?.date || '',
            },
          },
        });
        break;
      case 'boarding':
        navigate('/boarding/book', { state: { mode: 'reschedule', booking, step: 2 } });
        break;
      case 'birthday party':
      case 'bdaypawty':
        navigate('/bookpawty', { state: { mode: 'reschedule', booking } });
        break;
      default:
        navigate('/schedule', {
          state: {
            mode: 'reschedule',
            booking,
            selectedPets: [selectedPet],
            petCount: 1,
            selectedServices: booking.metadata?.services || [],
            schedule: {
              date: booking.date,
              time: booking.time,
              rawDate: booking.appointmentInfo?.date || '',
            },
          },
        });
    }
  };

  const handleCancel = async (bookingId) => {
    if (!(await siteConfirm('Are you sure you want to cancel this booking?'))) {
      return;
    }

    const booking = upcomingBookings.find((item) => item.id === bookingId);

    if (authUser?.id) {
      try {
        await cancelProfileBooking(authUser.id, bookingId);
      } catch (error) {
        alert(error?.message || 'Unable to cancel booking right now.');
        return;
      }
    }

    const cancelledAt = new Date().toISOString();
    const cancellationMessage = booking
      ? `Your booking ${booking.id} was cancelled.`
      : 'Your booking was cancelled.';

    setUpcomingBookings((prev) => prev.filter((b) => b.id !== bookingId));
    if (booking) {
      setPastBookings((prev) => [
        {
          ...booking,
          status: 'Cancelled',
          updatedAt: cancelledAt,
        },
        ...prev,
      ]);
    }
    setNotifications((prev) => [
      {
        id: `cancelled-booking-${bookingId}-${Date.now()}`,
        title: 'Booking Cancelled',
        message: cancellationMessage,
        time: 'just now',
        read: false,
        tone: 'cancelled',
      },
      ...prev,
    ]);
    setRecentActivity((prev) => [
      {
        id: `cancelled-booking-activity-${bookingId}-${Date.now()}`,
        text: booking ? `cancelled ${booking.service}${booking.petName ? ` for ${booking.petName}` : ''}` : 'cancelled booking',
        time: 'just now',
        at: cancelledAt,
      },
      ...prev,
    ]);
    setProfileNotice({
      tone: 'cancelled',
      title: 'Booking Cancelled',
      message: cancellationMessage,
    });
    alert('Booking cancelled successfully!');
  };

  const handleBookAgain = (pastBooking) => {
    const selectedPet = {
      id: pastBooking.petInfo?.id || pastBooking.petName || pastBooking.id,
      name: pastBooking.petName,
      type: pastBooking.petInfo?.type || 'Dog',
      size: pastBooking.petInfo?.size || 'Medium',
      breed: pastBooking.petBreed,
      birthday: pastBooking.petInfo?.birthday || '',
      parentName: user.name || '',
      parentPhone: user.phone || '',
      parentEmail: user.email || '',
      parentAddress: authProfile?.address || '',
    };

    switch(pastBooking.serviceType) {
      case 'grooming':
        navigate('/schedule', {
          state: {
            mode: 'book-again',
            selectedPets: [selectedPet],
            petCount: 1,
            selectedServices: pastBooking.metadata?.services || [],
          },
        });
        break;
      case 'boarding':
        navigate('/boarding/book', { state: { mode: 'book-again', booking: pastBooking, step: 2 } });
        break;
      case 'birthday party':
      case 'bdaypawty':
        navigate('/bookpawty', { state: { mode: 'book-again', booking: pastBooking } });
        break;
      default:
        navigate('/schedule', {
          state: {
            mode: 'book-again',
            selectedPets: [selectedPet],
            petCount: 1,
            selectedServices: pastBooking.metadata?.services || [],
          },
        });
    }
  };

  const handleLeaveReview = (booking) => {
    setSelectedBooking(booking);
    setReviewRating(0);
    setReviewText('');
    setEditingReviewId(null);
    setShowReviewPicker(false);
    setShowReviewForm(true);
    setActiveTab('reviews');
  };

  const handleEditReview = (reviewId) => {
    const review = userReviews.find(r => r.id === reviewId);
    setSelectedBooking(review);
    setReviewRating(review.rating);
    setReviewText(review.comment);
    setEditingReviewId(reviewId);
    setShowReviewPicker(false);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!(await siteConfirm('Are you sure you want to delete this review?'))) {
      return;
    }

    if (authUser?.id) {
      try {
        await deleteProfileReview(authUser.id, reviewId);
      } catch (error) {
        alert(error?.message || 'Unable to delete review right now.');
        return;
      }
    }

    setUserReviews((prev) => prev.filter((r) => r.id !== reviewId));
    alert('Review deleted successfully!');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (reviewRating === 0) {
      alert('Please select a rating!');
      return;
    }

    if (editingReviewId) {
      let updatedReview = null;
      if (authUser?.id) {
        try {
          updatedReview = await saveProfileReview(authUser.id, {
            reviewId: editingReviewId,
            bookingId: selectedBooking?.bookingId || selectedBooking?.id || null,
            service: selectedBooking?.service,
            petName: selectedBooking?.petName,
            petBreed: selectedBooking?.petBreed,
            date: new Date().toISOString(),
            rating: reviewRating,
            comment: reviewText,
          });
        } catch (error) {
          alert(error?.message || 'Unable to update review right now.');
          return;
        }
      }

      setUserReviews((prev) =>
        prev.map((review) =>
          review.id === editingReviewId
            ? updatedReview || {
                ...review,
                rating: reviewRating,
                comment: reviewText,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              }
            : review
        )
      );
      alert('Review updated successfully!');
    } else {
      let savedReview = null;
      if (authUser?.id) {
        try {
          savedReview = await saveProfileReview(authUser.id, {
            bookingId: selectedBooking?.bookingId || selectedBooking?.id || null,
            service: selectedBooking?.service,
            petName: selectedBooking?.petName,
            petBreed: selectedBooking?.petBreed,
            date: new Date().toISOString(),
            rating: reviewRating,
            comment: reviewText,
          });
        } catch (error) {
          alert(error?.message || 'Unable to submit review right now.');
          return;
        }
      }

      const newReview = savedReview || {
        id: userReviews.length + 3,
        service: selectedBooking.service,
        petName: selectedBooking.petName,
        petBreed: selectedBooking.petBreed,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rating: reviewRating,
        comment: reviewText
      };
      setUserReviews((prev) => [...prev, newReview]);
      
      setPastBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBooking.id
            ? { ...booking, reviewed: true }
            : booking
        )
      );
      
      alert('Thank you for your review!');
    }
    
    setShowReviewForm(false);
    setShowReviewPicker(false);
    setReviewRating(0);
    setReviewText('');
    setEditingReviewId(null);
  };

  const handleViewOrderDetails = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  const handleReorder = (order) => {
    navigate('/checkout', { state: { items: order.items } });
  };

  const handleCancelOrder = async (order) => {
    if (!order) return;
    const currentStage = getCustomerOrderStage(order);
    if (currentStage === 'Delivered' || currentStage === 'Order Received' || currentStage === 'Cancelled') return;
    if (order.requestStatus !== 'Pending Request') {
      alert('This order can only be cancelled while it is still pending admin approval.');
      return;
    }

    if (!(await siteConfirm('Are you sure you want to cancel this order?'))) {
      return;
    }

    const cancelledAt = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    const cancelReason = 'Cancelled by customer';
    const cancelledStage = 'Preparing Order';

    if (authUser?.id) {
      try {
        await cancelProfileOrder(authUser.id, order.dbId || order.id, {
          cancelledAt: new Date().toISOString(),
          cancelledStage,
          cancelReason,
          status: 'Cancelled',
        });
      } catch (error) {
        alert(error?.message || 'Unable to cancel order right now.');
        return;
      }
    }

    setOrderHistory((prev) =>
      prev.map((entry) => {
        if (entry.id !== order.id) return entry;

        const existingUpdates = Array.isArray(entry.trackingUpdates) ? entry.trackingUpdates : [];
        const hasCancelledStep = existingUpdates.some(
          (log) => String(log?.title || '').toLowerCase() === 'cancelled'
        );
        const trackingUpdates = hasCancelledStep
          ? existingUpdates
          : [
              ...existingUpdates,
              {
                time: cancelledAt,
                title: 'Cancelled',
                details: cancelReason,
              },
            ];

        return {
          ...entry,
          status: 'Cancelled',
          deliveryStatus: 'Cancelled',
          cancelledAt,
          cancelledStage,
          cancelReason,
          eta: '',
          updatedAt: cancelledAt,
          trackingUpdates,
        };
      })
    );

    setExpandedTracking((prev) => ({
      ...prev,
      [order.id]: true,
    }));

    alert('Order cancelled successfully!');
  };

  const handleViewServiceDetails = (booking) => {
    switch(booking.serviceType) {
      case 'grooming':
        navigate('/grooming');
        break;
      case 'boarding':
        navigate('/boarding');
        break;
      case 'bdaypawty':
        navigate('/bdaypawty');
        break;
      case 'petcafe':
        navigate('/petcafe');
        break;
      default:
        navigate('/choose-service');
    }
  };


  const markAllAsRead = async () => {
    if (authUser?.id) {
      try {
        await markAllNotificationsAsRead(authUser.id);
      } catch (error) {
        console.error('Unable to mark all notifications as read:', error?.message || error);
      }
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = async (id) => {
    if (authUser?.id) {
      try {
        await markNotificationAsRead(authUser.id, id);
      } catch (error) {
        console.error('Unable to mark notification as read:', error?.message || error);
      }
    }

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const normalizeBookingStatus = (status) => {
    const raw = String(status || '').trim();
    const normalized = raw.toLowerCase();

    if (!normalized || normalized === 'pending' || normalized === 'in process' || normalized === 'in-process') {
      return 'Processing';
    }
    if (normalized === 'pending approval') return 'Pending Approval';
    if (normalized === 'completed') return 'Completed';
    if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelled';
    if (normalized === 'out for delivery') return 'Out for Delivery';
    if (normalized === 'confirmed') return 'Confirmed';
    return raw || 'Processing';
  };

  const getBookingStatusClass = (status) =>
    normalizeBookingStatus(status).toLowerCase().replace(/\s+/g, '-');

  const getSafeStatusClass = (value, fallback = 'unknown') =>
    String(value || fallback).toLowerCase().replace(/\s+/g, '-');

  const getBookingStatusLabel = (status) => normalizeBookingStatus(status);

  const pickupOrderTimeline = ['Waiting for Admin Approval', 'Order Placed', 'Preparing Order', 'Order Received'];
  const deliveryOrderTimeline = ['Waiting for Admin Approval', 'Order Placed', 'Preparing Order', 'Rider Picked Up', 'Out for Delivery', 'Delivered'];

  const getOrderTimeline = (order) =>
    String(order?.fulfillmentMethod || '').toLowerCase() === 'pickup'
      ? pickupOrderTimeline
      : deliveryOrderTimeline;

  const getTrackingConfig = (order) => {
    const customerStage = getCustomerOrderStage(order);
    const baseTimeline = getOrderTimeline(order);

    if (customerStage === 'Cancelled') {
      const cancelledAtStep = order.cancelledStage || 'Preparing Order';
      const cutoffIndex = Math.max(baseTimeline.indexOf(cancelledAtStep), 0);
      const timeline = [...baseTimeline.slice(0, cutoffIndex + 1), 'Cancelled'];
      return { timeline, currentStepIndex: timeline.length - 1, customerStage };
    }

    const currentStepIndex = Math.max(baseTimeline.indexOf(customerStage), 0);
    return { timeline: baseTimeline, currentStepIndex, customerStage };
  };

  const getOrderFilterKey = (order) => {
    const customerStage = getCustomerOrderStage(order);
    if (customerStage === 'Delivered' || customerStage === 'Order Received') return 'completed';
    if (customerStage === 'Cancelled') return 'cancelled';
    return 'inprocess';
  };

  const orderFilterTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'inprocess', label: 'In Process' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  const getTrackingPercent = (timeline, currentStepIndex) => {
    if (!timeline || timeline.length <= 1) return 0;
    return Math.round((currentStepIndex / (timeline.length - 1)) * 100);
  };

  const getTrackingHeadline = (order, currentStep) => {
    const customerStage = getCustomerOrderStage(order);
    if (customerStage === 'Delivered' || customerStage === 'Order Received') {
      return customerStage === 'Order Received' ? 'Ready for pickup was received successfully' : 'Delivered successfully';
    }
    if (customerStage === 'Cancelled') {
      return `Order cancelled at ${order.cancelledStage || 'processing stage'}`;
    }
    if (customerStage === 'Out for Delivery') {
      return `${order.riderName} is on the way to your address`;
    }
    if (customerStage === 'Waiting for Admin Approval') {
      return 'Your order is waiting for admin approval';
    }
    if (customerStage === 'Order Placed') {
      return 'Your order has been accepted and placed';
    }
    return `Current stage: ${currentStep}`;
  };

  const getTrackingEtaLabel = (order) => {
    const customerStage = getCustomerOrderStage(order);
    if (customerStage === 'Delivered' || customerStage === 'Order Received') return customerStage;
    if (customerStage === 'Cancelled') return 'N/A';
    return order.eta || 'Updating...';
  };

  const getTrackingLocation = (order) => {
    const customerStage = getCustomerOrderStage(order);
    if (customerStage === 'Delivered' || customerStage === 'Order Received') return customerStage;
    if (customerStage === 'Cancelled') return 'Cancelled';
    if (customerStage === 'Out for Delivery') return 'Out for Delivery';
    if (customerStage === 'Rider Picked Up') return 'Rider Picked Up';
    if (customerStage === 'Preparing Order') return 'Preparing Order';
    if (customerStage === 'Order Placed') return 'Order Placed';
    return 'Pending Approval';
  };

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') {
      return orderHistory;
    }
    return orderHistory.filter((order) => getOrderFilterKey(order) === orderFilter);
  }, [orderFilter, orderHistory]);

  const availableReviewBookings = useMemo(
    () => pastBookings.filter((booking) => booking.status === 'Completed' && !booking.reviewed),
    [pastBookings]
  );

  const toggleTracking = (orderId) => {
    setExpandedTracking((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleLogout = async () => {
    if (!(await siteConfirm('Are you sure you want to sign out?'))) {
      return;
    }

    try {
      await logout();
      navigate('/');
    } catch (error) {
      alert(error?.message || 'Unable to sign out right now.');
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettingsError('');
    setSettingsSuccess('');
    setSettingsForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    const { fullName, email, phone } = settingsForm;
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setSettingsError('Please complete Full Name, Email, and Phone.');
      return;
    }

    const { firstName, lastName } = splitFullName(trimmedName);
    setIsSavingSettings(true);

    try {
      await updateProfile({ firstName, lastName, phone: trimmedPhone });

      let successMessage = 'Account settings updated successfully.';
      if (trimmedEmail !== (authUser?.email || '').trim()) {
        await updateEmail(trimmedEmail);
        successMessage = 'Profile updated. Check your inbox if email confirmation is required.';
      }

      setUser((prev) => ({
        ...prev,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone
      }));

      setSettingsForm((prev) => ({
        ...prev,
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone
      }));

      setSettingsError('');
      setSettingsSuccess(successMessage);
    } catch (error) {
      setSettingsSuccess('');
      setSettingsError(error?.message || 'Unable to save account settings right now.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSettingsReset = () => {
    setSettingsError('');
    setSettingsSuccess('');
    setSettingsForm((prev) => ({
      ...prev,
      fullName: user.name,
      email: user.email,
      phone: user.phone
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please complete all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
      setPasswordSuccess('Password updated successfully.');
    } catch (error) {
      setPasswordSuccess('');
      setPasswordError(error?.message || 'Unable to update password right now.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="profile-page">
      {/* Main Content with Sidebar */}
      <div className="profile-main-layout">
        {/* Sidebar */}
        <SidebarProfile 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          unreadCount={unreadCount}
          onLogout={handleLogout}
        />

        {/* Content Area */}
        <div className="profile-content-wrapper">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="welcome-content">
              <div>
                <h1 className="welcome-title">My Pet Care Journey</h1>
                <p className="welcome-subtitle">Welcome back, {user.name}! Here's what's happening with your furry friends</p>
              </div>
              <div className="pet-tags">
                {user.pets.map(pet => (
                  <span key={pet.name} className="pet-tag">
                    {pet.name} · {pet.type}
                  </span>
	                ))}
	              </div>
	            </div>
          </div>

          {profileNotice && (
            <div className={`profile-notice ${profileNotice.tone || 'info'}`} role="status" aria-live="polite">
              <div className="profile-notice-content">
                <div className="profile-notice-title">{profileNotice.title}</div>
                <div className="profile-notice-message">{profileNotice.message}</div>
              </div>
              <button
                type="button"
                className="profile-notice-close"
                onClick={() => setProfileNotice(null)}
                aria-label="Dismiss notice"
              >
                ×
              </button>
            </div>
          )}

          <div className="profile-content-area">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.upcoming}</div>
                <div className="stat-label">Upcoming Bookings</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.completed}</div>
                <div className="stat-label">Completed Bookings</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.orders}</div>
                <div className="stat-label">Completed Orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.reviews}</div>
                <div className="stat-label">My Reviews</div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              
              {/* OVERVIEW TAB */}
{activeTab === 'overview' && (
  <div className="overview-tab">
    <div className="overview-grid">
      {/* Next Upcoming Booking */}
      {upcomingBookings.length > 0 && (
        <div className="feature-card upcoming-main-card">
          <h3 className="feature-card-title">Next Upcoming</h3>
          <div className="next-booking">
            <div className="next-booking-service">{upcomingBookings[0].service}</div>
            <div className="next-booking-pet">{upcomingBookings[0].petName} · {upcomingBookings[0].petBreed}</div>
            <div className="next-booking-time">{upcomingBookings[0].date} at {upcomingBookings[0].time}</div>
          </div>
	                </div>
	              )}

      {/* Recent Activity */}
      <div className="feature-card activity-main-card">
        <h3 className="feature-card-title">Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <div className="activity-text">{activity.text}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="activity-empty">No recent activity yet.</div>
          )}
        </div>
      </div>

    </div>

    <div className="overview-grid overview-grid-compact">

      {/* Upcoming Preview */}
      <div className="feature-card upcoming-preview-card">
        <div className="profile-card-header">
          <h3 className="feature-card-title">Upcoming</h3>
          <button className="view-link" onClick={() => setActiveTab('upcoming')}>View all</button>
        </div>
        <div className="preview-items">
          {upcomingBookings.slice(0, 2).map(booking => (
            <div key={booking.id} className="preview-item">
              <div className="preview-info">
                <div className="preview-title">{booking.service}</div>
                <div className="preview-subtitle">{booking.petName} · {booking.date}</div>
              </div>
              <span className={`status ${getBookingStatusClass(booking.status)}`}>
                {getBookingStatusLabel(booking.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Orders */}
      <div className="feature-card orders-preview-card">
        <div className="profile-card-header">
          <h3 className="feature-card-title">Completed Orders</h3>
          <button className="view-link" onClick={() => setActiveTab('orders')}>View all</button>
        </div>
        <div className="preview-items">
          {completedOrders.slice(0, 2).map(order => {
            const customerStage = getCustomerOrderStage(order);
            return (
            <div key={order.id} className="preview-item">
              <div className="preview-info">
                <div className="preview-title">{order.id}</div>
                <div className="preview-subtitle">{order.items.length} items · {order.date}</div>
              </div>
              <span className={`status ${getSafeStatusClass(customerStage, 'completed')}`}>
                {customerStage}
              </span>
            </div>
          )})}
        </div>
      </div>
    </div>
  </div>
)}
    

              {/* UPCOMING TAB */}
              {activeTab === 'upcoming' && (
                <div className="upcoming-tab">
                  <h2 className="section-title">Upcoming Bookings</h2>
                  <p className="section-subtitle">You have {upcomingBookings.length} upcoming appointment{upcomingBookings.length !== 1 ? 's' : ''}</p>
                  
                  {upcomingBookings.length > 0 ? (
                    <div className="bookings-list">
                      {upcomingBookings.map(booking => (
                        <div key={booking.id} className="booking-card">
                          <div className="booking-header">
                            <div>
                              <h3>{booking.service}</h3>
                              <div className="booking-pet-info">
                                <span className="pet-name">{booking.petName}</span>
                                <span className="pet-breed">{booking.petBreed}</span>
                              </div>
                            </div>
                            <span className={`status-badge ${getBookingStatusClass(booking.status)}`}>
                              {getBookingStatusLabel(booking.status)}
                            </span>
                          </div>
                          
                          <div className="booking-datetime">
                            <div className="datetime-row">
                              <span className="datetime-label">Date</span>
                              <span className="datetime-value">{booking.date}</span>
                            </div>
                            <div className="datetime-row">
                              <span className="datetime-label">Time</span>
                              <span className="datetime-value">{booking.time}</span>
                            </div>
                          </div>
                          
                          <div className="booking-price">
                            <span className="price-label">Estimated Price</span>
                            <span className="price-value">{booking.price}</span>
                          </div>
                          
                          {booking.note && (
                            <p className="booking-note">{booking.note}</p>
                          )}
                          
                          <div className="booking-actions">
                            <button className="btn-secondary" onClick={() => handleReschedule(booking.id)}>
                              Reschedule
                            </button>
                            <button className="btn-outline" onClick={() => handleCancel(booking.id)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <h3>No Upcoming Bookings</h3>
                      <p>Ready to pamper your pet? Book a service now!</p>
                      <button className="btn-primary" onClick={() => navigate('/choose-service')}>
                        Browse Services
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PAST TAB */}
              {activeTab === 'past' && (
                <div className="past-tab">
                  <h2 className="section-title">Past Bookings</h2>
                  <p className="section-subtitle">Your completed appointments</p>
                  
                  {pastBookings.length > 0 ? (
                    <div className="bookings-list">
                      {pastBookings.map(booking => (
                        <div
                          key={booking.id}
                          className={`booking-card past ${String(booking.status).toLowerCase() === 'cancelled' ? 'cancelled-booking' : ''}`}
                        >
                          <div className="booking-header">
                            <div>
                              <h3>{booking.service}</h3>
                              <div className="booking-pet-info">
                                <span className="pet-name">{booking.petName}</span>
                                <span className="pet-breed">{booking.petBreed}</span>
                              </div>
                            </div>
                            <span className={`status-badge ${getBookingStatusClass(booking.status)}`}>
                              {getBookingStatusLabel(booking.status)}
                            </span>
                          </div>
                          
                          <div className="booking-datetime">
                            <div className="datetime-row">
                              <span className="datetime-label">Date</span>
                              <span className="datetime-value">{booking.date}</span>
                            </div>
                          </div>
                          
                          <div className="booking-price">
                            <span className="price-label">Paid</span>
                            <span className="price-value">{booking.price}</span>
                          </div>

                          {String(booking.status).toLowerCase() === 'cancelled' && (
                            <div className="booking-cancelled-note">
                              This booking was cancelled. You can book the same service again anytime.
                            </div>
                          )}
                          
                          {booking.rating && (
                            <div className="rating-display">
                              <span className="rating-stars">{'★'.repeat(booking.rating)}</span>
                              <span className="rating-text">{booking.rating}.0/5.0</span>
                            </div>
                          )}
                          
                          <div className="booking-actions">
                            <button className="btn-secondary" onClick={() => handleBookAgain(booking)}>
                              Book Again
                            </button>
                            {String(booking.status).toLowerCase() === 'completed' && !booking.reviewed && (
                              <button className="btn-outline" onClick={() => handleLeaveReview(booking)}>
                                Leave Review
                              </button>
			                  )}
			                </div>
                        </div>
	                      ))}
	                    </div>
                  ) : (
                    <div className="empty-state">
                      <h3>No Past Bookings</h3>
                      <p>Your completed appointments will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="orders-tab">
                  <h2 className="section-title">Order History</h2>
                  <p className="section-subtitle">Track your deliveries and view completed orders</p>

                  <div className="order-filter-tabs">
                          {orderFilterTabs.map((tab) => (
                      <button
                        key={tab.id}
                        className={`order-filter-btn ${orderFilter === tab.id ? 'active' : ''}`}
                        onClick={() => setOrderFilter(tab.id)}
                      >
                        {tab.label}
                        <span className="order-filter-count">
                          {tab.id === 'all'
                            ? orderHistory.length
                            : orderHistory.filter((order) => getOrderFilterKey(order) === tab.id).length}
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  {filteredOrders.length > 0 ? (
                    <div className="orders-list">
                      {filteredOrders.map(order => {
                        const { timeline, currentStepIndex, customerStage } = getTrackingConfig(order);
                        const isCompleted = customerStage === 'Delivered' || customerStage === 'Order Received';
                        const isCancelled = customerStage === 'Cancelled';
                        const paymentLabel = order.paymentMethod || (order.status === 'Paid' ? 'GCash' : 'Cash');
                        const fulfillmentLabel = order.fulfillmentMethod || (String(order.riderName || '').toLowerCase().includes('pickup') ? 'Pickup' : 'Delivery');
                        const showTracking = !!expandedTracking[order.id];
                        const latestTrackingUpdate = (order.trackingUpdates && order.trackingUpdates.length > 0)
                          ? order.trackingUpdates[order.trackingUpdates.length - 1]
                          : null;
                        const currentStep = timeline[currentStepIndex] || timeline[0];
                        const trackingPercent = getTrackingPercent(timeline, currentStepIndex);
                        const trackingHeadline = getTrackingHeadline(order, currentStep);

                        return (
                        <div key={order.id} className="order-card">
                          <div className="order-header">
                            <div className="order-id">Order #{order.id}</div>
                            <div className="order-date">{order.date}</div>
                            <span className={`order-status ${getSafeStatusClass(customerStage)}`}>
                              {customerStage || 'Unknown'}
                            </span>
                          </div>

                          <div className="order-meta-row">
                            <span><strong>Fulfillment:</strong> {fulfillmentLabel}</span>
                            <span><strong>Payment:</strong> {paymentLabel}</span>
                            <span><strong>Rider:</strong> {order.riderName}</span>
                            <span><strong>Last update:</strong> {order.updatedAt}</span>
                            {isCompleted && order.deliveredAt && (
                              <span><strong>Delivered:</strong> {order.deliveredAt}</span>
                            )}
                            {isCancelled && order.cancelledAt && (
                              <span><strong>Cancelled:</strong> {order.cancelledAt}</span>
                            )}
                            {isCancelled && order.cancelReason && (
                              <span><strong>Reason:</strong> {order.cancelReason}</span>
                            )}
                            {!isCompleted && !isCancelled && order.eta && (
                              <span><strong>ETA:</strong> {order.eta}</span>
                            )}
                          </div>
                          
                          <div className="order-items">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="order-item">
                                <span>{item.name}</span>
                                <span className="item-quantity">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="order-total">
                            <span>Total</span>
                            <span className="total-amount">{order.total}</span>
                          </div>

                          <div className={`tracking-summary ${isCancelled ? 'cancelled' : ''}`}>
                            <div className="tracking-summary-top">
                              <span className="tracking-summary-label">{trackingHeadline}</span>
                              <span className="tracking-summary-percent">{trackingPercent}%</span>
                            </div>
                            <div className="tracking-summary-bar">
                              <div
                                className="tracking-summary-fill"
                                style={{ width: `${trackingPercent}%` }}
                              />
                            </div>
                            <div className="tracking-summary-meta">
                              <span><strong>Now:</strong> {currentStep}</span>
                              {latestTrackingUpdate && (
                                <span><strong>Latest update:</strong> {latestTrackingUpdate.time}</span>
                              )}
                            </div>
                          </div>

                          {showTracking && (
                            <div className="order-tracking">
                              <div className="delivery-track-header">
                                <h4>Track Your Delivery</h4>
                                <div className="delivery-track-row">
                                  <span><strong>ETA:</strong> {getTrackingEtaLabel(order)}</span>
                                  <span><strong>Current:</strong> {currentStep}</span>
                                </div>
                              </div>

                              <div className="delivery-rider-box">
                                <div><strong>In-house Rider:</strong> {order.riderName || 'To be assigned'}</div>
                                <div><strong>Contact:</strong> {order.riderContact || 'N/A'}</div>
                                <div><strong>Vehicle:</strong> {order.riderVehicle || 'N/A'}</div>
                                <div><strong>Location:</strong> {getTrackingLocation(order)}</div>
                              </div>

                              <div className="delivery-timeline">
                                {(order.trackingUpdates || []).map((log, idx) => {
                                  const isCurrentLog = idx === (order.trackingUpdates || []).length - 1;
                                  const isLastLog = idx === (order.trackingUpdates || []).length - 1;
                                  return (
                                    <div
                                      key={`${order.id}-log-${idx}`}
                                      className={`delivery-timeline-item ${isCurrentLog ? 'current' : ''}`}
                                    >
                                      <div className="delivery-marker">
                                        <span className="delivery-dot" />
                                        {!isLastLog && <span className="delivery-line" />}
                                      </div>
                                      <div className="delivery-step-content">
                                        <div className="delivery-step-title">{log.title}</div>
                                        <div className="delivery-step-details">{log.details}</div>
                                      </div>
                                      <div className="delivery-step-time">{log.time}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <div className="order-actions">
                            <button className="btn-outline" onClick={() => toggleTracking(order.id)}>
                              {showTracking ? 'Hide Tracking' : 'View Tracking'}
                            </button>
                            {!isCompleted && !isCancelled && order.requestStatus === 'Pending Request' && (
                              <button className="btn-outline" onClick={() => handleCancelOrder(order)}>
                                Cancel
                              </button>
                            )}
                            <button className="btn-secondary" onClick={() => handleReorder(order)}>
                              Reorder
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <h3>No Orders Yet</h3>
                      <p>Visit our shop to find great products for your pets!</p>
                      <button className="btn-primary" onClick={() => navigate('/shop')}>
                        Shop Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* REVIEWS TAB */}
              {activeTab === 'reviews' && (
                <div className="reviews-tab">
                  <div className="reviews-header-row">
                    <div>
                      <h2 className="section-title">My Reviews</h2>
                      <p className="section-subtitle">You've written {userReviews.length} review{userReviews.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                      className="btn-primary reviews-add-btn"
                      onClick={() => {
                        setShowReviewForm(false);
                        setEditingReviewId(null);
                        setShowReviewPicker((prev) => !prev);
                      }}
                    >
                      {showReviewPicker ? 'Close' : 'Add New Review'}
                    </button>
                  </div>

                  {!showReviewForm ? (
                    <>
                      {showReviewPicker && (
                        <div className="review-picker-card">
                          <h3 className="review-picker-title">Select Completed Booking</h3>
                          {availableReviewBookings.length > 0 ? (
                            <div className="review-picker-list">
                              {availableReviewBookings.map((booking) => (
                                <div key={booking.id} className="review-picker-item">
                                  <div>
                                    <div className="review-picker-service">{booking.service}</div>
                                    <div className="review-picker-meta">
                                      {booking.petName} - {booking.petBreed} - {booking.date}
                                    </div>
                                  </div>
                                  <button className="btn-outline" onClick={() => handleLeaveReview(booking)}>
                                    Write Review
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="review-picker-empty">No completed bookings available for new review.</p>
                          )}
                        </div>
                      )}

                      {userReviews.length > 0 ? (
                        <div className="reviews-list">
                          {userReviews.map(review => (
                            <div key={review.id} className="review-card">
                              <div className="review-header">
                                <div>
                                  <h3>{review.service}</h3>
                                  <div className="review-meta">
                                    <span>{review.petName} - {review.petBreed}</span>
                                    <span className="review-date">{review.date}</span>
                                  </div>
                                </div>
                                <div className="review-rating">
                                  <span className="rating-stars">{'★'.repeat(review.rating)}</span>
                                  <span className="rating-number">{review.rating}.0</span>
                                </div>
                              </div>
                              <p className="review-comment">"{review.comment}"</p>
                              <div className="review-actions">
                                <button className="btn-outline" onClick={() => handleEditReview(review.id)}>
                                  Edit
                                </button>
                                <button className="btn-outline-danger" onClick={() => handleDeleteReview(review.id)}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <h3>No Reviews Yet</h3>
                          <p>Share your experience with the community!</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="review-form">
                      <div className="review-form-header">
                        <h3>{editingReviewId ? 'Edit Review' : 'Write a Review'}</h3>
                        <button className="close-btn" onClick={() => {
                          setShowReviewForm(false);
                          setEditingReviewId(null);
                        }}>×</button>
                      </div>

                      <p className="review-service-info">
                        How was your {selectedBooking?.service} experience?
                      </p>

                      <form onSubmit={handleSubmitReview}>
                        <div className="rating-selector">
                          <div className="stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`star ${star <= (hoverRating || reviewRating) ? 'active' : ''}`}
                                onClick={() => setReviewRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="rating-hint">Click to rate</p>
                        </div>

                        <div className="form-group">
                          <label htmlFor="review">Your Review</label>
                          <textarea
                            id="review"
                            rows="4"
                            placeholder="Share your experience..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                          />
                        </div>

                        <div className="form-actions">
                          <button type="submit" className="btn-primary btn-full">
                            {editingReviewId ? 'Update' : 'Submit'} Review
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="settings-tab">
                  <h2 className="section-title">Account Settings</h2>
                  <p className="section-subtitle">Manage your profile information and account preferences.</p>

                  <div className="feature-card">
                    {settingsError && <p className="settings-error">{settingsError}</p>}
                    {settingsSuccess && <p className="support-success">{settingsSuccess}</p>}
                    <form className="settings-form" onSubmit={handleSettingsSave}>
                      <h3 className="settings-section-title">Profile Information</h3>
                      <div className="settings-grid">
                        <div className="form-group">
                          <label htmlFor="settings-fullName">Full Name</label>
                          <input
                            id="settings-fullName"
                            type="text"
                            name="fullName"
                            value={settingsForm.fullName}
                            onChange={handleSettingsChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="settings-username">Username</label>
                          <input
                            id="settings-username"
                            type="text"
                            name="username"
                            value={settingsForm.username}
                            onChange={handleSettingsChange}
                          />
                        </div>
                      </div>

                      <h3 className="settings-section-title">Contact Details</h3>
                      <div className="settings-grid">
                        <div className="form-group">
                          <label htmlFor="settings-email">Email</label>
                          <input
                            id="settings-email"
                            type="email"
                            name="email"
                            value={settingsForm.email}
                            onChange={handleSettingsChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="settings-phone">Phone</label>
                          <input
                            id="settings-phone"
                            type="text"
                            name="phone"
                            value={settingsForm.phone}
                            onChange={handleSettingsChange}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="settings-address">Address</label>
                        <input
                          id="settings-address"
                          type="text"
                          name="address"
                          value={settingsForm.address}
                          onChange={handleSettingsChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="settings-city">City</label>
                        <input
                          id="settings-city"
                          type="text"
                          name="city"
                          value={settingsForm.city}
                          onChange={handleSettingsChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="settings-bio">Bio</label>
                        <textarea
                          id="settings-bio"
                          rows="3"
                          name="bio"
                          value={settingsForm.bio}
                          onChange={handleSettingsChange}
                        />
                      </div>

                      <div className="form-actions settings-actions">
                        <button type="button" className="btn-outline" onClick={handleSettingsReset}>Reset</button>
                        <button type="submit" className="btn-primary" disabled={isSavingSettings}>
                          {isSavingSettings ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="feature-card mt-3">
                    <h3 className="settings-section-title">Change Password</h3>
                    {passwordError && <p className="settings-error">{passwordError}</p>}
                    {passwordSuccess && <p className="support-success">{passwordSuccess}</p>}
                    <form className="settings-form" onSubmit={handlePasswordSave}>
                      <div className="settings-grid">
                        <div className="form-group">
                          <label htmlFor="settings-currentPassword">Current Password</label>
                          <input
                            id="settings-currentPassword"
                            type="password"
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="settings-newPassword">New Password</label>
                          <input
                            id="settings-newPassword"
                            type="password"
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="settings-confirmPassword">Confirm New Password</label>
                        <input
                          id="settings-confirmPassword"
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>

                      <div className="form-actions settings-actions">
                        <button type="submit" className="btn-primary" disabled={isSavingPassword}>
                          {isSavingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
