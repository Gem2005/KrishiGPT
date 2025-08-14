export { WeatherService } from './service'
export type { WeatherData, WeatherMapData, LocationCoordinates } from './providers/base-provider'
export { WeatherProvider } from './providers/base-provider'
export { IMDProvider } from './providers/imd-provider'
export { OpenWeatherMapProvider } from './providers/openweathermap-provider'
export { MockProvider } from './providers/mock-provider'

// Re-export OpenWeatherMap specific types
export type { 
  WeatherMapLayer, 
  WeatherMapOptions, 
  TileCoordinates 
} from './providers/openweathermap-provider'
