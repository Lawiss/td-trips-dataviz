/* global window */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import { TripsLayer } from '@deck.gl/geo-layers';




const INITIAL_VIEW_STATE = {
  longitude: 2.2882695,
  latitude: 46.9491073,
  zoom: 5,
  pitch: 5,
  bearing: 0
};

const MAP_STYLE = 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json';



export default function App({
  trailLength = 2000,
  initialViewState = INITIAL_VIEW_STATE,
  mapStyle = MAP_STYLE,
  animationSpeed = 25
}) {
  const [time, setTime] = useState(1698278400);
  const [animation] = useState({});
  const [isPlaying, setIsPlaying] = useState(false); // To track whether the animation is playing or paused
  const [displayTime, setDisplayTime] = useState(time);

  const animate = () => {
    setTime((t) => {
      let new_t;
      if (t > 1698410761.781) {
        new_t = 1698278400;
      } else {
        new_t = t + (isPlaying ? animationSpeed : 0); // Only advance time if playing
      }
      setDisplayTime(new_t); // Update displayTime
      return new_t;
    });
    animation.id = window.requestAnimationFrame(animate);
  };



  useEffect(() => {
    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [isPlaying]);

  const layers = [
    new TripsLayer({
      id: 'trips',
      data: "https://raw.githubusercontent.com/Lawiss/td-trips-dataviz/main/public/trips.json",
      getPath: d => d.coordinates,
      getTimestamps: d => d.timestamps,
      getColor: d => [23, 184, 190],
      opacity: 1,
      widthMinPixels: 3,
      rounded: true,
      trailLength: trailLength,
      currentTime: time, // Use sliderValue when paused
      shadowEnabled: false
    })
  ];

  return (
    <div>
      <DeckGL
        layers={layers}
        initialViewState={initialViewState}
        controller={true}
      >
        <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      </DeckGL>
      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255, 255, 255, 0.8', padding: '10px', borderRadius: '5px' }}>
        {new Date(displayTime * 1000).toLocaleString()}
        <button onClick={() => {
          setIsPlaying(!isPlaying)
        }}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min={1698278400}
          max={1698410761.781}
          step={animationSpeed}
          value={time}
          onChange={(e) => {
            const newTime = parseFloat(e.target.value);
            setTime(newTime);
            setDisplayTime(newTime); // Update displayTime
          }}
        />
      </div>
    </div>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
