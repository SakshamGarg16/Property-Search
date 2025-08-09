import axios from 'axios';

const ORS_KEY = process.env.OPENROUTESERVICE_API_KEY || '';

export async function calculateRoutes(origin: { lat: number; lon: number }, destinations: { lat: number; lon: number }[]) {
  if (!ORS_KEY) {
    return destinations.map(dest => {
      const R = 6371; // km
      const dLat = (dest.lat - origin.lat) * Math.PI / 180;
      const dLon = (dest.lon - origin.lon) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(origin.lat*Math.PI/180) * Math.cos(dest.lat*Math.PI/180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distKm = R * c;
      return { distance_m: Math.round(distKm*1000), duration_s: Math.round(distKm/50*3600) }; // assume avg 50 km/h
    });
  }

  // ORS matrix API (fast): returns durations/distance matrix
  const url = 'https://api.openrouteservice.org/v2/matrix/driving-car';
  const locations = [ [origin.lon, origin.lat], ...destinations.map(d => [d.lon, d.lat]) ];
  try {
    const resp = await axios.post(url, {
      locations,
      metrics: ['distance','duration'],
      sources: [0],
      destinations: destinations.map((_, idx) => idx+1)
    }, {
      headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' }
    });

    // resp.data contains distances[0][i] and durations[0][i]
    const distances = resp.data.distances[0]; // meters
    const durations = resp.data.durations[0]; // seconds
    return destinations.map((_, i) => ({ distance_m: Math.round(distances[i]), duration_s: Math.round(durations[i]) }));
  } catch (err) {
    console.warn('ORS failed, falling back to estimate', err);
    // fallback to estimate
    return destinations.map(dest => ({ distance_m: 0, duration_s: 0 }));
  }
}
