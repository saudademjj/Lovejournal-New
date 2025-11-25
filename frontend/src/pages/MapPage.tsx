/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { fetchTimeline } from "../lib/api";
import { MapMarker, TimelineItem } from "../lib/types";
import { AMAP_JS_CODE, AMAP_JS_KEY } from "../lib/config";

declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: any;
  }
}

type Filters = {
  entry: boolean;
  photo: boolean;
  keydate: boolean;
};

const MapPage: React.FC = () => {
  const [markers, setMarkers] = React.useState<MapMarker[]>([]);
  const [filters, setFilters] = React.useState<Filters>({ entry: true, photo: true, keydate: true });
  const mapRef = React.useRef<any>(null);
  const markerInstancesRef = React.useRef<any[]>([]);
  const infoWindowRef = React.useRef<any>(null);
  const provincePolygonsRef = React.useRef<Map<string, any[]>>(new Map());
  const visitedCodesRef = React.useRef<Set<string>>(new Set());
  const provinceFeaturesRef = React.useRef<Map<string, any[]>>(new Map());

  const loadGeoJSON = React.useCallback(async () => {
    if (provinceFeaturesRef.current.size > 0) return;
    try {
      const res = await fetch("/geo/china-provinces.geojson");
      const data = await res.json();
      (data.features || []).forEach((f: any) => {
        const props = f.properties || {};
        const code = String(props.adcode || props.parent?.adcode || (props.acroutes || []).slice(-1)[0] || "");
        const normalized = code.slice(0, 2).padEnd(6, "0");
        if (!provinceFeaturesRef.current.has(normalized)) {
          provinceFeaturesRef.current.set(normalized, []);
        }
        provinceFeaturesRef.current.get(normalized)!.push(f);
      });
    } catch (err) {
      console.error("Failed to load geojson", err);
    }
  }, []);

  const drawProvince = React.useCallback(
    (adcode: string) => {
      if (!window.AMap || provincePolygonsRef.current.has(adcode)) return;
      const feats = provinceFeaturesRef.current.get(adcode);
      if (!feats || !feats.length) return;
      const polys: any[] = [];
      feats.forEach((f) => {
        const geom = f.geometry || {};
        const type = geom.type;
        const coords = geom.coordinates || [];
        if (type === "MultiPolygon") {
          coords.forEach((poly: any) => {
            const paths = poly.map((ring: any) => ring.map(([lng, lat]: [number, number]) => [lng, lat]));
            if (paths.length) {
              const p = new window.AMap.Polygon({
                path: paths,
                fillColor: "#ff003c",
                fillOpacity: 0.25,
                strokeColor: "#ff003c",
                strokeOpacity: 0.6,
                strokeWeight: 1,
                zIndex: 5,
                bubble: false,
              });
              p.setMap(mapRef.current);
              polys.push(p);
            }
          });
        } else if (type === "Polygon") {
          const paths = coords.map((ring: any) => ring.map(([lng, lat]: [number, number]) => [lng, lat]));
          if (paths.length) {
            const p = new window.AMap.Polygon({
              path: paths,
              fillColor: "#ff003c",
              fillOpacity: 0.25,
              strokeColor: "#ff003c",
              strokeOpacity: 0.6,
              strokeWeight: 1,
              zIndex: 5,
              bubble: false,
            });
            p.setMap(mapRef.current);
            polys.push(p);
          }
        }
      });
      if (polys.length) {
        provincePolygonsRef.current.set(adcode, polys);
      }
    },
    []
  );

  const refreshProvinces = React.useCallback(() => {
    visitedCodesRef.current.forEach((code) => drawProvince(code));
  }, [drawProvince]);

  const buildMarkers = React.useCallback(
    async (data: MapMarker[]) => {
      if (!window.AMap || !mapRef.current) return;
      const map = mapRef.current;
      const markerInstances: any[] = [];
      const geocoder = new window.AMap.Geocoder({ extensions: "all" });
      const countCache: Record<string, number> = {};

      const jitter = (lat: number, lng: number) => {
        const key = `${Math.round(lat * 10)},${Math.round(lng * 10)}`;
        const count = (countCache[key] || 0) + 1;
        countCache[key] = count;
        if (count > 1) {
          const angle = count * 137.5 * (Math.PI / 180);
          const radius = 0.012 * Math.sqrt(count);
          const newLat = lat + radius * Math.cos(angle);
          const newLng = lng + radius * Math.sin(angle) * 1.3;
          return new window.AMap.LngLat(newLng, newLat);
        }
        return new window.AMap.LngLat(lng, lat);
      };

      const colorFor = (kind: string) => {
        if (kind === "photo") return "rgba(140,170,255,0.9)";
        if (kind === "keydate") return "#ff003c";
        return "rgba(255,255,255,0.9)";
      };

      const closeInfo = () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
      };
      (window as any).closeInfoWindow = closeInfo;

      await loadGeoJSON();

      for (const m of data) {
        const pos = jitter(m.lat, m.lng);
        let marker;
        if (m.kind === "keydate") {
          marker = new window.AMap.Marker({
            position: pos,
            anchor: "center",
            zIndex: 300,
            content: '<div class="keydate-pin"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.35-9.33-9.27C1.2 9.08 2.5 5.5 5.73 4.6c1.9-.52 3.61.22 4.77 1.7 1.16-1.48 2.87-2.22 4.77-1.7 3.23.89 4.53 4.48 3.06 7.13C19 16.65 12 21 12 21Z"/></svg></div>',
            extData: { kind: m.kind },
          });
        } else {
          marker = new window.AMap.CircleMarker({
            center: pos,
            radius: 3.6,
            strokeColor: "rgba(0,0,0,0.4)",
            strokeWeight: 0.6,
            fillColor: colorFor(m.kind),
            fillOpacity: 0.85,
            zIndex: 80,
            cursor: "pointer",
            bubble: true,
            extData: { kind: m.kind },
          });
        }

        const contentHtml = `
          <div class="amap-info-window-custom">
            <span class="info-close" onclick="closeInfoWindow()">×</span>
            <div class="info-time">${m.timestamp}</div>
            ${m.image ? `<img src="${m.image}" class="info-img" loading="lazy">` : ""}
            <div class="info-content">${(m.snippet || "").slice(0, 120)}</div>
            <div class="info-geo">${m.label}</div>
          </div>
        `;

        marker.on("click", () => {
          closeInfo();
          const info = new window.AMap.InfoWindow({
            isCustom: true,
            content: contentHtml,
            offset: new window.AMap.Pixel(0, -12),
            autoMove: true,
          });
          info.open(map, pos);
          infoWindowRef.current = info;
        });

        marker.setMap(map);
        markerInstances.push(marker);

        geocoder.getAddress([m.lng, m.lat], (_status: any, result: any) => {
          const raw = result?.regeocode?.addressComponent?.adcode;
          if (raw) {
            const code = String(raw).slice(0, 2).padEnd(6, "0");
            visitedCodesRef.current.add(code);
            refreshProvinces();
          }
        });
      }
      markerInstancesRef.current = markerInstances;
      if (markerInstances.length > 0) {
        map.setFitView(null, false, [100, 60, 100, 60]);
      }
    },
    [loadGeoJSON, refreshProvinces]
  );

  const initMap = React.useCallback(
    (data: MapMarker[]) => {
      if (!window.AMap) return;
      window._AMapSecurityConfig = { securityJsCode: AMAP_JS_CODE };
      const map = new window.AMap.Map("map", {
        viewMode: "2D",
        zoom: 4,
        center: [104.06, 30.67],
        mapStyle: "amap://styles/dark",
        pitch: 0,
      });
      mapRef.current = map;
      buildMarkers(data);
    },
    [buildMarkers]
  );

  const toggleFilter = (kind: keyof Filters) => {
    const next = { ...filters, [kind]: !filters[kind] };
    setFilters(next);
    markerInstancesRef.current.forEach((marker) => {
      const mkind = marker.getExtData()?.kind;
      if (next[mkind as keyof Filters]) marker.show();
      else marker.hide();
    });
    document.getElementById(`filter-${kind}`)?.classList.toggle("is-off", !next[kind]);
  };

  const loadScript = React.useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.AMap) {
        resolve();
        return;
      }
      // 安全码配置
      (window as any)._AMapSecurityConfig = { securityJsCode: AMAP_JS_CODE };
      const script = document.createElement("script");
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_JS_KEY}&plugin=AMap.Geocoder`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  }, []);

  React.useEffect(() => {
    // 前端直接从时间轴构建地图点，避免后端解析差异
    const parseCoords = (location?: string | null) => {
      if (!location) return null;
      const nums = (location.replace("，", ",").match(/-?\\d+(?:\\.\\d+)?/g) || []).map(parseFloat);
      if (nums.length < 2 || Number.isNaN(nums[0]) || Number.isNaN(nums[1])) return null;
      let lat = nums[0];
      let lng = nums[1];
      if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) [lat, lng] = [lng, lat];
      return { lat, lng };
    };

    fetchTimeline({ per_page: 500, type: "all" })
      .then((data) => {
        const items = data.items || [];
        const ms: MapMarker[] = [];
        items.forEach((it: TimelineItem) => {
          const coords = parseCoords(it.location);
          if (!coords) return;
          ms.push({
            id: it.id,
            kind: it.type,
            lat: coords.lat,
            lng: coords.lng,
            label: it.location || "",
            timestamp: new Date(it.timestamp).toLocaleString(),
            snippet: (it.content || it.caption || it.title || "").slice(0, 120),
            image: it.image,
          });
        });
        setMarkers(ms);
      })
      .catch((err) => {
        console.error("Load timeline for map failed", err);
      });
  }, []);

  React.useEffect(() => {
    loadScript()
      .then(() => initMap(markers))
      .catch((err) => console.error("AMap load failed", err));
  }, [markers, loadScript, initMap]);

  return (
    <>
      <div className="map-legend" aria-label="Legend for map markers">
        <div className="legend-item" id="filter-entry" onClick={() => toggleFilter("entry")}>
          <span className="map-dot entry"></span>TEXT
        </div>
        <div className="legend-item" id="filter-photo" onClick={() => toggleFilter("photo")}>
          <span className="map-dot photo"></span>PHOTO
        </div>
        <div className="legend-item" id="filter-keydate" onClick={() => toggleFilter("keydate")}>
          <span className="map-dot keydate"></span>DATE
        </div>
      </div>

      <div className="map-zoom-controls">
        <button type="button" className="zoom-btn" onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)} aria-label="Zoom In">
          +
        </button>
        <button type="button" className="zoom-btn" onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)} aria-label="Zoom Out">
          −
        </button>
      </div>

      <main aria-label="Map of memories">
        <div className="map-badge">ATLAS / TRACE</div>
        <div id="map"></div>
      </main>
    </>
  );
};

export default MapPage;
