/* global window */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react';
import { FlyToInterpolator } from 'deck.gl';
import { TripsLayer } from '@deck.gl/geo-layers';
import { scaleSequential, scaleLinear } from 'd3-scale';
import { interpolateBlues, interpolateGreens } from 'd3-scale-chromatic';
import { rgb } from 'd3-color';


const INITIAL_VIEW_STATE = {
  longitude: 2.2882695,
  latitude: 46.9491073,
  zoom: 5,
  pitch: 5,
  bearing: 0
};

// View state for Paris
const PARIS_VIEW_STATE = {
  longitude: 2.3522,
  latitude: 48.8566,
  zoom: 11,
  pitch: 30,
  bearing: 0
};

//const MAP_STYLE_DAY = 'https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const MAP_STYLE_DAY = 'https://api.jawg.io/styles/jawg-sunny.json?access-token=PloxOfmKiUbkBGlC0pazNY8inlQKTd4Vzo3UcvcrFxDT0WvmxHVV1ya1ElBdkj42';
//const MAP_STYLE_NIGHT = 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const MAP_STYLE_NIGHT = 'https://api.jawg.io/styles/jawg-dark.json?access-token=PloxOfmKiUbkBGlC0pazNY8inlQKTd4Vzo3UcvcrFxDT0WvmxHVV1ya1ElBdkj42';




