import { equipmentRepository } from "../repositories/equipment.repository.js";
import { getWeatherForecast } from "./weatherProvider.service.js";
import { weatherConfig } from "../config/env.js";

import {
  NotFoundError,
  AppError,
} from "../errors/AppError.js";

export const weatherService = {
  async getEquipmentWeather(equipmentId) {
    const equipment = await equipmentRepository.findById(
      equipmentId,
    );

    if (!equipment) {
      throw new NotFoundError("Оборудование не найдено");
    }

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      weatherConfig.timeoutMs,
    );

    try {
      const forecast = await getWeatherForecast({
        lat: equipment.location.lat,
        lon: equipment.location.lon,
        signal: controller.signal,
      });

      const suitable =
        (weatherConfig.allowPrecipitation ||
          forecast.precipitation === false) &&
        forecast.windSpeed < weatherConfig.maxWindSpeed;

      return {
        equipmentId: equipment.id,
        location: equipment.location,
        forecast,
        outdoorWorkSuitable: suitable,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new AppError(
          "Погодный сервис не ответил вовремя",
          504,
          "WEATHER_TIMEOUT",
        );
      }

      throw new AppError(
        "Не удалось получить прогноз погоды",
        502,
        "WEATHER_API_ERROR",
      );
    } finally {
      clearTimeout(timeout);
    }
  },
};