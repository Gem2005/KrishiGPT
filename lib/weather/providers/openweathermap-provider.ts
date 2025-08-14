import { WeatherProvider, WeatherData, WeatherMapData, LocationCoordinates } from './base-provider'

interface OpenWeatherMapCurrentResponse {
  coord: { lon: number; lat: number }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  base: string
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
    sea_level?: number
    grnd_level?: number
  }
  visibility: number
  wind: {
    speed: number
    deg: number
    gust?: number
  }
  rain?: {
    '1h'?: number
    '3h'?: number
  }
  clouds: {
    all: number
  }
  dt: number
  sys: {
    type: number
    id: number
    country: string
    sunrise: number
    sunset: number
  }
  timezone: number
  id: number
  name: string
  cod: number
}

interface OpenWeatherMapForecastResponse {
  cod: string
  message: number
  cnt: number
  list: Array<{
    dt: number
    main: {
      temp: number
      feels_like: number
      temp_min: number
      temp_max: number
      pressure: number
      sea_level: number
      grnd_level: number
      humidity: number
      temp_kf: number
    }
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
    clouds: {
      all: number
    }
    wind: {
      speed: number
      deg: number
      gust: number
    }
    visibility: number
    pop: number
    rain?: {
      '3h': number
    }
    sys: {
      pod: string
    }
    dt_txt: string
  }>
  city: {
    id: number
    name: string
    coord: {
      lat: number
      lon: number
    }
    country: string
    population: number
    timezone: number
    sunrise: number
    sunset: number
  }
}

// Weather map layer types
export type WeatherMapLayer = 
  | 'clouds_new'     // Clouds
  | 'precipitation_new' // Precipitation
  | 'pressure_new'   // Sea level pressure
  | 'wind_new'       // Wind speed
  | 'temp_new'       // Temperature
  | 'snow_new'       // Snow
  | 'rain_new'       // Rain

// Weather map options
export interface WeatherMapOptions {
  zoom?: number        // Zoom level, default 10
  opacity?: number      // 0-1, default 0.8
  palette?: string     // Custom color palette
  fillBound?: boolean  // Fill outside values, default false
  arrowStep?: number   // Wind arrow step in pixels, default 32
  useNorm?: boolean    // Normalize arrow length, default false
  date?: number        // Unix timestamp for historical/forecast maps
}

// Tile coordinates for map display
export interface TileCoordinates {
  zoom: number  // Zoom level
  x: number     // X tile coordinate
  y: number     // Y tile coordinate
}

export class OpenWeatherMapProvider extends WeatherProvider {
  private apiKey: string
  private baseUrl = 'https://api.openweathermap.org/data/2.5'
  private mapsUrl = 'https://maps.openweathermap.org/maps/2.0/weather'

