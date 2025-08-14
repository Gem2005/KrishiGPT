import { WeatherProvider, WeatherData, WeatherMapData, LocationCoordinates } from './providers/base-provider'
import { IMDProvider } from './providers/imd-provider'
import { OpenWeatherMapProvider } from './providers/openweathermap-provider'
import { MockProvider } from './providers/mock-provider'

// Keep legacy interface for backward compatibility
export interface LegacyWeatherData {
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  condition: string
  forecast: string
}

export class WeatherService {
  private providers: WeatherProvider[]
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map()
  private cacheExpiry = 10 * 60 * 1000 // 10 minutes

  constructor() {
    // Initialize providers in priority order: IMD -> OpenWeatherMap -> Mock
    this.providers = [
      new IMDProvider(),
      new OpenWeatherMapProvider(),
      new MockProvider()
    ]
  }

  async getWeatherData(location: string): Promise<WeatherData | null> {
    try {
      // Check cache first
      const cacheKey = this.normalizeLocation(location)
      const cached = this.cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`Weather cache hit for ${location}`)
        return cached.data
      }

      // Try providers in order
      for (const provider of this.providers) {
        try {
          console.log(`Trying weather provider: ${provider.getName()}`)
          
          // Check if provider is healthy
          const isHealthy = await provider.healthCheck()
          if (!isHealthy) {
            console.log(`Provider ${provider.getName()} failed health check`)
            continue
          }

          // Get weather data
          const weatherData = await provider.getWeather(location)
          if (weatherData) {
            console.log(`Weather data obtained from ${provider.getName()}`)
            
            // Cache the result
            this.cache.set(cacheKey, {
              data: weatherData,
              timestamp: Date.now()
            })
            
            return weatherData
          }
        } catch (error) {
          console.error(`Error with provider ${provider.getName()}:`, error)
          continue
        }
      }

