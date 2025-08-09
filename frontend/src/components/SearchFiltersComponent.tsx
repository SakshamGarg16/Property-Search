import React from "react";
import type { SearchFilters } from "../api/propertyAPI";

interface Props {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  onSearch: () => void;
}

const SearchFiltersComponent: React.FC<Props> = ({ filters, setFilters, onSearch }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="search-filters-compact">
      <input name="city" placeholder="City" value={filters.city ?? ""} onChange={handleChange} />
      <input name="minPrice" type="number" placeholder="Min Price" value={String(filters.minPrice ?? "")} onChange={handleChange} />
      <input name="maxPrice" type="number" placeholder="Max Price" value={String(filters.maxPrice ?? "")} onChange={handleChange} />
      <select name="propertyType" value={filters.propertyType ?? ""} onChange={handleChange}>
        <option value="">All Types</option>
        <option value="apartment">Apartment</option>
        <option value="house">House</option>
        <option value="villa">Villa</option>
      </select>
      <input name="minBedrooms" type="number" placeholder="Min Bedrooms" value={String(filters.minBedrooms ?? "")} onChange={handleChange} />
      <button type="submit" className="btn btn-primary small">Search</button>
    </form>
  );
};

export default SearchFiltersComponent;
