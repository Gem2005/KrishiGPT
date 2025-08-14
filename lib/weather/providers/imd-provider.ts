import { WeatherProvider, WeatherData } from './base-provider'

interface IMDCurrentWeatherResponse {
  'Station Id': string
  'Station': string
  'Date of Observation': string
  'Time': string
  'M.S.L.P': number
  'Wind Direction': number
  'Wind Speed': number
  'Temperature': number
  'Weather Code': number
  'Nebulosity': number
  'Humidity': number
  'Last 24 hrs Rainfall': number
}

interface IMDCityWeatherResponse {
  Date: string
  Station_Code: string
  Station_Name: string
  Today_Max_temp: number
  Today_Min_temp: number
  Today_Max_Departure_from_Normal: number
  Today_Min_Departure_from_Normal: number
  Past_24_hrs_Rainfall: number
  Relative_Humidity_at_0830: number
  Relative_Humidity_at_1730: number
  Todays_Forecast: string
  Day_2_Forecast: string
  Day_3_Forecast: string
  // ... other forecast days
}

export class IMDProvider extends WeatherProvider {
  private baseUrl = 'https://mausam.imd.gov.in/api'
  private cityBaseUrl = 'https://city.imd.gov.in/api'
  
  // Location to IMD station mapping
  private locationStationMap: Map<string, string> = new Map([
    ['delhi', '42182'],
    ['new delhi', '42182'],
    ['mumbai', '43003'],
    ['chennai', '43279'],
    ['kolkata', '42809'],
    ['bangalore', '43295'],
    ['bengaluru', '43295'],
    ['hyderabad', '43128'],
    ['pune', '43244'],
    ['ahmedabad', '42647'],
    ['jaipur', '42348'],
    ['lucknow', '42369'],
    ['kanpur', '42348'],
    ['nagpur', '42867'],
    ['patna', '42492'],
    ['indore', '42667'],
    ['thane', '43003'],
    ['bhopal', '42667'],
    ['visakhapatnam', '43135'],
    ['vadodara', '42667'],
  ])

  getName(): string {
    return 'IMD (India Meteorological Department)'
  }

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${this.baseUrl}/current_wx_api.php?id=42182`, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  async getWeather(location: string): Promise<WeatherData | null> {
    try {
      const normalizedLocation = this.normalizeLocation(location)
      const stationId = this.getStationId(normalizedLocation)
      
      if (!stationId) {
        console.log(`IMD: No station found for ${location}`)
        return null
      }

      // Get current weather and forecast in parallel
      const [currentWeather, cityWeather] = await Promise.all([
        this.getCurrentWeather(stationId),
        this.getCityWeather(stationId)
      ])

      if (!currentWeather && !cityWeather) {
        return null
      }

      return this.combineWeatherData(currentWeather, cityWeather, location)
    } catch (error) {
      console.error('IMD API error:', error)
      return null
    }
  }

  private getStationId(location: string): string | null {
    // Direct mapping
    if (this.locationStationMap.has(location)) {
      return this.locationStationMap.get(location)!
    }

    // Fuzzy matching for common variations
    for (const [key, value] of this.locationStationMap.entries()) {
      if (location.includes(key) || key.includes(location)) {
        return value
      }
    }

    return null
  }

  private async getCurrentWeather(stationId: string): Promise<IMDCurrentWeatherResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/current_wx_api.php?id=${stationId}`)
      
      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return Array.isArray(data) ? data[0] : data
    } catch (error) {
      console.error('IMD Current Weather API error:', error)
      return null
    }
  }

  private async getCityWeather(stationId: string): Promise<IMDCityWeatherResponse | null> {
    try {
      const response = await fetch(`${this.cityBaseUrl}/cityweather.php?id=${stationId}`)
      
      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return Array.isArray(data) ? data[0] : data
    } catch (error) {
      console.error('IMD City Weather API error:', error)
      return null
    }
  }

  private combineWeatherData(
    current: IMDCurrentWeatherResponse | null,
    city: IMDCityWeatherResponse | null,
    location: string
  ): WeatherData {
    const now = new Date().toISOString()
    
    // Use current weather as primary, city weather for forecast
    const temperature = current?.Temperature || city?.Today_Max_temp || 0
    const humidity = current?.Humidity || city?.Relative_Humidity_at_1730 || 0
    const rainfall = current?.['Last 24 hrs Rainfall'] || city?.Past_24_hrs_Rainfall || 0
    const windSpeed = current?.['Wind Speed'] || 0
    const pressure = current?.['M.S.L.P'] || undefined

    // Generate condition from weather code
    const condition = this.getWeatherCondition(current?.['Weather Code'] || 1)
    
    // Generate forecast from IMD forecast text
    const forecast = this.generateForecast(city)

    return {
      temperature,
      humidity,
      rainfall,
      windSpeed,
      condition,
      forecast,
      pressure,
      source: 'imd',
      location,
      departureFromNormal: city?.Today_Max_Departure_from_Normal,
      timestamp: now,
      cropAdvisory: this.generateCropAdvisory(temperature, humidity, rainfall, condition)
    }
  }

  private getWeatherCondition(weatherCode: number): string {
    // IMD Weather code mapping (abbreviated)
    const weatherConditions: { [key: number]: string } = {
      1: 'Clear sky',
      2: 'Partly cloudy',
      3: 'Cloudy',
      4: 'Hazy',
      5: 'Misty',
      10: 'Fog',
      20: 'Light rain',
      21: 'Moderate rain',
      22: 'Heavy rain',
      25: 'Light snow',
      26: 'Moderate snow',
      27: 'Heavy snow',
      30: 'Dust storm',
      40: 'Thunderstorm',
      // Add more mappings as needed
    }

    return weatherConditions[weatherCode] || 'Unknown'
  }

  private generateForecast(city: IMDCityWeatherResponse | null): string {
    if (!city) {
      return 'Forecast data not available from IMD'
    }

    let forecast = 'IMD Forecast: '
    
    if (city.Todays_Forecast) {
      forecast += `Today: ${city.Todays_Forecast}. `
    }
    
    if (city.Day_2_Forecast) {
      forecast += `Tomorrow: ${city.Day_2_Forecast}. `
    }
    
    if (city.Day_3_Forecast) {
      forecast += `Day after: ${city.Day_3_Forecast}.`
    }

    return forecast || 'Extended forecast available from IMD'
  }

  private generateCropAdvisory(temp: number, humidity: number, rainfall: number, condition: string): string {
    const advisories: string[] = []

    // Temperature-based advice
    if (temp > 35) {
      advisories.push('High temperature: Ensure adequate irrigation and provide shade for livestock')
    } else if (temp < 10) {
      advisories.push('Cold weather: Protect crops from frost damage')
    }

    // Humidity-based advice
    if (humidity > 80) {
      advisories.push('High humidity: Monitor for fungal diseases in crops')
    } else if (humidity < 40) {
      advisories.push('Low humidity: Increase irrigation frequency')
    }

    // Rainfall-based advice
    if (rainfall > 50) {
      advisories.push('Heavy rainfall: Ensure proper drainage to prevent waterlogging')
    } else if (rainfall === 0 && temp > 30) {
      advisories.push('No rainfall with high temperature: Consider drought-resistant crops')
    }

    // Condition-based advice
    if (condition.toLowerCase().includes('thunder')) {
      advisories.push('Thunderstorm warning: Avoid field work and secure equipment')
    }

    return advisories.length > 0 ? advisories.join('. ') : 'No specific advisory for current conditions'
  }
}
