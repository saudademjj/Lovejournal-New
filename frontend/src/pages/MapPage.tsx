/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { MapMarker } from "../lib/types";
import { AMAP_JS_CODE, AMAP_JS_KEY } from "../lib/config";
import { useTimelineStore } from "../store/timeline";
import { shallow } from "zustand/shallow";
import { onAppEvent } from "../lib/eventBus";

declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: any;
  }
}

type MarkerFilters = {
  entry: boolean;
  photo: boolean;
  keydate: boolean;
};

type NormalizedPolygon = [number, number][][];
type ProvinceFeature = { polygons: NormalizedPolygon[]; bbox: [number, number, number, number] };

const MapPage: React.FC = () => {
  const { mapItems, mapLoading, mapError, refreshMap, filters: timelineFilters } = useTimelineStore(
    (state) => ({
      mapItems: state.mapItems,
      mapLoading: state.mapLoading,
      mapError: state.mapError,
      refreshMap: state.refreshMap,
      filters: state.filters,
    }),
    shallow
  );
  const { q, type, tag } = timelineFilters;
  const [markerFilters, setMarkerFilters] = React.useState<MarkerFilters>({ entry: true, photo: true, keydate: true });
  const [geoLoaded, setGeoLoaded] = React.useState(false);
  const [mapReady, setMapReady] = React.useState(false);
  const [scriptError, setScriptError] = React.useState<string | null>(null);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [buildingMarkers, setBuildingMarkers] = React.useState(false);
  const mapRef = React.useRef<any>(null);
  const markerInstancesRef = React.useRef<any[]>([]);
  const buildSeqRef = React.useRef(0);
  const infoWindowRef = React.useRef<any>(null);
  const provincePolygonsRef = React.useRef<Map<string, any[]>>(new Map());
  const visitedCodesRef = React.useRef<Set<string>>(new Set());
  const provinceCacheRef = React.useRef<Map<string, string | null>>(new Map());
  const provinceFeaturesRef = React.useRef<Map<string, ProvinceFeature[]>>(new Map());
  const mapInitialized = React.useRef(false);
  const isInitialMount = React.useRef(true);

  const loadGeoJSON = React.useCallback(async () => {
    if (provinceFeaturesRef.current.size > 0) return;

    const normalizePolygons = (geom: any): NormalizedPolygon[] => {
      if (!geom) return [];
      if (geom.type === "MultiPolygon") return geom.coordinates || [];
      if (geom.type === "Polygon") return [geom.coordinates || []];
      return [];
    };

    const simplifyRing = (ring: [number, number][], maxPoints = 140) => {
      if (!ring || ring.length <= maxPoints) return ring;
      const step = Math.ceil(ring.length / maxPoints);
      const simplified: [number, number][] = [];
      for (let i = 0; i < ring.length; i += step) {
        simplified.push(ring[i]);
      }
      if (ring.length > 0 && simplified[simplified.length - 1] !== ring[ring.length - 1]) {
        simplified.push(ring[ring.length - 1]);
      }
      return simplified;
    };

    const simplifyPolygons = (polys: NormalizedPolygon[]) =>
      polys
        .map((poly) => poly.map((ring) => simplifyRing(ring)))
        .filter((poly) => poly.some((ring) => ring && ring.length >= 3));

    const calcBbox = (polys: NormalizedPolygon[]) => {
      let minLng = Number.POSITIVE_INFINITY;
      let minLat = Number.POSITIVE_INFINITY;
      let maxLng = Number.NEGATIVE_INFINITY;
      let maxLat = Number.NEGATIVE_INFINITY;
      polys.forEach((poly) =>
        poly.forEach((ring) =>
          ring.forEach(([lng, lat]) => {
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
          })
        )
      );
      if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
        return [-180, -90, 180, 90] as [number, number, number, number];
      }
      return [minLng, minLat, maxLng, maxLat] as [number, number, number, number];
    };

    const sources = [
      (import.meta as any).env?.VITE_GEOJSON_CDN as string,
      "/geo/china-provinces.geojson",
    ].filter(Boolean);

    for (const src of sources) {
      try {
        const res = await fetch(src, { cache: "force-cache" });
        if (!res.ok) continue;
        const data = await res.json();
        (data.features || []).forEach((f: any) => {
          const props = f.properties || {};
          const code = String(props.adcode || props.parent?.adcode || (props.acroutes || []).slice(-1)[0] || "");
          const normalized = code.slice(0, 2).padEnd(6, "0");
          const polygons = simplifyPolygons(normalizePolygons(f.geometry));
          if (!polygons.length) return;
          const bbox = calcBbox(polygons);
          const list = provinceFeaturesRef.current.get(normalized) || [];
          list.push({ polygons, bbox });
          provinceFeaturesRef.current.set(normalized, list);
        });
        if (provinceFeaturesRef.current.size > 0) {
          console.log("GeoJSON loaded from", src, "provinces:", provinceFeaturesRef.current.size);
          provinceCacheRef.current.clear();
          setGeoLoaded(true);
          setGeoError(null);
          return;
        }
      } catch (err) {
        console.error("Failed to load geojson from", src, err);
      }
    }
    setGeoError("省份边界加载失败，请刷新重试");
  }, []);

  const pointInRing = React.useCallback((point: [number, number], ring: [number, number][]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      const intersect = yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || 1e-9) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }, []);

  const pointInPolygon = React.useCallback(
    (point: [number, number], polygon: NormalizedPolygon) => {
      if (!polygon || polygon.length === 0) return false;
      let inside = false;
      polygon.forEach((ring, idx) => {
        if (ring.length < 3) return;
        if (pointInRing(point, ring)) {
          inside = idx === 0 ? true : !inside;
        }
      });
      return inside;
    },
    [pointInRing]
  );

  const findProvinceByPoint = React.useCallback(
    (lng: number, lat: number) => {
      const cacheKey = `${lng.toFixed(3)},${lat.toFixed(3)}`;
      if (provinceCacheRef.current.has(cacheKey)) {
        return provinceCacheRef.current.get(cacheKey) as string | null;
      }

      let matched: string | null = null;
      for (const [code, feats] of provinceFeaturesRef.current.entries()) {
        let hit = false;
        for (const feat of feats) {
          const [minLng, minLat, maxLng, maxLat] = feat.bbox;
          if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;
          for (const poly of feat.polygons) {
            if (pointInPolygon([lng, lat], poly)) {
              matched = code;
              hit = true;
              break;
            }
          }
          if (hit) break;
        }
        if (matched) break;
      }
      provinceCacheRef.current.set(cacheKey, matched);
      return matched;
    },
    [pointInPolygon]
  );

  const drawProvince = React.useCallback(
    (adcode: string, targetPolygons?: Map<string, any[]>) => {
      if (!window.AMap || !mapRef.current) return;
      const store = targetPolygons || provincePolygonsRef.current;
      if (store.has(adcode)) return;
      const feats = provinceFeaturesRef.current.get(adcode);
      if (!feats || !feats.length) {
        console.warn("No features for province:", adcode);
        return;
      }
      console.log("Drawing province:", adcode, "features:", feats.length);
      const polys: any[] = [];
      feats.forEach((f) => {
        f.polygons.forEach((poly) => {
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
      });
      if (polys.length) {
        store.set(adcode, polys);
      }
    },
    []
  );

  const refreshProvinces = React.useCallback(
    (visited?: Set<string>, targetPolygons?: Map<string, any[]>) => {
      const codes = visited || visitedCodesRef.current;
      codes.forEach((code) => drawProvince(code, targetPolygons));
    },
    [drawProvince]
  );

  const markers = React.useMemo<MapMarker[]>(() => {
    return (mapItems || []).filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
  }, [mapItems]);

  const buildMarkers = React.useCallback(
    async (data: MapMarker[]) => {
      if (!window.AMap || !mapRef.current) return;
      const buildId = ++buildSeqRef.current;
      setBuildingMarkers(true);
      const map = mapRef.current;

      const cleanupTemp = (markers: any[], polygons: Map<string, any[]>) => {
        markers.forEach((m) => m.setMap(null));
        polygons.forEach((polys) => polys.forEach((p) => p.setMap(null)));
      };

      try {
        markerInstancesRef.current.forEach((m) => m.setMap(null));
        markerInstancesRef.current = [];
        provincePolygonsRef.current.forEach((polys) => polys.forEach((p) => p.setMap(null)));
        provincePolygonsRef.current.clear();
        visitedCodesRef.current = new Set();
        provinceCacheRef.current.clear();

        const markerInstances: any[] = [];
        const countCache: Record<string, number> = {};
        const localVisited = new Set<string>();
        const localPolygons = new Map<string, any[]>();

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

        const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

        for (let idx = 0; idx < data.length; idx++) {
          if (buildSeqRef.current !== buildId) break;
          if (idx && idx % 120 === 0) {
            await pause();
          }
          const m = data[idx];
          const pos = jitter(m.lat, m.lng);
          let marker;
          if (m.kind === "keydate") {
            marker = new window.AMap.Marker({
              position: pos,
              anchor: "center",
              zIndex: 300,
              content:
                '<div class="keydate-pin"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.35-9.33-9.27C1.2 9.08 2.5 5.5 5.73 4.6c1.9-.52 3.61.22 4.77 1.7 1.16-1.48 2.87-2.22 4.77-1.7 3.23.89 4.53 4.48 3.06 7.13C19 16.65 12 21 12 21Z"/></svg></div>',
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
            <div class="info-time">${new Date(m.timestamp).toLocaleString()}</div>
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
          if (!markerFilters[m.kind as keyof MarkerFilters]) {
            marker.hide();
          }
          markerInstances.push(marker);

          const provinceCode = findProvinceByPoint(m.lng, m.lat);
          if (provinceCode) {
            localVisited.add(provinceCode);
          }
        }
        if (buildSeqRef.current !== buildId) {
          cleanupTemp(markerInstances, localPolygons);
          return;
        }
        markerInstancesRef.current = markerInstances;
        visitedCodesRef.current = localVisited;
        provincePolygonsRef.current = localPolygons;
        if (markerInstances.length > 0) {
          map.setFitView(null, false, [100, 60, 100, 60]);
        }
        refreshProvinces(localVisited, localPolygons);
      } finally {
        if (buildSeqRef.current === buildId) {
          setBuildingMarkers(false);
        }
      }
    },
    [refreshProvinces, markerFilters, findProvinceByPoint]
  );

  const initMap = React.useCallback(() => {
    if (!window.AMap || mapInitialized.current) return;
    console.log("Initializing map");
    window._AMapSecurityConfig = { securityJsCode: AMAP_JS_CODE };
    const map = new window.AMap.Map("map", {
      viewMode: "2D",
      zoom: 4,
      center: [104.06, 30.67],
      mapStyle: "amap://styles/dark",
      pitch: 0,
    });
    mapRef.current = map;
    mapInitialized.current = true;
  }, []);

  const toggleFilter = (kind: keyof MarkerFilters) => {
    const next = { ...markerFilters, [kind]: !markerFilters[kind] };
    setMarkerFilters(next);
    markerInstancesRef.current.forEach((marker) => {
      const mkind = marker.getExtData()?.kind;
      if (next[mkind as keyof MarkerFilters]) marker.show();
      else marker.hide();
    });
    document.getElementById(`filter-${kind}`)?.classList.toggle("is-off", !next[kind]);
  };

  const loadScript = React.useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.AMap) {
        setMapReady(true);
        setScriptError(null);
        resolve();
        return;
      }
      // 安全码配置
      (window as any)._AMapSecurityConfig = { securityJsCode: AMAP_JS_CODE };
      const script = document.createElement("script");
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_JS_KEY}`;
      script.async = true;
      script.onload = () => {
        setMapReady(true);
        setScriptError(null);
        resolve();
      };
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  }, []);

  // 1. 加载高德地图脚本
  React.useEffect(() => {
    loadScript()
      .then(() => console.log("AMap loaded"))
      .catch((err) => {
        console.error("AMap load failed", err);
        setScriptError("地图脚本加载失败，请刷新后重试");
      });
  }, [loadScript]);

  // 2. 加载 GeoJSON
  React.useEffect(() => {
    loadGeoJSON();
  }, [loadGeoJSON]);

  // 3. 同步时间轴数据到地图（依赖全局筛选）
  React.useEffect(() => {
    // 首次挂载时强制刷新，确保获取最新数据
    if (isInitialMount.current) {
      isInitialMount.current = false;
      refreshMap({ q, type, tag, limit: 800, force: true });
    } else {
      refreshMap({ q, type, tag, limit: 800 });
    }
  }, [refreshMap, q, type, tag]);

  // 4. 页面可见时尝试刷新
  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshMap({ q, type, tag, limit: 800, force: true });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refreshMap, q, type, tag]);

  // 5. 事件总线驱动的实时同步
  React.useEffect(() => {
    const off = onAppEvent("map:invalidate", () => {
      refreshMap({ q, type, tag, limit: 800, force: true });
    });
    return off;
  }, [refreshMap, q, type, tag]);

  // 6. 初始化地图（当 AMap 与 GeoJSON 准备好时）
  React.useEffect(() => {
    if (mapReady && window.AMap && geoLoaded && !mapInitialized.current) {
      initMap();
    }
  }, [mapReady, geoLoaded, initMap]);

  // 7. mapItems 更新时强制刷新地图标记（确保新数据同步）
  React.useEffect(() => {
    if (!mapInitialized.current || !window.AMap) return;
    buildMarkers(markers);
  }, [mapItems]);

  // 8. markers 筛选器变化时更新标记可见性
  React.useEffect(() => {
    if (markerInstancesRef.current.length === 0) return;
    markerInstancesRef.current.forEach((m) => {
      const kind = m.getExtData()?.kind;
      if (kind && markerFilters[kind as keyof MarkerFilters]) {
        m.show();
      } else {
        m.hide();
      }
    });
  }, [markerFilters]);

  const statusStyle: React.CSSProperties = {
    position: "fixed",
    right: "18px",
    bottom: "18px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "rgba(18, 18, 18, 0.82)",
    color: "#f1f1f1",
    fontSize: "12px",
    letterSpacing: "0.04em",
    zIndex: 900,
    lineHeight: 1.5,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    maxWidth: "280px",
  };
  const errorStyle: React.CSSProperties = {
    ...statusStyle,
    background: "rgba(255, 71, 87, 0.92)",
    color: "#fff",
  };

  return (
    <>
      {(mapLoading || buildingMarkers || !mapReady) && (
        <div style={statusStyle} role="status">
          {!mapReady ? "地图脚本加载中..." : mapLoading ? "正在获取最新数据..." : "正在刷新标记..."}
        </div>
      )}
      {(mapError || scriptError || geoError) && (
        <div style={errorStyle} role="alert">
          {scriptError || geoError || mapError}
        </div>
      )}
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
