import React from 'react';
import type { Property } from '../api/propertyAPI';

interface PropertyGridProps {
  properties: Property[];
  loading: boolean;
  error: string | null;
}

const PropertyGrid: React.FC<PropertyGridProps> = ({ properties, loading, error }) => {
  if (loading) return <p>Loading properties...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (properties.length === 0) return <p>No properties found.</p>;

  return (
    <div className="property-grid">
      {properties.map((prop) => (
        <div key={prop._id} className="property-card">
          <h3>{prop.title}</h3>
          <p>{prop.description}</p>
          <p>Price: ₹{prop.price}</p>
          <p>{prop.bedrooms} Bed / {prop.bathrooms} Bath</p>
          <p>Type: {prop.propertyType}</p>
          <p>City: {prop.location.city}</p>
        </div>
      ))}
    </div>
  );
};

export default PropertyGrid;

