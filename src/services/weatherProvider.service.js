import { z } from "zod";
import { env } from "../config/env.js";

const dailyForecastSchema = z
  .object({
    time: z.array(z.string()).min(1),
    temperature_2m_min: z.array(z.number().finite()),
    temperature_2m_max: z.array(z.number().finite()),
    precipitation_sum: z.array(z.number().finite()),
    wind_speed_10m_max: z.array(z.number().finite()),
  })
  .refine((daily) =>
    Object.values(daily).every((values) => values.length === daily.time.length),
  );

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
  const result = dailyForecastSchema.safeParse(payload?.daily);

  if (!result.success) {
    const error = new Error("Weather API returned invalid daily data");
    error.name = "WeatherApiError";
    throw error;
  }

  const daily = result.data;
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