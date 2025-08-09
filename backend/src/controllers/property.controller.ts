// src/controllers/property.controller.ts
import { Request, Response } from 'express';
import Property, { PropertyDocument } from '../models/property.model';
import mongoose from 'mongoose';
import axios from 'axios';

type SearchQuery = {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  minBedrooms?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
};

export const searchProperties = async (req: Request, res: Response) => {
  try {
    // parse & validate query params
    const city = (req.query.city as string) || undefined;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const propertyType = (req.query.propertyType as string) || undefined;
    const minBedrooms = req.query.minBedrooms ? Number(req.query.minBedrooms) : undefined;
    const sortBy = (req.query.sortBy as string) || 'listedDate';
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const limit = req.query.limit ? Math.max(1, Math.min(100, Number(req.query.limit))) : 10;

    // Build dynamic mongoose filter
    const filter: any = {};
    if (city) filter['location.city'] = new RegExp(`^${city}$`, 'i');
    if (propertyType) filter.propertyType = propertyType;
    if (minBedrooms !== undefined) filter.bedrooms = { ...(filter.bedrooms || {}), $gte: minBedrooms };
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // count + pagination
    const totalResults = await Property.countDocuments(filter);
    const totalPages = Math.ceil(totalResults / limit);
    const skip = (page - 1) * limit;

    // sorting map (extendable)
    const sortMap: Record<string, any> = {
      price: { price: 1 },
      price_desc: { price: -1 },
      listedDate: { listedDate: -1 },
      listedDate_asc: { listedDate: 1 },
    };
    const sortOption = sortMap[sortBy] || { listedDate: -1 };

    const docs = await Property.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean<PropertyDocument[]>(); // lean returns plain objects

    // Ensure every doc has coordinates (could be undefined) — we won't mutate DB here
    // but send coords as-is; frontend geocoding fallback will handle empty coordinates.
    const results = docs.map(d => ({
      ...d,
      _id: d._id,
    }));

    return res.json({
      results,
      page,
      limit,
      totalPages,
      totalResults,
    });
  } catch (err: any) {
    console.error('searchProperties error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getNearbyAmenities = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { radius = 1000, types = '' } = req.query;

    const property = await Property.findById(id);
    if (!property || !property.coordinates?.lat || !property.coordinates?.lng) {
      return res.status(404).json({ message: 'Property not found or missing coordinates' });
    }

    const amenitiesArray = (types as string)
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (!amenitiesArray.length) {
      return res.status(400).json({ message: 'No amenity types provided' });
    }

    // Overpass QL query
    const query = `
      [out:json];
      (
        ${amenitiesArray.map(
          type => `node["amenity"="${type}"](around:${radius},${property.coordinates?.lat},${property.coordinates?.lng});`
        ).join('\n')}
      );
      out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await axios.get(url);

    const amenities = response.data.elements.map((el: any) => ({
      id: el.id,
      name: el.tags?.name || 'Unnamed',
      type: el.tags?.amenity || 'unknown',
      lat: el.lat,
      lng: el.lon
    }));

    res.json({ amenities });
  } catch (err) {
    console.error('Error fetching amenities:', err);
    res.status(500).json({ message: 'Failed to fetch nearby amenities' });
  }
};


const geocodeLocation = async (city: string, state: string, pincode: string) => {
  const query = `${city}, ${state}, ${pincode}, India`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

  const res = await axios.get(url, { headers: { "User-Agent": "BhuExpert-App" } });
  if (res.data.length > 0) {
    return {
      lat: parseFloat(res.data[0].lat),
      lng: parseFloat(res.data[0].lon),
    };
  }
  return null;
};

export const addProperty = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      price,
      location,
      propertyType,
      bedrooms,
      bathrooms,
      area,
      amenities,
      images,
      listedDate,
      status
    } = req.body;

    if (!location || !location.city || !location.state || !location.pincode) {
      return res.status(400).json({ message: "City, state, and pincode are required" });
    }

    // Geocode the location
    const coordinates = await geocodeLocation(location.city, location.state, location.pincode);
    if (!coordinates) {
      return res.status(400).json({ message: "Could not find coordinates for given location" });
    }

    const newProperty = new Property({
      title,
      description,
      price,
      location,
      propertyType,
      bedrooms,
      bathrooms,
      area,
      amenities,
      images,
      listedDate: listedDate || new Date(),
      status: status || "available",
      coordinates
    });

    await newProperty.save();
    res.status(201).json(newProperty);
  } catch (error) {
    console.error("Error adding property:", error);
    res.status(500).json({ message: "Server error" });
  }
};

