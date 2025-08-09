import mongoose, { Schema, Document } from 'mongoose';

interface Location {
  city: string;
  state: string;
  pincode: string;
}

export interface PropertyDocument extends Document {
  title: string;
  description: string;
  price: number;
  location: Location;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: string[];
  listedDate: Date;
  status: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const PropertySchema: Schema = new Schema({
  title: String,
  description: String,
  price: Number,
  location: {
    city: String,
    state: String,
    pincode: String,
  },
  propertyType: String,
  bedrooms: Number,
  bathrooms: Number,
  area: Number,
  amenities: [String],
  images: [String],
  listedDate: Date,
  status: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
});

export default mongoose.model<PropertyDocument>('PropertyQuery', PropertySchema);

// === File: /backend/src/utils/buildQuery.ts ===

interface QueryParams {
  city?: any;
  minPrice?: any;
  maxPrice?: any;
  propertyType?: any;
  minBedrooms?: any;
}

export const buildQuery = (params: QueryParams) => {
  const query: any = {};

  if (params.city) {
    query['location.city'] = params.city;
  }
  if (params.propertyType) {
    query.propertyType = params.propertyType;
  }
  if (params.minPrice || params.maxPrice) {
    query.price = {};
    if (params.minPrice) query.price.$gte = Number(params.minPrice);
    if (params.maxPrice) query.price.$lte = Number(params.maxPrice);
  }
  if (params.minBedrooms) {
    query.bedrooms = { $gte: Number(params.minBedrooms) };
  }

  return query;
};
