import { NextRequest, NextResponse } from 'next/server'
import { WeatherService } from '@/lib/weather'

const weatherService = new WeatherService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const type = searchParams.get('type') || 'current' // current, forecast, historical
    const layersParam = searchParams.get('layers')
    const zoom = parseInt(searchParams.get('zoom') || '10')
    const days = parseInt(searchParams.get('days') || '5')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const opacity = parseFloat(searchParams.get('opacity') || '0.8')
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      )
    }

    // Parse layers parameter
    const layers = layersParam ? layersParam.split(',') : undefined
    
    // Map options
    const options = {
      zoom,
      opacity,
      fillBound: searchParams.get('fillBound') === 'true',
      arrowStep: parseInt(searchParams.get('arrowStep') || '32'),
      useNorm: searchParams.get('useNorm') === 'true'
    }

    let weatherMaps
    
    switch (type) {
      case 'current':
        weatherMaps = await weatherService.getWeatherMaps(location, layers, options)
        break
        
      case 'forecast':
        if (days < 1 || days > 10) {
          return NextResponse.json(
            { error: 'Days must be between 1 and 10 for forecast maps' },
            { status: 400 }
          )
        }
        const layer = searchParams.get('layer') || 'precipitation_new'
        weatherMaps = await weatherService.getForecastMaps(location, days, layer, options)
        break
        
      case 'historical':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate are required for historical maps' },
            { status: 400 }
          )
        }
        
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format. Use YYYY-MM-DD' },
            { status: 400 }
          )
        }
        
        if (start >= end) {
          return NextResponse.json(
            { error: 'startDate must be before endDate' },
            { status: 400 }
          )
        }
        
        const historicalLayer = searchParams.get('layer') || 'precipitation_new'
        weatherMaps = await weatherService.getHistoricalMaps(location, start, end, historicalLayer, options)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: current, forecast, or historical' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      type,
      location,
      maps: weatherMaps,
      count: weatherMaps.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Weather maps API error:', error)
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
    const { 
      location, 
      type = 'current',
      layers,
      options = {},
      days = 5,
      startDate,
      endDate,
      layer
    } = body
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location is required in request body' },
        { status: 400 }
      )
    }

    let weatherMaps
    
    switch (type) {
      case 'current':
        weatherMaps = await weatherService.getWeatherMaps(location, layers, options)
        break
        
      case 'forecast':
        if (days < 1 || days > 10) {
          return NextResponse.json(
            { error: 'Days must be between 1 and 10 for forecast maps' },
            { status: 400 }
          )
        }
        weatherMaps = await weatherService.getForecastMaps(location, days, layer || 'precipitation_new', options)
        break
        
      case 'historical':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate are required for historical maps' },
            { status: 400 }
          )
        }
        
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format. Use YYYY-MM-DD' },
            { status: 400 }
          )
        }
        
        weatherMaps = await weatherService.getHistoricalMaps(location, start, end, layer || 'precipitation_new', options)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: current, forecast, or historical' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      type,
      location,
      maps: weatherMaps,
      count: weatherMaps.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Weather maps API POST error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
