export interface WeatherData {
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  condition: string
  forecast: string
  // Extended fields for IMD
  pressure?: number
  visibility?: number
  uvIndex?: number
  soilMoisture?: number
  cropAdvisory?: string
  source: 'imd' | 'openweathermap' | 'mock'
  location: string
  // Additional IMD-specific fields
  departureFromNormal?: number
  rainfallCategory?: string
  warnings?: string[]
  nowcastCategory?: string
  timestamp: string
}

// Weather map interfaces
export interface WeatherMapData {
  layer: string
  url: string
  timestamp?: number
  description?: string
  coordinates?: {
    zoom: number
    x: number
    y: number
  }
}

export interface LocationCoordinates {
  latitude: number
  longitude: number
  name?: string
}

export abstract class WeatherProvider {
  abstract getName(): string
  abstract getWeather(location: string): Promise<WeatherData | null>
  abstract healthCheck(): Promise<boolean>
  
  // Optional weather maps functionality
  getWeatherMaps?(
    location: LocationCoordinates,
    layers?: string[],
    options?: any
  ): Promise<WeatherMapData[]> | WeatherMapData[]

  getForecastMaps?(
    location: LocationCoordinates,
    days?: number,
    layer?: string,
    options?: any
  ): Promise<WeatherMapData[]> | WeatherMapData[]

  getHistoricalMaps?(
    location: LocationCoordinates,
    startDate: Date,
    endDate: Date,
    layer?: string,
    options?: any
  ): Promise<WeatherMapData[]> | WeatherMapData[]
  
  protected normalizeLocation(location: string): string {
    return location.trim().toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
  }
}
