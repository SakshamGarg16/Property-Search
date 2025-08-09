import axios from 'axios';

const API_KEY = process.env.OPENTRIPMAP_API_KEY || '';
const BASE_URL = 'https://dev.opentripmap.org/0.1/en/places';

export async function fetchNearbyPlaces(lat: number, lon: number, kinds = 'education', radius = 5000, limit = 50) {
  const res = await axios.get(`${BASE_URL}/radius`, {
    params: {
      radius,
      lon,
      lat,
      kinds,
      format: 'json',
      limit,
      apikey: API_KEY
    },
    timeout: 10000
  });
  // each place: { xid, name, dist, kinds, point: { lat, lon } }
  return res.data.map((p: any) => ({
    xid: p.xid,
    name: p.name,
    kinds: p.kinds,
    dist_m: Math.round(p.dist || 0),
    lat: p.point?.lat,
    lon: p.point?.lon
  }));
}

export async function fetchPlaceDetails(xid: string) {
  const res = await axios.get(`${BASE_URL}/xid/${xid}`, {
    params: { apikey: API_KEY },
    timeout: 10000
  });
  return res.data;
}