      console.error('All weather providers failed')
      return null
    } catch (error) {
      console.error("Error fetching weather data:", error)
      return null
    }
  }

  // Legacy method for backward compatibility
  async getLegacyWeatherData(location: string): Promise<LegacyWeatherData | null> {
    const weatherData = await this.getWeatherData(location)
    if (!weatherData) return null

    return {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      rainfall: weatherData.rainfall,
      windSpeed: weatherData.windSpeed,
      condition: weatherData.condition,
      forecast: weatherData.forecast
    }
  }

  // Get provider status for debugging
  async getProviderStatus(): Promise<Array<{ name: string; healthy: boolean }>> {
    const status = []
    
    for (const provider of this.providers) {
      try {
        const isHealthy = await provider.healthCheck()
        status.push({ name: provider.getName(), healthy: isHealthy })
      } catch (error) {
        status.push({ name: provider.getName(), healthy: false })
      }
    }
    
    return status
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
    console.log('Weather cache cleared')
  }

  // Weather Maps functionality

  /**
   * Get weather maps for a location
   */
  async getWeatherMaps(
    location: string | LocationCoordinates,
    layers?: string[],
    options?: any
  ): Promise<WeatherMapData[]> {
    try {
      let coordinates: LocationCoordinates
      
      if (typeof location === 'string') {
        // Try to get coordinates from OpenWeatherMap provider
        const owmProvider = this.providers.find(p => p.getName() === 'OpenWeatherMap')
        if (owmProvider && 'getLocationCoordinates' in owmProvider) {
          const coords = await (owmProvider as any).getLocationCoordinates(location)
          if (!coords) {
            throw new Error(`Could not find coordinates for location: ${location}`)
          }
          coordinates = coords
        } else {
          throw new Error('OpenWeatherMap provider not available for coordinate lookup')
        }
      } else {
        coordinates = location
      }

      // Try providers that support weather maps
      for (const provider of this.providers) {
        if (provider.getWeatherMaps) {
          try {
            const maps = await Promise.resolve(provider.getWeatherMaps(coordinates, layers, options))
            if (maps && maps.length > 0) {
              console.log(`Weather maps obtained from ${provider.getName()}`)
              return maps
            }
          } catch (error) {
            console.error(`Error getting weather maps from ${provider.getName()}:`, error)
            continue
          }
        }
      }

      throw new Error('No weather map providers available')
    } catch (error) {
      console.error('Error getting weather maps:', error)
      throw error
    }
  }

  /**
   * Get forecast weather maps
   */
  async getForecastMaps(
    location: string | LocationCoordinates,
    days: number = 5,
    layer?: string,
    options?: any
  ): Promise<WeatherMapData[]> {
    try {
      let coordinates: LocationCoordinates
      
      if (typeof location === 'string') {
        const owmProvider = this.providers.find(p => p.getName() === 'OpenWeatherMap')
        if (owmProvider && 'getLocationCoordinates' in owmProvider) {
          const coords = await (owmProvider as any).getLocationCoordinates(location)
          if (!coords) {
            throw new Error(`Could not find coordinates for location: ${location}`)
          }
          coordinates = coords
        } else {
          throw new Error('OpenWeatherMap provider not available for coordinate lookup')
        }
      } else {
        coordinates = location
      }

      // Try providers that support forecast maps
      for (const provider of this.providers) {
        if (provider.getForecastMaps) {
          try {
            const maps = await Promise.resolve(provider.getForecastMaps(coordinates, days, layer, options))
            if (maps && maps.length > 0) {
              console.log(`Forecast maps obtained from ${provider.getName()}`)
              return maps
            }
          } catch (error) {
            console.error(`Error getting forecast maps from ${provider.getName()}:`, error)
            continue
          }
        }
      }

      throw new Error('No forecast map providers available')
    } catch (error) {
      console.error('Error getting forecast maps:', error)
      throw error
    }
  }

  /**
   * Get historical weather maps
   */
  async getHistoricalMaps(
    location: string | LocationCoordinates,
    startDate: Date,
    endDate: Date,
    layer?: string,
    options?: any
  ): Promise<WeatherMapData[]> {
    try {
      let coordinates: LocationCoordinates
      
      if (typeof location === 'string') {
        const owmProvider = this.providers.find(p => p.getName() === 'OpenWeatherMap')
        if (owmProvider && 'getLocationCoordinates' in owmProvider) {
          const coords = await (owmProvider as any).getLocationCoordinates(location)
          if (!coords) {
            throw new Error(`Could not find coordinates for location: ${location}`)
          }
          coordinates = coords
        } else {
          throw new Error('OpenWeatherMap provider not available for coordinate lookup')
        }
      } else {
        coordinates = location
      }

      // Try providers that support historical maps
      for (const provider of this.providers) {
        if (provider.getHistoricalMaps) {
          try {
            const maps = await Promise.resolve(provider.getHistoricalMaps(coordinates, startDate, endDate, layer, options))
            if (maps && maps.length > 0) {
              console.log(`Historical maps obtained from ${provider.getName()}`)
              return maps
            }
          } catch (error) {
            console.error(`Error getting historical maps from ${provider.getName()}:`, error)
            continue
          }
        }
      }

      throw new Error('No historical map providers available')
    } catch (error) {
      console.error('Error getting historical maps:', error)
      throw error
    }
  }

  private normalizeLocation(location: string): string {
    return location.toLowerCase().trim().replace(/\s+/g, ' ')
  }

  // Legacy mock methods for backward compatibility
  private getMockWeatherData(location: string): LegacyWeatherData {
    // Generate realistic weather data based on location patterns
    const locationLower = location.toLowerCase()

    // Different weather patterns for different regions
    if (locationLower.includes("kerala") || locationLower.includes("kochi") || locationLower.includes("trivandrum")) {
      return {
        temperature: 28,
        humidity: 85,
        rainfall: 15,
        windSpeed: 12,
        condition: "Partly Cloudy with High Humidity",
        forecast: "Monsoon season - expect heavy rainfall in next 3-5 days",
      }
    } else if (
      locationLower.includes("punjab") ||
      locationLower.includes("haryana") ||
      locationLower.includes("delhi")
    ) {
      return {
        temperature: 35,
        humidity: 60,
        rainfall: 2,
        windSpeed: 8,
        condition: "Hot and Dry",
        forecast: "Hot weather continues - irrigation recommended for crops",
      }
    } else if (
      locationLower.includes("maharashtra") ||
      locationLower.includes("mumbai") ||
      locationLower.includes("pune")
    ) {
      return {
        temperature: 32,
        humidity: 75,
        rainfall: 8,
        windSpeed: 15,
        condition: "Warm with Moderate Humidity",
        forecast: "Monsoon approaching - prepare fields for kharif crops",
      }
    } else if (
      locationLower.includes("tamil nadu") ||
      locationLower.includes("chennai") ||
      locationLower.includes("coimbatore")
    ) {
      return {
        temperature: 30,
        humidity: 80,
        rainfall: 12,
        windSpeed: 10,
        condition: "Warm and Humid",
        forecast: "Northeast monsoon expected - good for rice cultivation",
      }
    } else {
      // Default weather for other locations
      return {
        temperature: 29,
        humidity: 70,
        rainfall: 5,
        windSpeed: 10,
        condition: "Pleasant Weather",
        forecast: "Stable weather conditions expected for next few days",
      }
    }
  }
}
