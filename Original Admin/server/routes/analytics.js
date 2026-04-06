import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const PERIOD_CONFIG = {
  week: { days: 7, previousLabel: 'vs last week' },
  month: { days: 30, previousLabel: 'vs last month' },
  year: { days: 365, previousLabel: 'vs last year' },
};

const SERVICE_COLORS = ['#f53799', '#9b51e0', '#f2994a', '#2d9cdb', '#6fcf97', '#f768a1'];

const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const signedPercent = (current, previous) => {
  if (!previous && !current) return { text: '0%', trend: 'up' };
  if (!previous) return { text: '+100%', trend: 'up' };
  const raw = ((current - previous) / previous) * 100;
  return {
    text: `${raw >= 0 ? '+' : ''}${Math.round(raw)}%`,
    trend: raw >= 0 ? 'up' : 'down',
  };
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;
  const base = typeof dateValue === 'string' ? dateValue : new Date(dateValue).toISOString().slice(0, 10);
  const time = timeValue || '00:00:00';
  const parsed = new Date(`${base}T${time}`);
  return Number.isNaN(parsed.getTime()) ? parseDate(dateValue) : parsed;
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const subDays = (date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000);

const inRange = (date, start, end) => date && date >= start && date <= end;

const toWeekday = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });
const toShortWeekday = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
const toMonth = (date) => date.toLocaleDateString('en-US', { month: 'short' });

const safeItems = (items) => (Array.isArray(items) ? items : []);

const buildRange = (period) => {
  const config = PERIOD_CONFIG[period] || PERIOD_CONFIG.month;
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(end, config.days - 1));
  const previousEnd = endOfDay(subDays(start, 1));
  const previousStart = startOfDay(subDays(previousEnd, config.days - 1));
  return { ...config, start, end, previousStart, previousEnd };
};

const countUnique = (values) => new Set(values.filter(Boolean)).size;

const aggregateOrderItems = (orders) => {
  const counts = new Map();

  orders.forEach((order) => {
    safeItems(order.items).forEach((item) => {
      const key = item.name || `${order.category} Item`;
      const entry = counts.get(key) || { name: key, count: 0, category: order.category };
      entry.count += Number(item.quantity || 1);
      counts.set(key, entry);
    });

    if (safeItems(order.items).length === 0) {
      const key = `${order.category} Order`;
      const entry = counts.get(key) || { name: key, count: 0, category: order.category };
      entry.count += 1;
      counts.set(key, entry);
    }
  });

  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 4);
};

