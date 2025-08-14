-- Insert comprehensive agricultural knowledge for vector embedding
-- This will be processed by the document processing pipeline

INSERT INTO public.document_embeddings (content, metadata, document_type, language) VALUES
-- Rice cultivation knowledge
('Rice cultivation in monsoon season requires proper water management. Plant rice seedlings when monsoon arrives, typically June-July. Ensure fields have good drainage to prevent waterlogging. Use flood-tolerant varieties like Swarna Sub1 or IR64 Sub1 for areas prone to flooding.', 
'{"crop": "rice", "season": "monsoon", "topic": "cultivation", "region": "general"}', 'agricultural_knowledge', 'en'),

('धान की खेती मानसून के मौसम में उचित जल प्रबंधन की आवश्यकता होती है। मानसून आने पर धान के पौधे लगाएं, आमतौर पर जून-जुलाई में। खेतों में अच्छी जल निकासी सुनिश्चित करें। बाढ़ प्रवण क्षेत्रों के लिए स्वर्णा सब1 या IR64 सब1 जैसी बाढ़ सहनशील किस्मों का उपयोग करें।',
'{"crop": "rice", "season": "monsoon", "topic": "cultivation", "region": "general", "language": "hindi"}', 'agricultural_knowledge', 'hi'),

-- Wheat cultivation
('Wheat should be sown in November-December after monsoon ends. Prepare field by plowing 2-3 times. Use certified seeds at 100-125 kg per hectare. Apply fertilizers: 120 kg nitrogen, 60 kg phosphorus, 40 kg potash per hectare. Irrigate at crown root initiation, tillering, jointing, flowering, and grain filling stages.',
'{"crop": "wheat", "season": "rabi", "topic": "cultivation", "region": "general"}', 'agricultural_knowledge', 'en'),

-- Pest management
('Integrated Pest Management (IPM) for rice: Use pheromone traps for stem borer control. Apply neem oil spray for brown planthopper. Maintain 2-3 cm water level to control weeds. Use biological control agents like Trichogramma for sustainable pest management.',
'{"crop": "rice", "topic": "pest_management", "method": "ipm"}', 'agricultural_knowledge', 'en'),

-- Soil health
('Soil testing should be done every 2-3 years to determine nutrient status. Maintain soil pH between 6.0-7.5 for optimal crop growth. Add organic matter through compost, farmyard manure, or green manuring. Practice crop rotation to maintain soil fertility and break pest cycles.',
'{"topic": "soil_health", "practice": "testing", "maintenance": "organic"}', 'agricultural_knowledge', 'en'),

-- Weather-based advice
('During heavy rainfall, ensure proper drainage in fields to prevent crop damage. For rice fields, maintain 5-10 cm water level. For other crops, create drainage channels. Apply fungicides preventively during humid conditions to prevent disease outbreaks.',
'{"weather": "heavy_rain", "topic": "crop_protection", "season": "monsoon"}', 'agricultural_knowledge', 'en'),

-- Regional specific - Rajasthan
('In Rajasthan arid regions, focus on drought-resistant crops like bajra, jowar, and groundnut. Use drip irrigation for water conservation. Plant during pre-monsoon (May-June) to utilize monsoon rains. Mulching helps retain soil moisture in desert conditions.',
'{"region": "rajasthan", "climate": "arid", "topic": "drought_management"}', 'agricultural_knowledge', 'en'),

-- Organic farming
('Organic farming practices: Use compost and vermicompost instead of chemical fertilizers. Apply neem cake for pest control. Practice intercropping with legumes to fix nitrogen. Use bio-fertilizers like Rhizobium and Azotobacter for sustainable agriculture.',
'{"method": "organic", "topic": "sustainable_farming", "inputs": "biological"}', 'agricultural_knowledge', 'en');
