import { supabase } from "../supabaseClient";

const DATE_OPTIONS = { month: "short", day: "numeric", year: "numeric" };
const TIME_OPTIONS = { hour: "numeric", minute: "2-digit" };
const DATE_TIME_OPTIONS = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

function isSchemaError(error) {
  const text = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return (
    text.includes("does not exist") ||
    text.includes("could not find the table") ||
    text.includes("schema cache") ||
    text.includes("column") ||
    text.includes("relation")
  );
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", DATE_OPTIONS);
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", TIME_OPTIONS);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", DATE_TIME_OPTIONS);
}

function formatCurrency(amount, currency = "PHP") {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return `${currency} 0.00`;
  return `${currency} ${numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return formatDate(date.toISOString());
}

function toReviewDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);

  return parsed.toISOString().slice(0, 10);
}

function normalizePaymentMethod(value, status) {
  const text = String(value || "").toLowerCase();
  if (text.includes("gcash")) return "GCash";
  if (text.includes("cash")) return "Cash";

  const normalizedStatus = String(status || "").toLowerCase();
  if (normalizedStatus === "paid") return "GCash";
  if (normalizedStatus === "pending") return "Cash";
  return "";
}

function normalizeFulfillmentMethod(value, riderName) {
  const text = String(value || "").toLowerCase();
  if (text.includes("pickup")) return "Pickup";
  if (text.includes("delivery")) return "Delivery";

  const riderText = String(riderName || "").toLowerCase();
  if (riderText.includes("pickup")) return "Pickup";
  if (riderText.includes("rider")) return "Delivery";
  return "";
}

function normalizeBookingStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text || text === "pending" || text === "in process" || text === "in-process") {
    return "Processing";
  }
  if (text === "completed") return "Completed";
  if (text === "cancelled" || text === "canceled") return "Cancelled";
  if (text === "out for delivery") return "Out for Delivery";
  if (text === "confirmed") return "Confirmed";
  return String(value || "").trim() || "Processing";
}

function mapReviewRowToUi(row) {
  return {
    id: row.id,
    bookingId: row.booking_id || null,
    service: row.service || "Service",
    petName: row.pet_name || "Pet",
    petBreed: row.pet_breed || "",
    date: formatDate(row.review_date || row.created_at),
    rating: Number(row.rating || 0),
    comment: row.comment || "",
  };
}

function toTimestamp(value) {
  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function buildRecentActivity(notificationsRows, bookingsRows, ordersRows, reviewsRows) {
  const activity = [];

  for (const row of notificationsRows) {
    const text = row.message || row.title || "Notification";
    const at = row.created_at;
    activity.push({
      id: `notification-${row.id}`,
      text,
      time: toRelativeTime(at),
      at,
    });
  }

  for (const row of bookingsRows) {
    const status = String(row.status || "").toLowerCase();
    const service = row.service || "Service";
    const petSuffix = row.pet_name ? ` for ${row.pet_name}` : "";
    let text = `${service} booking updated${petSuffix}`;

    if (status === "completed") {
      text = `completed ${service}${petSuffix}`;
    } else if (status === "cancelled") {
      text = `cancelled ${service}${petSuffix}`;
    } else if (status) {
      text = `${service} booking is ${row.status}${petSuffix}`;
    }

    const at = row.updated_at || row.scheduled_at || row.created_at;
    activity.push({
      id: `booking-${row.id}`,
      text,
      time: toRelativeTime(at),
      at,
    });
  }

  for (const row of ordersRows) {
    const orderNumber = row.order_number || row.id || "order";
    const deliveryStatus = String(row.delivery_status || "").toLowerCase();
    let text = `Order ${orderNumber} was updated`;

    if (deliveryStatus === "completed") {
      text = `Order ${orderNumber} was delivered`;
    } else if (deliveryStatus === "cancelled") {
      text = `Order ${orderNumber} was cancelled`;
    } else if (row.delivery_status) {
      text = `Order ${orderNumber} is ${row.delivery_status.toLowerCase()}`;
    }

    const at = row.updated_at || row.ordered_at;
    activity.push({
      id: `order-${row.id}`,
      text,
      time: toRelativeTime(at),
      at,
    });
  }

  for (const row of reviewsRows) {
    const service = row.service || "service";
    const petSuffix = row.pet_name ? ` for ${row.pet_name}` : "";
    const at = row.created_at || row.review_date;
    activity.push({
      id: `review-${row.id}`,
      text: `You left a review for ${service}${petSuffix}`,
      time: toRelativeTime(at),
      at,
    });
  }

  return activity
    .filter((item) => item.text)
    .sort((a, b) => toTimestamp(b.at) - toTimestamp(a.at))
    .slice(0, 6)
    .map(({ id, text, time }) => ({
      id,
      text,
      time: time || "recently",
    }));
}

async function safeSelectRows(queryPromise) {
  const { data, error } = await queryPromise;
  if (error) {
    if (isSchemaError(error)) return { rows: [], schemaMissing: true };
    throw new Error(error.message);
  }

  return { rows: Array.isArray(data) ? data : [], schemaMissing: false };
}

async function loadProfileDetails(userId) {
  const extended = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, username, address, city, bio, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (!extended.error) {
    return {
      profile: extended.data || null,
      schemaMissing: false,
    };
  }

  if (!isSchemaError(extended.error)) {
    throw new Error(extended.error.message);
  }

  const fallback = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone")
    .eq("id", userId)
    .maybeSingle();

  if (fallback.error && !isSchemaError(fallback.error)) {
    throw new Error(fallback.error.message);
  }

  return {
    profile: fallback.data || null,
    schemaMissing: true,
  };
}

async function loadOrderRows(userId) {
  const selectWithMethods =
    "id, order_number, ordered_at, items, total_amount, currency, status, delivery_status, payment_method, fulfillment_method, rider_name, rider_contact, rider_vehicle, updated_at, delivered_at, eta, cancelled_at, cancelled_stage, cancel_reason, tracking_updates";
  const selectFallback =
    "id, order_number, ordered_at, items, total_amount, currency, status, delivery_status, rider_name, rider_contact, rider_vehicle, updated_at, delivered_at, eta, cancelled_at, cancelled_stage, cancel_reason, tracking_updates";

  const primary = await supabase
    .from("profile_orders")
    .select(selectWithMethods)
    .eq("user_id", userId)
    .order("ordered_at", { ascending: false });

  if (!primary.error) {
    return {
      rows: Array.isArray(primary.data) ? primary.data : [],
      schemaMissing: false,
    };
  }

  if (!isSchemaError(primary.error)) {
    throw new Error(primary.error.message);
  }

  const fallback = await supabase
    .from("profile_orders")
    .select(selectFallback)
    .eq("user_id", userId)
    .order("ordered_at", { ascending: false });

  if (fallback.error) {
    if (isSchemaError(fallback.error)) return { rows: [], schemaMissing: true };
    throw new Error(fallback.error.message);
  }

  const rows = Array.isArray(fallback.data)
    ? fallback.data.map((row) => ({
        ...row,
        payment_method: null,
        fulfillment_method: null,
      }))
    : [];

  return {
    rows,
    schemaMissing: true,
  };
}

export async function fetchProfileDashboard(userId) {
  if (!supabase || !userId) return null;

  const profileResult = await loadProfileDetails(userId);
  const petsResult = await safeSelectRows(
    supabase
      .from("user_pets")
      .select("id, name, species, breed, birth_date")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
  );

  const notificationsResult = await safeSelectRows(
    supabase
      .from("profile_notifications")
      .select("id, title, message, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100)
  );

  const bookingsResult = await safeSelectRows(
    supabase
      .from("profile_bookings")
      .select(
        "id, service, service_type, pet_name, pet_breed, scheduled_at, status, price_label, note, reviewed, created_at, updated_at"
      )
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: false })
  );

  const ordersResult = await loadOrderRows(userId);

  const reviewsResult = await safeSelectRows(
    supabase
      .from("profile_reviews")
      .select("id, booking_id, service, pet_name, pet_breed, review_date, rating, comment, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  );

  const bookings = bookingsResult.rows.map((row) => ({
    id: row.id,
    service: row.service || "Service",
    serviceType: row.service_type || "general",
    petName: row.pet_name || "Pet",
    petBreed: row.pet_breed || "",
    date: formatDate(row.scheduled_at),
    time: formatTime(row.scheduled_at),
    status: normalizeBookingStatus(row.status),
    price: row.price_label || "",
    note: row.note || "",
    reviewed: Boolean(row.reviewed),
    scheduledAtRaw: row.scheduled_at,
  }));

  const now = new Date();
  const upcomingBookings = [];
  const pastBookings = [];

  for (const booking of bookings) {
    const bookingDate = new Date(booking.scheduledAtRaw);
    const normalizedStatus = (booking.status || "").toLowerCase();
    const isCompleted = normalizedStatus === "completed";
    const isCancelled = normalizedStatus === "cancelled";
    const hasValidDate = !Number.isNaN(bookingDate.getTime());
    const isFuture = hasValidDate && bookingDate.getTime() >= now.getTime();

    const cleanBooking = { ...booking };
    delete cleanBooking.scheduledAtRaw;

    if (isCompleted) {
      pastBookings.push(cleanBooking);
    } else if (!isCancelled && (!hasValidDate || isFuture)) {
      upcomingBookings.push(cleanBooking);
    }
  }

  const orders = ordersResult.rows.map((row) => ({
    dbId: row.id,
    id: row.order_number || row.id,
    orderNumber: row.order_number || row.id,
    date: formatDate(row.ordered_at),
    items: Array.isArray(row.items) ? row.items : [],
    total: formatCurrency(row.total_amount, row.currency || "PHP"),
    status: row.status || "Pending",
    deliveryStatus: row.delivery_status || "Processing",
    paymentMethod: normalizePaymentMethod(row.payment_method, row.status),
    fulfillmentMethod: normalizeFulfillmentMethod(row.fulfillment_method, row.rider_name),
    riderName: row.rider_name || "Not assigned",
    riderContact: row.rider_contact || "",
    riderVehicle: row.rider_vehicle || "",
    updatedAt: formatDateTime(row.updated_at),
    deliveredAt: formatDateTime(row.delivered_at),
    eta: formatDateTime(row.eta),
    cancelledAt: formatDateTime(row.cancelled_at),
    cancelledStage: row.cancelled_stage || "",
    cancelReason: row.cancel_reason || "",
    trackingUpdates: Array.isArray(row.tracking_updates) ? row.tracking_updates : [],
  }));

  const reviews = reviewsResult.rows.map(mapReviewRowToUi);
  const notifications = notificationsResult.rows.map((row) => ({
    id: row.id,
    title: row.title || "Notification",
    message: row.message || "",
    time: toRelativeTime(row.created_at),
    read: Boolean(row.is_read),
  }));
  const recentActivity = buildRecentActivity(
    notificationsResult.rows,
    bookingsResult.rows,
    ordersResult.rows,
    reviewsResult.rows
  );

  const pets = petsResult.rows.map((row) => ({
    name: row.name || "Pet",
    type: row.breed || row.species || "Pet",
    birthday: row.birth_date ? String(row.birth_date).slice(0, 10) : "",
  }));

  const schemaReady =
    !profileResult.schemaMissing &&
    !petsResult.schemaMissing &&
    !notificationsResult.schemaMissing &&
    !bookingsResult.schemaMissing &&
    !ordersResult.schemaMissing &&
    !reviewsResult.schemaMissing;

  return {
    schemaReady,
    profile: profileResult.profile,
    pets,
    notifications,
    upcomingBookings,
    pastBookings,
    orders,
    reviews,
    recentActivity,
  };
}

function normalizeSpecies(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("cat")) return "cat";
  if (text.includes("dog")) return "dog";
  return text || "pet";
}

function buildScheduledAt(dateValue, timeValue) {
  if (!dateValue) return new Date().toISOString();

  if (!timeValue) {
    const parsedDateOnly = new Date(`${dateValue}T10:00:00`);
    return Number.isNaN(parsedDateOnly.getTime())
      ? new Date().toISOString()
      : parsedDateOnly.toISOString();
  }

  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export async function createProfileBooking(userId, payload) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!userId) throw new Error("You must be logged in to create a booking.");

  const scheduledAt = payload.scheduledAt
    || buildScheduledAt(payload.date, payload.time);

  const bookingRow = {
    user_id: userId,
    service: payload.service || "Service Booking",
    service_type: payload.serviceType || "general",
    pet_name: payload.petName || null,
    pet_breed: payload.petBreed || null,
    scheduled_at: scheduledAt,
    status: payload.status || "Processing",
    price_label: payload.priceLabel || null,
    note: payload.note || null,
    reviewed: Boolean(payload.reviewed || false),
    metadata: payload.metadata || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profile_bookings")
    .insert(bookingRow)
    .select("id, service, service_type, pet_name, pet_breed, scheduled_at, status, price_label, note, reviewed")
    .single();

  if (error) throw new Error(error.message);

  // Keep user pet tags in profile aligned with booking activity.
  if (payload.petName) {
    const petRow = {
      user_id: userId,
      name: payload.petName,
      species: normalizeSpecies(payload.petType),
      breed: payload.petBreed || null,
      updated_at: new Date().toISOString(),
    };

    if (payload.petBirthday) {
      petRow.birth_date = payload.petBirthday;
    }

    await supabase.from("user_pets").upsert(petRow, {
      onConflict: "user_id,name",
    });
  }

  return data;
}

export async function createProfileOrder(userId, payload) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!userId) throw new Error("You must be logged in to create an order.");

  const items = Array.isArray(payload.items) ? payload.items : [];
  const orderNumber = payload.orderNumber
    || `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const orderRow = {
    user_id: userId,
    order_number: orderNumber,
    ordered_at: payload.orderedAt || new Date().toISOString(),
    items,
    total_amount: Number(payload.totalAmount || 0),
    currency: payload.currency || "PHP",
    status: payload.status || "Paid",
    delivery_status: payload.deliveryStatus || "Processing",
    payment_method: payload.paymentMethod || null,
    fulfillment_method: payload.fulfillmentMethod || null,
    rider_name: payload.riderName || null,
    rider_contact: payload.riderContact || null,
    rider_vehicle: payload.riderVehicle || null,
    delivered_at: payload.deliveredAt || null,
    eta: payload.eta || null,
    cancelled_at: payload.cancelledAt || null,
    cancelled_stage: payload.cancelledStage || null,
    cancel_reason: payload.cancelReason || null,
    tracking_updates: Array.isArray(payload.trackingUpdates) ? payload.trackingUpdates : [],
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from("profile_orders")
    .insert(orderRow)
    .select("id, order_number")
    .single();

  if (error && isSchemaError(error)) {
    const legacyOrderRow = {
      ...orderRow,
    };
    delete legacyOrderRow.payment_method;
    delete legacyOrderRow.fulfillment_method;

    const retry = await supabase
      .from("profile_orders")
      .insert(legacyOrderRow)
      .select("id, order_number")
      .single();

    data = retry.data;
    error = retry.error;
  }

  if (error) throw new Error(error.message);
  return data;
}

export async function cancelProfileOrder(userId, orderId, payload = {}) {
  if (!supabase || !userId || !orderId) return false;

  const nowIso = new Date().toISOString();
  const updateRow = {
    status: payload.status || "Cancelled",
    delivery_status: "Cancelled",
    cancelled_at: payload.cancelledAt || nowIso,
    cancelled_stage: payload.cancelledStage || "Preparing Order",
    cancel_reason: payload.cancelReason || "Cancelled by customer",
    eta: null,
    updated_at: nowIso,
  };

  const byId = await supabase
    .from("profile_orders")
    .update(updateRow)
    .eq("user_id", userId)
    .eq("id", orderId)
    .select("id")
    .maybeSingle();

  if (!byId.error && byId.data?.id) return true;
  if (byId.error && !isSchemaError(byId.error)) throw new Error(byId.error.message);

  const byOrderNumber = await supabase
    .from("profile_orders")
    .update(updateRow)
    .eq("user_id", userId)
    .eq("order_number", orderId)
    .select("id")
    .maybeSingle();

  if (byOrderNumber.error) {
    if (isSchemaError(byOrderNumber.error)) return false;
    throw new Error(byOrderNumber.error.message);
  }

  return Boolean(byOrderNumber.data?.id);
}

export async function markNotificationAsRead(userId, notificationId) {
  if (!supabase || !userId || !notificationId) return false;

  const { error } = await supabase
    .from("profile_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", notificationId);

  if (error) {
    if (isSchemaError(error)) return false;
    throw new Error(error.message);
  }

  return true;
}

export async function markAllNotificationsAsRead(userId) {
  if (!supabase || !userId) return false;

  const { error } = await supabase
    .from("profile_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    if (isSchemaError(error)) return false;
    throw new Error(error.message);
  }

  return true;
}

export async function cancelProfileBooking(userId, bookingId) {
  if (!supabase || !userId || !bookingId) return false;

  const { error } = await supabase
    .from("profile_bookings")
    .update({
      status: "Cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", bookingId);

  if (error) {
    if (isSchemaError(error)) return false;
    throw new Error(error.message);
  }

  return true;
}

export async function saveProfileReview(userId, payload) {
  if (!supabase || !userId) return null;

  const reviewRow = {
    user_id: userId,
    booking_id: payload.bookingId || null,
    service: payload.service || "Service",
    pet_name: payload.petName || null,
    pet_breed: payload.petBreed || null,
    review_date: toReviewDate(payload.date),
    rating: Number(payload.rating || 0),
    comment: payload.comment || "",
    updated_at: new Date().toISOString(),
  };

  if (payload.reviewId) {
    const { data, error } = await supabase
      .from("profile_reviews")
      .update(reviewRow)
      .eq("user_id", userId)
      .eq("id", payload.reviewId)
      .select("id, booking_id, service, pet_name, pet_breed, review_date, rating, comment, created_at")
      .single();

    if (error) {
      if (isSchemaError(error)) return null;
      throw new Error(error.message);
    }

    return mapReviewRowToUi(data);
  }

  const { data, error } = await supabase
    .from("profile_reviews")
    .insert(reviewRow)
    .select("id, booking_id, service, pet_name, pet_breed, review_date, rating, comment, created_at")
    .single();

  if (error) {
    if (isSchemaError(error)) return null;
    throw new Error(error.message);
  }

  return mapReviewRowToUi(data);
}

export async function deleteProfileReview(userId, reviewId) {
  if (!supabase || !userId || !reviewId) return false;

  const { error } = await supabase
    .from("profile_reviews")
    .delete()
    .eq("user_id", userId)
    .eq("id", reviewId);

  if (error) {
    if (isSchemaError(error)) return false;
    throw new Error(error.message);
  }

  return true;
}
