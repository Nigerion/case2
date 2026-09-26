import { env } from "../config/env.js";

export async function getWeatherForecast({ lat, lon, days = 1, signal }) {
  if (!env.weatherApiUrl) {
    return { ...mockForecast(lat, lon, days), source: "mock"}
  }

  const url = new URL(env.weatherApiUrl);

  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
  );
  url.searchParams.set("forecast_days", String(days));
  url.searchParams.set("timezone", "auto");
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
  const current = payload.daily ?? {};

  if (!daily.time?.length) {
   const error = new Error(
      `Weather API returned no data`,
    );
    error.name = "WeatherApiError";
    throw error;
  }

  const data = current.time.map((date, i) => ({
        date,
        temperature_2m_min: temperature_2m_min[i],
        temperature_2m_max: temperature_2m_max[i],
        precipitation_sum: precipitation_sum[i],
    }));


  return {
    data, 
    source:"OpenMeteo",
    fetchedAt: new Date().toISOString(),
  };
}

function mockForecast(lat, lon, days) {
  const windSpeed = Math.abs(Math.sin(lat + lon)) * 15;
  const data = Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
    temperatureMin: 10 + i,
    temperatureMax: 18 + i,
    precipitation: false,
    windSpeed: Number((windSpeed + i * 0.3).toFixed(2)),
  }));

  return {
    data,
    fetchedAt: new Date().toISOString(),
  };
}