// src/models/property.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

interface Location {
  city: string;
  state?: string;
  pincode?: string;
}

export interface PropertyDocument extends Document {
  title: string;
  description?: string;
  price: number;
  location: Location;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  amenities?: string[];
  images?: string[];
  listedDate?: Date;
  status?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const PropertySchema = new Schema<PropertyDocument>({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  location: {
    city: { type: String, index: true },
    state: String,
    pincode: String,
  },
  propertyType: { type: String, index: true },
  bedrooms: { type: Number, index: true },
  bathrooms: Number,
  area: Number,
  amenities: [String],
  images: [String],
  listedDate: { type: Date, default: Date.now, index: true },
  status: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
});

// Prevent OverwriteModelError in dev/hot reload
const Property: Model<PropertyDocument> =
  (mongoose.models.Property as Model<PropertyDocument>) ||
  mongoose.model<PropertyDocument>('Property', PropertySchema);

export default Property;
