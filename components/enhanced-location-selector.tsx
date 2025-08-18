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
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Nagaon", "Tinsukia", "Jorhat"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon"],
  "Goa": ["Panaji", "Vasco da Gama", "Margao", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi", "Kullu"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Hazaribagh"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Kottayam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur"],
  "Manipur": ["Imphal", "Thoubal", "Churachandpur"],
  "Meghalaya": ["Shillong", "Tura", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar"],
  "Sikkim": ["Gangtok", "Namchi", "Geyzing"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Rishikesh"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", "Bardhaman"],
}

export default function EnhancedLocationSelector({
  onLocationSelect,
  onClose,
  showLanguageSelector = false,
  initialLanguage = "en",
  onLanguageSelect,
}: LocationSelectorProps) {
  const [selectedState, setSelectedState] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [customCity, setCustomCity] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage)
  const [step, setStep] = useState(showLanguageSelector ? "language" : "location")

  const handleLanguageSelect = (language: string) => {
    setCurrentLanguage(language)
    onLanguageSelect?.(language)
    setStep("location")
  }

  const handleSubmit = () => {
    const city = customCity || selectedCity
    if (selectedState && city) {
      onLocationSelect({
        state: selectedState,
        city: city,
      })
    }
  }

  const getTexts = () => {
    const texts = {
      en: {
        languageTitle: "Choose Your Language",
        languageSubtitle: "Select your preferred language for better experience",
        locationTitle: "Tell us your location",
        locationSubtitle: "For better agricultural advice",
        selectState: "Select State",
        selectCity: "Select City",
        customCityLabel: "Enter Village/City Name",
        customCityPlaceholder: "e.g., Taranagar, Khetri, etc.",
        customCityOption: "My city is not listed",
        cancel: "Cancel",
        continue: "Continue",
        back: "Back"
      },
      hi: {
        languageTitle: "अपनी भाषा चुनें",
        languageSubtitle: "बेहतर अनुभव के लिए अपनी पसंदीदा भाषा चुनें",
        locationTitle: "आपका स्थान बताएं",
        locationSubtitle: "बेहतर कृषि सलाह के लिए",
        selectState: "राज्य चुनें",
        selectCity: "शहर चुनें",
        customCityLabel: "गांव/शहर का नाम लिखें",
        customCityPlaceholder: "जैसे: तारानगर, खेतड़ी, आदि",
        customCityOption: "मेरा शहर सूची में नहीं है",
        cancel: "रद्द करें",
        continue: "जारी रखें",
        back: "वापस"
      },
      bn: {
        languageTitle: "আপনার ভাষা নির্বাচন করুন",
        languageSubtitle: "ভাল অভিজ্ঞতার জন্য আপনার পছন্দের ভাষা নির্বাচন করুন",
        locationTitle: "আপনার অবস্থান বলুন",
        locationSubtitle: "উন্নত কৃষি পরামর্শের জন্য",
        selectState: "রাজ্য নির্বাচন করুন",
        selectCity: "শহর নির্বাচন করুন",
        customCityLabel: "গ্রাম/শহরের নাম লিখুন",
        customCityPlaceholder: "যেমন: তারানগর, খেতড়ি ইত্যাদি",
        customCityOption: "আমার শহর তালিকায় নেই",
        cancel: "বাতিল",
        continue: "এগিয়ে যান",
        back: "পিছনে"
      },
      te: {
        languageTitle: "మీ భాషను ఎంచుకోండి",
        languageSubtitle: "మెరుగైన అనుభవం కోసం మీ ఇష్టమైన భాషను ఎంచుకోండి",
        locationTitle: "మీ స్థానాన్ని చెప్పండి",
        locationSubtitle: "మెరుగైన వ్యవసాయ సలహా కోసం",
        selectState: "రాష్ట్రాన్ని ఎంచుకోండి",
        selectCity: "నగరాన్ని ఎంచుకోండి",
        customCityLabel: "గ్రామం/నగరం పేరు రాయండి",
        customCityPlaceholder: "ఉదా: తారానగర్, ఖేత్రీ మొదలైనవి",
        customCityOption: "నా నగరం జాబితాలో లేదు",
        cancel: "రద్దు చేయండి",
        continue: "కొనసాగించండి",
        back: "వెనుకకు"
      },
      ta: {
        languageTitle: "உங்கள் மொழியைத் தேர்வுசெய்யுங்கள்",
        languageSubtitle: "சிறந்த அனுபவத்திற்காக உங்கள் விருப்பமான மொழியைத் தேர்வுசெய்யுங்கள்",
        locationTitle: "உங்கள் இடத்தைச் சொல்லுங்கள்",
        locationSubtitle: "சிறந்த வேளாண் ஆலோசனைக்காக",
        selectState: "மாநிலத்தைத் தேர்வுசெய்யுங்கள்",
        selectCity: "நகரத்தைத் தேர்வுசெய்யுங்கள்",
        customCityLabel: "கிராமம்/நகரத்தின் பெயரை உள்ளிடுங்கள்",
        customCityPlaceholder: "எ.கா: தாரானகர், கேத்ரி போன்றவை",
        customCityOption: "என் நகரம் பட்டியலில் இல்லை",
        cancel: "ரத்துசெய்",
        continue: "தொடரவும்",
        back: "மீண்டும்"
      }
    }
    return texts[currentLanguage as keyof typeof texts] || texts.en
  }

  const texts = getTexts()

  if (step === "language") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-cyan-500 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-center mb-2">
              <Globe className="h-8 w-8 mr-3" />
              <h2 className="text-xl font-semibold">{texts.languageTitle}</h2>
            </div>
            <p className="text-center text-green-50 mt-2 text-sm">{texts.languageSubtitle}</p>
          </div>

          <div className="p-6 space-y-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800 group-hover:text-green-700">
                      {lang.nativeName}
                    </div>
                    <div className="text-sm text-gray-500">{lang.name}</div>
                  </div>
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full group-hover:border-green-500 group-hover:bg-green-100"></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-cyan-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-center mb-2">
            <MapPin className="h-8 w-8 mr-3" />
            <h2 className="text-xl font-semibold">{texts.locationTitle}</h2>
          </div>
          <p className="text-center text-green-50 mt-2 text-sm">{texts.locationSubtitle}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* State Selection */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700">{texts.selectState}</label>
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
                {texts.selectState}
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
              <label className="block text-sm font-semibold mb-3 text-gray-700">{texts.selectCity}</label>
              <select
                value={selectedCity}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setSelectedCity(e.target.value)
                  setCustomCity("")
                  setShowCustomInput(e.target.value === "custom")
                }}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-700 bg-white"
              >
                <option value="" className="text-gray-500">
                  {texts.selectCity}
                </option>
                {CITIES_BY_STATE[selectedState]?.map((city) => (
                  <option key={city} value={city} className="text-gray-700">
                    {city}
                  </option>
                ))}
                <option value="custom" className="text-blue-600 font-medium">
                  {texts.customCityOption}
                </option>
              </select>
            </div>
          )}

          {/* Custom City Input */}
          {showCustomInput && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                {texts.customCityLabel}
              </label>
              <input
                type="text"
                value={customCity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCity(e.target.value)}
                placeholder={texts.customCityPlaceholder}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-700 bg-white"
                autoFocus
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {showLanguageSelector && (
              <Button
                onClick={() => setStep("language")}
                variant="outline"
                className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 bg-transparent"
              >
                {texts.back}
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 bg-transparent"
            >
              {texts.cancel}
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!selectedState || (!selectedCity && !customCity)}
              className="flex-1 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-4 w-4 mr-2" />
              {texts.continue}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