  constructor() {
    super()
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY || ''
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured')
    }
  }

  getName(): string {
    return 'OpenWeatherMap'
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(
        `${this.baseUrl}/weather?q=Delhi&appid=${this.apiKey}&units=metric`,
        {
          method: 'GET',
          signal: controller.signal
        }
      )
      
      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  async getWeather(location: string): Promise<WeatherData | null> {
    if (!this.apiKey) {
      console.error('OpenWeatherMap API key not configured')
      return null
    }

    try {
      // Get current weather and forecast in parallel
      const [currentWeather, forecast] = await Promise.all([
        this.getCurrentWeather(location),
        this.getForecast(location)
      ])

      if (!currentWeather) {
        return null
      }

      return this.transformToWeatherData(currentWeather, forecast, location)
    } catch (error) {
      console.error('OpenWeatherMap API error:', error)
      return null
    }
  }

  private async getCurrentWeather(location: string): Promise<OpenWeatherMapCurrentResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`
      )

      if (!response.ok) {
        console.error(`OpenWeatherMap current weather API error: ${response.status} ${response.statusText}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('OpenWeatherMap current weather fetch error:', error)
      return null
    }
  }

  private async getForecast(location: string): Promise<OpenWeatherMapForecastResponse | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`
      )

      if (!response.ok) {
        console.error(`OpenWeatherMap forecast API error: ${response.status} ${response.statusText}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('OpenWeatherMap forecast fetch error:', error)
      return null
    }
  }

  private transformToWeatherData(
    current: OpenWeatherMapCurrentResponse,
    forecast: OpenWeatherMapForecastResponse | null,
    location: string
  ): WeatherData {
    const temperature = Math.round(current.main.temp)
    const humidity = current.main.humidity
    const windSpeed = current.wind.speed
    const pressure = current.main.pressure
    const condition = current.weather[0]?.description || 'Unknown'
    
    // Calculate rainfall from rain data
    const rainfall = this.calculateRainfall(current.rain)
    
    // Generate forecast text
    const forecastText = this.generateForecastText(forecast)
    
    // Generate crop advisory
    const cropAdvisory = this.generateCropAdvisory(temperature, humidity, rainfall, condition)

    return {
      temperature,
      humidity,
      rainfall,
      windSpeed,
      condition: this.capitalizeWords(condition),
      forecast: forecastText,
      pressure,
      source: 'openweathermap',
      location: current.name,
      timestamp: new Date().toISOString(),
      cropAdvisory
    }
  }

  private calculateRainfall(rain?: { '1h'?: number; '3h'?: number }): number {
    if (!rain) return 0
    // Prefer 1h data, fallback to 3h data
    return rain['1h'] || rain['3h'] || 0
  }

  private generateForecastText(forecast: OpenWeatherMapForecastResponse | null): string {
    if (!forecast || !forecast.list || forecast.list.length === 0) {
      return 'Extended forecast not available'
    }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const dayAfter = new Date(today)
    dayAfter.setDate(today.getDate() + 2)

    // Find forecasts for next few days
    const tomorrowForecast = forecast.list.find(item => {
      const itemDate = new Date(item.dt * 1000)
      return itemDate.getDate() === tomorrow.getDate() && itemDate.getHours() >= 12
    })
    
    const dayAfterForecast = forecast.list.find(item => {
      const itemDate = new Date(item.dt * 1000)
      return itemDate.getDate() === dayAfter.getDate() && itemDate.getHours() >= 12
    })

    let forecastText = 'OpenWeatherMap Forecast: '
    
    if (tomorrowForecast) {
      forecastText += `Tomorrow: ${this.capitalizeWords(tomorrowForecast.weather[0]?.description || 'Unknown')}, ${Math.round(tomorrowForecast.main.temp)}°C. `
    }
    
    if (dayAfterForecast) {
      forecastText += `Day after: ${this.capitalizeWords(dayAfterForecast.weather[0]?.description || 'Unknown')}, ${Math.round(dayAfterForecast.main.temp)}°C.`
    }

    return forecastText
  }

  private generateCropAdvisory(temp: number, humidity: number, rainfall: number, condition: string): string {
    const advisories: string[] = []

    // Temperature-based advice
    if (temp > 35) {
      advisories.push('High temperature alert: Increase irrigation frequency and provide shade for crops')
    } else if (temp < 5) {
      advisories.push('Frost warning: Protect sensitive crops with covers or heating')
    } else if (temp < 15) {
      advisories.push('Cool weather: Consider cold-resistant crop varieties')
    }

    // Humidity-based advice
    if (humidity > 85) {
      advisories.push('Very high humidity: Monitor for fungal diseases and improve ventilation')
    } else if (humidity < 30) {
      advisories.push('Low humidity: Increase irrigation and consider mulching')
    }

    // Rainfall-based advice
    if (rainfall > 25) {
      advisories.push('Heavy rainfall: Ensure proper drainage and avoid field operations')
    } else if (rainfall > 10) {
      advisories.push('Moderate rainfall: Good for most crops, monitor soil moisture')
    } else if (rainfall === 0 && temp > 25) {
      advisories.push('No rainfall with warm weather: Maintain adequate irrigation')
    }

    // Condition-based advice
    const lowerCondition = condition.toLowerCase()
    if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
      advisories.push('Storm warning: Secure equipment and avoid outdoor activities')
    } else if (lowerCondition.includes('hail')) {
      advisories.push('Hail risk: Protect crops with nets or covers if possible')
    } else if (lowerCondition.includes('wind')) {
      advisories.push('Windy conditions: Secure loose materials and check plant supports')
    }

    return advisories.length > 0 
      ? advisories.join('. ') 
      : 'Weather conditions are generally favorable for agricultural activities'
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase())
  }

  // Weather Maps API Methods

  /**
   * Generate weather map tile URL
   * @param layer Weather map layer type
   * @param coordinates Tile coordinates (zoom, x, y)
   * @param options Optional parameters for the map
   * @returns Complete URL for the weather map tile
   */
  getWeatherMapTileUrl(
    layer: WeatherMapLayer,
    coordinates: TileCoordinates,
    options: WeatherMapOptions = {}
  ): string {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured')
    }

    const { zoom, x, y } = coordinates
    const {
      opacity = 0.8,
      palette,
      fillBound = false,
      arrowStep = 32,
      useNorm = false,
      date
    } = options

    const params = new URLSearchParams({
      appid: this.apiKey,
      opacity: opacity.toString(),
      fill_bound: fillBound.toString()
    })

    // Add optional parameters
    if (palette) params.append('palette', palette)
    if (date) params.append('date', date.toString())
    
    // Wind-specific parameters
    if (layer === 'wind_new') {
      params.append('arrow_step', arrowStep.toString())
      params.append('use_norm', useNorm.toString())
    }

    return `${this.mapsUrl}/${layer}/${zoom}/${x}/${y}?${params.toString()}`
  }

  /**
   * Get multiple weather map URLs for a location
   * @param coordinates Tile coordinates
   * @param layers Array of weather map layers to get
   * @param options Optional parameters
   * @returns Object with layer names as keys and URLs as values
   */
  getMultipleWeatherMaps(
    coordinates: TileCoordinates,
    layers: WeatherMapLayer[],
    options: WeatherMapOptions = {}
  ): Record<WeatherMapLayer, string> {
    const maps: Partial<Record<WeatherMapLayer, string>> = {}
    
    layers.forEach(layer => {
      maps[layer] = this.getWeatherMapTileUrl(layer, coordinates, options)
    })
    
    return maps as Record<WeatherMapLayer, string>
  }

  /**
   * Convert lat/lng to tile coordinates
   * Useful for getting tile coordinates from location coordinates
   * @param lat Latitude
   * @param lng Longitude
   * @param zoom Zoom level
   * @returns Tile coordinates
   */
  static latLngToTile(lat: number, lng: number, zoom: number): TileCoordinates {
    const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom))
    const y = Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * Math.pow(2, zoom))
    
    return { zoom, x, y }
  }

  /**
   * Get weather maps for a specific location
   * @param lat Latitude
   * @param lng Longitude
   * @param zoom Zoom level (default: 10)
   * @param layers Layers to include (default: all main layers)
   * @param options Additional options
   * @returns Weather map URLs
   */
  getLocationWeatherMaps(
    lat: number,
    lng: number,
    zoom: number = 10,
    layers: WeatherMapLayer[] = ['clouds_new', 'precipitation_new', 'pressure_new', 'wind_new', 'temp_new'],
    options: WeatherMapOptions = {}
  ): Record<WeatherMapLayer, string> {
    const coordinates = OpenWeatherMapProvider.latLngToTile(lat, lng, zoom)
    return this.getMultipleWeatherMaps(coordinates, layers, options)
  }

  /**
   * Get forecast weather maps (up to 10 days)
   * @param coordinates Tile coordinates
   * @param forecastDays Number of days to forecast (1-10)
   * @param layer Weather layer
   * @param options Additional options
   * @returns Array of forecast map URLs with timestamps
   */
  getForecastWeatherMaps(
    coordinates: TileCoordinates,
    forecastDays: number = 5,
    layer: WeatherMapLayer = 'precipitation_new',
    options: WeatherMapOptions = {}
  ): Array<{ date: number; url: string; dateString: string }> {
    const maps: Array<{ date: number; url: string; dateString: string }> = []
    const now = Math.floor(Date.now() / 1000)
    const dayInSeconds = 24 * 60 * 60
    
    for (let i = 1; i <= Math.min(forecastDays, 10); i++) {
      const forecastDate = now + (i * dayInSeconds)
      const mapOptions = { ...options, date: forecastDate }
      const url = this.getWeatherMapTileUrl(layer, coordinates, mapOptions)
      
      maps.push({
        date: forecastDate,
        url,
        dateString: new Date(forecastDate * 1000).toISOString().split('T')[0]
      })
    }
    
    return maps
  }

  /**
   * Get historical weather maps (from March 2019)
   * @param coordinates Tile coordinates
   * @param startDate Unix timestamp for start date
   * @param endDate Unix timestamp for end date
   * @param layer Weather layer
   * @param options Additional options
   * @returns Array of historical map URLs with timestamps
   */
  getHistoricalWeatherMaps(
    coordinates: TileCoordinates,
    startDate: number,
    endDate: number,
    layer: WeatherMapLayer = 'precipitation_new',
    options: WeatherMapOptions = {}
  ): Array<{ date: number; url: string; dateString: string }> {
    const maps: Array<{ date: number; url: string; dateString: string }> = []
    const minDate = new Date('2019-03-01').getTime() / 1000 // March 2019 limit
    const maxDate = Math.floor(Date.now() / 1000)
    
    // Validate date range
    const validStartDate = Math.max(startDate, minDate)
    const validEndDate = Math.min(endDate, maxDate)
    
    if (validStartDate >= validEndDate) {
      throw new Error('Invalid date range. Historical data available from March 2019.')
    }
    
    // Generate daily maps for the range (limit to reasonable number)
    const dayInSeconds = 24 * 60 * 60
    const maxDays = 30 // Limit to 30 days to avoid too many requests
    const totalDays = Math.min(Math.floor((validEndDate - validStartDate) / dayInSeconds), maxDays)
    
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = validStartDate + (i * dayInSeconds)
      const mapOptions = { ...options, date: currentDate }
      const url = this.getWeatherMapTileUrl(layer, coordinates, mapOptions)
      
      maps.push({
        date: currentDate,
        url,
        dateString: new Date(currentDate * 1000).toISOString().split('T')[0]
      })
    }
    
    return maps
  }

  // Implement abstract weather maps methods

  /**
   * Get weather maps for a location using coordinates
   */
  getWeatherMaps(
    location: LocationCoordinates,
    layers: WeatherMapLayer[] = ['clouds_new', 'precipitation_new', 'pressure_new', 'wind_new', 'temp_new'],
    options: WeatherMapOptions = {}
  ): WeatherMapData[] {
    const zoom = options.zoom || 10
    const coordinates = OpenWeatherMapProvider.latLngToTile(location.latitude, location.longitude, zoom)
    const mapUrls = this.getMultipleWeatherMaps(coordinates, layers, options)
    
    return layers.map(layer => ({
      layer,
      url: mapUrls[layer],
      description: this.getLayerDescription(layer),
      coordinates: coordinates
    }))
  }

  /**
   * Get forecast weather maps
   */
  getForecastMaps(
    location: LocationCoordinates,
    days: number = 5,
    layer: WeatherMapLayer = 'precipitation_new',
    options: WeatherMapOptions = {}
  ): WeatherMapData[] {
    const zoom = options.zoom || 10
    const coordinates = OpenWeatherMapProvider.latLngToTile(location.latitude, location.longitude, zoom)
    const forecastMaps = this.getForecastWeatherMaps(coordinates, days, layer, options)
    
    return forecastMaps.map(forecast => ({
      layer,
      url: forecast.url,
      timestamp: forecast.date,
      description: `${this.getLayerDescription(layer)} - ${forecast.dateString}`,
      coordinates: coordinates
    }))
  }

  /**
   * Get historical weather maps
   */
  getHistoricalMaps(
    location: LocationCoordinates,
    startDate: Date,
    endDate: Date,
    layer: WeatherMapLayer = 'precipitation_new',
    options: WeatherMapOptions = {}
  ): WeatherMapData[] {
    const zoom = options.zoom || 10
    const coordinates = OpenWeatherMapProvider.latLngToTile(location.latitude, location.longitude, zoom)
    const startTimestamp = Math.floor(startDate.getTime() / 1000)
    const endTimestamp = Math.floor(endDate.getTime() / 1000)
    
    const historicalMaps = this.getHistoricalWeatherMaps(coordinates, startTimestamp, endTimestamp, layer, options)
    
    return historicalMaps.map(historical => ({
      layer,
      url: historical.url,
      timestamp: historical.date,
      description: `${this.getLayerDescription(layer)} - ${historical.dateString}`,
      coordinates: coordinates
    }))
  }

  /**
   * Get description for weather map layer
   */
  private getLayerDescription(layer: WeatherMapLayer): string {
    const descriptions: Record<WeatherMapLayer, string> = {
      'clouds_new': 'Cloud Coverage',
      'precipitation_new': 'Precipitation',
      'pressure_new': 'Sea Level Pressure',
      'wind_new': 'Wind Speed and Direction',
      'temp_new': 'Temperature',
      'snow_new': 'Snow Cover',
      'rain_new': 'Rainfall'
    }
    
    return descriptions[layer] || layer
  }

  /**
   * Helper method to get coordinates from location name
   */
  async getLocationCoordinates(locationName: string): Promise<LocationCoordinates | null> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=1&appid=${this.apiKey}`
      )
      
      if (!response.ok) return null
      
      const locations = await response.json()
      if (!locations || locations.length === 0) return null
      
      const location = locations[0]
      return {
        latitude: location.lat,
        longitude: location.lon,
        name: location.name
      }
    } catch (error) {
      console.error('Error getting location coordinates:', error)
      return null
    }
  }
}
