import React from 'react';
import type { SearchFilters } from '../api/propertyAPI';

interface Props {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  onSearch: () => void;
}

const SearchFiltersComponent: React.FC<Props> = ({ filters, setFilters, onSearch }) => {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Convert number strings to actual numbers if present
  const parsedFilters: SearchFilters = {
    ...filters,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    minBedrooms: filters.minBedrooms ? Number(filters.minBedrooms) : undefined,
  };

  onSearch();
};


  return (
    <form onSubmit={handleSubmit} className="search-filters">
      <input type="text" name="city" placeholder="City" value={filters.city || ''} onChange={handleChange} />
      <input type="number" name="minPrice" placeholder="Min Price" value={filters.minPrice || ''} onChange={handleChange} />
      <input type="number" name="maxPrice" placeholder="Max Price" value={filters.maxPrice || ''} onChange={handleChange} />
      <select name="propertyType" value={filters.propertyType || ''} onChange={handleChange}>
        <option value="">All Types</option>
        <option value="apartment">Apartment</option>
        <option value="house">House</option>
        <option value="villa">Villa</option>
      </select>
      <input type="number" name="minBedrooms" placeholder="Min Bedrooms" value={filters.minBedrooms || ''} onChange={handleChange} />
      {/* <button type="submit">Search</button> */}
    </form>
  );
};

export default SearchFiltersComponent;