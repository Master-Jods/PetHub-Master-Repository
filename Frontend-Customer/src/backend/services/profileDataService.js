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

function normalizePaymentMethod(value, fallbackStatus) {
  const text = String(value || "").toLowerCase();
  if (text.includes("gcash")) return "GCash";
  if (text.includes("cash")) return "Cash";

  const status = String(fallbackStatus || "").toLowerCase();
  if (status === "paid") return "GCash";
  return "Cash";
}

function normalizeFulfillmentMethod(value, deliveryMethod) {
  const text = String(value || "").toLowerCase();
  if (text === "pickup") return "Pickup";
  if (text === "delivery") return "Delivery";

  const legacy = String(deliveryMethod || "").toLowerCase();
  if (legacy.includes("pickup")) return "Pickup";
  if (legacy.includes("delivery")) return "Delivery";
  return "";
}

function normalizeBookingStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text || text === "pending" || text === "pending approval" || text === "in process" || text === "in-process") {
    return "Processing";
  }
  if (text === "completed") return "Completed";
  if (text === "cancelled" || text === "canceled") return "Cancelled";
  if (text === "confirmed") return "Confirmed";
  if (text === "in progress") return "In Progress";
  return String(value || "").trim() || "Processing";
}

function normalizeOrderDeliveryStatus(row) {
  const explicit = String(row.delivery_status || "").trim();
  const explicitLower = explicit.toLowerCase();
  if (explicitLower === "cancelled" || explicitLower === "canceled") return "Cancelled";
  if (explicitLower === "completed") return "Completed";
  if (explicitLower === "out for delivery") return "Out for Delivery";
  if (explicitLower === "processing") return "Processing";

  const status = String(row.status || "").trim().toLowerCase();
  if (status === "cancelled") return "Cancelled";
  if (status === "delivered" || status === "order received") return "Completed";
  if (status === "out for delivery" || status === "rider picked up") return "Out for Delivery";
  return explicit || "Processing";
}

function mapReviewRowToUi(row) {
  return {
    id: row.id,
    bookingId: row.booking_id || null,
    orderId: row.order_id || null,
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
    const status = String(row.booking_status || "").toLowerCase();
    const service = row.service || row.service_type || "Service";
    const petSuffix = row.pet_name ? ` for ${row.pet_name}` : "";
    let text = `${service} booking updated${petSuffix}`;

    if (status === "completed") {
      text = `completed ${service}${petSuffix}`;
    } else if (status === "cancelled") {
      text = `cancelled ${service}${petSuffix}`;
    } else if (row.booking_status) {
      text = `${service} booking is ${row.booking_status}${petSuffix}`;
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
    const orderCode = row.order_code || row.id || "order";
    const deliveryStatus = normalizeOrderDeliveryStatus(row).toLowerCase();
    let text = `Order ${orderCode} was updated`;

    if (deliveryStatus === "completed") {
      text = `Order ${orderCode} was delivered`;
    } else if (deliveryStatus === "cancelled") {
      text = `Order ${orderCode} was cancelled`;
    } else {
      text = `Order ${orderCode} is ${normalizeOrderDeliveryStatus(row).toLowerCase()}`;
    }

    const at = row.updated_at || row.order_date || row.created_at;
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

function splitFullName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
}

function buildDisplayName(profile) {
  const firstName = profile?.first_name?.trim() || "";
  const lastName = profile?.last_name?.trim() || "";
  const joined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  if (profile?.email) return profile.email.split("@")[0];
  return "Customer";
}

async function loadProfileDetails(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, email, first_name, last_name, display_name, phone, username, address, city, bio, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isSchemaError(error)) {
      return { profile: null, schemaMissing: true };
    }
    throw new Error(error.message);
  }

  return {
    profile: data
      ? {
          ...data,
          id: data.user_id,
        }
      : null,
    schemaMissing: false,
  };
}

async function loadOrderRows(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_code, order_date, items, total, base_total, currency, status, request_status, payment_method, payment_status, fulfillment_method, delivery_method, delivery_zone, delivery_fee, shipping_address, rider_snapshot, updated_at, eta, cancelled_at, cancelled_stage, cancel_reason, tracking_updates, timeline, proof_of_payment, delivery_status, created_at"
    )
    .eq("user_id", userId)
    .order("order_date", { ascending: false });

  if (error) {
    if (isSchemaError(error)) return { rows: [], schemaMissing: true };
    throw new Error(error.message);
  }

  return {
    rows: Array.isArray(data) ? data : [],
    schemaMissing: false,
  };
}

function normalizeSpecies(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("cat")) return "cat";
  if (text.includes("dog")) return "dog";
  return "other";
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

function parseCurrencyLabel(value) {
  const text = String(value || "").replace(/[^0-9.]/g, "");
  const numeric = Number(text);
  return Number.isNaN(numeric) ? 0 : numeric;
}

