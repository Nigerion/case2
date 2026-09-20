import { env } from "../config/env.js";

export async function getWeatherForecast({ lat, lon, signal }) {
  if (!env.weatherApiUrl) {
    return mockForecast(lat, lon);
  }

  const url = new URL(env.weatherApiUrl);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,wind_speed_10m,precipitation",
  );
  url.searchParams.set("wind_speed_unit", "ms");

  const response = await fetch(url, { signal });

  if (!response.ok) {
    const error = new Error(
      `Weather API responded with ${response.status}`,
    );
    error.name = "WeatherApiError";
    throw error;
  }

  const payload = await response.json();
  const current = payload.current ?? {};

  return {
    temperature: Number(current.temperature_2m ?? 0),
    windSpeed: Number(current.wind_speed_10m ?? 0),
    precipitation: Number(current.precipitation ?? 0) > 0,
    fetchedAt: new Date().toISOString(),
  };
}

function mockForecast(lat, lon) {
  const windSpeed = Math.abs(Math.sin(lat + lon)) * 15;
  return {
    temperature: 15,
    windSpeed: Number(windSpeed.toFixed(2)),
    precipitation: false,
    fetchedAt: new Date().toISOString(),
  };
}