import { KrishiRAGChain } from '../langchain/rag-chain'

async function testEnhancedRAGChain() {
  console.log('🧪 Testing Enhanced RAG Chain with Market Analysis...\n')
  
  const ragChain = new KrishiRAGChain()
  
  // Test 1: Ask a viability question
  console.log('Test 1: Asking "Should I grow cotton in Gujarat?"...')
  try {
    const response1 = await ragChain.generateResponse(
      "Should I grow cotton in Gujarat this season?",
      {
        userLocation: "Gujarat",
        language: "en",
        includeMarketAnalysis: true
      }
    )
    console.log('✅ Response with market analysis:')
    console.log(response1)
  } catch (error) {
    console.log('❌ Error in viability question:', error)
  }
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  // Test 2: Ask a general farming question
  console.log('Test 2: Asking general farming question...')
  try {
    const response2 = await ragChain.generateResponse(
      "What are the best practices for rice cultivation?",
      {
        userLocation: "Punjab",
        language: "en"
      }
    )
    console.log('✅ Response for general question:')
    console.log(response2)
  } catch (error) {
    console.log('❌ Error in general question:', error)
  }
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  // Test 3: Ask in Hindi
  console.log('Test 3: Asking in Hindi...')
  try {
    const response3 = await ragChain.generateResponse(
      "क्या मुझे महाराष्ट्र में प्याज उगाना चाहिए?",
      {
        userLocation: "Maharashtra",
        language: "hi",
        includeMarketAnalysis: true
      }
    )
    console.log('✅ Response in Hindi:')
    console.log(response3)
  } catch (error) {
    console.log('❌ Error in Hindi question:', error)
  }
  
  console.log('\n🧪 Enhanced RAG Chain tests completed!')
}

// Run the test
testEnhancedRAGChain().catch(console.error)
