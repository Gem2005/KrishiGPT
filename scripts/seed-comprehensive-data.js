#!/usr/bin/env node

/**
 * Comprehensive Agricultural Data Seeder
 * Seeds the database with ~1MB of agricultural knowledge in 5 languages
 * Supports: English (en), Hindi (hi), Bengali (bn), Tamil (ta), Telugu (te)
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDatabase() {
  console.log('🌱 Starting comprehensive agricultural data seeding...')
  
  try {
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'comprehensive-agricultural-data.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} data insertion statements`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        // Extract title for progress tracking
        const titleMatch = statement.match(/VALUES\s*\(\s*'([^']+)'/i)
        const title = titleMatch ? titleMatch[1].substring(0, 50) + '...' : `Statement ${i + 1}`
        
        console.log(`📝 Inserting: ${title}`)
        
        // Execute the statement
        const { error } = await supabase.rpc('execute_sql', { 
          sql_statement: statement 
        })
        
        if (error) {
          // Try direct insertion if RPC fails
          const values = extractValuesFromInsert(statement)
          if (values) {
            const { error: insertError } = await supabase
              .from('agricultural_knowledge')
              .insert(values)
            
            if (insertError) {
              console.error(`❌ Error inserting ${title}:`, insertError.message)
              errorCount++
            } else {
              successCount++
            }
          } else {
            console.error(`❌ Error executing ${title}:`, error.message)
            errorCount++
          }
        } else {
          successCount++
        }
        
        // Rate limiting
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
      } catch (err) {
        console.error(`❌ Unexpected error:`, err.message)
        errorCount++
      }
    }
    
    console.log('\n📊 Seeding Summary:')
    console.log(`✅ Successfully inserted: ${successCount} records`)
    console.log(`❌ Failed insertions: ${errorCount} records`)
    console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`)
    
    // Verify data in database
    const { data: totalCount, error: countError } = await supabase
      .from('agricultural_knowledge')
      .select('id', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`🗄️ Total records in database: ${totalCount || 0}`)
    }
    
    // Check language distribution
    const languages = ['en', 'hi', 'bn', 'ta', 'te']
    console.log('\n🌍 Language distribution:')
    
    for (const lang of languages) {
      const { data, error } = await supabase
        .from('agricultural_knowledge')
        .select('id', { count: 'exact', head: true })
        .eq('language', lang)
      
      if (!error) {
        console.log(`  ${lang.toUpperCase()}: ${data || 0} records`)
      }
    }
    
    console.log('\n🎉 Agricultural data seeding completed!')
    
  } catch (error) {
    console.error('💥 Fatal error during seeding:', error)
    process.exit(1)
  }
}

function extractValuesFromInsert(statement) {
  try {
    // Parse INSERT statement to extract values
    const valuesMatch = statement.match(/VALUES\s*\((.*)\)/i)
    if (!valuesMatch) return null
    
    const valuesStr = valuesMatch[1]
    
    // Split by commas, but respect quoted strings
    const values = []
    let current = ''
    let inQuotes = false
    let quoteChar = null
    
    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i]
      
      if ((char === "'" || char === '"') && valuesStr[i-1] !== '\\') {
        if (!inQuotes) {
          inQuotes = true
          quoteChar = char
        } else if (char === quoteChar) {
          inQuotes = false
          quoteChar = null
        }
      }
      
      if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    if (current.trim()) {
      values.push(current.trim())
    }
    
    // Clean up values
    const cleanValues = values.map(val => {
      val = val.trim()
      if ((val.startsWith("'") && val.endsWith("'")) || 
          (val.startsWith('"') && val.endsWith('"'))) {
        return val.slice(1, -1)
      }
      if (val.startsWith('ARRAY[') && val.endsWith(']')) {
        // Parse array
        const arrayContent = val.slice(6, -1)
        return arrayContent.split(',').map(item => 
          item.trim().replace(/^'|'$/g, '')
        )
      }
      return val
    })
    
    // Map to object
    if (cleanValues.length >= 6) {
      return {
        title: cleanValues[0],
        content: cleanValues[1],
        category: cleanValues[2],
        subcategory: cleanValues[3],
        language: cleanValues[4],
        tags: cleanValues[5]
      }
    }
    
    return null
  } catch (err) {
    console.error('Error parsing values:', err)
    return null
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { seedDatabase }
