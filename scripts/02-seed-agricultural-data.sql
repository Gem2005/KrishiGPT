-- Insert sample agricultural knowledge data
INSERT INTO agricultural_knowledge (title, content, category, subcategory, language, tags) VALUES
-- Crop Management
('Rice Cultivation Best Practices', 'Rice is one of the most important staple crops. For optimal yield: 1) Prepare fields with proper drainage, 2) Use quality seeds, 3) Maintain water levels at 2-5cm during growing season, 4) Apply fertilizers in split doses, 5) Monitor for pests and diseases regularly.', 'crops', 'rice', 'en', ARRAY['rice', 'cultivation', 'water-management', 'fertilizer']),

('धान की खेती की सर्वोत्तम प्रथाएं', 'धान एक महत्वपूर्ण मुख्य फसल है। अधिकतम उत्पादन के लिए: 1) उचित जल निकासी के साथ खेत तैयार करें, 2) गुणवत्तापूर्ण बीज का उपयोग करें, 3) बढ़ते मौसम में पानी का स्तर 2-5 सेमी बनाए रखें, 4) उर्वरकों को विभाजित मात्रा में डालें, 5) कीटों और बीमारियों की नियमित निगरानी करें।', 'crops', 'rice', 'hi', ARRAY['धान', 'खेती', 'जल-प्रबंधन', 'उर्वरक']),

('Wheat Farming Techniques', 'Wheat cultivation requires: 1) Well-drained loamy soil, 2) Sowing between October-December, 3) Seed rate of 100-125 kg/hectare, 4) Irrigation at critical stages (crown root, tillering, flowering, grain filling), 5) Balanced NPK fertilization.', 'crops', 'wheat', 'en', ARRAY['wheat', 'sowing', 'irrigation', 'fertilization']),

-- Pest and Disease Management
('Common Rice Diseases and Treatment', 'Major rice diseases include: 1) Blast - use resistant varieties and fungicides, 2) Brown spot - ensure proper nutrition and drainage, 3) Bacterial blight - use certified seeds and copper-based sprays, 4) Sheath blight - maintain proper plant spacing and use biological control.', 'diseases', 'rice', 'en', ARRAY['rice', 'diseases', 'blast', 'treatment', 'fungicides']),

('Integrated Pest Management for Vegetables', 'IPM approach for vegetables: 1) Use resistant varieties, 2) Crop rotation and intercropping, 3) Biological control agents, 4) Pheromone traps, 5) Judicious use of pesticides only when necessary, 6) Regular monitoring and early detection.', 'pest-management', 'vegetables', 'en', ARRAY['IPM', 'vegetables', 'biological-control', 'pesticides']),

-- Weather and Climate
('Monsoon Farming Strategies', 'During monsoon season: 1) Ensure proper drainage to prevent waterlogging, 2) Choose flood-tolerant varieties, 3) Apply fungicides preventively, 4) Harvest mature crops before heavy rains, 5) Store seeds and fertilizers in dry places.', 'weather', 'monsoon', 'en', ARRAY['monsoon', 'drainage', 'flood-tolerant', 'storage']),

-- Livestock Management
('Dairy Cattle Management', 'Effective dairy management: 1) Provide balanced nutrition with green fodder, 2) Ensure clean water supply, 3) Maintain proper housing with ventilation, 4) Regular health checkups and vaccinations, 5) Proper milking hygiene, 6) Record keeping for breeding and production.', 'livestock', 'dairy', 'en', ARRAY['dairy', 'cattle', 'nutrition', 'health', 'milking']),

-- Soil Management
('Soil Health Improvement Techniques', 'To improve soil health: 1) Regular soil testing, 2) Organic matter addition through compost and FYM, 3) Crop rotation with legumes, 4) Minimal tillage practices, 5) Cover cropping, 6) Balanced fertilization based on soil test results.', 'soil', 'health', 'en', ARRAY['soil-health', 'organic-matter', 'crop-rotation', 'fertilization']),

-- Market and Economics
('Post-Harvest Management and Marketing', 'Effective post-harvest practices: 1) Proper harvesting timing, 2) Immediate drying to safe moisture levels, 3) Clean storage facilities, 4) Grading and packaging, 5) Market price monitoring, 6) Direct marketing or farmer producer organizations.', 'economics', 'post-harvest', 'en', ARRAY['post-harvest', 'storage', 'marketing', 'pricing']),

-- Technology and Innovation
('Precision Agriculture Technologies', 'Modern farming technologies: 1) GPS-guided tractors for precise operations, 2) Drone surveillance for crop monitoring, 3) Soil sensors for real-time data, 4) Variable rate application of inputs, 5) Satellite imagery for field mapping, 6) Mobile apps for decision support.', 'technology', 'precision-agriculture', 'en', ARRAY['precision-agriculture', 'GPS', 'drones', 'sensors', 'mobile-apps']);
