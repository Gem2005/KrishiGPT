export interface MarketPrice {
  crop: string
  location: string
  currentPrice: number
  unit: string
  priceRange: {
    min: number
    max: number
  }
  trend: 'rising' | 'falling' | 'stable'
  lastUpdated: string
  season: string
  marketDemand: 'high' | 'medium' | 'low'
  qualityGrade?: string
  source: string
}

export interface CropProfitabilityAnalysis {
  crop: string
  location: string
  currentMarketPrice: number
  estimatedCost: number
  profitMargin: number
  profitabilityScore: 'excellent' | 'good' | 'moderate' | 'poor'
  recommendation: string
  riskFactors: string[]
  bestSellingPeriod: string
  competitiveCrops: string[]
}

export class MarketPriceService {
  private readonly DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b'
  private readonly DAILY_MANDI_API = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'
  private readonly WHOLESALE_PRICE_API = 'https://api.data.gov.in/resource/bd3890fa-8338-4d68-a834-b65acdb2f6a0'

  // Simulated market data for major crops (in INR per quintal)
  private simulatedMarketData: Record<string, Record<string, MarketPrice>> = {
    "rice": {
      "punjab": {
        crop: "rice",
        location: "punjab",
        currentPrice: 2800,
        unit: "quintal",
        priceRange: { min: 2600, max: 3200 },
        trend: "stable",
        lastUpdated: new Date().toISOString(),
        season: "kharif",
        marketDemand: "medium",
        source: "mandi_prices"
      },
      "west bengal": {
        crop: "rice",
        location: "west bengal",
        currentPrice: 2650,
        unit: "quintal",
        priceRange: { min: 2400, max: 3000 },
        trend: "rising",
        lastUpdated: new Date().toISOString(),
        season: "kharif",
        marketDemand: "high",
        source: "mandi_prices"
      },
      "tamil nadu": {
        crop: "rice",
        location: "tamil nadu",
        currentPrice: 2750,
        unit: "quintal",
        priceRange: { min: 2500, max: 3100 },
        trend: "stable",
        lastUpdated: new Date().toISOString(),
        season: "kharif",
        marketDemand: "medium",
        source: "mandi_prices"
      }
    },
    "wheat": {
      "punjab": {
        crop: "wheat",
        location: "punjab",
        currentPrice: 2400,
        unit: "quintal",
        priceRange: { min: 2200, max: 2800 },
        trend: "stable",
        lastUpdated: new Date().toISOString(),
        season: "rabi",
        marketDemand: "high",
        source: "mandi_prices"
      },
      "haryana": {
        crop: "wheat",
        location: "haryana",
        currentPrice: 2350,
        unit: "quintal",
        priceRange: { min: 2150, max: 2750 },
        trend: "rising",
        lastUpdated: new Date().toISOString(),
        season: "rabi",
        marketDemand: "high",
        source: "mandi_prices"
      },
      "uttar pradesh": {
        crop: "wheat",
        location: "uttar pradesh",
        currentPrice: 2300,
        unit: "quintal",
        priceRange: { min: 2100, max: 2700 },
        trend: "stable",
        lastUpdated: new Date().toISOString(),
        season: "rabi",
        marketDemand: "medium",
        source: "mandi_prices"
      }
    },
    "cotton": {
      "gujarat": {
        crop: "cotton",
        location: "gujarat",
        currentPrice: 6200,
        unit: "quintal",
        priceRange: { min: 5800, max: 7000 },
        trend: "rising",
        lastUpdated: new Date().toISOString(),
        season: "kharif",
        marketDemand: "high",
        source: "mandi_prices"
      },
      "maharashtra": {
        crop: "cotton",
        location: "maharashtra",
        currentPrice: 6100,
        unit: "quintal",
        priceRange: { min: 5700, max: 6800 },
        trend: "stable",
        lastUpdated: new Date().toISOString(),
        season: "kharif",
        marketDemand: "high",
        source: "mandi_prices"
      },
      "telangana": {
        crop: "cotton",
        location: "telangana",
        currentPrice: 5950,
        unit: "quintal",
        priceRange: { min: 5500, max: 6600 },
        trend: "rising",
        lastUpdated: new Date().toISOString(),
        season: "kharif",
        marketDemand: "medium",
        source: "mandi_prices"
      }
    },
    "sugarcane": {
      "uttar pradesh": {
        crop: "sugarcane",
        location: "uttar pradesh",
        currentPrice: 380,
        unit: "quintal",
        priceRange: { min: 340, max: 420 },
        trend: "stable",
        lastUpdated: new Date().toISOString(),
        season: "annual",
        marketDemand: "high",
        source: "mandi_prices"
      },
      "maharashtra": {
        crop: "sugarcane",
        location: "maharashtra",
        currentPrice: 400,
        unit: "quintal",
        priceRange: { min: 360, max: 450 },
        trend: "rising",
        lastUpdated: new Date().toISOString(),
        season: "annual",
        marketDemand: "high",
        source: "mandi_prices"
      },
      "karnataka": {
        crop: "sugarcane",
        location: "karnataka",
        currentPrice: 390,
        unit: "quintal",
        priceRange: { min: 350, max: 440 },
        trend: "stable",
        lastUpdated: new Date().toISOString(),
        season: "annual",
        marketDemand: "medium",
        source: "mandi_prices"
      }
    },
    "tomato": {
      "karnataka": {
        crop: "tomato",
        location: "karnataka",
        currentPrice: 2200,
        unit: "quintal",
        priceRange: { min: 1800, max: 3500 },
        trend: "rising",
        lastUpdated: new Date().toISOString(),
        season: "year-round",
        marketDemand: "high",
        source: "mandi_prices"
      },
      "andhra pradesh": {
        crop: "tomato",
        location: "andhra pradesh",
        currentPrice: 2100,
        unit: "quintal",
        priceRange: { min: 1700, max: 3200 },
        trend: "rising",
        lastUpdated: new Date().toISOString(),
        season: "year-round",
        marketDemand: "high",
        source: "mandi_prices"
      },
      "tamil nadu": {
        crop: "tomato",
        location: "tamil nadu",
        currentPrice: 2300,
        unit: "quintal",
        priceRange: { min: 1900, max: 3400 },
        trend: "stable",
        lastUpdated: new Date().toISOString(),
        season: "year-round",
        marketDemand: "medium",
        source: "mandi_prices"
      }
    },
    "onion": {
      "maharashtra": {
        crop: "onion",
        location: "maharashtra",
        currentPrice: 1800,
        unit: "quintal",
        priceRange: { min: 1400, max: 2800 },
        trend: "falling",
        lastUpdated: new Date().toISOString(),
        season: "year-round",
        marketDemand: "medium",
        source: "mandi_prices"
      },
      "karnataka": {
        crop: "onion",
        location: "karnataka",
        currentPrice: 1750,
        unit: "quintal",
        priceRange: { min: 1350, max: 2700 },
        trend: "stable",
        lastUpdated: new Date().toISOString(),
        season: "year-round",
        marketDemand: "medium",
        source: "mandi_prices"
      },
      "gujarat": {
        crop: "onion",
        location: "gujarat",
        currentPrice: 1900,
        unit: "quintal",
        priceRange: { min: 1500, max: 2900 },
        trend: "falling",
        lastUpdated: new Date().toISOString(),
        season: "year-round",
        marketDemand: "low",
        source: "mandi_prices"
      }
    }
  }

