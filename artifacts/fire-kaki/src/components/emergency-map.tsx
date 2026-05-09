import { useMemo, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
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
}

interface MapPoint {
  key: string;
  lat: number;
  lng: number;
  kind: "major" | "minor" | "responder" | "self";
  label: string;
  sub?: string;
}

export function EmergencyMap({
  emergencies,
  selfLocation,
  focusEmergencyId,
  height = 320,
  activeOnly = true,
}: EmergencyMapProps) {
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
    return out;
  }, [emergencies, focusEmergencyId, activeOnly, selfLocation]);

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
        className="rounded-xl overflow-hidden border border-stone-200"
        style={{ height }}
      >
        <Map
          mapId="firekaki-map"
          defaultCenter={center}
          defaultZoom={focusEmergencyId ? 15 : 13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
        >
          {points.map((p) => (
            <PointMarker key={p.key} point={p} />
          ))}
        </Map>
      </div>
    </APIProvider>
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

export default EmergencyMap;
