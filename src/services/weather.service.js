import { equipmentRepository } from "../repositories/equipment.repository.js";
import { getWeatherForecast } from "./weatherProvider.service.js";
import { weatherConfig } from "../config/env.js";

import { NotFoundError } from "../errors/NotFoundError.js";
import { AppError } from "../errors/AppError.js";

export const weatherService = {
  async getEquipmentWeather(equipmentId , { days = 1}) {
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
      const {data, source, fetchedAt} = await getWeatherForecast({
        lat: equipment.location.lat,
        lon: equipment.location.lon,
        days,
        signal: controller.signal,
      });

      const today = data[0];

      const suitable =
        (weatherConfig.allowPrecipitation ||
          today.precipitation === false) &&
        today.windSpeed < weatherConfig.maxWindSpeed;

      return {
        equipmentId: equipment.id,
        location: equipment.location,
        source,
        fetchedAt,
        data,
        outdoorWorkSuitable: suitable,
        criteria: {
          maxWindSpeed: weatherConfig.maxWindSpeed,
          allowPrecipitation: weatherConfig.allowPrecipitation,
        },
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