const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const mapRider = (rider) => ({
  id: rider.riderId || rider.rider_id || String(rider.id),
  name: rider.name || '',
  contact: rider.contact || '',
  vehicle: rider.vehicle || '',
  plateNumber: rider.plateNumber || rider.plate_number || ''
});

export async function getRiders() {
  const response = await fetch(`${API_BASE_URL}/riders`);
  if (!response.ok) {
    throw new Error(`Failed to fetch riders (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload.riders) ? payload.riders.map(mapRider) : [];
}