function mapBookingServiceType(value, service) {
  const text = String(value || service || "").toLowerCase();
  if (text.includes("groom")) return "Grooming";
  if (text.includes("board")) return "Boarding";
  if (text.includes("pawty") || text.includes("birthday")) return "Birthday Party";
  return "General";
}

function resolveBookingPaymentMethod(serviceType, requestedMethod, fallbackStatus) {
  if (serviceType === "Birthday Party") return "GCash";
  if (serviceType === "Grooming" || serviceType === "Boarding") return "Cash";
  return normalizePaymentMethod(requestedMethod, fallbackStatus);
}

function mapReviewCategory(value, service) {
  const text = String(value || service || "").toLowerCase();
  if (text.includes("order")) return "Orders";
  if (text.includes("board")) return "Boarding";
  if (text.includes("pawty") || text.includes("birthday")) return "Birthday Party";
  return "Grooming";
}

async function getCustomerContext(userId) {
  const profileResult = await loadProfileDetails(userId);
  return {
    profile: profileResult.profile,
    schemaMissing: profileResult.schemaMissing,
  };
}

async function insertNotifications(rows) {
  if (!rows.length) return;

  const { error } = await supabase.from("notifications").insert(rows);
  if (error && !isSchemaError(error)) {
    console.warn("Unable to insert notifications:", error.message || error);
  }
}

