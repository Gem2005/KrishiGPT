import { WeatherProvider, WeatherData } from './base-provider'

export class MockProvider extends WeatherProvider {
  getName(): string {
    return 'Mock Weather Provider'
  }

  async healthCheck(): Promise<boolean> {
    return true // Mock provider is always available
  }

  async getWeather(location: string): Promise<WeatherData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Generate realistic mock data based on location
    const mockData = this.generateMockData(location)
    
    console.log(`Mock provider: Generated data for ${location}`)
    return mockData
  }

  private generateMockData(location: string): WeatherData {
    const now = new Date()
    const normalizedLocation = this.normalizeLocation(location)
    
    // Base data influenced by location
    const baseTemp = this.getBaseTemperature(normalizedLocation)
    const baseHumidity = this.getBaseHumidity(normalizedLocation)
    
    // Add some randomness for realism
    const temperature = Math.round(baseTemp + (Math.random() - 0.5) * 6)
    const humidity = Math.round(Math.max(20, Math.min(90, baseHumidity + (Math.random() - 0.5) * 20)))
    const rainfall = Math.random() > 0.7 ? Math.round(Math.random() * 15) : 0
    const windSpeed = Math.round(Math.random() * 15 + 5)
    const pressure = Math.round(1000 + Math.random() * 50)
    
    const conditions = ['Clear sky', 'Partly cloudy', 'Cloudy', 'Light rain', 'Moderate rain', 'Scattered showers']
    const condition = rainfall > 0 
      ? ['Light rain', 'Moderate rain', 'Scattered showers'][Math.floor(Math.random() * 3)]
      : conditions[Math.floor(Math.random() * 3)]

    const forecast = this.generateMockForecast(temperature, condition)
    const cropAdvisory = this.generateCropAdvisory(temperature, humidity, rainfall, condition)

    return {
      temperature,
      humidity,
      rainfall,
      windSpeed,
      condition,
      forecast,
      pressure,
      source: 'mock',
      location: this.capitalizeLocation(location),
      timestamp: now.toISOString(),
      cropAdvisory,
      // Mock additional fields
      warnings: rainfall > 10 ? ['Heavy rainfall warning'] : undefined,
      rainfallCategory: this.getRainfallCategory(rainfall)
    }
  }

  private getBaseTemperature(location: string): number {
    // Temperature based on common Indian cities
    const tempMap: { [key: string]: number } = {
      'delhi': 28,
      'mumbai': 30,
      'chennai': 32,
      'kolkata': 29,
      'bangalore': 25,
      'bengaluru': 25,
      'hyderabad': 30,
      'pune': 26,
      'jaipur': 31,
      'lucknow': 27,
      'ahmedabad': 33,
      'kanpur': 28,
      'nagpur': 29,
      'patna': 28,
      'indore': 29,
      'bhopal': 27,
      'visakhapatnam': 29,
      'vadodara': 31
    }

    return tempMap[location] || 27 // Default temperature
  }

  private getBaseHumidity(location: string): number {
    // Humidity based on coastal vs inland cities
    const coastalCities = ['mumbai', 'chennai', 'visakhapatnam']
    const isCoastal = coastalCities.some(city => location.includes(city))
    
    return isCoastal ? 75 : 55
  }

  private generateMockForecast(currentTemp: number, currentCondition: string): string {
    const tomorrowTemp = currentTemp + Math.round((Math.random() - 0.5) * 4)
    const dayAfterTemp = currentTemp + Math.round((Math.random() - 0.5) * 6)
    
    const conditions = ['Clear', 'Partly cloudy', 'Cloudy', 'Light showers']
    const tomorrowCondition = conditions[Math.floor(Math.random() * conditions.length)]
    const dayAfterCondition = conditions[Math.floor(Math.random() * conditions.length)]

    return `Mock Forecast: Tomorrow: ${tomorrowCondition}, ${tomorrowTemp}°C. Day after: ${dayAfterCondition}, ${dayAfterTemp}°C. Extended forecast available with seasonal trends.`
  }

  private generateCropAdvisory(temp: number, humidity: number, rainfall: number, condition: string): string {
    const advisories: string[] = []

    // Temperature advice
    if (temp > 35) {
      advisories.push('High temperature: Ensure adequate irrigation for summer crops like cotton and sugarcane')
    } else if (temp < 15) {
      advisories.push('Cool weather: Good time for wheat and mustard cultivation')
    } else if (temp >= 25 && temp <= 30) {
      advisories.push('Optimal temperature: Favorable for rice and maize cultivation')
    }

    // Humidity advice
    if (humidity > 80) {
      advisories.push('High humidity: Watch for leaf blight in rice and fungal diseases in vegetables')
    } else if (humidity < 40) {
      advisories.push('Low humidity: Increase irrigation frequency for leafy vegetables')
    }

    // Rainfall advice
    if (rainfall > 15) {
      advisories.push('Heavy rainfall: Good for kharif crops, ensure drainage in low-lying areas')
    } else if (rainfall > 5) {
      advisories.push('Moderate rainfall: Beneficial for crop growth, monitor soil moisture')
    } else if (rainfall === 0) {
      advisories.push('No rainfall: Continue irrigation schedule, consider drought-resistant varieties')
    }

    // Seasonal advice (mock)
    const month = new Date().getMonth()
    if (month >= 5 && month <= 8) { // Monsoon season
      advisories.push('Monsoon season: Ideal for transplanting rice seedlings')
    } else if (month >= 9 && month <= 11) { // Post-monsoon
      advisories.push('Post-monsoon: Good time for harvesting kharif crops and sowing rabi crops')
    }

    return advisories.length > 0 
      ? advisories.join('. ')
      : 'Weather conditions are suitable for general agricultural activities'
  }

  private getRainfallCategory(rainfall: number): string {
    if (rainfall === 0) return 'No rain'
    if (rainfall < 2.5) return 'Light rain'
    if (rainfall < 7.5) return 'Moderate rain'
    if (rainfall < 35) return 'Rather heavy rain'
    if (rainfall < 65) return 'Heavy rain'
    return 'Very heavy rain'
  }

  private capitalizeLocation(location: string): string {
    return location.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
}
