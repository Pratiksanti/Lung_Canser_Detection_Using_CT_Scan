// HospitalMap.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import "./HospitalMap.css";

import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── Icons ──────────────────────────────────────────────────────────── */
const makeIcon = (color, size = [25, 41], anchor = [12, 41]) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const USER_ICON = makeIcon("blue");
const HOSPITAL_ICON = makeIcon("red");
const ACTIVE_ICON = makeIcon("green", [30, 46], [15, 46]);
const SEARCH_ICON = makeIcon("orange");

/* ── Helpers ────────────────────────────────────────────────────────── */
function openExternalDirections(fromLat, fromLon, toLat, toLon, name) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    window.open(
      `maps://maps.apple.com/?saddr=${fromLat},${fromLon}&daddr=${toLat},${toLon}&q=${encodeURIComponent(name)}`,
      "_blank",
    );
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLon}&destination=${toLat},${toLon}&travelmode=driving`,
      "_blank",
    );
  }
}

async function fetchOSRMRoute(fromLat, fromLon, toLat, toLon) {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Route fetch failed");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length)
    throw new Error("No route found");
  const route = data.routes[0];
  return {
    coordinates: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceKm: (route.distance / 1000).toFixed(1),
    durationMin: Math.round(route.duration / 60),
  };
}

// Nominatim — search hospitals/clinics by name (free, no key)
async function searchHospitalByName(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=6&addressdetails=1&extratags=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data
    .filter((r) => {
      const t = (r.type || "").toLowerCase();
      const c = (r.class || "").toLowerCase();
      const n = (r.display_name || "").toLowerCase();
      // accept hospitals, clinics, doctors, health categories, or if query word appears in name
      return (
        c === "amenity" ||
        c === "healthcare" ||
        t === "hospital" ||
        t === "clinic" ||
        t === "doctors" ||
        t === "pharmacy" ||
        n.includes("hospital") ||
        n.includes("clinic") ||
        n.includes("medical") ||
        n.includes("cancer") ||
        n.includes("health")
      );
    })
    .map((r) => ({
      id: "search-" + r.place_id,
      name: r.display_name.split(",")[0],
      fullName: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      address: [
        r.address?.road,
        r.address?.city || r.address?.town,
        r.address?.state,
      ]
        .filter(Boolean)
        .join(", "),
      phone: r.extratags?.phone || null,
      website: r.extratags?.website || null,
      isSearchResult: true,
    }));
}

/* ── Component ──────────────────────────────────────────────────────── */
function HospitalMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef({});
  const searchMarkerRef = useRef(null);
  const debounceRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeLoadingId, setRouteLoadingId] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState(null); // pinned search result

  /* ── Init map ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (mapInstanceRef.current) return;
    mapInstanceRef.current = L.map(mapRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  /* ── Debounced live search ───────────────────────────────────────── */
  const runSearch = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    try {
      const results = await searchHospitalByName(q);
      setSearchResults(results);
      setShowDropdown(true);
      if (results.length === 0)
        setSearchError("No hospitals found. Try a different name or city.");
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setSelectedSearch(null);
    clearSearchMarker();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 400);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(searchQuery);
  };

  /* ── Place a searched hospital on map ───────────────────────────── */
  const clearSearchMarker = () => {
    if (searchMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }
    setSelectedSearch(null);
  };

  const pinSearchResult = (hospital) => {
    setShowDropdown(false);
    setSearchQuery(hospital.name);
    setSelectedSearch(hospital);
    clearSearchMarker();

    const map = mapInstanceRef.current;
    if (!map) return;

    const popupContent = buildPopupHTML(hospital);
    const marker = L.marker([hospital.lat, hospital.lon], { icon: SEARCH_ICON })
      .addTo(map)
      .bindPopup(popupContent)
      .openPopup();

    searchMarkerRef.current = marker;
    markersRef.current[hospital.id] = marker;
    map.setView([hospital.lat, hospital.lon], 15);
  };

  /* ── Popup HTML builder ─────────────────────────────────────────── */
  const buildPopupHTML = (hospital) => `
    <div class="hospital-popup">
      <h4>🏥 ${hospital.name}</h4>
      ${hospital.address ? `<p>📍 ${hospital.address}</p>` : ""}
      ${hospital.phone ? `<p>📞 <a href="tel:${hospital.phone}">${hospital.phone}</a></p>` : ""}
      ${hospital.website ? `<p>🌐 <a href="${hospital.website}" target="_blank" rel="noopener">Visit website</a></p>` : ""}
      <div class="popup-actions">
        <button class="popup-directions-btn" onclick="window.__getDirections('${hospital.id}')">
          🗺️ Get Directions
        </button>
        <button class="popup-external-btn" onclick="window.__openExternal('${hospital.id}')">
          ↗ Open in Maps
        </button>
      </div>
    </div>
  `;

  /* ── Nearby hospitals fetch ─────────────────────────────────────── */
  const OVERPASS_ENDPOINTS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
  ];

  const fetchNearbyHospitals = async (lat, lon, radiusKm = 25) => {
    setStatus("loading");

    const radiusMeters = radiusKm * 1000;

    const query = `
    [out:json][timeout:40];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
      node["healthcare"="hospital"](around:${radiusMeters},${lat},${lon});
      node["healthcare"="clinic"](around:${radiusMeters},${lat},${lon});
      node["healthcare"="cancer_centre"](around:${radiusMeters},${lat},${lon});

      way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      way["amenity"="clinic"](around:${radiusMeters},${lat},${lon});
      way["healthcare"="hospital"](around:${radiusMeters},${lat},${lon});
      way["healthcare"="clinic"](around:${radiusMeters},${lat},${lon});
      way["healthcare"="cancer_centre"](around:${radiusMeters},${lat},${lon});
    );
    out center tags;
  `;

    let lastError = null;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8",
          },
          body: query,
        });

        if (!response.ok) {
          throw new Error(`Overpass error: ${response.status}`);
        }

        const data = await response.json();

        const results = data.elements
          .map((el) => ({
            id: el.type + "-" + el.id,
            name:
              el.tags?.name ||
              el.tags?.["name:en"] ||
              "Unnamed Hospital / Clinic",
            lat: el.lat ?? el.center?.lat,
            lon: el.lon ?? el.center?.lon,
            phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
            website: el.tags?.website || el.tags?.["contact:website"] || null,
            address: [
              el.tags?.["addr:housenumber"],
              el.tags?.["addr:street"],
              el.tags?.["addr:city"],
            ]
              .filter(Boolean)
              .join(", "),
          }))
          .filter((h) => h.lat && h.lon);

        setHospitals(results);
        return results;
      } catch (err) {
        lastError = err;
        console.error("Overpass failed:", endpoint, err);
      }
    }

    throw new Error(
      "Could not load nearby hospitals. Free map server may be busy. Please try again later.",
    );
  };

  /* ── Route helpers ──────────────────────────────────────────────── */
  const clearRoute = () => {
    if (routeLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    Object.entries(markersRef.current).forEach(([id, m]) => {
      // keep search marker as SEARCH_ICON, nearby as HOSPITAL_ICON
      if (String(id).startsWith("search-")) m.setIcon(SEARCH_ICON);
      else m.setIcon(HOSPITAL_ICON);
    });
    setActiveRoute(null);
  };

  const handleGetDirections = async (hospital, e) => {
    e?.stopPropagation();
    const loc = userLocation;
    if (!loc) {
      setErrorMsg(
        "Please click 'Find Hospitals Near Me' first to detect your location.",
      );
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    clearRoute();
    setRouteLoading(true);
    setRouteLoadingId(hospital.id);

    // Ensure the hospital is on the map
    if (!markersRef.current[hospital.id]) {
      pinSearchResult(hospital);
    }
    const marker = markersRef.current[hospital.id];
    if (marker) marker.setIcon(ACTIVE_ICON);

    try {
      const { coordinates, distanceKm, durationMin } = await fetchOSRMRoute(
        loc.lat,
        loc.lon,
        hospital.lat,
        hospital.lon,
      );
      const polyline = L.polyline(coordinates, {
        color: "#2563eb",
        weight: 5,
        opacity: 0.85,
        lineJoin: "round",
      }).addTo(mapInstanceRef.current);

      routeLayerRef.current = polyline;
      mapInstanceRef.current.fitBounds(polyline.getBounds(), {
        padding: [60, 60],
      });
      setActiveRoute({ hospital, distanceKm, durationMin });
      if (marker) marker.openPopup();
    } catch {
      setErrorMsg("Could not draw route. Opening Google Maps instead...");
      setTimeout(() => setErrorMsg(""), 4000);
      openExternalDirections(
        loc.lat,
        loc.lon,
        hospital.lat,
        hospital.lon,
        hospital.name,
      );
    } finally {
      setRouteLoading(false);
      setRouteLoadingId(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Add nearby markers to map ──────────────────────────────────── */
  const addNearbyMarkersToMap = (results, userLat, userLon) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (
        layer instanceof L.Marker ||
        layer instanceof L.Circle ||
        layer instanceof L.Polyline
      )
        map.removeLayer(layer);
    });
    markersRef.current = {};
    routeLayerRef.current = null;
    setActiveRoute(null);
    searchMarkerRef.current = null;

    L.marker([userLat, userLon], { icon: USER_ICON })
      .addTo(map)
      .bindPopup("<b>📍 Your Location</b>")
      .openPopup();

    L.circle([userLat, userLon], {
      radius: 10000,
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.05,
      weight: 1.5,
      dashArray: "6 4",
    }).addTo(map);

    results.forEach((hospital) => {
      const marker = L.marker([hospital.lat, hospital.lon], {
        icon: HOSPITAL_ICON,
      })
        .addTo(map)
        .bindPopup(buildPopupHTML(hospital));
      markersRef.current[hospital.id] = marker;
    });

    if (results.length > 0) {
      map.fitBounds(
        [[userLat, userLon], ...results.map((h) => [h.lat, h.lon])],
        { padding: [40, 40] },
      );
    } else {
      map.setView([userLat, userLon], 13);
    }
  };

  /* ── Sync popup button handlers ─────────────────────────────────── */
  const allHospitals = [
    ...hospitals,
    ...(selectedSearch ? [selectedSearch] : []),
  ];

  useEffect(() => {
    window.__getDirections = (id) => {
      const h = allHospitals.find((r) => String(r.id) === String(id));
      if (h) handleGetDirections(h);
    };
    window.__openExternal = (id) => {
      const h = allHospitals.find((r) => String(r.id) === String(id));
      if (h && userLocation)
        openExternalDirections(
          userLocation.lat,
          userLocation.lon,
          h.lat,
          h.lon,
          h.name,
        );
    };
  }, [userLocation, hospitals, selectedSearch, activeRoute]);

  /* ── Locate me ──────────────────────────────────────────────────── */
  const handleLocate = () => {
    setStatus("locating");
    setErrorMsg("");
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setUserLocation({ lat, lon });

        try {
          const results = await fetchNearbyHospitals(lat, lon, 25);
          addNearbyMarkersToMap(results, lat, lon);
          setStatus("done");
        } catch (err) {
          setErrorMsg(err.message);
          setStatus("error");
        }
      },
      (err) => {
        setErrorMsg(
          err.code === 1
            ? "Location access denied. Please allow location permission and try again."
            : "Unable to get your location. Please try again.",
        );
        setStatus("error");
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="hospital-map-page">
      {/* ── Header ── */}
      <div className="map-header">
        <h1>Find Nearby Hospitals &amp; Cancer Treatment Centers</h1>
        <p>
          Detect hospitals near you, or search for any specific hospital by
          name.
        </p>

        <button
          className={`locate-btn ${status === "locating" || status === "loading" ? "loading" : ""}`}
          onClick={handleLocate}
          disabled={status === "locating" || status === "loading"}
        >
          {status === "locating"
            ? "Getting your location..."
            : status === "loading"
              ? "Finding hospitals..."
              : "📍 Find Hospitals Near Me"}
        </button>

        {status === "error" && <div className="map-error">⚠️ {errorMsg}</div>}
        {errorMsg && status !== "error" && (
          <div className="map-error">⚠️ {errorMsg}</div>
        )}
        {status === "done" && (
          <div className="map-success">
            ✅ Found <strong>{hospitals.length}</strong> hospital
            {hospitals.length !== 1 ? "s" : ""} within 10 km.
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div className="search-section">
        <form
          className="search-form"
          onSubmit={handleSearchSubmit}
          autoComplete="off"
        >
          <div className="search-input-wrap">
            <span className="search-icon-prefix">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search hospital by name, e.g. AIIMS, Tata Memorial..."
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowDropdown(false);
                  clearSearchMarker();
                  clearRoute();
                }}
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="search-submit-btn"
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? <span className="mini-spinner" /> : "Search"}
            </button>
          </div>

          {/* Dropdown suggestions */}
          {showDropdown && searchResults.length > 0 && (
            <ul className="search-dropdown">
              {searchResults.map((r) => (
                <li
                  key={r.id}
                  className="search-dropdown-item"
                  onMouseDown={() => pinSearchResult(r)}
                >
                  <span className="dropdown-icon">🏥</span>
                  <div>
                    <span className="dropdown-name">{r.name}</span>
                    <span className="dropdown-addr">
                      {r.address || r.fullName.split(",").slice(1, 3).join(",")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </form>

        {searchError && <div className="search-error">⚠️ {searchError}</div>}

        {/* Selected search hospital card */}
        {selectedSearch && (
          <div className="selected-hospital-card">
            <div className="selected-left">
              <span className="selected-badge">🔍 Search Result</span>
              <strong>{selectedSearch.name}</strong>
              {selectedSearch.address && (
                <span className="selected-addr">{selectedSearch.address}</span>
              )}
            </div>
            <div className="selected-actions">
              <button
                className="card-directions-btn"
                disabled={routeLoading}
                onClick={(e) => handleGetDirections(selectedSearch, e)}
              >
                {routeLoadingId === selectedSearch.id
                  ? "Loading..."
                  : "🗺️ Get Directions"}
              </button>
              {userLocation && (
                <button
                  className="card-external-btn"
                  onClick={() =>
                    openExternalDirections(
                      userLocation.lat,
                      userLocation.lon,
                      selectedSearch.lat,
                      selectedSearch.lon,
                      selectedSearch.name,
                    )
                  }
                >
                  ↗ Maps
                </button>
              )}
              <button
                className="clear-route-btn"
                onClick={() => {
                  clearSearchMarker();
                  clearRoute();
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Route Banner ── */}
      {activeRoute && (
        <div className="route-banner">
          <div className="route-banner-info">
            <span className="route-icon">🗺️</span>
            <div>
              <strong>{activeRoute.hospital.name}</strong>
              <span className="route-meta">
                {activeRoute.distanceKm} km &nbsp;·&nbsp; ~
                {activeRoute.durationMin} min by car
              </span>
            </div>
          </div>
          <div className="route-banner-actions">
            <button
              className="open-maps-btn"
              onClick={() =>
                openExternalDirections(
                  userLocation.lat,
                  userLocation.lon,
                  activeRoute.hospital.lat,
                  activeRoute.hospital.lon,
                  activeRoute.hospital.name,
                )
              }
            >
              ↗ Open in Google Maps
            </button>
            <button className="clear-route-btn" onClick={clearRoute}>
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Map ── */}
      <div className="map-container">
        {routeLoading && (
          <div className="map-loading-overlay">
            <div className="map-spinner" />
            <span>Calculating route...</span>
          </div>
        )}
        <div ref={mapRef} className="leaflet-map" />
      </div>

      {/* ── Legend ── */}
      <div className="map-legend">
        <span>
          <img
            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png"
            alt="you"
            height="20"
          />{" "}
          Your location
        </span>
        <span>
          <img
            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
            alt="hospital"
            height="20"
          />{" "}
          Nearby hospital
        </span>
        <span>
          <img
            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png"
            alt="search"
            height="20"
          />{" "}
          Search result
        </span>
        <span>
          <img
            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
            alt="active"
            height="20"
          />{" "}
          Selected
        </span>
        <span className="legend-route">&#9473;&#9473; Route</span>
      </div>

      {/* ── Nearby Hospitals List ── */}
      {hospitals.length > 0 && (
        <div className="hospitals-list">
          <h2>Hospitals Near You</h2>
          <div className="hospitals-grid">
            {hospitals.map((h) => (
              <div
                key={h.id}
                className={`hospital-card ${activeRoute?.hospital.id === h.id ? "active" : ""}`}
                onClick={() => {
                  mapInstanceRef.current?.setView([h.lat, h.lon], 15);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="hospital-card-icon">🏥</div>
                <div className="hospital-card-info">
                  <h3>{h.name}</h3>
                  {h.address && <p className="hospital-address">{h.address}</p>}
                  {h.phone && (
                    <a
                      href={`tel:${h.phone}`}
                      className="hospital-phone"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📞 {h.phone}
                    </a>
                  )}
                  <div className="card-actions">
                    <button
                      className="card-directions-btn"
                      disabled={routeLoading}
                      onClick={(e) => handleGetDirections(h, e)}
                    >
                      {routeLoadingId === h.id
                        ? "Loading..."
                        : "🗺️ Get Directions"}
                    </button>
                    {userLocation && (
                      <button
                        className="card-external-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openExternalDirections(
                            userLocation.lat,
                            userLocation.lon,
                            h.lat,
                            h.lon,
                            h.name,
                          );
                        }}
                      >
                        ↗ Maps
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalMap;
