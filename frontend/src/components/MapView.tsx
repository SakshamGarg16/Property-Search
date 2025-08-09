import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  Tooltip,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import "@changey/react-leaflet-markercluster/dist/styles.min.css";

/* ---------- Fix default icon paths for Leaflet ---------- */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

/* ---------- Types ---------- */
export type Property = {
  _id: string;
  title: string;
  price?: number;
  coordinates?: { lat: number; lng: number };
  location?: { city?: string; state?: string; pincode?: string };
};

export type Amenity = {
  id: string | number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  distance_m?: number;
  duration_s?: number;
  rating?: number | string;
};

interface MapViewProps {
  properties?: Property[];
  selectedId?: string | null;
  onPropertySelect?: (p: Property) => void;
  onRequestAmenities?: (
    propertyId: string,
    radius?: number,
    types?: string[]
  ) => void;
  amenities?: Amenity[];
  fallbackCenter?: LatLngExpression;
  radius?: number;
  focusCoords?: [number, number] | null;
  amenitiesPanelOpen?: boolean;
  highlightAmenityId?: string | number | null;
}

/* ---------- Auto fly helper ---------- */
const MapAutoFly: React.FC<{ center: LatLngExpression | null }> = ({
  center,
}) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      try {
        map.flyTo(center, 14, { duration: 0.7 });
      } catch {}
    }
  }, [center, map]);
  return null;
};

/* ---------- Map resize handling ---------- */
const ResizeHandler: React.FC<{ deps?: any[] }> = ({ deps = [] }) => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ...deps]);
  return null;
};

/* ---------- Amenity marker helpers ---------- */
const amenityColor = (type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("restaurant") || t.includes("food")) return "#e74c3c";
  if (t.includes("cafe")) return "#e67e22";
  if (t.includes("school")) return "#3498db";
  if (t.includes("hospital") || t.includes("clinic")) return "#8e44ad";
  if (t.includes("park")) return "#2ecc71";
  return "#7f8c8d";
};

const createAmenityIcon = (color: string) =>
  new L.DivIcon({
    className: "amenity-icon",
    html: `<svg width="18" height="26" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" d="M12 0C7.03 0 3 4.03 3 9c0 7 9 20 9 20s9-13 9-20c0-4.97-4.03-9-9-9z"/>
      <circle cx="12" cy="10" r="3" fill="#fff"/>
    </svg>`,
    iconSize: [18, 26],
    iconAnchor: [9, 26],
    popupAnchor: [0, -22],
  });