export default function App({
  trailLength = 3000,
  initialViewState = INITIAL_VIEW_STATE,
  animationSpeed = 50
}) {
  const [time, setTime] = useState(1701043200);
  const [animation] = useState({});
  const [isPlaying, setIsPlaying] = useState(false); // To track whether the animation is playing or paused
  const [displayTime, setDisplayTime] = useState(time);
  // State hooks to manage the opacities of the two maps
  const [dayMapOpacity, setDayMapOpacity] = useState(0); // Day map is visible initially
  const [nightMapOpacity, setNightMapOpacity] = useState(1); // Night map is hidden
  const [viewState, setViewState] = useState(initialViewState);

  const [manualMode, setManualMode] = useState(false); // State to track manual mode
  const [manualDaytime, setManualDaytime] = useState(true); // State to track manual day/night mode

  const [customLongitude, setCustomLongitude] = useState('2.3522'); // Default values for Paris
  const [customLatitude, setCustomLatitude] = useState('48.8566');
  const [customZoom, setCustomZoom] = useState('11');
  const [customPitch, setCustomPitch] = useState('30');

  // State hook to manage whether it is currently daytime
  const [isDaytime, setIsDaytime] = useState(() => {
    const currentHour = new Date(time * 1000).getHours();
    return currentHour >= 6 && currentHour < 18;
  });

  useEffect(() => {
    if (manualMode) {
      setDayMapOpacity(manualDaytime ? 1 : 0);
      setNightMapOpacity(manualDaytime ? 0 : 1);
    }
  }, [manualMode, manualDaytime]);

  // Function to toggle the manualDaytime state
  const toggleDaytime = () => {
    // Toggle only if we're in manual mode
    if (manualMode) {
      setManualDaytime(!manualDaytime);
    }
  };

  const onViewStateChange = ({ viewState }) => {
    setViewState(viewState);
  };

  // Function to smooth transition to a specific view state
  const goToLocation = (targetViewState) => {
    setViewState({
      ...viewState,
      ...targetViewState,
      transitionDuration: 2000, // in milliseconds, adjust to your preference
      transitionInterpolator: new FlyToInterpolator()
    });
  };

  const goToCustomLocation = () => {
    const targetViewState = {
      longitude: parseFloat(customLongitude),
      latitude: parseFloat(customLatitude),
      zoom: parseFloat(customZoom),
      pitch: parseFloat(customPitch),
      bearing: 0,
      transitionDuration: 2000,
      transitionInterpolator: new FlyToInterpolator()
    };
    setViewState(targetViewState);
  };



  const animate = () => {
    setTime((t) => {
      let new_t;
      if (t > 1701388800) {
        new_t = 1701043200;
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

  useEffect(() => {
    // Calculate if it is day or night based on the `time`
    const currentHour = new Date(time * 1000).getHours();
    const isNowDaytime = currentHour >= 6 && currentHour < 18;

    // Only update state if there is an actual change from day to night, or night to day
    if ((isDaytime !== isNowDaytime) && !manualMode) {
      setIsDaytime(isNowDaytime); // Update the daytime state

      // Update opacities to initiate the transition
      setDayMapOpacity(isNowDaytime ? 1 : 0);
      setNightMapOpacity(isNowDaytime ? 0 : 1);
    }
  }, [time]);



  const colorScale = scaleLinear()
    .domain([0, 25])
    .range(['#ffce00', '#ff7400']); // Use colors that stand out on a dark background

  function getColorFromQuantity(quantity) {
    const colorHex = (colorScale)(Math.min(quantity, 15));
    const rgbColor = rgb(colorHex);
    return [rgbColor.r, rgbColor.g, rgbColor.b, 255];
  }

  const layers = [
    new TripsLayer({
      id: 'trips',
      data: '/trips.json',
      getPath: d => d.coordinates,
      getTimestamps: d => d.timestamps,
      getColor: d => getColorFromQuantity(d.quantity),
      opacity: 1,
      widthMinPixels: 4,
      rounded: true,
      trailLength: trailLength,
      currentTime: time, // Use sliderValue when paused
      shadowEnabled: false
    })
  ];

  return (
    <div>
      {/* Keep your DeckGL component intact */}
      <DeckGL
        initialViewState={initialViewState}
        viewState={viewState} // Pass viewState to DeckGL
        onViewStateChange={onViewStateChange} // Update viewState on change
        controller={true}
        layers={layers}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Day map container */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transition: 'opacity 2.5s',
          opacity: dayMapOpacity,
          pointerEvents: nightMapOpacity === 1 ? 'none' : 'auto',
          zIndex: -1
        }}>
          <Map
            reuseMaps
            mapLib={maplibregl}
            mapStyle={MAP_STYLE_DAY}
            preventStyleDiffing={true}
            viewState={viewState} // Synchronize the viewState with DeckGL
          />
        </div>
        {/* Night map container */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transition: 'opacity 2.5s',
          opacity: nightMapOpacity,
          pointerEvents: dayMapOpacity === 1 ? 'none' : 'auto',
          zIndex: -1
        }}>
          <Map
            reuseMaps
            mapLib={maplibregl}
            mapStyle={MAP_STYLE_NIGHT}
            preventStyleDiffing={true}
            viewState={viewState} // Synchronize the viewState with DeckGL
          />
        </div>

      </DeckGL>

      {/* Your existing UI components such as the date/time display and play/pause button */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255, 255, 255, 0.8)', padding: '10px', borderRadius: '5px', width: '10%' }}>
        <div>
          {new Date(displayTime * 1000).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
          })}
          <button onClick={() => {
            setIsPlaying(!isPlaying);
          }}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <input
            type="range"
            min={1701043200}
            max={1701388800}
            step={animationSpeed}
            value={time}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value);
              setTime(newTime);
              setDisplayTime(newTime);
            }}
          />
        </div>
        <div>
          {/* Button to enable/disable manual mode */}
          <button onClick={() => setManualMode(!manualMode)}>
            Mode nuit/jour manuel : {manualMode ? 'Désactiver' : 'Activer'}
          </button>

          {/* Button to toggle between day and night mode, shown only when manualMode is enabled */}
          {manualMode && (
            <button onClick={toggleDaytime}>
              Changer pour la vue {manualDaytime ? 'Nuit' : 'Jour'}
            </button>
          )}
        </div>
        <div>
          <button onClick={() => goToLocation(PARIS_VIEW_STATE)}>
            Go to Paris
          </button>
        </div>
        <div>
          <div>
            <label>
              Longitude:
              <input type="text" value={customLongitude} onChange={e => setCustomLongitude(e.target.value)} />
            </label>
          </div>

          <div>
            <label>
              Latitude:
              <input type="text" value={customLatitude} onChange={e => setCustomLatitude(e.target.value)} />
            </label>
          </div>

          <div>
            <label>
              Zoom:
              <input type="text" value={customZoom} onChange={e => setCustomZoom(e.target.value)} />
            </label>
          </div>

          <div>
            <label>
              Pitch:
              <input type="text" value={customPitch} onChange={e => setCustomPitch(e.target.value)} />
            </label>
          </div>


          <button onClick={goToCustomLocation}>
            Voler!
          </button>
          <button onClick={e => goToLocation(initialViewState)}>
            Reset la vue
          </button>
        </div>

      </div>
    </div>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
