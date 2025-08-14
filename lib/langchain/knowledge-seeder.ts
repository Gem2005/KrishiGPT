import { DocumentProcessor } from "./document-processor"

export class KnowledgeSeeder {
  private processor: DocumentProcessor

  constructor() {
    this.processor = new DocumentProcessor()
  }

  async seedAgriculturalKnowledge(): Promise<void> {
    console.log("Starting agricultural knowledge seeding...")

    const knowledgeData = [
      // Rice cultivation comprehensive guide
      {
        content: `Rice Cultivation Complete Guide:

1. Land Preparation:
- Plow the field 2-3 times when soil moisture is optimal
- Level the field properly for uniform water distribution
- Apply farmyard manure 2-3 weeks before transplanting
- Prepare nursery beds with fine tilth

2. Seed Selection and Treatment:
- Use certified seeds of high-yielding varieties
- Treat seeds with fungicide (Carbendazim 2g/kg seed)
- For direct seeding: 25-30 kg/hectare
- For transplanting: 20-25 kg/hectare

3. Nursery Management:
- Sow seeds in nursery 25-30 days before transplanting
- Maintain 2-3 cm water level in nursery
- Apply nitrogen fertilizer after 15 days

4. Transplanting:
- Transplant 25-30 day old seedlings
- Maintain 20x15 cm spacing
- Plant 2-3 seedlings per hill
- Transplant during cloudy weather or evening

5. Water Management:
- Maintain 2-5 cm water level throughout growth
- Drain field 10 days before harvest
- Critical stages: tillering, panicle initiation, flowering

6. Fertilizer Application:
- Nitrogen: 120 kg/ha (split in 3 doses)
- Phosphorus: 60 kg/ha (basal application)
- Potassium: 40 kg/ha (split in 2 doses)
- Apply based on soil test recommendations

7. Pest and Disease Management:
- Monitor for stem borer, brown planthopper, leaf folder
- Use pheromone traps and light traps
- Apply neem oil for organic control
- Spray fungicides for blast and sheath blight

8. Harvesting:
- Harvest when 80% grains turn golden yellow
- Cut crop 15-20 cm above ground
- Dry to 14% moisture content before storage`,
        metadata: {
          crop: "rice",
          topic: "cultivation",
          document_type: "comprehensive_guide",
          language: "en",
          region: "general",
        },
      },

      // Wheat cultivation guide
      {
        content: `Wheat Cultivation Best Practices:

1. Soil and Climate Requirements:
- Well-drained loamy soil with pH 6.0-7.5
- Temperature: 15-25°C during growth, 25-30°C during maturity
- Annual rainfall: 75-100 cm

2. Land Preparation:
- Deep plowing in summer to break hardpan
- 2-3 cross plowing before sowing
- Level field for uniform irrigation

3. Sowing:
- Optimal time: November 15 - December 15
- Seed rate: 100-125 kg/hectare
- Row spacing: 20-23 cm
- Sowing depth: 5-6 cm

4. Irrigation Schedule:
- Crown root initiation (20-25 days)
- Tillering stage (40-45 days)
- Jointing stage (60-65 days)
- Flowering stage (85-90 days)
- Grain filling stage (100-105 days)

5. Fertilizer Management:
- Nitrogen: 120 kg/ha (1/3 basal, 1/3 at first irrigation, 1/3 at second irrigation)
- Phosphorus: 60 kg/ha (full basal)
- Potassium: 40 kg/ha (full basal)

6. Weed Control:
- Pre-emergence: Pendimethalin 1 kg/ha
- Post-emergence: 2,4-D 0.5 kg/ha at 30-35 days
- Manual weeding at 20-25 days

7. Disease Management:
- Rust: Apply Propiconazole 0.1%
- Loose smut: Seed treatment with Vitavax
- Karnal bunt: Avoid late sowing

8. Harvesting:
- Harvest when moisture content is 20-25%
- Use combine harvester for large areas
- Dry to 12% moisture for storage`,
        metadata: {
          crop: "wheat",
          topic: "cultivation",
          season: "rabi",
          document_type: "cultivation_guide",
          language: "en",
        },
      },

      // Integrated Pest Management
      {
        content: `Integrated Pest Management (IPM) for Sustainable Agriculture:

1. Prevention Strategies:
- Use resistant varieties when available
- Crop rotation to break pest cycles
- Maintain field sanitation
- Proper spacing for air circulation
- Balanced fertilization to avoid pest attraction

2. Monitoring and Identification:
- Regular field scouting (2-3 times per week)
- Use pheromone traps for early detection
- Identify beneficial insects vs pests
- Economic threshold levels for intervention

3. Biological Control:
- Encourage natural enemies (predators, parasites)
- Use Trichogramma for lepidopteran pests
- Apply Bacillus thuringiensis for caterpillars
- Release Chrysoperla for aphid control

4. Cultural Control:
- Intercropping with repellent plants
- Trap crops to divert pests
- Proper irrigation management
- Timely harvesting and crop residue management

5. Mechanical Control:
- Hand picking of large insects
- Use of light traps and sticky traps
- Barriers and row covers
- Soil cultivation to expose pupae

6. Chemical Control (Last Resort):
- Use selective pesticides
- Rotate different modes of action
- Follow label instructions strictly
- Observe pre-harvest intervals
- Use recommended doses only

7. Organic Alternatives:
- Neem oil spray (0.5-1%)
- Soap solution for soft-bodied insects
- Garlic-chili extract
- Botanical pesticides

8. Record Keeping:
- Document pest occurrences
- Track treatment effectiveness
- Monitor beneficial insect populations
- Economic analysis of interventions`,
        metadata: {
          topic: "pest_management",
          method: "ipm",
          approach: "sustainable",
          document_type: "management_guide",
          language: "en",
        },
      },

      // Soil health management
      {
        content: `Soil Health Management for Sustainable Farming:

1. Soil Testing:
- Test soil every 2-3 years
- Parameters: pH, organic carbon, N-P-K, micronutrients
- Collect samples from 0-15 cm depth
- Take composite samples from multiple points

2. Organic Matter Enhancement:
- Apply 5-10 tons FYM per hectare annually
- Use compost and vermicompost
- Green manuring with leguminous crops
- Incorporate crop residues

3. pH Management:
- For acidic soils: Apply lime 2-3 tons/ha
- For alkaline soils: Apply gypsum 2-5 tons/ha
- Use organic acids through compost
- Monitor pH changes regularly

4. Nutrient Management:
- Follow soil test recommendations
- Use balanced fertilization (N:P:K)
- Apply micronutrients based on deficiency
- Foliar application for quick correction

5. Biological Activity:
- Use bio-fertilizers (Rhizobium, Azotobacter, PSB)
- Apply mycorrhizal inoculants
- Maintain soil moisture for microbial activity
- Avoid excessive pesticide use

6. Physical Properties:
- Improve soil structure through organic matter
- Avoid compaction by controlled traffic
- Deep plowing once in 3-4 years
- Maintain proper drainage

7. Conservation Practices:
- Contour farming on slopes
- Terracing for erosion control
- Cover crops during fallow periods
- Mulching to conserve moisture

8. Monitoring Indicators:
- Soil organic carbon levels
- Microbial biomass
- Earthworm population
- Water infiltration rate
- Aggregate stability`,
        metadata: {
          topic: "soil_health",
          practice: "management",
          approach: "sustainable",
          document_type: "management_guide",
          language: "en",
        },
      },

      // Regional specific - Rajasthan arid farming
      {
        content: `Arid Zone Farming in Rajasthan - Water Conservation and Crop Management:

1. Climate Challenges:
- Low rainfall (150-400 mm annually)
- High temperature (up to 50°C in summer)
- High evaporation rates
- Frequent droughts

2. Water Conservation:
- Rainwater harvesting in farm ponds
- Drip irrigation for efficient water use
- Mulching to reduce evaporation
- Contour bunding to prevent runoff

3. Suitable Crops:
- Drought-tolerant: Bajra, Jowar, Moth bean
- Cash crops: Groundnut, Sesame, Castor
- Horticultural: Ber, Pomegranate, Date palm
- Fodder: Cenchrus, Stylo, Dhaman grass

4. Soil Management:
- Add organic matter to improve water retention
- Use gypsum for sodic soils
- Practice minimum tillage
- Maintain soil cover

5. Cropping Systems:
- Intercropping: Bajra + Cowpea
- Mixed cropping: Pearl millet + Cluster bean
- Relay cropping: Mustard after Bajra
- Agro-forestry with drought-tolerant trees

6. Livestock Integration:
- Goat and sheep rearing
- Camel husbandry in extreme arid areas
- Poultry for additional income
- Use animal waste for soil fertility

7. Technology Adoption:
- Solar-powered irrigation systems
- Weather-based agro-advisories
- Drought-resistant seed varieties
- Precision farming techniques

8. Risk Management:
- Crop insurance schemes
- Diversified farming systems
- Value addition and processing
- Market linkages for better prices`,
        metadata: {
          region: "rajasthan",
          climate: "arid",
          topic: "drought_management",
          document_type: "regional_guide",
          language: "en",
        },
      },
    ]

    // Process and store all knowledge
    const result = await this.processor.processBatch(knowledgeData, {
      chunkSize: 800,
      chunkOverlap: 100,
      documentType: "agricultural_knowledge",
    })

    console.log(`Knowledge seeding completed: ${result.processed} chunks processed, ${result.stored} stored`)

    if (result.errors > 0) {
      console.warn(`${result.errors} errors occurred during seeding`)
    }
  }

