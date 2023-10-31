/* global window */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ ambientLight, pointLight });

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
};

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect]
};

const INITIAL_VIEW_STATE = {
  longitude: 2.2882695,
  latitude: 46.9491073,
  zoom: 5,
  pitch: 5,
  bearing: 0
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

const res = await fetch('public/trips.json')
const DATA = await res.json()
console.log(DATA)

const landCover = [
  [
    [-74.0, 40.7],
    [-74.02, 40.7],
    [-74.02, 40.72],
    [-74.0, 40.72]
  ]
];

export default function App({
  trips = DATA,
  trailLength = 500,
  initialViewState = INITIAL_VIEW_STATE,
  mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  animationSpeed = 25
}) {
  const [time, setTime] = useState(1698278400);
  const [animation] = useState({});
  const [currentDateString, setCurrentDateString] = useState('');

  const animate = () => {
    setTime(t => {
      //console.log("This is t :", t)
      let new_t;
      if (t > 1698410761.781) {
        new_t = 1698278400
      } else {
        new_t = t + animationSpeed
      }
      setCurrentDateString(new Date(new_t * 1000).toLocaleString());
      //console.log(new_t)  
      return new_t
    });
    animation.id = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [animation]);

  const layers = [
    // This is only needed when using shadow effects
    new PolygonLayer({
      id: 'ground',
      data: landCover,
      getPolygon: f => f,
      stroked: false,
      getFillColor: [0, 0, 0, 0]
    }),
    new TripsLayer({
      id: 'trips',
      data: trips,
      getPath: d => d.coordinates,
      getTimestamps: d => d.timestamps,
      getColor: d => theme.trailColor1,
      opacity: 1,
      widthMinPixels: 3,
      rounded: true,
      trailLength,
      currentTime: time,

      shadowEnabled: false
    })
  ];

  return (
    <div>
      <DeckGL
        layers={layers}
        effects={theme.effects}
        initialViewState={initialViewState}
        controller={true}
      >
        <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
      </DeckGL>
      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255, 255, 255, 0.8', padding: '10px', borderRadius: '5px' }}>
        {currentDateString}
      </div>
    </div>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