export async function fetchProfileDashboard(userId) {
  if (!supabase || !userId) return null;

  const profileResult = await loadProfileDetails(userId);
  const petsResult = await safeSelectRows(
    supabase
      .from("pets")
      .select("id, name, species, breed, birth_date")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
  );

  const notificationsResult = await safeSelectRows(
    supabase
      .from("notifications")
      .select("id, title, message, is_read, created_at, type, entity_type, entity_id, audience")
      .eq("user_id", userId)
      .in("audience", ["customer", "all"])
      .order("created_at", { ascending: false })
      .limit(100)
  );

  const bookingsResult = await safeSelectRows(
    supabase
      .from("bookings")
      .select(
        "id, booking_code, service, service_type, pet_name, pet_breed, scheduled_at, booking_status, service_total, price_label, note, reviewed, created_at, updated_at"
      )
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: false })
  );

  const ordersResult = await loadOrderRows(userId);

  const reviewsResult = await safeSelectRows(
    supabase
      .from("reviews")
      .select("id, booking_id, order_id, service, pet_name, pet_breed, review_date, rating, comment, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  );

  const bookings = bookingsResult.rows.map((row) => ({
    id: row.id,
    bookingCode: row.booking_code,
    service: row.service || "Service",
    serviceType: String(row.service_type || "general").toLowerCase(),
    petName: row.pet_name || "Pet",
    petBreed: row.pet_breed || "",
    date: formatDate(row.scheduled_at),
    time: formatTime(row.scheduled_at),
    status: normalizeBookingStatus(row.booking_status),
    price: row.price_label || formatCurrency(row.service_total),
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
    id: row.order_code || row.id,
    orderNumber: row.order_code || row.id,
    date: formatDate(row.order_date),
    items: Array.isArray(row.items) ? row.items : [],
    total: formatCurrency(row.total || row.base_total, row.currency || "PHP"),
    status: row.status || "Pending",
    deliveryStatus: normalizeOrderDeliveryStatus(row),
    paymentMethod: normalizePaymentMethod(row.payment_method, row.payment_status),
    fulfillmentMethod: normalizeFulfillmentMethod(row.fulfillment_method, row.delivery_method),
    riderName: row.rider_snapshot?.name || "Not assigned",
    riderContact: row.rider_snapshot?.contact || "",
    riderVehicle: row.rider_snapshot?.vehicle || "",
    updatedAt: formatDateTime(row.updated_at),
    deliveredAt: row.status === "Delivered" || row.status === "Order Received" ? formatDateTime(row.updated_at) : "",
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

export async function createProfileBooking(userId, payload) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!userId) throw new Error("You must be logged in to create a booking.");

  const scheduledAt = payload.scheduledAt || buildScheduledAt(payload.date, payload.time);
  const { profile } = await getCustomerContext(userId);
  const customerName = payload.customerName || profile?.display_name || buildDisplayName(profile);
  const customerEmail = payload.customerEmail || profile?.email || "";
  const customerPhone = payload.customerPhone || profile?.phone || "";
  const bookingCode = payload.bookingCode || `BKG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const nowIso = new Date().toISOString();

  const serviceType = mapBookingServiceType(payload.serviceType, payload.service);
  const metadata = payload.metadata || {};
  const paymentMethod = resolveBookingPaymentMethod(
    serviceType,
    payload.paymentMethod || metadata.paymentMethod,
    payload.paymentStatus
  );
  const petInfo = {
    name: payload.petName || "",
    type: payload.petType || "",
    breed: payload.petBreed || "",
    birthday: payload.petBirthday || metadata.petBirthday || null,
    size: metadata.petSize || "",
    photoUrl: metadata.petPhotoDataUrl || null,
    photoName: metadata.petPhotoName || "",
  };

  const bookingRow = {
    booking_code: bookingCode,
    user_id: userId,
    service: payload.service || "Service Booking",
    service_type: serviceType,
    scheduled_at: scheduledAt,
    customer_name: customerName || "Customer",
    customer_email: customerEmail,
    customer_phone: customerPhone,
    pet_name: payload.petName || null,
    pet_breed: payload.petBreed || null,
    pet_info: petInfo,
    appointment_info: {
      date: payload.date || "",
      time: payload.time || "",
    },
    contact_info: {
      owner: customerName || "Customer",
      phone: customerPhone || "",
      email: customerEmail || "",
    },
    service_details: metadata,
    grooming_summary: payload.groomingSummary || {},
    metadata: metadata,
    service_total: Number(payload.totalAmount || parseCurrencyLabel(payload.priceLabel)),
    price_label: payload.priceLabel || null,
    payment_method: paymentMethod,
    payment_status: payload.paymentStatus || "Pending",
    booking_status: payload.bookingStatus || "Pending Approval",
    note: payload.note || null,
    reviewed: Boolean(payload.reviewed || false),
    total_price_history: [],
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(bookingRow)
    .select("id, booking_code, service, service_type, pet_name, pet_breed, scheduled_at, booking_status, price_label, note, reviewed")
    .single();

  if (error) throw new Error(error.message);

  if (payload.petName) {
    const petRow = {
      user_id: userId,
      name: payload.petName,
      species: normalizeSpecies(payload.petType),
      breed: payload.petBreed || null,
      updated_at: nowIso,
    };

    if (payload.petBirthday) {
      petRow.birth_date = payload.petBirthday;
    }

    await supabase.from("pets").upsert(petRow, {
      onConflict: "user_id,name",
    });
  }

  await insertNotifications([
    {
      user_id: userId,
      audience: "customer",
      type: "booking",
      entity_type: "booking",
      entity_id: data.id,
      title: "Booking Submitted",
      message: `Your ${bookingRow.service_type} booking has been submitted.`,
      metadata: {
        bookingCode: bookingCode,
        serviceType: bookingRow.service_type,
      },
    },
    {
      user_id: null,
      audience: "admin",
      type: "booking",
      entity_type: "booking",
      entity_id: data.id,
      title: "New Booking",
      message: `${customerName} booked ${bookingRow.service_type}`,
      metadata: {
        bookingCode: bookingCode,
        customerName,
        serviceType: bookingRow.service_type,
      },
    },
  ]);

  return {
    id: data.id,
    booking_code: data.booking_code,
    service: data.service,
    service_type: data.service_type,
    pet_name: data.pet_name,
    pet_breed: data.pet_breed,
    scheduled_at: data.scheduled_at,
    status: data.booking_status,
    price_label: data.price_label,
    note: data.note,
    reviewed: data.reviewed,
  };
}

export async function createProfileOrder(userId, payload) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!userId) throw new Error("You must be logged in to create an order.");

  const items = Array.isArray(payload.items) ? payload.items : [];
  const { profile } = await getCustomerContext(userId);
  const customerName = payload.customerName || profile?.display_name || buildDisplayName(profile);
  const customerEmail = payload.customerEmail || profile?.email || "";
  const customerPhone = payload.customerPhone || profile?.phone || "";
  const orderCode = payload.orderCode || payload.orderNumber || `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const totalAmount = Number(payload.totalAmount || payload.total || 0);
  const deliveryFee = Number(payload.deliveryFee || 0);
  const baseTotal = Number(payload.baseTotal || Math.max(totalAmount - deliveryFee, 0));
  const fulfillmentMethod = String(payload.fulfillmentMethod || "pickup").toLowerCase();
  const deliveryMethod = fulfillmentMethod === "delivery" ? "Delivery" : "Store Pickup";
  const nowIso = new Date().toISOString();

  const orderRow = {
    order_code: orderCode,
    user_id: userId,
    category: payload.category || "Pet Shop",
    customer_name: customerName || "Customer",
    customer_email: customerEmail,
    customer_phone: customerPhone,
    order_date: payload.orderedAt || nowIso,
    items,
    currency: payload.currency || "PHP",
    base_total: baseTotal,
    total: totalAmount,
    status: payload.status || "Order Placed",
    request_status: payload.requestStatus || "Pending Request",
    rejection_reason: payload.rejectionReason || "",
    payment_method: normalizePaymentMethod(payload.paymentMethod, payload.paymentStatus),
    payment_status: payload.paymentStatus || "Pending",
    fulfillment_method: fulfillmentMethod,
    delivery_method: deliveryMethod,
    delivery_zone: payload.deliveryZone || "",
    delivery_fee: deliveryFee,
    shipping_address: payload.shippingAddress || "",
    eta: payload.eta || null,
    rider_snapshot: payload.riderSnapshot || null,
    tracking_updates: Array.isArray(payload.trackingUpdates) ? payload.trackingUpdates : [],
    timeline: Array.isArray(payload.timeline) ? payload.timeline : (Array.isArray(payload.trackingUpdates) ? payload.trackingUpdates : []),
    proof_of_payment: payload.proofOfPayment || "",
    delivery_status: payload.deliveryStatus || "Processing",
    cancelled_at: payload.cancelledAt || null,
    cancelled_stage: payload.cancelledStage || null,
    cancel_reason: payload.cancelReason || null,
    metadata: payload.metadata || {},
    updated_at: nowIso,
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(orderRow)
    .select("id, order_code")
    .single();

  if (error) throw new Error(error.message);

  await insertNotifications([
    {
      user_id: userId,
      audience: "customer",
      type: "order",
      entity_type: "order",
      entity_id: data.id,
      title: "Order Placed",
      message: `Your order ${orderCode} has been placed successfully.`,
      metadata: {
        orderCode,
        category: orderRow.category,
      },
    },
    {
      user_id: null,
      audience: "admin",
      type: "order",
      entity_type: "order",
      entity_id: data.id,
      title: "New Order",
      message: `${customerName} placed a ${orderRow.category} order`,
      metadata: {
        orderCode,
        customerName,
        category: orderRow.category,
      },
    },
  ]);

  return {
    id: data.id,
    order_number: data.order_code,
    order_code: data.order_code,
  };
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

  const { data, error } = await supabase
    .from("orders")
    .update(updateRow)
    .eq("user_id", userId)
    .eq("id", orderId)
    .select("id, order_code")
    .maybeSingle();

  if (error) {
    if (isSchemaError(error)) return false;
    throw new Error(error.message);
  }

  if (!data?.id) return false;

  await insertNotifications([
    {
      user_id: userId,
      audience: "customer",
      type: "order",
      entity_type: "order",
      entity_id: data.id,
      title: "Order Cancelled",
      message: `Your order ${data.order_code} was cancelled.`,
      metadata: {
        orderCode: data.order_code,
      },
    },
  ]);

  return true;
}

export async function markNotificationAsRead(userId, notificationId) {
  if (!supabase || !userId || !notificationId) return false;

  const { error } = await supabase
    .from("notifications")
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
    .from("notifications")
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

  const { data, error } = await supabase
    .from("bookings")
    .update({
      booking_status: "Cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", bookingId)
    .select("id, booking_code")
    .maybeSingle();

  if (error) {
    if (isSchemaError(error)) return false;
    throw new Error(error.message);
  }

  if (!data?.id) return false;

  await insertNotifications([
    {
      user_id: userId,
      audience: "customer",
      type: "booking",
      entity_type: "booking",
      entity_id: data.id,
      title: "Booking Cancelled",
      message: `Your booking ${data.booking_code} was cancelled.`,
      metadata: {
        bookingCode: data.booking_code,
      },
    },
  ]);

  return true;
}

export async function saveProfileReview(userId, payload) {
  if (!supabase || !userId) return null;

  const reviewRow = {
    user_id: userId,
    booking_id: payload.bookingId || null,
    order_id: payload.orderId || null,
    service: payload.service || "Service",
    category: payload.category || mapReviewCategory(payload.serviceType, payload.service),
    pet_name: payload.petName || null,
    pet_breed: payload.petBreed || null,
    review_date: toReviewDate(payload.date),
    rating: Number(payload.rating || 0),
    comment: payload.comment || "",
    score: payload.score || null,
    transaction: payload.transaction || {},
    updated_at: new Date().toISOString(),
  };

  if (payload.reviewId) {
    const { data, error } = await supabase
      .from("reviews")
      .update(reviewRow)
      .eq("user_id", userId)
      .eq("id", payload.reviewId)
      .select("id, booking_id, order_id, service, pet_name, pet_breed, review_date, rating, comment, created_at")
      .single();

    if (error) {
      if (isSchemaError(error)) return null;
      throw new Error(error.message);
    }

    return mapReviewRowToUi(data);
  }

  const reviewCode = payload.reviewCode || `REV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      ...reviewRow,
      review_code: reviewCode,
    })
    .select("id, booking_id, order_id, service, pet_name, pet_breed, review_date, rating, comment, created_at")
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
    .from("reviews")
    .delete()
    .eq("user_id", userId)
    .eq("id", reviewId);

  if (error) {
    if (isSchemaError(error)) return false;
    throw new Error(error.message);
  }

  return true;
}
