"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Search, Globe } from "lucide-react"

interface LocationSelectorProps {
  onLocationSelect: (location: { state: string; city: string }) => void
  onClose: () => void
  showLanguageSelector?: boolean
  initialLanguage?: string
  onLanguageSelect?: (language: string) => void
}

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
]

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
]

const CITIES_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Tirupati",
    "Anantapur",
  ],
  Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar"],
  Haryana: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal"],
  Karnataka: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Malappuram"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati"],
  Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Hoshiarpur"],
  Rajasthan: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahbubnagar", "Nalgonda"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", "Bardhaman", "Kharagpur"],
}

export default function LocationSelector({ onLocationSelect, onClose }: LocationSelectorProps) {
  const [selectedState, setSelectedState] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [customCity, setCustomCity] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleSubmit = () => {
    if (selectedState && (selectedCity || customCity)) {
      onLocationSelect({
        state: selectedState,
        city: customCity || selectedCity,
      })
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto border border-gray-200">
      <div className="bg-gradient-to-r from-green-500 to-cyan-500 text-white p-6 rounded-t-xl">
        <div className="flex items-center justify-center gap-3">
          <MapPin className="h-6 w-6" />
          <h2 className="text-xl font-semibold">आपका स्थान बताएं / Tell us your location</h2>
        </div>
        <p className="text-center text-green-50 mt-2 text-sm">बेहतर कृषि सलाह के लिए / For better agricultural advice</p>
      </div>

      <div className="p-6 space-y-5">
        {/* State Selection */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700">राज्य चुनें / Select State</label>
          <select
            value={selectedState}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelectedState(e.target.value)
              setSelectedCity("")
              setCustomCity("")
              setShowCustomInput(false)
            }}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-700 bg-white"
          >
            <option value="" className="text-gray-500">
              राज्य चुनें / Select State
            </option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state} className="text-gray-700">
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* City Selection */}
        {selectedState && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-semibold mb-3 text-gray-700">शहर/गांव चुनें / Select City/Village</label>
            <select
              value={selectedCity}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setSelectedCity(e.target.value)
                if (e.target.value === "other") {
                  setShowCustomInput(true)
                } else {
                  setShowCustomInput(false)
                  setCustomCity("")
                }
              }}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-700 bg-white"
            >
              <option value="" className="text-gray-500">
                शहर चुनें / Select City
              </option>
              {CITIES_BY_STATE[selectedState]?.map((city) => (
                <option key={city} value={city} className="text-gray-700">
                  {city}
                </option>
              ))}
              <option value="other" className="text-green-600 font-medium">
                🏘️ अन्य गांव/शहर / Other Village/City
              </option>
            </select>
          </div>
        )}

        {/* Custom City Input */}
        {showCustomInput && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              गांव/शहर का नाम लिखें / Enter Village/City Name
            </label>
            <input
              type="text"
              value={customCity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCity(e.target.value)}
              placeholder="जैसे: तारानगर, खेतड़ी, etc."
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-700 bg-white"
              autoFocus
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 bg-transparent"
          >
            रद्द करें / Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedState || (!selectedCity && !customCity)}
            className="flex-1 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4 mr-2" />
            जारी रखें / Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
