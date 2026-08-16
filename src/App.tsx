/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Moon, Utensils, Loader2, ExternalLink, Plus, X, Camera, CheckCircle2, Check, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findBiryaniPlaces } from './services/geminiService';
import { cn } from './lib/utils';
import profilePic from '../assets/Abdul Latif-Ayan.jpg';

// ==========================================
// ১. খাবারের নাম ক্লিন করার ফাংশন
// ==========================================
const cleanFoodType = (typeStr?: string | null): string => {
  if (!typeStr) return 'বিরিয়ানি';
  if (typeStr.includes('-')) {
    const parts = typeStr.split('-');
    return parts[parts.length - 1].trim();
  }
  return typeStr.trim();
};

// ==========================================
// ২. রমজান সময়সূচী ও লাইভ ক্লক
// ==========================================
function RamadaneSchedule() {
  const [hijriDate, setHijriDate] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('ঢাকা, বাংলাদেশ');
  const [loading, setLoading] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<{ sehri: string; iftar: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const toBanglaDigits = (str: string | number) => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.toString().replace(/\d/g, (x) => banglaDigits[parseInt(x, 10)]);
  };

  const hijriMonthsBn: Record<string, string> = {
    'Muḥarram': 'মহররম',
    'Ṣafar': 'সফর',
    'Rabīʿ al-awwal': 'রবিউল আউয়াল',
    'Rabīʿ al-thānī': 'রবিউস সানি',
    'Jumādá al-ūlá': 'জুমাদাল উলা',
    'Jumādá al-ākhirah': 'জুমাদাস সানি',
    'Rajab': 'রজব',
    'Shaʿbān': 'শাবান',
    'Ramaḍān': 'রমজান',
    'Shawwāl': 'শাওয়াল',
    'Dhū al-Qaʿdah': 'জিলকদ',
    'Dhū al-Ḥijjah': 'জিলহজ্জ'
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format12Hour = (time24: string) => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr ? minutesStr.split(' ')[0] : '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursFormatted = hours < 10 ? `0${hours}` : hours;
    return `${hoursFormatted}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const fetchScheduleData = async (lat?: number, lng?: number) => {
      try {
        setLoading(true);
        const targetLat = lat || 23.8103;
        const targetLng = lng || 90.4125;

        if (lat && lng) {
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const geoData = await geoRes.json();
            const area = geoData?.address?.city || geoData?.address?.town || geoData?.address?.suburb || geoData?.address?.state || 'ঢাকা';
            setLocationName(`${area}, বাংলাদেশ`);
          } catch (e) {
            setLocationName('ঢাকা, বাংলাদেশ');
          }
        }

        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${targetLat}&longitude=${targetLng}&method=1`);
        const data = await res.json();

        if (data.code === 200) {
          const timings = data.data.timings;
          const dateInfo = data.data.date.hijri;

          setSchedule({
            sehri: format12Hour(timings.Fajr),
            iftar: format12Hour(timings.Maghrib)
          });

          const monthName = hijriMonthsBn[dateInfo.month.en] || dateInfo.month.en;
          setHijriDate(`${toBanglaDigits(dateInfo.day)} ${monthName} ${toBanglaDigits(dateInfo.year)} হিজরী`);
        }
      } catch (err) {
        console.error("Failed to fetch timings", err);
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchScheduleData(pos.coords.latitude, pos.coords.longitude);
        },
        () => fetchScheduleData()
      );
    } else {
      fetchScheduleData();
    }
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const timeString = `${formattedHours < 10 ? '0' : ''}${formattedHours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds} ${ampm}`;

  const monthName = currentTime.toLocaleString('en-US', { month: 'long' });
  const dateString = `${currentTime.getDate()} ${monthName} ${currentTime.getFullYear()}`;
  const dayName = currentTime.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#5A5A40]/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl font-semibold flex items-center gap-2 text-[#5A5A40]">
          <Moon size={24} />
          আজকের সময়সূচী
        </h2>
        <span className="text-xs bg-[#5A5A40]/10 text-[#5A5A40] px-3 py-1 rounded-full flex items-center gap-1 font-medium">
          <MapPin size={12} /> {locationName}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="animate-spin text-[#5A5A40]" size={32} />
          <p className="text-xs text-stone-400 animate-pulse">সময়সূচী লোড হচ্ছে...</p>
        </div>
      ) : schedule ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500 font-medium">সেহরির শেষ সময়</p>
                <p className="text-2xl font-bold text-[#5A5A40]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  {schedule.sehri}
                </p>
              </div>
              <Clock className="text-[#5A5A40]/40" size={28} />
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500 font-medium">ইফতারের সময়</p>
                <p className="text-2xl font-bold text-[#5A5A40]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  {schedule.iftar}
                </p>
              </div>
              <Utensils className="text-[#5A5A40]/40" size={28} />
            </div>
          </div>

          {hijriDate && (
            <div className="text-center pt-2 text-sm text-stone-600 flex items-center justify-center gap-1 font-medium">
              <Calendar size={16} /> হিজরি তারিখ: <span className="font-bold text-[#5A5A40]">{hijriDate}</span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-stone-100 text-center bg-stone-50 rounded-2xl p-3">
            <p className="text-xl font-bold text-[#5A5A40]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {timeString}
            </p>
            <p className="text-xs text-stone-500 font-medium mt-1">
              date: {dateString}
            </p>
            <p className="text-xs text-stone-500 font-medium">
              day: {dayName}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center py-4 text-stone-500 text-sm">সময়সূচী পাওয়া যায়নি</p>
      )}
    </div>
  );
}

