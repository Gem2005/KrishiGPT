"use client"

import { Mic, MicOff, Loader2, AlertCircle, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface VoiceDialogProps {
  isOpen: boolean
  onClose: () => void
  status: "initializing" | "listening" | "processing" | "error" | "no-speech"
  language: string
}

export function VoiceDialog({ isOpen, onClose, status, language }: VoiceDialogProps) {
  if (!isOpen) return null

  const getStatusText = () => {
    switch (status) {
      case "initializing":
        return {
          hi: "माइक्रोफ़ोन शुरू कर रहे हैं...",
          bn: "মাইক্রোফোন শুরু করা হচ্ছে...",
          te: "మైక్రోఫోన్ ప్రారంభిస్తోంది...",
          ta: "மைக்ரோஃபோனைத் தொடங்குகிறது...",
          en: "Initializing microphone..."
        }
      case "listening":
        return {
          hi: "बोलिए...",
          bn: "বলুন...",
          te: "మాట్లాడండి...",
          ta: "பேசுங்கள்...",
          en: "Speak now..."
        }
      case "processing":
        return {
          hi: "आपकी बात समझ रहे हैं...",
          bn: "আপনার কথা বুঝতে চেষ্টা করছি...",
          te: "మీ మాటలను అర్థం చేసుకుంటున్నాను...",
          ta: "உங்கள் வார்த்தைகளைப் புரிந்துகொள்கிறேன்...",
          en: "Processing your speech..."
        }
      case "no-speech":
        return {
          hi: "कोई आवाज़ नहीं सुनाई दी। कृपया फिर से कोशिश करें।",
          bn: "কোনো কণ্ঠস্বর শোনা যায়নি। দয়া করে আবার চেষ্টা করুন।",
          te: "ఎటువంటి వాయిస్ వినిపించలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
          ta: "எந்த குரலும் கேட்கவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
          en: "No speech detected. Please try again."
        }
      case "error":
        return {
          hi: "वॉयस रिकॉग्निशन में त्रुटि। कृपया फिर से कोशिश करें।",
          bn: "ভয়েস রিকগনিশনে ত্রুটি। দয়া করে আবার চেষ্টা করুন।",
          te: "వాయిస్ రికగ్నిషన్‌లో లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.",
          ta: "குரல் அடையாளத்தில் பிழை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
          en: "Voice recognition error. Please try again."
        }
      default:
        return {
          hi: "माइक्रोफ़ोन शुरू कर रहे हैं...",
          bn: "মাইক্রোফোন শুরু করা হচ্ছে...",
          te: "మైక్రోఫోన్ ప్రారంభిస్తోంది...",
          ta: "மைக்ரோஃபோனைத் தொடங்குகிறது...",
          en: "Initializing microphone..."
        }
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "initializing":
        return <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      case "listening":
        return <Mic className="w-12 h-12 text-red-500 animate-pulse" />
      case "processing":
        return <Loader2 className="w-12 h-12 animate-spin text-green-500" />
      case "no-speech":
        return <VolumeX className="w-12 h-12 text-yellow-500" />
      case "error":
        return <AlertCircle className="w-12 h-12 text-red-500" />
      default:
        return <Mic className="w-12 h-12 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "initializing":
        return "border-blue-200 bg-blue-50"
      case "listening":
        return "border-red-200 bg-red-50"
      case "processing":
        return "border-green-200 bg-green-50"
      case "no-speech":
        return "border-yellow-200 bg-yellow-50"
      case "error":
        return "border-red-200 bg-red-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const statusTexts = getStatusText()
  const currentText = statusTexts[language as keyof typeof statusTexts] || statusTexts.en

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md mx-auto ${getStatusColor()} border-2`}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              {getStatusIcon()}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {language === "hi" ? "वॉयस सर्च" 
               : language === "bn" ? "ভয়েস সার্চ"
               : language === "te" ? "వాయిస్ సెర్చ్"
               : language === "ta" ? "குரல் தேடல்"
               : "Voice Search"}
            </h3>
            
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              {currentText}
            </p>
            
            {(status === "error" || status === "no-speech") && (
              <Button
                onClick={onClose}
                variant="outline"
                className="mt-4"
              >
                {language === "hi" ? "बंद करें"
                 : language === "bn" ? "বন্ধ করুন"
                 : language === "te" ? "మూసివేయండి"
                 : language === "ta" ? "மூடு"
                 : "Close"}
              </Button>
            )}
            
            {status === "listening" && (
              <Button
                onClick={onClose}
                variant="destructive"
                size="sm"
                className="mt-4"
              >
                <MicOff className="w-4 h-4 mr-2" />
                {language === "hi" ? "रोकें"
                 : language === "bn" ? "থামান"
                 : language === "te" ? "ఆపండి"
                 : language === "ta" ? "நிறுத்து"
                 : "Stop"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
