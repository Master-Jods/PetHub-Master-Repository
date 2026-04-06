# Shared Schema Mapping

This project now targets one shared database for customer and admin flows.

## Table Mapping

| Old source | New shared table | Notes |
| --- | --- | --- |
| `public.user_pets` | `public.pets` | Customer pet records |
| `public.profile_bookings` | `public.bookings` | Customer bookings now land in the same table admin reads |
| `public.profile_orders` | `public.orders` | Customer orders now land in the same table admin reads |
| `public.profile_reviews` | `public.reviews` | Shared review records |
| `public.profile_notifications` | `public.notifications` | Shared notification feed |
| `public.booking_notifications` | `public.notifications` | Admin booking alerts are now notifications with `type='booking'` |
| `public.order_notifications` | `public.notifications` | Admin order alerts are now notifications with `type='order'` |
| `public.customers` | derived from `public.profiles`, `public.pets`, `public.orders`, `public.bookings` | Admin customer list is now assembled from shared data |
| customer `public.profiles` | `public.profiles` | Shared profile row keyed by `user_id` |
| admin `public.profiles` | `public.profiles` | Shared profile row keyed by `user_id`, RBAC stays in `role` |

## Column Mapping

### Profiles

| Old column | New column |
| --- | --- |
| customer `profiles.id` | `profiles.user_id` |
| admin `profiles.user_id` | `profiles.user_id` |
| admin `profiles.name` | `profiles.display_name` and/or `profiles.first_name` + `profiles.last_name` |
| admin/customer `profiles.role` | `profiles.role` |

### Bookings

| Old column | New column |
| --- | --- |
| `profile_bookings.id` | `bookings.id` |
| `bookings.booking_id` | `bookings.booking_code` |
| `profile_bookings.user_id` | `bookings.user_id` |
| `profile_bookings.service` | `bookings.service` |
| `profile_bookings.service_type` | `bookings.service_type` |
| `profile_bookings.scheduled_at` | `bookings.scheduled_at` |
| admin `bookings.appointment_date` | generated/read from `bookings.appointment_date` |
| admin `bookings.appointment_time` | generated/read from `bookings.appointment_time` |
| `profile_bookings.status` | `bookings.booking_status` |
| `profile_bookings.price_label` | `bookings.price_label` |
| admin `bookings.service_total` | `bookings.service_total` |

### Orders

| Old column | New column |
| --- | --- |
| `profile_orders.id` | `orders.id` |
| `profile_orders.order_number` | `orders.order_code` |
| admin `orders.order_id` | `orders.order_code` |
| `profile_orders.user_id` | `orders.user_id` |
| `profile_orders.ordered_at` | `orders.order_date` |
| `profile_orders.total_amount` | `orders.total` |
| `profile_orders.fulfillment_method` | `orders.fulfillment_method` |
| `profile_orders.delivery_status` | `orders.delivery_status` |
| admin `orders.delivery_method` | `orders.delivery_method` |
| admin `orders.delivery_zone` | `orders.delivery_zone` |
| admin `orders.delivery_fee` | `orders.delivery_fee` |

### Reviews

| Old column | New column |
| --- | --- |
| `profile_reviews.id` | `reviews.id` |
| admin `reviews.review_id` | `reviews.review_code` |
| `profile_reviews.user_id` | `reviews.user_id` |
| `profile_reviews.booking_id` | `reviews.booking_id` |
| `profile_reviews.comment` | `reviews.comment` |
| admin `reviews.review_text` | `reviews.comment` |
| admin `reviews.admin_response` | `reviews.admin_response` |

### Notifications

| Old column | New column |
| --- | --- |
| `profile_notifications.user_id` | `notifications.user_id` |
| `profile_notifications.kind` | `notifications.type` |
| `booking_notifications.booking_id` | `notifications.metadata.bookingCode` and `notifications.entity_id` |
| `order_notifications.order_id` | `notifications.metadata.orderCode` and `notifications.entity_id` |

## Code Targets

- `Frontend-Customer` now reads/writes shared `profiles`, `pets`, `bookings`, `orders`, `reviews`, and `notifications`.
- `Backend-Admin` now reads/writes shared `profiles`, `bookings`, `orders`, `reviews`, `notifications`, `inventory_items`, and `riders`.
- `Frontend-Admin` keeps its existing UI shape and receives compatibility-mapped payloads from `Backend-Admin`.
