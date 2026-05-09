import { useEffect, useMemo, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import type { Emergency } from "@workspace/api-client-react";

const API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "") as string;

const JLN_BESAR = { lat: 1.3097, lng: 103.8556 };

interface EmergencyMapProps {
  emergencies: Emergency[];
  /** Optional volunteer location to render as a separate "you" pin. */
  selfLocation?: { lat: number; lng: number } | null;
  /** When provided, focus the map on this single emergency and show its responders. */
  focusEmergencyId?: number;
  height?: number;
  /** Show only currently-active emergencies. Defaults to true. */
  activeOnly?: boolean;
  /** When provided, clicking the map calls this with the lat/lng of the click. */
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  /** Draw walking routes from selfLocation to every active emergency pin. */
  showRoutesFromSelf?: boolean;
  /** Live volunteer locations to render as blue pins (admin/reviewer view). */
  volunteerLocations?: ReadonlyArray<{
    id: number;
    name: string;
    lat: number;
    lng: number;
    lastSeenAt?: string | null;
  }>;
  /** When set, draw walking routes from every volunteer to this emergency. */
  routeToEmergencyId?: number | null;
}

interface MapPoint {
  key: string;
  lat: number;
  lng: number;
  kind: "major" | "minor" | "responder" | "self" | "volunteer";
  label: string;
  sub?: string;
}

