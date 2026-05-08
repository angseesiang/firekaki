import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

export type Coords = { lat: number; lng: number; accuracy?: number | null };

export type LocationStatus =
  | "idle"
  | "requesting"
  | "denied"
  | "tracking"
  | "error";

interface Options {
  enabled: boolean;
  onUpdate?: (coords: Coords) => void;
  intervalMs?: number;
}

/**
 * Foreground location tracker. Requests permission, then watches position
 * and forwards updates to the optional `onUpdate` callback.
 *
 * On web, falls back to navigator.geolocation.watchPosition.
 */
export function useLocationTracker({ enabled, onUpdate, intervalMs = 8000 }: Options) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    let nativeSub: Location.LocationSubscription | null = null;
    let webWatchId: number | null = null;

    (async () => {
      setStatus("requesting");
      setError(null);

      if (Platform.OS === "web") {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          if (!cancelled) {
            setStatus("error");
            setError("Geolocation not available");
          }
          return;
        }
        webWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (cancelled) return;
            const c: Coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
            setCoords(c);
            setStatus("tracking");
            onUpdateRef.current?.(c);
          },
          (err) => {
            if (cancelled) return;
            if (err.code === 1) setStatus("denied");
            else {
              setStatus("error");
              setError(err.message);
            }
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
        );
        return;
      }

      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (perm !== "granted") {
          setStatus("denied");
          return;
        }
        nativeSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: intervalMs,
            distanceInterval: 5,
          },
          (loc) => {
            if (cancelled) return;
            const c: Coords = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracy: loc.coords.accuracy,
            };
            setCoords(c);
            setStatus("tracking");
            onUpdateRef.current?.(c);
          },
        );
        if (cancelled) {
          nativeSub.remove();
          nativeSub = null;
        } else {
          setStatus("tracking");
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
      if (nativeSub) {
        nativeSub.remove();
        nativeSub = null;
      }
      if (webWatchId != null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(webWatchId);
      }
    };
  }, [enabled, intervalMs]);

  return { status, coords, error };
}