router.get('/', async (req, res) => {
  const period = ['week', 'month', 'year'].includes(req.query.period) ? req.query.period : 'month';
  const { start, end, previousStart, previousEnd, previousLabel } = buildRange(period);

  try {
    const [
      { data: bookings, error: bookingsError },
      { data: orders, error: ordersError },
      { data: customers, error: customersError },
      { data: reviews, error: reviewsError },
    ] = await Promise.all([
      supabaseAdmin
        .from('bookings')
        .select('booking_id, customer_name, service_type, appointment_date, appointment_time, service_total, booking_status, created_at'),
      supabaseAdmin
        .from('orders')
        .select('order_id, customer_name, category, order_date, items, total, status, created_at'),
      supabaseAdmin
        .from('customers')
        .select('customer_id, name, account_created, pets'),
      supabaseAdmin
        .from('reviews')
        .select('review_id, rating, created_at'),
    ]);

    if (bookingsError) throw bookingsError;
    if (ordersError) throw ordersError;
    if (customersError) throw customersError;
    if (reviewsError) throw reviewsError;

    const bookingRows = (bookings || []).map((row) => ({
      ...row,
      eventDate: parseDateTime(row.appointment_date || row.created_at, row.appointment_time),
      amount: Number(row.service_total || 0),
      customerKey: row.customer_name,
      cancelled: row.booking_status === 'Cancelled',
    }));

    const orderRows = (orders || []).map((row) => ({
      ...row,
      eventDate: parseDate(row.order_date || row.created_at),
      amount: Number(row.total || 0),
      customerKey: row.customer_name,
      cancelled: row.status === 'Cancelled',
    }));

    const currentBookings = bookingRows.filter((row) => !row.cancelled && inRange(row.eventDate, start, end));
    const previousBookings = bookingRows.filter((row) => !row.cancelled && inRange(row.eventDate, previousStart, previousEnd));
    const currentOrders = orderRows.filter((row) => !row.cancelled && inRange(row.eventDate, start, end));
    const previousOrders = orderRows.filter((row) => !row.cancelled && inRange(row.eventDate, previousStart, previousEnd));

    const currentRevenue = currentBookings.reduce((sum, row) => sum + row.amount, 0) + currentOrders.reduce((sum, row) => sum + row.amount, 0);
    const previousRevenue = previousBookings.reduce((sum, row) => sum + row.amount, 0) + previousOrders.reduce((sum, row) => sum + row.amount, 0);
    const currentBookingsCount = currentBookings.length;
    const previousBookingsCount = previousBookings.length;
    const currentOrdersCount = currentOrders.length;
    const previousOrdersCount = previousOrders.length;
    const currentAvgOrderValue = currentOrdersCount ? currentOrders.reduce((sum, row) => sum + row.amount, 0) / currentOrdersCount : 0;
    const previousAvgOrderValue = previousOrdersCount ? previousOrders.reduce((sum, row) => sum + row.amount, 0) / previousOrdersCount : 0;

    const currentCustomerKeys = [...currentBookings.map((row) => row.customerKey), ...currentOrders.map((row) => row.customerKey)];
    const previousCustomerKeys = [...previousBookings.map((row) => row.customerKey), ...previousOrders.map((row) => row.customerKey)];
    const uniqueCurrentCustomers = countUnique(currentCustomerKeys);
    const uniquePreviousCustomers = countUnique(previousCustomerKeys);
    const repeatCurrentCustomers = [...new Set(currentCustomerKeys.filter((customer, index, all) => customer && all.indexOf(customer) !== index))].length;
    const repeatPreviousCustomers = [...new Set(previousCustomerKeys.filter((customer, index, all) => customer && all.indexOf(customer) !== index))].length;
    const currentRetention = uniqueCurrentCustomers ? (repeatCurrentCustomers / uniqueCurrentCustomers) * 100 : 0;
    const previousRetention = uniquePreviousCustomers ? (repeatPreviousCustomers / uniquePreviousCustomers) * 100 : 0;

    const metricDefinitions = [
      { label: 'Total Revenue', current: currentRevenue, previous: previousRevenue, value: currency.format(currentRevenue) },
      { label: 'Total Bookings', current: currentBookingsCount, previous: previousBookingsCount, value: currentBookingsCount.toLocaleString('en-PH') },
      { label: 'Orders', current: currentOrdersCount, previous: previousOrdersCount, value: currentOrdersCount.toLocaleString('en-PH') },
      { label: 'Avg. Order Value', current: currentAvgOrderValue, previous: previousAvgOrderValue, value: currency.format(currentAvgOrderValue) },
      { label: 'Customer Retention', current: currentRetention, previous: previousRetention, value: `${Math.round(currentRetention)}%` },
    ];

    const metrics = metricDefinitions.map((metric, index) => {
      const change = signedPercent(metric.current, metric.previous);
      return {
        id: index + 1,
        label: metric.label,
        value: metric.value,
        change: change.text,
        trend: change.trend,
        period: previousLabel,
      };
    });

    const serviceMap = new Map();
    currentBookings.forEach((row) => {
      const entry = serviceMap.get(row.service_type) || { service: row.service_type, bookings: 0, revenue: 0 };
      entry.bookings += 1;
      entry.revenue += row.amount;
      serviceMap.set(row.service_type, entry);
    });

    const popularServices = [...serviceMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item, index) => ({ id: index + 1, ...item, color: SERVICE_COLORS[index % SERVICE_COLORS.length] }));

    const orderDistribution = {
      petShop: currentOrders.filter((row) => row.category === 'Pet Shop').length,
      petMenu: currentOrders.filter((row) => row.category === 'Pet Menu').length,
    };

    const popularOrders = aggregateOrderItems(currentOrders);

    let peakHours;
    if (period === 'week') {
      const dayCounts = new Map();
      currentBookings.forEach((row) => {
        const key = toWeekday(row.eventDate);
        dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
      });
      const max = Math.max(...dayCounts.values(), 1);
      peakHours = [...dayCounts.entries()]
        .map(([time, bookingsCount]) => ({ time, bookings: bookingsCount, percentage: Math.round((bookingsCount / max) * 100) }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);
    } else if (period === 'month') {
      const slots = [
        { label: '8:00 AM - 10:00 AM', min: 8, max: 10 },
        { label: '10:00 AM - 12:00 PM', min: 10, max: 12 },
        { label: '12:00 PM - 2:00 PM', min: 12, max: 14 },
        { label: '2:00 PM - 4:00 PM', min: 14, max: 16 },
        { label: '4:00 PM - 6:00 PM', min: 16, max: 18 },
      ];
      const slotCounts = slots.map((slot) => {
        const bookingsCount = currentBookings.filter((row) => {
          if (!row.eventDate) return false;
          const hour = row.eventDate.getHours();
          return hour >= slot.min && hour < slot.max;
        }).length;
        return { time: slot.label, bookings: bookingsCount };
      });
      const max = Math.max(...slotCounts.map((item) => item.bookings), 1);
      peakHours = slotCounts.map((item) => ({ ...item, percentage: Math.round((item.bookings / max) * 100) })).sort((a, b) => b.bookings - a.bookings);
    } else {
      const monthCounts = new Map();
      currentBookings.forEach((row) => {
        const key = toMonth(row.eventDate);
        monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
      });
      const max = Math.max(...monthCounts.values(), 1);
      peakHours = [...monthCounts.entries()]
        .map(([time, bookingsCount]) => ({ time, bookings: bookingsCount, percentage: Math.round((bookingsCount / max) * 100) }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);
    }

    const newCustomers = (customers || []).filter((customer) => {
      const created = parseDate(customer.account_created);
      return inRange(created, start, end);
    }).length;

    const totalVisits = currentBookingsCount + currentOrdersCount;
    const avgVisits = uniqueCurrentCustomers ? totalVisits / uniqueCurrentCustomers : 0;

    const interactionDates = [...currentBookings.map((row) => row.eventDate), ...currentOrders.map((row) => row.eventDate)].filter(Boolean);
    const activeDayCounts = new Map();
    interactionDates.forEach((date) => {
      const key = toWeekday(date);
      activeDayCounts.set(key, (activeDayCounts.get(key) || 0) + 1);
    });
    const activeDay = [...activeDayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const petCounts = { Dogs: 0, Cats: 0, 'All Pets': 0 };
    (customers || []).forEach((customer) => {
      (customer.pets || []).forEach((pet) => {
        const species = String(pet.species || pet.type || '').toLowerCase();
        if (species.includes('dog')) petCounts.Dogs += 1;
        else if (species.includes('cat')) petCounts.Cats += 1;
        else petCounts['All Pets'] += 1;
      });
    });
    const totalPets = Object.values(petCounts).reduce((sum, value) => sum + value, 0);
    const [popularPetLabel, popularPetCount] = Object.entries(petCounts).sort((a, b) => b[1] - a[1])[0] || ['Dogs', 0];
    const popularPet = totalPets ? `${popularPetLabel} (${Math.round((popularPetCount / totalPets) * 100)}%)` : 'N/A';

    const currentReviews = (reviews || []).filter((review) => inRange(parseDate(review.created_at), start, end));
    const avgRating = currentReviews.length
      ? currentReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / currentReviews.length
      : 0;

    const insights = {
      newCustomers,
      repeatRate: `${Math.round(currentRetention)}%`,
      avgVisits: decimal.format(avgVisits),
      activeDay,
      popularPet,
      satisfaction: currentReviews.length ? `${decimal.format(avgRating)}/5` : '0.0/5',
    };

    let revenueTrend;
    if (period === 'week') {
      const labels = Array.from({ length: 7 }, (_, index) => toShortWeekday(subDays(end, 6 - index)));
      const current = labels.map((_, index) => {
        const day = startOfDay(subDays(end, 6 - index));
        const nextDay = endOfDay(day);
        return [...currentBookings, ...currentOrders]
          .filter((row) => inRange(row.eventDate, day, nextDay))
          .reduce((sum, row) => sum + row.amount, 0);
      });
      const previous = labels.map((_, index) => {
        const day = startOfDay(subDays(previousEnd, 6 - index));
        const nextDay = endOfDay(day);
        return [...previousBookings, ...previousOrders]
          .filter((row) => inRange(row.eventDate, day, nextDay))
          .reduce((sum, row) => sum + row.amount, 0);
      });
      revenueTrend = { labels, current, previous };
    } else if (period === 'month') {
      const labels = ['W1', 'W2', 'W3', 'W4'];
      const buildWeekBuckets = (rangeStart, bookingSet, orderSet) =>
        labels.map((_, index) => {
          const bucketStart = startOfDay(subDays(rangeStart, -index * 7));
          const bucketEnd = endOfDay(subDays(bucketStart, -6));
          return [...bookingSet, ...orderSet]
            .filter((row) => inRange(row.eventDate, bucketStart, bucketEnd))
            .reduce((sum, row) => sum + row.amount, 0);
        });
      revenueTrend = {
        labels,
        current: buildWeekBuckets(start, currentBookings, currentOrders),
        previous: buildWeekBuckets(previousStart, previousBookings, previousOrders),
      };
    } else {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const bucketByMonth = (rows) =>
        labels.map((label, index) =>
          rows
            .filter((row) => row.eventDate && row.eventDate.getMonth() === index)
            .reduce((sum, row) => sum + row.amount, 0)
        );
      revenueTrend = {
        labels,
        current: bucketByMonth([...currentBookings, ...currentOrders]),
        previous: bucketByMonth([...previousBookings, ...previousOrders]),
      };
    }

    res.json({
      metrics,
      popularServices,
      peakHours,
      insights,
      revenueTrend,
      orderDistribution,
      popularOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load analytics.' });
  }
});

export default router;
