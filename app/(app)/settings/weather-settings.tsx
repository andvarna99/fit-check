"use client";

import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import type { TempUnit } from "@/lib/outfits/weather";
import { cityLabel, searchCities, type City } from "@/lib/weather/open-meteo";
import { useTempUnit, useWeatherLocation, type WeatherLocation } from "@/lib/weather/prefs";
import { loadWeather } from "@/lib/weather/store";

const UNIT_OPTIONS = [
  { value: "F", label: "°F" },
  { value: "C", label: "°C" },
] as const;

export function WeatherSettings() {
  const [location, setLocation] = useWeatherLocation();
  const [unit, setUnit] = useTempUnit();
  const [searching, setSearching] = useState(false);

  function choose(next: WeatherLocation) {
    setLocation(next);
    void loadWeather(true);
  }

  return (
    <>
      <section aria-labelledby="weather-location" className="flex flex-col gap-2">
        <h2 id="weather-location" className="type-title-sm">
          Weather location
        </h2>
        <div className="fc-group">
          <div className="fc-li">
            <span className="type-body-strong">Use current location</span>
            <Switch
              label="Use current location"
              checked={location.mode === "device"}
              onChange={(on) => (on ? choose({ mode: "device" }) : setSearching(true))}
            />
          </div>
          <button type="button" className="fc-li" onClick={() => setSearching(true)}>
            <span className="flex min-w-0 flex-col">
              <span className={location.mode === "city" ? "type-body-strong" : "type-body-strong !text-ink-muted"}>
                {location.mode === "city" ? cityLabel(location.city) : "Set a city"}
              </span>
              <span className="type-caption">
                {location.mode === "city" ? "Weather for this city" : "Use a city instead of your location"}
              </span>
            </span>
            <Icon name="right" size={20} className="flex-none text-ink-muted" />
          </button>
        </div>
        <p className="type-caption">Your location goes only to Open-Meteo for the forecast. It isn&apos;t saved anywhere else.</p>
      </section>

      <section aria-labelledby="temp-unit" className="flex flex-col gap-2">
        <h2 id="temp-unit" className="type-title-sm">
          Temperature unit
        </h2>
        <Segmented<TempUnit> label="Temperature unit" options={UNIT_OPTIONS} value={unit} onChange={(u) => u && setUnit(u)} />
      </section>

      <CitySheet
        open={searching}
        onClose={() => setSearching(false)}
        onPick={(city) => {
          choose({ mode: "city", city });
          setSearching(false);
        }}
      />
    </>
  );
}

function CitySheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (city: City) => void }) {
  return open ? <CitySearch onClose={onClose} onPick={onPick} /> : null;
}

type SearchState = { status: "idle" } | { status: "loading" } | { status: "done"; results: City[] } | { status: "error" };

function CitySearch({ onClose, onPick }: { onClose: () => void; onPick: (city: City) => void }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearch({ status: "loading" });
      searchCities(trimmed, controller.signal)
        .then((results) => setSearch({ status: "done", results }))
        .catch((error: unknown) => {
          if (!controller.signal.aborted) setSearch({ status: "error" });
          return error;
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const shown: SearchState = trimmed.length < 2 ? { status: "idle" } : search;

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="Set a city"
      footer={
        <Button variant="secondary" block onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="fc-search">
          <Icon name="search" size={20} />
          <input
            type="search"
            placeholder="Search cities"
            aria-label="Search cities"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            enterKeyHint="search"
            autoFocus
          />
        </label>
        <div aria-live="polite">
          {shown.status === "idle" ? <p className="type-caption">Type at least two letters.</p> : null}
          {shown.status === "loading" ? <p className="type-caption">Searching...</p> : null}
          {shown.status === "error" ? <p className="type-body text-danger">City search isn&apos;t working right now. Try again.</p> : null}
          {shown.status === "done" && shown.results.length === 0 ? <p className="type-body text-ink-muted">No cities match “{trimmed}”.</p> : null}
          {shown.status === "done" && shown.results.length ? (
            <ul className="fc-group">
              {shown.results.map((city) => (
                <li key={`${city.latitude},${city.longitude}`}>
                  <button type="button" className="fc-li" onClick={() => onPick(city)}>
                    <span className="flex min-w-0 flex-col">
                      <span className="type-body-strong">{city.name}</span>
                      {city.region ? <span className="type-caption">{city.region}</span> : null}
                    </span>
                    <Icon name="pin" size={20} className="flex-none text-lavender-500" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </BottomSheet>
  );
}
