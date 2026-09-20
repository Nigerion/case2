import { weatherService } from "../services/weather.service.js";

export const weatherController = {
  async getEquipmentWeather(req, res) {
    const result = await weatherService.getEquipmentWeather(
      req.params.id,
    );

    res.status(200).json({
      data: result,
    });
  },
};