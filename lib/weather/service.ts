export interface WeatherData {
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  condition: string
  forecast: string
}

export class WeatherService {
  async getWeatherData(location: string): Promise<WeatherData | null> {
    try {
      // For hackathon demo, return mock weather data based on location
      // In production, integrate with actual weather API like OpenWeatherMap
      const mockWeatherData = this.getMockWeatherData(location)
      return mockWeatherData
    } catch (error) {
      console.error("Error fetching weather data:", error)
      return null
    }
  }

  private getMockWeatherData(location: string): WeatherData {
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