  // Estimated production costs per quintal (INR)
  private productionCosts: Record<string, number> = {
    "rice": 1800,
    "wheat": 1600,
    "cotton": 4200,
    "sugarcane": 280,
    "tomato": 1500,
    "onion": 1200,
    "potato": 1000,
    "maize": 1400,
    "soybean": 2000,
    "groundnut": 2200,
  }

  constructor() {
    this.initializeService()
  }

  private initializeService() {
    console.log("Market Price Service initialized with Data.gov.in APIs")
  }

  // Fetch real-time data from Data.gov.in Daily Mandi Prices API
  private async fetchDailyMandiPrices(commodity?: string, state?: string): Promise<any[]> {
    try {
      let url = `${this.DAILY_MANDI_API}?api-key=${this.DATA_GOV_API_KEY}&format=json&limit=100`
      
      if (commodity) {
        // Map common crop names to API commodity names
        const commodityMap: Record<string, string> = {
          'rice': 'Rice',
          'wheat': 'Wheat', 
          'tomato': 'Tomato',
          'onion': 'Onion',
          'potato': 'Potato',
          'cotton': 'Cotton',
          'sugarcane': 'Sugarcane',
          'bengal gram': 'Bengal Gram(Gram)(Whole)',
          'gram': 'Bengal Gram(Gram)(Whole)'
        }
        
        const apiCommodity = commodityMap[commodity.toLowerCase()] || commodity
        url += `&filters[commodity]=${encodeURIComponent(apiCommodity)}`
      }
      
      if (state) {
        const stateCapitalized = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase()
        url += `&filters[state]=${encodeURIComponent(stateCapitalized)}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      return data.records || []
    } catch (error) {
      console.error('Error fetching daily mandi prices:', error)
      return []
    }
  }

  // Process mandi data to extract price information
  private processMandiData(records: any[]): MarketPrice | null {
    if (records.length === 0) return null

    // Calculate average prices from multiple markets
    const totalRecords = records.length
    const avgMinPrice = records.reduce((sum, record) => sum + parseFloat(record.min_price || '0'), 0) / totalRecords
    const avgMaxPrice = records.reduce((sum, record) => sum + parseFloat(record.max_price || '0'), 0) / totalRecords
    const avgModalPrice = records.reduce((sum, record) => sum + parseFloat(record.modal_price || '0'), 0) / totalRecords

    // Get the most recent record for metadata
    const latestRecord = records[0]
    
    // Determine trend (simplified logic - could be enhanced with historical data)
    const trend = avgModalPrice > avgMinPrice + (avgMaxPrice - avgMinPrice) * 0.7 ? 'rising' : 
                 avgModalPrice < avgMinPrice + (avgMaxPrice - avgMinPrice) * 0.3 ? 'falling' : 'stable'

    // Determine market demand based on price stability
    const priceRange = avgMaxPrice - avgMinPrice
    const marketDemand = priceRange > avgModalPrice * 0.5 ? 'high' : 
                        priceRange > avgModalPrice * 0.2 ? 'medium' : 'low'

    return {
      crop: latestRecord.commodity?.toLowerCase() || 'unknown',
      location: `${latestRecord.state}, ${latestRecord.district}`,
      currentPrice: Math.round(avgModalPrice),
      unit: 'quintal',
      priceRange: {
        min: Math.round(avgMinPrice),
        max: Math.round(avgMaxPrice)
      },
      trend: trend as 'rising' | 'falling' | 'stable',
      lastUpdated: latestRecord.arrival_date || new Date().toISOString(),
      season: this.getCurrentSeason(),
      marketDemand: marketDemand as 'high' | 'medium' | 'low',
      qualityGrade: latestRecord.grade,
      source: 'data.gov.in_mandi'
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1
    if (month >= 6 && month <= 9) return 'kharif'
    if (month >= 10 && month <= 3) return 'rabi'
    return 'summer'
  }

  async getCropPrice(crop: string, location: string): Promise<MarketPrice | null> {
    try {
      const normalizedCrop = crop.toLowerCase().trim()
      const normalizedLocation = location.toLowerCase().trim()

      // First try to get real-time data from Data.gov.in API
      console.log(`Fetching real-time price for ${normalizedCrop} in ${normalizedLocation}`)
      
      const state = this.extractStateFromLocation(normalizedLocation)
      if (state) {
        const mandiRecords = await this.fetchDailyMandiPrices(normalizedCrop, state)
        const realTimePrice = this.processMandiData(mandiRecords)
        
        if (realTimePrice) {
          console.log(`Found real-time price data for ${normalizedCrop}`)
          return realTimePrice
        }
      }

      console.log(`No real-time data found, using simulated data for ${normalizedCrop}`)

      // Fall back to simulated data
      if (this.simulatedMarketData[normalizedCrop]?.[normalizedLocation]) {
        return this.simulatedMarketData[normalizedCrop][normalizedLocation]
      }

      // Try to find price for state if city is provided
      const stateLocation = this.extractStateFromLocation(normalizedLocation)
      if (stateLocation && this.simulatedMarketData[normalizedCrop]?.[stateLocation]) {
        return {
          ...this.simulatedMarketData[normalizedCrop][stateLocation],
          location: normalizedLocation
        }
      }

      // Try to find regional average
      const regionalPrice = await this.getRegionalAveragePrice(normalizedCrop, normalizedLocation)
      if (regionalPrice) {
        return regionalPrice
      }

      return null
    } catch (error) {
      console.error("Error getting crop price:", error)
      return null
    }
  }

  async getCropProfitabilityAnalysis(crop: string, location: string): Promise<CropProfitabilityAnalysis | null> {
    try {
      const marketPrice = await this.getCropPrice(crop, location)
      if (!marketPrice) {
        return null
      }

      const normalizedCrop = crop.toLowerCase().trim()
      
      // Map API commodity names back to our crop names for production cost lookup
      const cropMapping: Record<string, string> = {
        'tomato': 'tomato',
        'onion': 'onion', 
        'potato': 'potato',
        'rice': 'rice',
        'wheat': 'wheat',
        'cotton': 'cotton',
        'sugarcane': 'sugarcane',
        'bengal gram(gram)(whole)': 'groundnut', // closest match for production costs
        'banana': 'tomato', // use tomato costs as proxy for fruits
        'pomegranate': 'tomato',
        'cucumbar(kheera)': 'tomato',
        'bottle gourd': 'tomato',
        'papaya': 'tomato'
      }
      
      const costLookupCrop = cropMapping[marketPrice.crop] || normalizedCrop
      const estimatedCost = this.productionCosts[costLookupCrop] || 1500

      const profitMargin = marketPrice.currentPrice - estimatedCost
      const profitPercentage = (profitMargin / estimatedCost) * 100

      let profitabilityScore: 'excellent' | 'good' | 'moderate' | 'poor'
      let recommendation: string
      
      if (profitPercentage >= 50) {
        profitabilityScore = 'excellent'
        recommendation = 'Highly recommended for cultivation. Strong profit margins and market demand.'
      } else if (profitPercentage >= 25) {
        profitabilityScore = 'good'
        recommendation = 'Good option for cultivation. Profitable with manageable risks.'
      } else if (profitPercentage >= 10) {
        profitabilityScore = 'moderate'
        recommendation = 'Moderate profitability. Consider market timing and cost optimization.'
      } else {
        profitabilityScore = 'poor'
        recommendation = 'Not recommended currently. Low profit margins or losses expected.'
      }

      const riskFactors = this.getRiskFactors(marketPrice.crop, marketPrice, location)
      const bestSellingPeriod = this.getBestSellingPeriod(marketPrice.crop)
      const competitiveCrops = this.getCompetitiveCrops(marketPrice.crop, location)

      return {
        crop: marketPrice.crop,
        location,
        currentMarketPrice: marketPrice.currentPrice,
        estimatedCost,
        profitMargin,
        profitabilityScore,
        recommendation,
        riskFactors,
        bestSellingPeriod,
        competitiveCrops
      }
    } catch (error) {
      console.error("Error analyzing crop profitability:", error)
      return null
    }
  }

  private extractStateFromLocation(location: string): string | null {
    const stateMapping: Record<string, string> = {
      // Maharashtra
      "mumbai": "Maharashtra", "pune": "Maharashtra", "nashik": "Maharashtra", "aurangabad": "Maharashtra",
      "nagpur": "Maharashtra", "thane": "Maharashtra", "kolhapur": "Maharashtra",
      
      // Tamil Nadu  
      "chennai": "Tamil Nadu", "madurai": "Tamil Nadu", "coimbatore": "Tamil Nadu", "salem": "Tamil Nadu",
      "tiruchirappalli": "Tamil Nadu", "tirunelveli": "Tamil Nadu",
      
      // Karnataka
      "bangalore": "Karnataka", "bengaluru": "Karnataka", "mysore": "Karnataka", "hubli": "Karnataka", 
      "mangalore": "Karnataka", "belgaum": "Karnataka", "gulbarga": "Karnataka",
      
      // Telangana
      "hyderabad": "Telangana", "warangal": "Telangana", "nizamabad": "Telangana", "karimnagar": "Telangana",
      
      // Andhra Pradesh
      "visakhapatnam": "Andhra Pradesh", "vijayawada": "Andhra Pradesh", "guntur": "Andhra Pradesh",
      "tirupati": "Andhra Pradesh", "nellore": "Andhra Pradesh",
      
      // West Bengal
      "kolkata": "West Bengal", "howrah": "West Bengal", "durgapur": "West Bengal", "asansol": "West Bengal",
      
      // Punjab
      "ludhiana": "Punjab", "amritsar": "Punjab", "jalandhar": "Punjab", "patiala": "Punjab",
      "bathinda": "Punjab", "mohali": "Punjab",
      
      // Haryana
      "gurgaon": "Haryana", "faridabad": "Haryana", "panipat": "Haryana", "ambala": "Haryana",
      "karnal": "Haryana", "rohtak": "Haryana", "gurugram": "Haryana",
      
      // Gujarat
      "ahmedabad": "Gujarat", "surat": "Gujarat", "vadodara": "Gujarat", "rajkot": "Gujarat",
      "bhavnagar": "Gujarat", "jamnagar": "Gujarat", "gandhinagar": "Gujarat",
      
      // Rajasthan
      "jaipur": "Rajasthan", "jodhpur": "Rajasthan", "udaipur": "Rajasthan", "kota": "Rajasthan",
      "bikaner": "Rajasthan", "ajmer": "Rajasthan", "alwar": "Rajasthan",
      
      // Uttar Pradesh
      "lucknow": "Uttar Pradesh", "kanpur": "Uttar Pradesh", "agra": "Uttar Pradesh", "varanasi": "Uttar Pradesh",
      "meerut": "Uttar Pradesh", "allahabad": "Uttar Pradesh", "prayagraj": "Uttar Pradesh",
      
      // Madhya Pradesh
      "bhopal": "Madhya Pradesh", "indore": "Madhya Pradesh", "gwalior": "Madhya Pradesh", "jabalpur": "Madhya Pradesh",
      
      // Bihar
      "patna": "Bihar", "gaya": "Bihar", "bhagalpur": "Bihar", "muzaffarpur": "Bihar",
      
      // Odisha
      "bhubaneswar": "Odisha", "cuttack": "Odisha", "rourkela": "Odisha", "berhampur": "Odisha",
      
      // Kerala
      "thiruvananthapuram": "Kerala", "kochi": "Kerala", "kozhikode": "Kerala", "thrissur": "Kerala",
      "kollam": "Kerala", "palakkad": "Kerala",
      
      // Other states
      "chandigarh": "Punjab", "delhi": "Delhi", "goa": "Goa"
    }

    for (const [city, state] of Object.entries(stateMapping)) {
      if (location.includes(city)) {
        return state
      }
    }

    // Check if it's already a state name (case insensitive)
    const states = [
      "Punjab", "Haryana", "Rajasthan", "Gujarat", "Maharashtra", "Karnataka", 
      "Kerala", "Tamil Nadu", "Andhra Pradesh", "Telangana", "West Bengal", 
      "Bihar", "Uttar Pradesh", "Madhya Pradesh", "Chhattisgarh", "Odisha",
      "Jharkhand", "Assam", "Himachal Pradesh", "Uttarakhand", "Goa", "Delhi"
    ]
    
    for (const state of states) {
      if (location.toLowerCase().includes(state.toLowerCase())) {
        return state
      }
    }

    return null
  }

  private async getRegionalAveragePrice(crop: string, location: string): Promise<MarketPrice | null> {
    const cropData = this.simulatedMarketData[crop]
    if (!cropData) return null

    // Get regional data based on location
    const region = this.getRegionFromLocation(location)
    const regionPrices = Object.values(cropData).filter(price => 
      this.getRegionFromLocation(price.location) === region
    )

    if (regionPrices.length === 0) return null

    const avgPrice = regionPrices.reduce((sum, price) => sum + price.currentPrice, 0) / regionPrices.length
    const minPrice = Math.min(...regionPrices.map(p => p.priceRange.min))
    const maxPrice = Math.max(...regionPrices.map(p => p.priceRange.max))

    return {
      crop,
      location,
      currentPrice: Math.round(avgPrice),
      unit: "quintal",
      priceRange: { min: minPrice, max: maxPrice },
      trend: "stable",
      lastUpdated: new Date().toISOString(),
      season: regionPrices[0].season,
      marketDemand: "medium",
      source: "regional_average"
    }
  }

  private getRegionFromLocation(location: string): string {
    const northStates = ["punjab", "haryana", "himachal", "uttarakhand", "delhi", "chandigarh"]
    const southStates = ["tamil nadu", "kerala", "karnataka", "andhra pradesh", "telangana"]
    const westStates = ["maharashtra", "gujarat", "rajasthan", "goa"]
    const eastStates = ["west bengal", "bihar", "jharkhand", "odisha"]
    const centralStates = ["madhya pradesh", "chhattisgarh"]

    const locationLower = location.toLowerCase()

    if (northStates.some(state => locationLower.includes(state))) return "north"
    if (southStates.some(state => locationLower.includes(state))) return "south"
    if (westStates.some(state => locationLower.includes(state))) return "west"
    if (eastStates.some(state => locationLower.includes(state))) return "east"
    if (centralStates.some(state => locationLower.includes(state))) return "central"

    return "unknown"
  }

  private getRiskFactors(crop: string, marketPrice: MarketPrice, location: string): string[] {
    const risks: string[] = []

    // Price volatility risks
    if (marketPrice.trend === 'falling') {
      risks.push('Declining market prices')
    }

    // Demand-based risks
    if (marketPrice.marketDemand === 'low') {
      risks.push('Low market demand')
    }

    // Crop-specific risks
    const cropRisks: Record<string, string[]> = {
      "tomato": ["High price volatility", "Perishable nature", "Weather dependent"],
      "onion": ["Storage losses", "Price fluctuations", "Export dependency"],
      "cotton": ["Pest attacks", "Weather dependency", "Global price fluctuations"],
      "rice": ["Water availability", "Monsoon dependency", "Storage costs"],
      "wheat": ["Weather conditions", "Government procurement policy changes"],
      "sugarcane": ["Water intensive", "Processing unit dependency", "Long crop cycle"]
    }

    if (cropRisks[crop]) {
      risks.push(...cropRisks[crop])
    }

    // Location-based risks
    const locationLower = location.toLowerCase()
    if (locationLower.includes("rajasthan") || locationLower.includes("gujarat")) {
      risks.push("Water scarcity", "Drought risk")
    }
    if (locationLower.includes("kerala") || locationLower.includes("west bengal")) {
      risks.push("Excess rainfall risk", "Flooding potential")
    }

    return risks
  }

  private getBestSellingPeriod(crop: string): string {
    const sellingPeriods: Record<string, string> = {
      "rice": "November-January (post-harvest)",
      "wheat": "April-June (post-harvest)",
      "cotton": "December-March (post-harvest)",
      "sugarcane": "Year-round with peak in winter",
      "tomato": "Peak season varies by region, generally winter months",
      "onion": "March-May for rabi, November-December for kharif",
      "potato": "February-May",
      "maize": "October-December for kharif, March-May for rabi",
      "soybean": "October-December",
      "groundnut": "December-February for kharif, April-May for summer"
    }

    return sellingPeriods[crop] || "Consult local market analysis"
  }

  private getCompetitiveCrops(crop: string, location: string): string[] {
    const competitiveCrops: Record<string, string[]> = {
      "rice": ["wheat", "maize", "sugarcane"],
      "wheat": ["rice", "mustard", "chickpea"],
      "cotton": ["sugarcane", "soybean", "maize"],
      "sugarcane": ["cotton", "rice", "wheat"],
      "tomato": ["onion", "potato", "cabbage"],
      "onion": ["tomato", "potato", "chili"],
      "potato": ["onion", "tomato", "cabbage"],
      "maize": ["rice", "soybean", "sugarcane"],
      "soybean": ["cotton", "maize", "rice"],
      "groundnut": ["cotton", "soybean", "maize"]
    }

    return competitiveCrops[crop] || []
  }

  async getMarketTrends(crop: string, location: string): Promise<string> {
    try {
      const price = await this.getCropPrice(crop, location)
      if (!price) {
        return "Market data not available for this crop and location combination."
      }

      const analysis = await this.getCropProfitabilityAnalysis(crop, location)
      if (!analysis) {
        return "Unable to generate market analysis."
      }

      return `Market Analysis for ${crop} in ${location}:
- Current Price: ₹${price.currentPrice}/${price.unit}
- Price Range: ₹${price.priceRange.min}-${price.priceRange.max}
- Market Trend: ${price.trend}
- Demand Level: ${price.marketDemand}
- Profitability: ${analysis.profitabilityScore}
- Profit Margin: ₹${analysis.profitMargin}/${price.unit}
- Best Selling Period: ${analysis.bestSellingPeriod}`
    }
    catch (error) {
      console.error("Error getting market trends:", error)
      return "Market analysis temporarily unavailable."
    }
  }
}