/* ---------- Main MapView ---------- */
const MapView: React.FC<MapViewProps> = ({
  properties = [],
  selectedId,
  onPropertySelect,
  onRequestAmenities,
  amenities = [],
  fallbackCenter = [28.6139, 77.209],
  radius = 2500,
  focusCoords = null,
  amenitiesPanelOpen = false,
  highlightAmenityId = null,
}) => {
  const firstValidProperty = properties.find(
    (p) =>
      p.coordinates &&
      typeof p.coordinates.lat === "number" &&
      typeof p.coordinates.lng === "number"
  );

  const initialCenter: LatLngExpression =
    (focusCoords as any) ??
    (firstValidProperty
      ? [firstValidProperty.coordinates!.lat, firstValidProperty.coordinates!.lng]
      : (fallbackCenter as LatLngExpression));

  // Refs for markers (properties + amenities)
  const propertyMarkerRefs = useRef<Record<string, L.Marker | null>>({});
  const amenityMarkerRefs = useRef<Record<string | number, L.Marker | null>>({});

  // auto-open popup for selected property
  useEffect(() => {
    if (!selectedId) return;
    const m = propertyMarkerRefs.current[selectedId];
    if (m) {
      try {
        m.openPopup();
      } catch {}
    }
  }, [selectedId]);

  // auto-open popup for highlighted amenity
  useEffect(() => {
    if (!highlightAmenityId) return;
    const m = amenityMarkerRefs.current[highlightAmenityId];
    if (m) {
      try {
        m.openPopup();
      } catch {}
    }
  }, [highlightAmenityId]);

  // amenity icons map
  const amenityIconMap = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    amenities.forEach((a) => {
      const t = (a.type || "").toLowerCase();
      if (!map.has(t)) map.set(t, createAmenityIcon(amenityColor(t)));
    });
    return map;
  }, [amenities]);

  // base layer state: 'osm' or 'sat'
  const [baseLayer, setBaseLayer] = useState<"osm" | "sat">("osm");

  // map instance ref (via whenCreated)
  const mapRef = useRef<L.Map | null>(null);
  const handleMapCreated = (map: L.Map) => {
    mapRef.current = map;
  };

  // Fit map to all property markers on initial load or when properties change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const coords = properties
      .filter((p) => p.coordinates && typeof p.coordinates.lat === "number")
      .map((p) => [p.coordinates!.lat, p.coordinates!.lng] as [number, number]);

    if (coords.length === 0) {
      // fallback center
      map.setView(initialCenter as LatLngExpression, 12);
      return;
    }

    try {
      const bounds = L.latLngBounds(coords as any);
      map.fitBounds(bounds, { padding: [60, 60] });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.length]);

  // Toggle base layer
  const toggleBase = () => {
    setBaseLayer((prev) => (prev === "osm" ? "sat" : "osm"));
  };

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 460, position: "relative" }}>
      <MapContainer
        center={initialCenter as LatLngExpression}
        zoom={12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <ResizeHandler deps={[amenitiesPanelOpen, focusCoords, properties.length]} />

        {/* Base tile layer depends on state */}
        {baseLayer === "osm" ? (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        <MapAutoFly center={focusCoords ?? initialCenter} />

        {/* Property clustering */}
        <MarkerClusterGroup chunkedLoading>
          {properties
            .filter(
              (p) =>
                p.coordinates &&
                typeof p.coordinates.lat === "number" &&
                typeof p.coordinates.lng === "number"
            )
            .map((p) => {
            const pos: [number, number] = [
              p.coordinates!.lat,
              p.coordinates!.lng,
            ];
              return (
                <Marker
                  key={`prop-${p._id}`}
                  position={pos}
                  ref={(ref) => {
                    propertyMarkerRefs.current[p._id] = ref || null;
                  }}
                  eventHandlers={{
                    click: () => {
                      onPropertySelect?.(p);
                    },
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <strong>{p.title}</strong>
                    <div style={{ marginTop: 6 }}>
                      ₹{p.price?.toLocaleString?.()}
                    </div>
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="btn btn-small"
                          onClick={(e) => {
                            e.stopPropagation();
                          onRequestAmenities?.(
                            p._id,
                            radius,
                            ["restaurant", "school", "hospital"]
                          );
                            onPropertySelect?.(p);
                          }}
                        >
                          Show nearby amenities
                        </button>
                      </div>
                    </div>
                  </Popup>
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                    {p.title}
                  </Tooltip>
                </Marker>
              );
            })}
        </MarkerClusterGroup>

        {/* Amenity markers (not clustered) */}
        {amenities
          .filter((a) => typeof a.lat === "number" && typeof a.lng === "number")
          .map((a) => {
            const t = (a.type || "").toLowerCase();
            const icon = amenityIconMap.get(t) ?? createAmenityIcon(amenityColor(t));
            return (
              <Marker
                key={`amen-${a.id}`}
                position={[a.lat, a.lng]}
                icon={icon as any}
                ref={(ref) => {
                  amenityMarkerRefs.current[a.id] = ref || null;
                }}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>{a.name}</strong>
                    <div style={{ fontSize: 13, color: "#555" }}>{a.type}</div>
                    {typeof a.distance_m === "number" && (
                      <div style={{ marginTop: 6 }}>{(a.distance_m / 1000).toFixed(2)} km</div>
                    )}
                    {typeof a.duration_s === "number" && (
                      <div style={{ marginTop: 4 }}>{Math.round(a.duration_s / 60)} min</div>
                    )}
                    <div style={{ marginTop: 6 }}>
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
                </Popup>
              </Marker>
            );
          })}

        {/* Draw circle on selected property */}
        {selectedId &&
          (() => {
            const sp = properties.find((p) => p._id === selectedId);
            if (sp && sp.coordinates) {
              return (
                <Circle
                  center={[sp.coordinates.lat, sp.coordinates.lng]}
                  radius={radius}
                  pathOptions={{
                    color: "#1e90ff",
                    fillOpacity: 0.08,
                  }}
                />
              );
            }
            return null;
          })()}
      </MapContainer>

      {/* Layer toggle control (floating) */}
      <div className="map-controls">
        <button
          className="btn btn-ghost"
          onClick={toggleBase}
          title={baseLayer === "osm" ? "Switch to Satellite" : "Switch to Street"}
        >
          {baseLayer === "osm" ? "Satellite" : "Street"}
        </button>
      </div>
    </div>
  );
};

export default MapView;
