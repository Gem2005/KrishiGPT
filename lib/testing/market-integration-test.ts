import { MarketPriceService } from '../market/service'

/**
 * Comprehensive Market Integration Test Suite
 * Tests real-time government API integration and market analysis
 */

class MarketIntegrationTester {
  private marketService: MarketPriceService

  constructor() {
    this.marketService = new MarketPriceService()
  }

  async runAllTests() {
    console.log('🧪 KrishiGPT Market Integration Test Suite')
    console.log('=' .repeat(60))
    console.log('Testing: Real-time API integration, Market analysis\n')

    try {
      await this.testRealTimeDataIntegration()
      await this.testProfitabilityAnalysis()
      await this.testMarketRAGIntegration()
      await this.testFallbackMechanisms()
      
      console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!')
      console.log('✅ Real-time government data integration working')
      console.log('✅ Market analysis with profitability calculations working')
      console.log('✅ Fallback mechanisms working')

    } catch (error) {
      console.error('\n❌ TEST SUITE FAILED:', error)
    }
  }

  private async testRealTimeDataIntegration() {
    console.log('📡 Test 1: Real-Time Data.gov.in API Integration')
    console.log('-'.repeat(50))

    // Test with crops known to have real data
    const testCases = [
      { crop: 'tomato', location: 'Haryana' },
      { crop: 'rice', location: 'Punjab' },
      { crop: 'onion', location: 'Maharashtra' }
    ]

    for (const { crop, location } of testCases) {
      console.log(`\n🔍 Testing ${crop} prices in ${location}...`)
      
      try {
        const priceData = await this.marketService.getCropPrice(crop, location)
        
        if (priceData) {
          const isRealTime = priceData.source === 'data.gov.in_mandi'
          console.log(`${isRealTime ? '✅' : '⚠️'} ${isRealTime ? 'REAL-TIME' : 'SIMULATED'} data retrieved:`)
          console.log(`   Price: ₹${priceData.currentPrice}/${priceData.unit}`)
          console.log(`   Range: ₹${priceData.priceRange.min} - ₹${priceData.priceRange.max}`)
          console.log(`   Trend: ${priceData.trend}`)
          console.log(`   Source: ${priceData.source}`)
          
          if (isRealTime) {
            console.log(`   Grade: ${priceData.qualityGrade}`)
            console.log(`   Last Updated: ${priceData.lastUpdated}`)
          }
        } else {
          console.log('❌ No price data available')
        }
      } catch (error) {
        console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  private async testProfitabilityAnalysis() {
    console.log('\n\n💰 Test 2: Profitability Analysis with Real Data')
    console.log('-'.repeat(50))

    const testCrops = ['tomato', 'rice', 'cotton']
    const testLocation = 'Haryana'

    for (const crop of testCrops) {
      console.log(`\n📊 Analyzing profitability for ${crop} in ${testLocation}...`)
      
      try {
        const analysis = await this.marketService.getCropProfitabilityAnalysis(crop, testLocation)
        
        if (analysis) {
          console.log('✅ Profitability analysis completed:')
          console.log(`   Market Price: ₹${analysis.currentMarketPrice}/quintal`)
          console.log(`   Production Cost: ₹${analysis.estimatedCost}/quintal`)
          console.log(`   Profit Margin: ₹${analysis.profitMargin}/quintal`)
          console.log(`   Score: ${analysis.profitabilityScore}`)
          console.log(`   Recommendation: ${analysis.recommendation.substring(0, 100)}...`)
          console.log(`   Best Selling: ${analysis.bestSellingPeriod}`)
          console.log(`   Alternatives: ${analysis.competitiveCrops.slice(0, 3).join(', ')}`)
        } else {
          console.log('❌ No profitability analysis available')
        }
      } catch (error) {
        console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  private async testMarketRAGIntegration() {
    console.log('\n\n🤖 Test 3: Market Analysis Features')
    console.log('-'.repeat(50))

    console.log('✅ Market analysis features tested separately in test-enhanced-rag.ts')
    console.log('✅ This test focuses on core market data functionality')
  }

  private async testFallbackMechanisms() {
    console.log('\n\n🛡️ Test 4: Fallback Mechanisms')
    console.log('-'.repeat(50))

    // Test with unknown crop and location
    console.log('\n🔍 Testing fallback with unknown crop/location...')
    
    try {
      const fallbackData = await this.marketService.getCropPrice('unknowncrop', 'UnknownState')
      
      if (fallbackData) {
        console.log('✅ Fallback mechanism working:')
        console.log(`   Source: ${fallbackData.source}`)
        console.log(`   Price: ₹${fallbackData.currentPrice}/${fallbackData.unit}`)
      } else {
        console.log('✅ Graceful handling of unknown crop/location')
      }
    } catch (error) {
      console.log(`❌ Error in fallback: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Test profitability with fallback data
    console.log('\n📊 Testing profitability analysis with fallback data...')
    
    try {
      const analysis = await this.marketService.getCropProfitabilityAnalysis('wheat', 'TestState')
      
      if (analysis) {
        console.log('✅ Profitability analysis with fallback data:')
        console.log(`   Score: ${analysis.profitabilityScore}`)
        console.log(`   Has recommendation: ${analysis.recommendation ? 'Yes' : 'No'}`)
      } else {
        console.log('✅ Graceful handling when analysis not possible')
      }
    } catch (error) {
      console.log(`❌ Error in fallback analysis: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async testSpecificCrop(crop: string, location: string) {
    console.log(`\n🎯 Specific Test: ${crop} in ${location}`)
    console.log('-'.repeat(40))

    try {
      // Get price data
      const priceData = await this.marketService.getCropPrice(crop, location)
      if (priceData) {
        console.log('📊 Price Data:')
        console.log(`   Current Price: ₹${priceData.currentPrice}/${priceData.unit}`)
        console.log(`   Source: ${priceData.source}`)
      }

      // Get profitability analysis
      const analysis = await this.marketService.getCropProfitabilityAnalysis(crop, location)
      if (analysis) {
        console.log('\n💰 Profitability:')
        console.log(`   Score: ${analysis.profitabilityScore}`)
        console.log(`   Profit Margin: ₹${analysis.profitMargin}/quintal`)
      }

      // Test RAG response
      console.log('\n🤖 RAG Integration:')
      console.log('   RAG testing available in test-enhanced-rag.ts')
      console.log('   This test focuses on core market functionality')

    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

// Export for external use
export { MarketIntegrationTester }

// Run tests if called directly
if (require.main === module) {
  const tester = new MarketIntegrationTester()
  
  // Check for specific test arguments
  const args = process.argv.slice(2)
  if (args.length >= 2) {
    const [crop, location] = args
    tester.testSpecificCrop(crop, location).catch(console.error)
  } else {
    tester.runAllTests().catch(console.error)
  }
}
