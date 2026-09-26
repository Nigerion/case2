import { env } from "../config/env.js";

export async function getWeatherForecast({ lat, lon, days = 1, signal }) {
  if (!env.weatherApiUrl) {
    return { ...mockForecast(lat, lon, days), source: "mock" };
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
  const daily = payload.daily;

  if (
    !Array.isArray(daily?.time) ||
    !Array.isArray(daily.temperature_2m_min) ||
    !Array.isArray(daily.temperature_2m_max) ||
    !Array.isArray(daily.precipitation_sum) ||
    !Array.isArray(daily.wind_speed_10m_max) ||
    daily.time.length === 0 ||
    daily.temperature_2m_min.length < daily.time.length ||
    daily.temperature_2m_max.length < daily.time.length ||
    daily.precipitation_sum.length < daily.time.length ||
    daily.wind_speed_10m_max.length < daily.time.length ||
    daily.time.some((date) => typeof date !== "string") ||
    daily.temperature_2m_min.some((value) => !Number.isFinite(value)) ||
    daily.temperature_2m_max.some((value) => !Number.isFinite(value)) ||
    daily.precipitation_sum.some((value) => !Number.isFinite(value)) ||
    daily.wind_speed_10m_max.some((value) => !Number.isFinite(value))
  ) {
    const error = new Error("Weather API returned incomplete daily data");
    error.name = "WeatherApiError";
    throw error;
  }

  const data = daily.time.map((date, index) => ({
    date,
    temperatureMin: daily.temperature_2m_min[index],
    temperatureMax: daily.temperature_2m_max[index],
    precipitation: daily.precipitation_sum[index] > 0,
    windSpeed: daily.wind_speed_10m_max[index],
  }));

  return {
    data,
    source: "OpenMeteo",
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