  async seedMultilingualContent(): Promise<void> {
    console.log("Seeding multilingual agricultural content...")

    const multilingualData = [
      // Hindi content
      {
        content: `धान की खेती की संपूर्ण जानकारी:

1. भूमि की तैयारी:
- मिट्टी में नमी होने पर 2-3 बार जुताई करें
- समान पानी वितरण के लिए खेत को समतल करें
- रोपाई से 2-3 सप्ताह पहले गोबर की खाद डालें

2. बीज का चुनाव:
- प्रमाणित बीज का उपयोग करें
- बीज को कार्बेन्डाजिम से उपचारित करें
- रोपाई के लिए 20-25 किग्रा/हेक्टेयर बीज चाहिए

3. पानी का प्रबंधन:
- खेत में 2-5 सेमी पानी बनाए रखें
- कटाई से 10 दिन पहले पानी निकाल दें
- महत्वपूर्ण अवस्थाएं: कल्ले निकलना, बाली आना, फूल आना

4. उर्वरक प्रबंधन:
- नाइट्रोजन: 120 किग्रा/हेक्टेयर (3 भागों में)
- फास्फोरस: 60 किग्रा/हेक्टेयर (बुआई के समय)
- पोटाश: 40 किग्रा/हेक्टेयर (2 भागों में)

5. कीट और रोग नियंत्रण:
- तना छेदक के लिए फेरोमोन ट्रैप का उपयोग
- भूरे फुदके के लिए नीम का तेल छिड़कें
- ब्लास्ट रोग के लिए फफूंदनाशी का प्रयोग`,
        metadata: {
          crop: "rice",
          topic: "cultivation",
          language: "hi",
          document_type: "cultivation_guide",
        },
      },

      // Telugu content
      {
        content: `వరి సాగు పూర్తి మార్గదర్శకం:

1. భూమి తయారీ:
- మట్టిలో తేమ ఉన్నప్పుడు 2-3 సార్లు దున్నాలి
- నీటి పంపిణీ కోసం పొలాన్ని సమం చేయాలి
- నాట్లు వేయడానికి 2-3 వారాల ముందు పేడ వేయాలి

2. విత్తన ఎంపిక:
- ధృవీకరించబడిన విత్తనాలను వాడాలి
- విత్తనాలను కార్బెండాజిమ్‌తో శుద్ధి చేయాలి
- నాట్లకు 20-25 కిలోలు/హెక్టారు విత్తనాలు కావాలి

3. నీటి నిర్వహణ:
- పొలంలో 2-5 సెంటీమీటర్లు నీరు ఉంచాలి
- కోత కోయడానికి 10 రోజుల ముందు నీరు తీసేయాలి
- ముఖ్య దశలు: చిగుళ్లు రావడం, వెంట్రుకలు రావడం, పూలు రావడం

4. ఎరువుల నిర్వహణ:
- నత్రజని: 120 కిలోలు/హెక్టారు (3 భాగాలుగా)
- భాస్వరం: 60 కిలోలు/హెక్టారు (విత్తన సమయంలో)
- పొటాష్: 40 కిలోలు/హెక్టారు (2 భాగాలుగా)

5. కీటక మరియు వ్యాధి నియంత్రణ:
- కాండం తొలుచు కీటకాలకు ఫెరోమోన్ ట్రాప్‌లు వాడాలి
- గోధుమ రంగు గెంతులకు వేప నూనె చల్లాలి
- బ్లాస్ట్ వ్యాధికి శిలీంధ్రనాశకాలు వాడాలi`,
        metadata: {
          crop: "rice",
          topic: "cultivation",
          language: "te",
          document_type: "cultivation_guide",
        },
      },
    ]

    const result = await this.processor.processBatch(multilingualData, {
      chunkSize: 600,
      chunkOverlap: 100,
      documentType: "multilingual_knowledge",
    })

    console.log(`Multilingual seeding completed: ${result.processed} chunks processed, ${result.stored} stored`)
  }
}