// ==========================================
// ৩. মূল App কম্পোনেন্ট
// ==========================================
interface UserSpot {
  id: number;
  mosque_name: string;
  area: string;
  food_type: string;
  lat: number;
  lng: number;
  images: string;
  created_at: string;
}

export default function App() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{ text: string; places: any[] } | null>(null);
  const [userSpots, setUserSpots] = useState<UserSpot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    mosque: '',
    area: '',
    type: 'কাচ্চি বিরিয়ানি',
    images: [] as string[],
    commitment: false
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchUserSpots();
    let watchId: number;

    const handleLocationSuccess = (position: GeolocationPosition) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    };

    const handleLocationError = (err: GeolocationPositionError) => {
      console.error("Geolocation error:", err);
      let msg = "লোকেশন অ্যাক্সেস পাওয়া যায়নি।";
      if (err.code === err.PERMISSION_DENIED) msg = "লোকেশন পারমিশন রিজেক্ট করা হয়েছে।";
      if (err.code === err.TIMEOUT) msg = "লোকেশন পেতে অনেক সময় লাগছে।";
      setError(msg);
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      });

      watchId = navigator.geolocation.watchPosition(handleLocationSuccess, handleLocationError, {
        enableHighAccuracy: true
      });
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const fetchUserSpots = async () => {
    try {
      const res = await fetch('/api/spots');
      const data = await res.json();
      if (data.success) {
        setUserSpots(data.spots || []);
      }
    } catch (err) {
      console.error("Failed to fetch spots", err);
    }
  };

  // -------------------------------------------------------------
  // আপডেট করা ফাইল রিডার প্রমিস হ্যান্ডলার (ছবি সঠিক ও দ্রুত আপলোডের জন্য)
  // -------------------------------------------------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    };

    try {
      const fileList = Array.from(files);
      const base64Images = await Promise.all(fileList.map(file => readAsBase64(file)));
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...base64Images]
      }));
    } catch (err) {
      console.error("Image loading error:", err);
      alert("ছবি রিড করতে ব্যর্থ হয়েছে, অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।");
    } finally {
      e.target.value = ''; // রিসেট করা যেন একই ছবি বারবার সিলেক্ট করা যায়
    }
  };

  const handleSubmitSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert("স্পট যোগ করার জন্য অনুগ্রহ করে লোকেশন অ্যাক্সেস দিন।");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lat: location.lat,
          lng: location.lng
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({ mosque: '', area: '', type: 'কাচ্চি বিরিয়ানি', images: [], commitment: false });
        fetchUserSpots();
      } else {
        alert(data.message || "স্পট যোগ করতে সমস্যা হয়েছে");
      }
    } catch (err) {
      console.error(err);
      alert("স্পট যোগ করতে ব্যর্থ হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getImages = (images: any): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/spots');
      const dbData = await res.json();
      
      if (!res.ok) {
        throw new Error(dbData.message || "সার্ভার থেকে ডেটা পাওয়া যায়নি");
      }

      let allSpots: any[] = [];
      if (dbData.success && dbData.spots) {
        allSpots = dbData.spots.map((spot: any) => ({
          ...spot,
          source: 'user'
        }));
      }

      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (apiKey) {
        try {
          const aiData = await findBiryaniPlaces(location?.lat, location?.lng);
          if (aiData && aiData.places) {
            const aiSpots = aiData.places.map((place: any) => ({
              mosque_name: place.title,
              area: "AI Search Result",
              food_type: "বিরিয়ানি",
              lat: location?.lat || 23.8103,
              lng: location?.lng || 90.4125,
              uri: place.uri,
              source: 'ai',
              images: "[]"
            }));
            allSpots = [...allSpots, ...aiSpots];
          }
        } catch (aiErr: any) {
          console.error("AI Search failed", aiErr);
        }
      }
      
      if (location) {
        allSpots = allSpots.map(spot => ({
          ...spot,
          distance: calculateDistance(location.lat, location.lng, spot.lat, spot.lng)
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setResults({ 
        text: allSpots.length > 0 
          ? `আপনার আশেপাশে ${allSpots.length}টি বিরিয়ানি স্পট পাওয়া গেছে।`
          : "দুঃখিত, কোনো বিরিয়ানি স্পট খুঁজে পাওয়া যায়নি।", 
        places: allSpots 
      });
    } catch (err: any) {
      let msg = "বিরিয়ানি স্পট খুঁজে পেতে ব্যর্থ হয়েছে।";
      if (err.message?.includes('Invalid API key')) {
        msg = "ডাটাবেস কানেকশন এরর: অনুগ্রহ করে Supabase API Key চেক করুন।";
      } else if (err.message?.includes('Failed to fetch')) {
        msg = "সার্ভারের সাথে যোগাযোগ করা সম্ভব হচ্ছে না।";
      } else {
        msg += ` (${err.message})`;
      }
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="bg-[#5A5A40] text-white py-8 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="grid grid-cols-8 gap-4 rotate-12 scale-150">
            {Array.from({ length: 32 }).map((_, i) => (
              <Utensils key={i} size={48} />
            ))}
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-2 tracking-tight">
            রমজানের বিরিয়ানি খুঁজুন
          </h1>
        </motion.div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">
        <section>
          <RamadaneSchedule />
        </section>

        {/* Search Action */}
        <section className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className={cn(
                "group relative flex items-center gap-3 px-8 py-4 bg-[#5A5A40] text-white rounded-full text-xl font-serif font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 shadow-lg shadow-[#5A5A40]/20",
                loading && "cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Search size={24} />
              )}
              বিরিয়ানি খুঁজুন
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-3 px-8 py-4 bg-white text-[#5A5A40] border-2 border-[#5A5A40] rounded-full text-xl font-serif font-medium transition-all hover:bg-[#5A5A40]/5 hover:scale-105 active:scale-95 shadow-lg"
            >
              <Plus size={24} />
              স্পট যোগ করুন
            </button>
          </div>
          
          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}
        </section>

        {/* User Added Spots */}
        {userSpots.length > 0 && (
          <section className="space-y-6">
            <h3 className="font-serif text-2xl font-bold flex items-center gap-2 text-[#5A5A40]">
              <CheckCircle2 size={24} />
              সদস্যদের যোগ করা স্পট
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userSpots.map((spot) => {
                const spotImages = getImages(spot.images);
                return (
                  <motion.div
                    key={spot.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#5A5A40]/10 flex flex-col justify-between"
                  >
                    {spotImages.length > 0 && (
                      <div className="h-48 overflow-hidden bg-stone-100">
                        <img 
                          src={spotImages[0]} 
                          alt={spot.mosque_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-serif text-xl font-bold text-[#5A5A40]">{spot.mosque_name}</h4>
                        <span className="text-xs bg-[#5A5A40]/10 text-[#5A5A40] px-2 py-1 rounded-full font-bold">
                          {cleanFoodType(spot.food_type)}
                        </span>
                      </div>
                      <p className="text-stone-500 flex items-center gap-1 text-sm mb-4">
                        <MapPin size={14} /> {spot.area}
                      </p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#5A5A40] font-medium flex items-center gap-1 hover:underline"
                      >
                        ম্যাপে দেখুন <ExternalLink size={14} />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Search Results */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#5A5A40]/10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif text-2xl font-bold flex items-center gap-2 text-[#5A5A40]">
                    <Utensils size={24} />
                    খুঁজে পাওয়া বিরিয়ানি স্পট
                  </h3>
                  <span className="bg-[#5A5A40] text-white px-4 py-1 rounded-full text-sm font-bold">
                    {results.places.length} টি পাওয়া গেছে
                  </span>
                </div>

                <div className="space-y-4">
                  {results.places.map((spot: any, idx: number) => {
                    const spotImages = getImages(spot.images);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-stone-100 bg-stone-50 hover:bg-stone-100 transition-all group"
                      >
                        {spotImages.length > 0 ? (
                          <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-stone-200">
                            <img 
                              src={spotImages[0]} 
                              alt={spot.mosque_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full md:w-32 h-32 rounded-xl bg-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400">
                            <Camera size={32} />
                          </div>
                        )}

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-serif text-xl font-bold text-[#5A5A40]">{spot.mosque_name}</h4>
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
                                {cleanFoodType(spot.food_type)}
                              </span>
                            </div>
                            <p className="text-stone-500 flex items-center gap-1 text-sm mt-1">
                              <MapPin size={14} /> {spot.area}
                            </p>
                          </div>

                          <div className="mt-4 flex justify-between items-end">
                            <div className="text-[#5A5A40]">
                              {spot.distance !== undefined && (
                                <p className="text-xs font-bold bg-[#5A5A40]/10 px-2 py-1 rounded-lg inline-block">
                                  {spot.distance.toFixed(2)} কিমি দূরে
                                </p>
                              )}
                              {spot.source === 'ai' && (
                                <p className="text-[10px] text-stone-400 mt-1 italic">AI দ্বারা খুঁজে পাওয়া</p>
                              )}
                            </div>
                            <a 
                              href={spot.uri || `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#5A5A40] text-white p-2 rounded-xl hover:scale-110 transition-transform"
                            >
                              <ExternalLink size={18} />
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 text-center border-t border-stone-100 bg-stone-50">
        <div className="max-w-xs mx-auto space-y-4">
          <p className="font-serif italic text-stone-500">Ramadanul Mubarak • রমজানুল মোবারক</p>
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#5A5A40] shadow-lg bg-white">
              <img 
                src={profilePic} 
                alt="Abdul Latif Ayan"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayan";
                }}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-stone-400 text-[10px] uppercase tracking-widest">Developed By</p>
              <a 
                href="https://www.facebook.com/abdullatifayan321" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-stone-800 hover:text-[#5A5A40] transition-colors flex items-center gap-2 text-lg"
              >
                Abdul Latif Ayan
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
          <p className="text-stone-400 text-[10px] mt-4">© 2026 Ramadane Biryani Khujun</p>
        </div>
      </footer>

      {/* Add Spot Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                <h3 className="font-serif text-2xl font-bold text-[#5A5A40]">নতুন স্পট যোগ করুন</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmitSpot} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-600">মসজিদের নাম</label>
                  <input
                    required
                    type="text"
                    value={formData.mosque}
                    onChange={e => setFormData(prev => ({ ...prev, mosque: e.target.value }))}
                    placeholder="যেমন: বাইতুল মামুর জামে মসজিদ"
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-600">এলাকা</label>
                  <input
                    required
                    type="text"
                    value={formData.area}
                    onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="যেমন: মগবাজার, ঢাকা"
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-600">খাবারের ধরন</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all bg-white"
                  >
                    <option value="কাচ্চি বিরিয়ানি">কাচ্চি বিরিয়ানি</option>
                    <option value="তেহারি">তেহারি</option>
                    <option value="গরুর মাংস">গরুর মাংস</option>
                    <option value="খিচুড়ি">খিচুড়ি</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-600">ছবি (ঐচ্ছিক)</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200">
                        <img src={img} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:border-[#5A5A40] hover:text-[#5A5A40] transition-all cursor-pointer">
                      <Camera size={20} />
                      <span className="text-[10px] mt-1">যোগ করুন</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="space-y-4 mt-6 pt-6 border-t-2 border-orange-100">
                  <div className="flex items-start gap-3 p-5 bg-orange-50 rounded-2xl border border-orange-200">
                    <div className="flex-shrink-0">
                      <Utensils className="text-orange-500" size={24} />
                    </div>
                    <div className="flex-1">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.commitment}
                          onChange={e => setFormData(prev => ({ ...prev, commitment: e.target.checked }))}
                          className="hidden" 
                        />
                        <div className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-1",
                          formData.commitment ? "bg-orange-500 border-orange-500" : "bg-white border-orange-300"
                        )}>
                          {formData.commitment && <Check size={14} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-stone-800 text-lg">আমি অঙ্গীকার করছি</p>
                          <p className="text-stone-600 text-sm leading-relaxed">
                            আমি রোজা রেখে অঙ্গীকার করছি যে উপরে যে সকল তথ্য পূরণ করেছি তা 
                            <span className="font-bold text-orange-600"> সঠিক ও সত্য</span>। 
                            যদি কোন তথ্য মিথ্যা প্রমাণিত হয়, তাহলে আমি এর জন্য দায়ী থাকব।
                          </p>
                        </div>
                      </label>
                      
                      <div className="mt-3 p-3 bg-white/60 rounded-xl border border-orange-100 text-xs text-stone-500 italic">
                        "তোমরা সত্যকে মিথ্যার সাথে মিশিয়ে দিও না এবং জেনে-শুনে সত্য গোপন করো না" 
                        <span className="text-orange-400 block mt-1">(সূরা আল-বাকারাহ, আয়াত ৪২)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.commitment}
                    className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    পাবলিশ করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
