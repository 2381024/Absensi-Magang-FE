import { useState, useEffect, useCallback, useMemo } from 'react';
import Map, { NavigationControl, Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import circle from '@turf/circle';

export default function GeofenceMap({
  center = [-6.2088, 106.8456],
  zoom = 13,
  markers = [],
  selectedPosition,
  radius,
  onPositionSelect,
  interactive = false,
  height = 400,
  className = '',
}) {
  const [viewState, setViewState] = useState({
    longitude: selectedPosition ? selectedPosition.lng : center[1],
    latitude: selectedPosition ? selectedPosition.lat : center[0],
    zoom: zoom
  });

  // Keep viewState updated if `selectedPosition` changes externally
  useEffect(() => {
    if (selectedPosition) {
      setViewState(prev => ({
        ...prev,
        longitude: selectedPosition.lng,
        latitude: selectedPosition.lat
      }));
    }
  }, [selectedPosition]);

  const handleClick = useCallback((e) => {
    if (interactive && onPositionSelect) {
      onPositionSelect({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    }
  }, [interactive, onPositionSelect]);

  const handleDragEnd = useCallback((e) => {
    if (onPositionSelect) {
      onPositionSelect({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    }
  }, [onPositionSelect]);

  const circlesGeoJSON = useMemo(() => {
    const features = markers.map((m, i) => {
      const centerPt = [Number(m.longitude), Number(m.latitude)];
      const r = Number(m.radius_meters) / 1000; // turf takes radius in kilometers
      return circle(centerPt, r, { 
        steps: 64, 
        units: 'kilometers', 
        properties: { id: m.id || i, isActive: m.is_active } 
      });
    });

    if (selectedPosition && radius && interactive) {
      const centerPt = [selectedPosition.lng, selectedPosition.lat];
      const r = Number(radius) / 1000;
      features.push(circle(centerPt, r, { 
        steps: 64, 
        units: 'kilometers', 
        properties: { id: 'selected', isActive: true, isSelected: true } 
      }));
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [markers, selectedPosition, radius, interactive]);

  const fillLayerStyle = {
    id: 'geofence-circles-fill',
    type: 'fill',
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'isActive'], true], '#6c63ff',
        '#64748b'
      ],
      'fill-opacity': [
        'case',
        ['==', ['get', 'isSelected'], true], 0.2,
        0.15
      ]
    }
  };

  const strokeLayerStyle = {
    id: 'geofence-circles-stroke',
    type: 'line',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'isActive'], true], '#6c63ff',
        '#64748b'
      ],
      'line-width': 2
    }
  };

  return (
    <div style={{ height, borderRadius: 'var(--radius-md)', overflow: 'hidden' }} className={className}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        onClick={handleClick}
        interactiveLayerIds={interactive ? undefined : []} // Prevents click events on layers if we only want map clicks
      >
        <NavigationControl position="top-right" />

        {/* Existing Geofence Circles */}
        <Source id="geofences" type="geojson" data={circlesGeoJSON}>
          <Layer {...fillLayerStyle} />
          <Layer {...strokeLayerStyle} />
        </Source>

        {/* Existing markers */}
        {markers.map((m, i) => (
          <Marker 
            key={`marker-${m.id || i}`} 
            longitude={Number(m.longitude)} 
            latitude={Number(m.latitude)} 
            color={m.is_active ? '#6c63ff' : '#64748b'} 
          />
        ))}

        {/* Selected position for editing */}
        {selectedPosition && interactive && (
          <Marker
            longitude={selectedPosition.lng}
            latitude={selectedPosition.lat}
            draggable
            onDragEnd={handleDragEnd}
            color="#6c63ff"
          />
        )}
      </Map>
    </div>
  );
}
