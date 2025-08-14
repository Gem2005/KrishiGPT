import { NextRequest, NextResponse } from 'next/server'
import { WeatherService } from '@/lib/weather'

const weatherService = new WeatherService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const debug = searchParams.get('debug') === 'true'
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      )
    }

    if (debug) {
      // Return provider status for debugging
      const providerStatus = await weatherService.getProviderStatus()
      return NextResponse.json({
        location,
        providers: providerStatus,
        message: 'Provider status check'
      })
    }

    // Get weather data
    console.log(`Weather API: Fetching data for ${location}`)
    const weatherData = await weatherService.getWeatherData(location)
    
    if (!weatherData) {
      return NextResponse.json(
        { error: 'Weather data not available for this location' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      location,
      weather: weatherData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location } = body
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location is required in request body' },
        { status: 400 }
      )
    }

    console.log(`Weather API POST: Fetching data for ${location}`)
    const weatherData = await weatherService.getWeatherData(location)
    
    if (!weatherData) {
      return NextResponse.json(
        { error: 'Weather data not available for this location' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      location,
      weather: weatherData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Weather API POST error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Clear cache endpoint
export async function DELETE() {
  try {
    weatherService.clearCache()
    return NextResponse.json({
      success: true,
      message: 'Weather cache cleared'
    })
  } catch (error) {
    console.error('Weather cache clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