export function EmergencyMap({
  emergencies,
  selfLocation,
  focusEmergencyId,
  height = 320,
  activeOnly = true,
  onMapClick,
  showRoutesFromSelf = false,
  volunteerLocations,
  routeToEmergencyId,
}: EmergencyMapProps) {
  const routeTarget = useMemo(() => {
    if (!routeToEmergencyId) return null;
    const e = emergencies.find(
      (x) => x.id === routeToEmergencyId && x.status === "active",
    );
    if (!e || e.lat == null || e.lng == null) return null;
    return { id: e.id, lat: e.lat, lng: e.lng, type: e.type };
  }, [routeToEmergencyId, emergencies]);
  const points = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];
    const filtered = focusEmergencyId
      ? emergencies.filter((e) => e.id === focusEmergencyId)
      : activeOnly
        ? emergencies.filter((e) => e.status === "active")
        : emergencies;

    for (const e of filtered) {
      if (e.lat != null && e.lng != null) {
        out.push({
          key: `e-${e.id}`,
          lat: e.lat,
          lng: e.lng,
          kind: e.type === "major" ? "major" : "minor",
          label: `${e.type === "major" ? "MAJOR" : "Minor"} · ${e.creatorName}`,
          sub: e.address ?? undefined,
        });
      }
    }
    if (selfLocation) {
      out.push({
        key: "self",
        lat: selfLocation.lat,
        lng: selfLocation.lng,
        kind: "self",
        label: "You",
      });
    }
    if (volunteerLocations) {
      for (const v of volunteerLocations) {
        out.push({
          key: `v-${v.id}`,
          lat: v.lat,
          lng: v.lng,
          kind: "volunteer",
          label: v.name,
          sub: v.lastSeenAt
            ? `Last seen ${new Date(v.lastSeenAt).toLocaleTimeString()}`
            : "Volunteer on standby",
        });
      }
    }
    return out;
  }, [emergencies, focusEmergencyId, activeOnly, selfLocation, volunteerLocations]);

  const center = useMemo(() => {
    if (points.length === 0) return JLN_BESAR;
    const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    return { lat: avgLat, lng: avgLng };
  }, [points]);

  if (!API_KEY) {
    return (
      <div
        className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm p-4"
        style={{ minHeight: height }}
      >
        Google Maps key not configured. Set <code>GOOGLE_MAPS_API_KEY</code> in
        your environment to enable the map.
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div
        className="relative rounded-xl overflow-hidden border border-stone-200"
        style={{ height }}
      >
        <MapLegend />
        <Map
          mapId="firekaki-map"
          defaultCenter={center}
          defaultZoom={focusEmergencyId ? 15 : 13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
          onClick={
            onMapClick
              ? (ev) => {
                  const ll = ev.detail.latLng;
                  if (ll) onMapClick({ lat: ll.lat, lng: ll.lng });
                }
              : undefined
          }
          style={onMapClick ? { cursor: "crosshair" } : undefined}
        >
          {points.map((p) => (
            <PointMarker key={p.key} point={p} />
          ))}
          {showRoutesFromSelf && selfLocation && (
            <RoutesOverlay
              origin={selfLocation}
              destinations={points.filter(
                (p) => p.kind === "major" || p.kind === "minor",
              )}
            />
          )}
          {routeTarget && volunteerLocations && volunteerLocations.length > 0 && (
            <VolunteerRoutesOverlay
              destination={routeTarget}
              origins={volunteerLocations}
            />
          )}
        </Map>
      </div>
    </APIProvider>
  );
}

function MapLegend() {
  const items: Array<{ color: string; border: string; label: string }> = [
    { color: "#cf3517", border: "#7a1d09", label: "Major emergency" },
    { color: "#f59e0b", border: "#92400e", label: "Minor emergency" },
    { color: "#2563eb", border: "#1e3a8a", label: "Volunteer" },
  ];
  return (
    <div className="absolute top-2 left-2 z-10 bg-white/95 backdrop-blur-sm rounded-lg border border-stone-200 shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-stone-700 mb-1">Map legend</p>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2">
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50% 50% 50% 0",
                transform: "rotate(-45deg)",
                background: it.color,
                border: `2px solid ${it.border}`,
                display: "inline-block",
              }}
            />
            <span className="text-stone-700">{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PointMarker({ point }: { point: MapPoint }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  const colors = (() => {
    switch (point.kind) {
      case "major":
        return { bg: "#cf3517", border: "#7a1d09", glyph: "#fff" };
      case "minor":
        return { bg: "#f59e0b", border: "#92400e", glyph: "#fff" };
      case "responder":
        return { bg: "#16a34a", border: "#14532d", glyph: "#fff" };
      case "volunteer":
      case "self":
      default:
        return { bg: "#2563eb", border: "#1e3a8a", glyph: "#fff" };
    }
  })();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: point.lat, lng: point.lng }}
        onClick={() => setOpen((s) => !s)}
        title={point.label}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          }}
        />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="text-sm">
            <p className="font-semibold text-stone-900">{point.label}</p>
            {point.sub && <p className="text-xs text-stone-600 mt-0.5">{point.sub}</p>}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function VolunteerRoutesOverlay({
  destination,
  origins,
}: {
  destination: { id: number; lat: number; lng: number; type: "major" | "minor" };
  origins: ReadonlyArray<{ id: number; name: string; lat: number; lng: number }>;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");

  useEffect(() => {
    if (!map || !routesLib) return;
    const service = new routesLib.DirectionsService();
    let cancelled = false;
    const created: google.maps.Polyline[] = [];
    const baseColor = destination.type === "major" ? "#cf3517" : "#f59e0b";

    Promise.all(
      origins.map((o) =>
        service
          .route({
            origin: { lat: o.lat, lng: o.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: google.maps.TravelMode.WALKING,
          })
          .then((res) => ({ res }))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      for (const r of results) {
        if (!r) continue;
        const path = r.res.routes[0]?.overview_path;
        if (!path) continue;
        const line = new google.maps.Polyline({
          path,
          strokeColor: baseColor,
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        });
        created.push(line);
      }
    });

    return () => {
      cancelled = true;
      for (const line of created) line.setMap(null);
    };
  }, [map, routesLib, destination, origins]);

  return null;
}

function RoutesOverlay({
  origin,
  destinations,
}: {
  origin: { lat: number; lng: number };
  destinations: MapPoint[];
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !routesLib) return;
    const service = new routesLib.DirectionsService();
    let cancelled = false;
    const created: google.maps.Polyline[] = [];

    Promise.all(
      destinations.map((d) =>
        service
          .route({
            origin,
            destination: { lat: d.lat, lng: d.lng },
            travelMode: google.maps.TravelMode.WALKING,
          })
          .then((res) => ({ d, res }))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      for (const r of results) {
        if (!r) continue;
        const path = r.res.routes[0]?.overview_path;
        if (!path) continue;
        const color = r.d.kind === "major" ? "#cf3517" : "#f59e0b";
        const line = new google.maps.Polyline({
          path,
          strokeColor: color,
          strokeOpacity: 0.85,
          strokeWeight: 5,
          map,
        });
        created.push(line);
      }
      setPolylines(created);
    });

    return () => {
      cancelled = true;
      for (const line of created) line.setMap(null);
    };
  }, [map, routesLib, origin.lat, origin.lng, JSON.stringify(destinations.map((d) => [d.key, d.lat, d.lng]))]);

  // cleanup any previously-rendered polylines on re-render
  useEffect(() => {
    return () => {
      for (const line of polylines) line.setMap(null);
    };
  }, [polylines]);

  return null;
}

export default EmergencyMap;
