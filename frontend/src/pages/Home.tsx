import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapView, { type Amenity, type Property } from "../components/MapView";
import SearchFiltersComponent from "../components/SearchFiltersComponent";
import { fetchProperties } from "../api/propertyAPI";
import type { SearchFilters } from "../api/propertyAPI";
import "./home.css";

// (kept everything else the same)

const Home: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fallbackCenter, setFallbackCenter] = useState<[number, number]>([
    28.6139, 77.2090,
  ]);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);

  // new states
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const [highlightAmenityId, setHighlightAmenityId] = useState<string | number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // -------------------------
  // Initial load: fetch ALL properties on mount
  // -------------------------
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        // call your existing API to get all properties (empty filters)
        const results = await fetchProperties({});
        if (!cancelled) {
          setProperties(results.results ?? []);
        }
      } catch (err) {
        console.error("Initial properties fetch failed", err);
        if (!cancelled) setError("Failed to load properties");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Manual search only when user clicks Search or presses Enter ---
  const doSearch = useCallback(
    async (useFilters: SearchFilters = filters) => {
      setLoading(true);
      setError(null);

      try {
        const results = await fetchProperties(useFilters);
        const found = results.results ?? [];
        setProperties(found);

        // NEW: If user provided city, prefer centering on a property in that city.
        if (useFilters.city) {
          // 1) If we have at least one property with coordinates, center on its coords
          const firstWithCoords = found.find(
            (p) =>
              p?.coordinates &&
              typeof p.coordinates.lat === "number" &&
              typeof p.coordinates.lng === "number"
          );

          if (firstWithCoords) {
            setFocusCoords([firstWithCoords.coordinates!.lat, firstWithCoords.coordinates!.lng]);
            // also update fallbackCenter for consistency
            setFallbackCenter([firstWithCoords.coordinates!.lat, firstWithCoords.coordinates!.lng]);
          } else {
            // 2) No property coords found — geocode the city and center the map there
            try {
              const r = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                  useFilters.city
                )}`
              );
              const d = await r.json();
              if (d && d.length) {
                const lat = parseFloat(d[0].lat);
                const lon = parseFloat(d[0].lon);
                setFallbackCenter([lat, lon]);
                setFocusCoords([lat, lon]);
              }
            } catch (geoErr) {
              console.warn("City geocode failed", geoErr);
              // keep previous fallback/focus if geocode fails
            }
          }
        } else {
          // If no city provided in filters: optional behavior left unchanged.
          // (You can choose to center on first property on empty search if desired.)
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
      setIsAmenitiesOpen(true); // open panel right away (loading state)
      try {
        const url = `/api/properties/${propertyId}/nearby-amenities?radius=${radius}&types=${types.join(
          ","
        )}`;
        const res = await fetch(url);
        if (!res.ok) {
          console.warn("amenities api not ok", res.status);
          setIsAmenitiesOpen(true); // keep open but empty
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
            distance_m: a.distance_m, // might be undefined
            duration_s: a.duration_s, // might be undefined
            rating: a.rating ?? a.tags?.rating ?? undefined, // optional
          }))
          .filter((x: Amenity) => typeof x.lat === "number" && typeof x.lng === "number");

        // sort by distance if distance present; otherwise keep order
        list.sort((a: Amenity, b: Amenity) => {
          const da = typeof a.distance_m === "number" ? a.distance_m : Infinity;
          const db = typeof b.distance_m === "number" ? b.distance_m : Infinity;
          return da - db;
        });

        setAmenities(list);
        setIsAmenitiesOpen(true);
      } catch (err) {
        console.error("Failed to fetch amenities", err);
        setIsAmenitiesOpen(true);
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

  // --- Amenity actions ---
  const onViewAmenityOnMap = useCallback((a: Amenity) => {
    setHighlightAmenityId(a.id);
    setFocusCoords([a.lat, a.lng]);
  }, []);

  const onCloseAmenities = useCallback(() => {
    setIsAmenitiesOpen(false);
    setAmenities([]);
    setHighlightAmenityId(null);
  }, []);

  // grouping for UI (memoized)
  const groupedAmenities = useMemo(() => {
    const groups = new Map<string, Amenity[]>();
    for (const a of amenities) {
      const key = (a.type || "other").toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    }
    // sort inside each group by distance (if available)
    for (const [k, arr] of groups) {
      arr.sort((x, y) => {
        const dx = typeof x.distance_m === "number" ? x.distance_m : Infinity;
        const dy = typeof y.distance_m === "number" ? y.distance_m : Infinity;
        return dx - dy;
      });
    }
    return groups;
  }, [amenities]);

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
            amenitiesPanelOpen={isAmenitiesOpen}
            highlightAmenityId={highlightAmenityId}
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="results-section">
        <h2 className="results-title">Search Results</h2>
        {loading ? (
          <div className="no-results">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="no-results">No properties found. Try different filters.</div>
        ) : (
          <div className="results-grid">{properties.map((p) => renderCard(p))}</div>
        )}
      </div>

      {/* Floating Amenities Panel (overlay) */}
      <div
        className={`amenities-panel ${isAmenitiesOpen ? "open" : ""}`}
        aria-hidden={!isAmenitiesOpen}
      >
        <div className="amenities-header">
          <h3>Nearby Amenities</h3>
          <div className="amenities-actions">
            <button className="btn btn-ghost" onClick={onCloseAmenities}>
              ✖
            </button>
          </div>
        </div>

        <div className="amenities-content">
          {amenities.length === 0 ? (
            <div className="amenities-empty">No amenities found.</div>
          ) : (
            Array.from(groupedAmenities.entries()).map(([type, list]) => (
              <div className="amenity-group" key={type}>
                <div className="amenity-group-title">
                  {type[0].toUpperCase() + type.slice(1)} ({list.length})
                </div>
                <div className="amenity-group-list">
                  {list.map((a) => {
                    // compute fallback distance/duration if missing
                    const distanceKm =
                      typeof a.distance_m === "number"
                        ? a.distance_m / 1000
                        : undefined;
                    const durationS =
                      typeof a.duration_s === "number"
                        ? a.duration_s
                        : typeof a.distance_m === "number"
                        ? Math.round(a.distance_m / 11.111) // approx driving at 40km/h: m / 11.111 = seconds
                        : undefined;
                    return (
                      <div className="amenity-row" key={String(a.id)}>
                        <div className="amenity-left">
                          <strong className="amenity-name">{a.name}</strong>
                          <div className="amenity-meta">
                            <span className="amenity-type">{a.type}</span>
                            {distanceKm !== undefined && (
                              <span className="amenity-distance">
                                • {distanceKm.toFixed(2)} km
                              </span>
                            )}
                            {durationS !== undefined && (
                              <span className="amenity-duration">
                                • {Math.round(durationS / 60)} min
                              </span>
                            )}
                            { (a as any).rating && (
                              <span className="amenity-rating">• ⭐ {(a as any).rating}</span>
                            )}
                          </div>
                        </div>

                        <div className="amenity-actions">
                          <button
                            className="btn btn-small"
                            onClick={() => onViewAmenityOnMap(a)}
                          >
                            View on map
                          </button>

                          <a
                            className="btn btn-ghost btn-small"
                            target="_blank"
                            rel="noreferrer"
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                              `${a.lat},${a.lng}`
                            )}&travelmode=driving`}
                          >
                            Directions
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
