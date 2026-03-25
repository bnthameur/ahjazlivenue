'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

interface MapPickerInnerProps {
    lat: number | null;
    lng: number | null;
    onLocationChange: (lat: number, lng: number) => void;
}

// Inner component that uses Leaflet directly — only rendered on client
function MapPickerInner({ lat, lng, onLocationChange }: MapPickerInnerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Dynamically import leaflet to avoid SSR issues
        import('leaflet').then((L) => {
            // Fix default marker icon paths broken by webpack
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            const defaultLat = lat ?? 36.7538;
            const defaultLng = lng ?? 3.0588;

            const map = L.map(containerRef.current!).setView([defaultLat, defaultLng], 12);
            mapRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            // Add marker if lat/lng are set
            if (lat !== null && lng !== null) {
                const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
                markerRef.current = marker;

                marker.on('dragend', () => {
                    const pos = marker.getLatLng();
                    onLocationChange(
                        Math.round(pos.lat * 1000000) / 1000000,
                        Math.round(pos.lng * 1000000) / 1000000
                    );
                });
            }

            // Click to place/move marker
            map.on('click', (e: any) => {
                const { lat: clickLat, lng: clickLng } = e.latlng;
                const roundedLat = Math.round(clickLat * 1000000) / 1000000;
                const roundedLng = Math.round(clickLng * 1000000) / 1000000;

                if (markerRef.current) {
                    markerRef.current.setLatLng([roundedLat, roundedLng]);
                } else {
                    const marker = L.marker([roundedLat, roundedLng], { draggable: true }).addTo(map);
                    markerRef.current = marker;
                    marker.on('dragend', () => {
                        const pos = marker.getLatLng();
                        onLocationChange(
                            Math.round(pos.lat * 1000000) / 1000000,
                            Math.round(pos.lng * 1000000) / 1000000
                        );
                    });
                }

                onLocationChange(roundedLat, roundedLng);
            });
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync marker when lat/lng prop changes externally (e.g. user typed in the fields)
    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return;
        if (lat !== null && lng !== null) {
            markerRef.current.setLatLng([lat, lng]);
            mapRef.current.setView([lat, lng], mapRef.current.getZoom());
        }
    }, [lat, lng]);

    return (
        <>
            {/* Inject Leaflet CSS */}
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
            />
            <div
                ref={containerRef}
                style={{ height: '300px', width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
            />
        </>
    );
}

// Export a dynamic no-SSR wrapper so Leaflet never runs on the server
const MapPicker = dynamic(
    () => Promise.resolve(MapPickerInner),
    {
        ssr: false,
        loading: () => (
            <div
                className="w-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm"
                style={{ height: '300px' }}
            >
                <span>تحميل الخريطة...</span>
            </div>
        ),
    }
);

export default MapPicker;
