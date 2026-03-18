import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";

const CityCoordinates: Record<string, { latitude: number; longitude: number }> = {
  "北京": { latitude: 39.9, longitude: 116.4 },
  "上海": { latitude: 31.2, longitude: 121.5 },
  "杭州": { latitude: 30.3, longitude: 120.2 },
  "广州": { latitude: 23.1, longitude: 113.3 },
  "深圳": { latitude: 22.5, longitude: 114.1 },
  "成都": { latitude: 30.6, longitude: 104.1 },
  "武汉": { latitude: 30.6, longitude: 114.3 },
  "南京": { latitude: 32.1, longitude: 118.8 },
  "西安": { latitude: 34.3, longitude: 108.9 },
  "重庆": { latitude: 29.6, longitude: 106.5 },
  "天津": { latitude: 39.1, longitude: 117.2 },
  "苏州": { latitude: 31.3, longitude: 120.6 },
  "长沙": { latitude: 28.2, longitude: 113.0 },
  "郑州": { latitude: 34.7, longitude: 113.7 },
  "东京": { latitude: 35.7, longitude: 139.7 },
  "纽约": { latitude: 40.7, longitude: -74.0 },
  "伦敦": { latitude: 51.5, longitude: -0.1 },
  "巴黎": { latitude: 48.9, longitude: 2.3 },
  "新加坡": { latitude: 1.3, longitude: 103.8 },
  "首尔": { latitude: 37.6, longitude: 127.0 },
};

const WeatherParams = Type.Object({
  city: Type.String({ description: "城市名称，如：北京、上海、杭州" }),
});

type WeatherParamsType = Static<typeof WeatherParams>;

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    wind_speed_10m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    apparent_temperature?: number;
  };
}

const weatherCodeMap: Record<number, string> = {
  0: "晴天",
  1: "大部晴朗",
  2: "局部多云",
  3: "阴天",
  45: "雾",
  48: "沉积雾凇",
  51: "小毛毛雨",
  53: "中毛毛雨",
  55: "大毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "小阵雨",
  81: "中阵雨",
  82: "大阵雨",
  95: "雷暴",
  96: "雷暴伴小冰雹",
  99: "雷暴伴大冰雹",
};

function getWeatherDescription(code: number): string {
  return weatherCodeMap[code] ?? "未知天气";
}

async function fetchWeather(city: string): Promise<string> {
  const coords = CityCoordinates[city];
  if (!coords) {
    const supported = Object.keys(CityCoordinates).join("、");
    return `抱歉，暂不支持查询「${city}」的天气。目前支持的城市有：${supported}`;
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", coords.latitude.toString());
  url.searchParams.set("longitude", coords.longitude.toString());
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
  );
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString());
  if (!res.ok) {
    return `获取天气数据失败：HTTP ${res.status}`;
  }

  const data: OpenMeteoResponse = await res.json();
  const current = data.current;

  if (!current) {
    return "未能获取当前天气数据";
  }

  const temp = current.temperature_2m ?? "N/A";
  const feelsLike = current.apparent_temperature ?? "N/A";
  const humidity = current.relative_humidity_2m ?? "N/A";
  const windSpeed = current.wind_speed_10m ?? "N/A";
  const weatherDesc = current.weather_code !== undefined
    ? getWeatherDescription(current.weather_code)
    : "未知";

  return [
    `${city}当前天气：${weatherDesc}`,
    `温度：${temp}°C（体感 ${feelsLike}°C）`,
    `湿度：${humidity}%`,
    `风速：${windSpeed} km/h`,
  ].join("\n");
}

export const weatherTool: AgentTool<typeof WeatherParams> = {
  name: "get_weather",
  description: "获取指定城市的当前天气信息，包括温度、湿度、风速和天气状况",
  label: "获取天气",
  parameters: WeatherParams,
  execute: async (
    _toolCallId: string,
    params: WeatherParamsType
  ): Promise<AgentToolResult<string>> => {
    const result = await fetchWeather(params.city);
    return {
      content: [{ type: "text", text: result }],
      details: result,
    };
  },
};

export function getSupportedCities(): string[] {
  return Object.keys(CityCoordinates);
}
