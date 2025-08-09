import React, { useCallback, useRef, useState } from "react";
import MapView, { type Amenity, type Property } from "../components/MapView";
import SearchFiltersComponent from "../components/SearchFiltersComponent";
import { fetchProperties } from "../api/propertyAPI";
import type { SearchFilters } from "../api/propertyAPI";
import "./home.css";

const Home: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fallbackCenter, setFallbackCenter] = useState<[number, number]>([
    28.6139, 77.2090,
  ]);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // --- Manual search only when user clicks Search or presses Enter ---
  const doSearch = useCallback(
    async (useFilters: SearchFilters = filters) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchProperties(useFilters);
        setProperties(results.results ?? []);

        if ((!results.results || results.results.length === 0) && useFilters.city) {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              useFilters.city
            )}`
          );
          const d = await r.json();
          if (d && d.length) {
            setFallbackCenter([parseFloat(d[0].lat), parseFloat(d[0].lon)]);
          }
        }
      } catch (err) {
        console.error("Search failed", err);
        setError("Failed to fetch properties");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const onManualSearch = useCallback(async () => {
    await doSearch();
  }, [doSearch]);

  // --- Fetch amenities for a property + center map ---
  const fetchAmenitiesForProperty = useCallback(
    async (
      propertyId: string,
      radius = 2500,
      types = ["restaurant", "school", "hospital"]
    ) => {
      const prop = properties.find((p) => p._id === propertyId);
      if (prop?.coordinates) {
        setFocusCoords([prop.coordinates.lat, prop.coordinates.lng]); // trigger flyTo
      }

      setAmenities([]);
      try {
        const url = `/api/properties/${propertyId}/nearby-amenities?radius=${radius}&types=${types.join(
          ","
        )}`;
        const res = await fetch(url);
        if (!res.ok) {
          console.warn("amenities api not ok", res.status);
          return;
        }
        const data = await res.json();
        const list: Amenity[] = (data.amenities || [])
          .map((a: any) => ({
            id: a.id ?? a.osm_id ?? `${a.lat}-${a.lng}`,
            name: a.name ?? "Unnamed",
            type: a.type ?? a.amenity ?? "unknown",
            lat: a.lat ?? a.coordinates?.lat ?? null,
            lng: a.lng ?? a.coordinates?.lng ?? null,
            distance_m: a.distance_m,
            duration_s: a.duration_s,
          }))
          .filter(
            (x: Amenity) =>
              typeof x.lat === "number" && typeof x.lng === "number"
          );
        setAmenities(list);
      } catch (err) {
        console.error("Failed to fetch amenities", err);
      }
    },
    [properties]
  );

  // --- Marker click: select + scroll to card ---
  const onPropertySelect = useCallback((prop: Property) => {
    setSelectedId(prop._id);
    if (prop.coordinates) {
      setFocusCoords([prop.coordinates.lat, prop.coordinates.lng]); // fly to marker
    }
    const el = resultRefs.current[prop._id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // --- Render property card ---
  const renderCard = (p: Property) => {
    return (
      <div
        id={`property-${p._id}`}
        key={p._id}
        className={`property-card ${selectedId === p._id ? "selected" : ""}`}
        onClick={() => {
          setSelectedId(p._id);
          if (p.coordinates) {
            setFocusCoords([p.coordinates.lat, p.coordinates.lng]);
          }
        }}
      >
        <div className="card-top">
          <strong className="card-title">{p.title}</strong>
          <div className="card-price">₹{p.price?.toLocaleString?.()}</div>
        </div>
        <div className="card-body">
          {p.location?.city && (
            <div className="card-location">
              {p.location.city}, {p.location.state}
            </div>
          )}
          <div className="card-actions">
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(p._id);
                fetchAmenitiesForProperty(p._id);
              }}
            >
              Show nearby amenities
            </button>
            <button
              className="btn btn-ghost"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(p._id);
                if (p.coordinates) {
                  setFocusCoords([p.coordinates.lat, p.coordinates.lng]);
                }
              }}
            >
              Focus
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <div className="top-grid">
        <div className="search-container">
          <div className="search-card">
            <h2>Search</h2>
            <SearchFiltersComponent
              filters={filters}
              setFilters={setFilters}
              onSearch={onManualSearch}
            />
            <div style={{ marginTop: 8 }}>
              {/* <button
                className="btn btn-wide"
                onClick={onManualSearch}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button> */}
            </div>
            {error && <div className="error">{error}</div>}
          </div>
        </div>

        <div className="map-container">
          <MapView
            properties={properties}
            selectedId={selectedId}
            focusCoords={focusCoords}
            onPropertySelect={onPropertySelect}
            onRequestAmenities={(id, radius, types) =>
              fetchAmenitiesForProperty(id, radius, types)
            }
            amenities={amenities}
            fallbackCenter={fallbackCenter}
          />
        </div>
      </div>

            {/* Search Results */}
      <div className="results-section">
        <h2 className="results-title">Search Results</h2>
        {properties.length === 0 ? (
          <div className="no-results">
            No properties found. Try different filters.
          </div>
        ) : (
          <div className="results-grid">
            {properties.map((p) => renderCard(p))}
          </div>
        )}
      </div>

      {/* Nearby Amenities */}
      {amenities.length > 0 && (
        <div className="results-section">
          <h2 className="results-title">Nearby Amenities</h2>
          <div className="results-grid">
            {amenities.map((a) => (
              <div key={a.id} className="property-card">
                <strong>{a.name}</strong>
                <div>{a.type}</div>
                {a.distance_m && (
                  <div>{(a.distance_m / 1000).toFixed(2)} km away</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
