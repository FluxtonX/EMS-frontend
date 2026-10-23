'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Compass,
  Navigation,
  Clock,
  Building2,
  User,
  X,
  ExternalLink,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { AttendanceRecord } from '@/types/attendance';

export type MapLayerType = 'street' | 'satellite' | 'hybrid';

interface AttendanceMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onReconcile?: (record: AttendanceRecord) => void;
}

export function AttendanceMapModal({
  isOpen,
  onClose,
  record,
  onReconcile,
}: AttendanceMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ base?: any; overlay?: any }>({});
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('hybrid');
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  // Fallback London coordinates if site or record coordinates are absent
  const DEFAULT_LAT = 51.5074;
  const DEFAULT_LNG = -0.1278;

  // Resolve Site coordinates
  const siteLat =
    record?.site?.latitude ??
    (record?.site as any)?.address?.latitude ??
    DEFAULT_LAT;
  const siteLng =
    record?.site?.longitude ??
    (record?.site as any)?.address?.longitude ??
    DEFAULT_LNG;
  const geofenceRadius = record?.site?.geofenceRadius || 200;

  // Resolve Officer Clock-in coordinates
  const officerLat = record?.clockInLat ?? siteLat;
  const officerLng = record?.clockInLng ?? siteLng;
  const accuracy = record?.clockInAccuracy || 15;
  const distanceMeters = record?.clockInDistance;
  const isVerified = record?.clockInVerified;

  // 1. Dynamically import Leaflet and inject CSS on browser mount
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined') {
      // Inject Leaflet CSS link if not already in document
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      setIsLeafletReady(true);
    }
  }, [isOpen]);

  // 2. Initialize and re-render Leaflet Map
  useEffect(() => {
    if (!isOpen || !isLeafletReady || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous map instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map centered between Officer and Site
      const centerLat = (officerLat + siteLat) / 2;
      const centerLng = (officerLng + siteLng) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 16,
        zoomControl: false,
      });

      // Zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;

      // Function to apply tile layers
      const applyLayer = (layer: MapLayerType) => {
        if (layersRef.current.base) {
          map.removeLayer(layersRef.current.base);
        }
        if (layersRef.current.overlay) {
          map.removeLayer(layersRef.current.overlay);
          layersRef.current.overlay = undefined;
        }

        if (layer === 'street') {
          layersRef.current.base = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors',
            }
          ).addTo(map);
        } else if (layer === 'satellite') {
          layersRef.current.base = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              maxZoom: 19,
              attribution: 'Esri World Imagery',
            }
          ).addTo(map);
        } else {
          // Hybrid: Satellite imagery + Boundaries/Labels overlay
          layersRef.current.base = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              maxZoom: 19,
              attribution: 'Esri World Imagery',
            }
          ).addTo(map);

          layersRef.current.overlay = L.tileLayer(
            'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            {
              maxZoom: 19,
            }
          ).addTo(map);
        }
      };

      applyLayer(activeLayer);

      // --- 1. SITE LOCATION MARKER & GEOFENCE ZONE ---
      const siteIcon = L.divIcon({
        className: 'custom-site-marker',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            background: #6C5CE7;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 14px rgba(108, 92, 231, 0.45);
            color: #ffffff;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M6 12H4a2 2 0 0 0-2 2v8"/>
              <path d="M18 12h2a2 2 0 0 1 2 2v8"/>
              <path d="M10 6h4"/>
              <path d="M10 10h4"/>
              <path d="M10 14h4"/>
              <path d="M10 18h4"/>
            </svg>
            <div style="
              position: absolute;
              bottom: -22px;
              white-space: nowrap;
              background: #1E1B4B;
              color: #ffffff;
              font-size: 11px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 6px;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              ${record?.site?.code || 'SITE POST'}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const siteMarker = L.marker([siteLat, siteLng], { icon: siteIcon }).addTo(map);
      siteMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 4px;">
          <div style="font-weight: 700; color: #1E1B4B; font-size: 13px;">${record?.site?.name || 'Assigned Job Site'}</div>
          <div style="color: #6B7280; font-size: 11px;">Site Code: ${record?.site?.code || 'N/A'}</div>
          <div style="margin-top: 4px; color: #4B5563;">Geofence Zone: <b>${geofenceRadius}m</b> radius</div>
        </div>
      `);

      // Geofence Circle Boundary around Site
      L.circle([siteLat, siteLng], {
        radius: geofenceRadius,
        color: '#6C5CE7',
        fillColor: '#6C5CE7',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);

      // --- 2. EMPLOYEE LIVE CHECK-IN MARKER & ACCURACY ---
      const officerColor = isVerified ? '#10B981' : '#EF4444';
      const officerBg = isVerified ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';

      const officerIcon = L.divIcon({
        className: 'custom-officer-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <div style="
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: ${officerBg};
              animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              position: relative;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: ${officerColor};
              border: 3px solid #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style="
              position: absolute;
              bottom: -22px;
              white-space: nowrap;
              background: ${isVerified ? '#064E3B' : '#7F1D1D'};
              color: #ffffff;
              font-size: 11px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 6px;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              ${record?.employee?.firstName || 'Guard'} (${isVerified ? 'VERIFIED' : 'OUT OF GEOFENCE'})
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const officerMarker = L.marker([officerLat, officerLng], { icon: officerIcon }).addTo(map);
      officerMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 4px;">
          <div style="font-weight: 700; color: #111827; font-size: 13px;">${record?.employee?.firstName} ${record?.employee?.lastName}</div>
          <div style="color: #6B7280; font-size: 11px;">Officer ID: ${record?.employee?.employeeNumber}</div>
          <div style="margin-top: 4px; color: ${isVerified ? '#059669' : '#DC2626'}; font-weight: 600;">
            ${isVerified ? '✓ Inside Authorized Geofence' : '⚠ Out of Geofence Deviation'}
          </div>
          <div style="color: #4B5563; font-size: 11px; margin-top: 2px;">
            Distance to Site: <b>${distanceMeters !== undefined ? `${distanceMeters}m` : 'N/A'}</b>
          </div>
          <div style="color: #9CA3AF; font-size: 10px; margin-top: 2px;">
            GPS Accuracy: ±${accuracy}m
          </div>
        </div>
      `);

      // Device GPS Accuracy Radius Circle around Officer
      if (accuracy > 0) {
        L.circle([officerLat, officerLng], {
          radius: accuracy,
          color: officerColor,
          fillColor: officerColor,
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(map);
      }

      // --- 3. VECTOR DISTANCE POLYLINE ---
      // If officer coordinates differ from site, draw direct vector line connecting them
      if (officerLat !== siteLat || officerLng !== siteLng) {
        const polyline = L.polyline(
          [
            [officerLat, officerLng],
            [siteLat, siteLng],
          ],
          {
            color: isVerified ? '#10B981' : '#EF4444',
            weight: 3,
            dashArray: '8, 8',
            opacity: 0.85,
          }
        ).addTo(map);

        // Fit map bounds to encompass both officer and site comfortably
        const bounds = L.latLngBounds([
          [officerLat, officerLng],
          [siteLat, siteLng],
        ]);
        map.fitBounds(bounds, { padding: [60, 60] });
      } else {
        map.setView([siteLat, siteLng], 17);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, isLeafletReady, record, activeLayer, officerLat, officerLng, siteLat, siteLng, geofenceRadius]);

  // Handle Layer switch dynamically
  const handleLayerChange = (layer: MapLayerType) => {
    setActiveLayer(layer);
  };

  const handleCenterMap = () => {
    if (!mapInstanceRef.current) return;
    const centerLat = (officerLat + siteLat) / 2;
    const centerLng = (officerLng + siteLng) / 2;
    mapInstanceRef.current.setView([centerLat, centerLng], 16);
  };

  if (!isOpen || !record) return null;

  const clockInFormatted = new Date(record.clockInTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <MapPin className="w-5 h-5 text-[#A5B4FC]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Live Attendance Geofence &amp; Satellite Map
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isVerified
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isVerified ? (
                    <>
                      <ShieldCheck className="w-3 h-3" /> Within Geofence
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" /> Out of Geofence
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Officer live GPS punch telemetry vs. assigned site geofence radius.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Layer Switchers & Telemetry Quick Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-800 border-b border-slate-700 text-xs shrink-0">
          {/* Map Layer Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" /> Layer:
            </span>
            <button
              type="button"
              onClick={() => handleLayerChange('street')}
              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                activeLayer === 'street'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Street Map
            </button>
            <button
              type="button"
              onClick={() => handleLayerChange('satellite')}
              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                activeLayer === 'satellite'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleLayerChange('hybrid')}
              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                activeLayer === 'hybrid'
                  ? 'bg-[#6C5CE7] text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Hybrid
            </button>
          </div>

          {/* Quick Center Control */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCenterMap}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs border border-slate-600 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-purple-300" /> Center View
            </button>
            <a
              href={`https://www.google.com/maps?q=${officerLat},${officerLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 font-medium text-xs border border-purple-500/40 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Google Maps
            </a>
          </div>
        </div>

        {/* Interactive Map Viewport */}
        <div className="relative flex-1 min-h-[380px] w-full bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />

          {/* Floating On-Map Telemetry Card */}
          <div className="absolute bottom-4 left-4 z-40 bg-slate-900/90 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl max-w-sm text-xs space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-purple-400" /> Live Telemetry
              </span>
              <span className="text-[11px] font-mono text-purple-300 font-bold">
                {distanceMeters !== undefined ? `${distanceMeters}m to Site` : 'Position Locked'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Officer GPS:</span>
                <span className="font-mono text-slate-200">
                  {officerLat.toFixed(5)}, {officerLng.toFixed(5)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Site Center:</span>
                <span className="font-mono text-slate-200">
                  {siteLat.toFixed(5)}, {siteLng.toFixed(5)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span>Allowed Radius: <b className="text-white">{geofenceRadius}m</b></span>
              <span>GPS Precision: <b className="text-white">±{accuracy}m</b></span>
            </div>
          </div>
        </div>

        {/* Modal Footer: Officer & Site Meta details */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
            {/* Officer Details */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-purple-100 text-[#6C5CE7] flex items-center justify-center font-bold text-xs shrink-0">
                {record.employee?.firstName?.[0] || 'O'}
                {record.employee?.lastName?.[0] || 'F'}
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-900 truncate">
                  {record.employee?.firstName} {record.employee?.lastName}
                </p>
                <p className="text-[11px] text-slate-500">
                  ID: {record.employee?.employeeNumber || 'Guard'}
                </p>
              </div>
            </div>

            {/* Site Details */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-900 truncate">{record.site?.name}</p>
                <p className="text-[11px] text-slate-500">Code: {record.site?.code}</p>
              </div>
            </div>

            {/* Clock-In Time & Status */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Clocked In: {clockInFormatted}</p>
                <p className="text-[11px] text-slate-500">
                  Status: <span className="capitalize font-semibold text-slate-700">{record.status.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500">
              {isVerified
                ? 'Officer is confirmed on-site within statutory geofence boundaries.'
                : 'Officer clocked in beyond the site geofence perimeter. Manager review recommended.'}
            </p>

            <div className="flex items-center gap-2">
              {onReconcile && !isVerified && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReconcile(record);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#6C5CE7] border border-purple-200 text-xs font-semibold transition-colors"
                >
                  Reconcile / Authorize Post
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
