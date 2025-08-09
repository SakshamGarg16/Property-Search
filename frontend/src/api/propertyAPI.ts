import axios from 'axios';

// src/api/propertyAPI.ts

export interface Property {
  _id: string;
  title: string;
  price: number;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  [key: string]: any; // other optional fields
}

// For convenience, create a mapped frontend-friendly type
export const mapProperty = (raw: Property) => ({
  id: raw._id,
  title: raw.title,
  price: raw.price,
  latitude: raw.location.coordinates[1],
  longitude: raw.location.coordinates[0],
});



export interface SearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  minBedrooms?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  results: Property[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export const fetchProperties = async (filters: SearchFilters): Promise<SearchResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });

  const res = await axios.get(`/api/properties/search?${params.toString()}`);
  return res.data;
};
