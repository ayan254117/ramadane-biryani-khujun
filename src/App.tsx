/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Utensils, Loader2, ExternalLink, Plus, X, 
  Clock, Heart, Share2, Bookmark, MessageSquare, Home, Compass, 
  BookmarkCheck, User, Facebook, Code, Sparkles, ImagePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findBiryaniPlaces } from './services/geminiService';
import { cn } from './lib/utils';
import profilePic from '../assets/Abdul Latif-Ayan.jpg';
import biryaniLogo from '/assets/Biryani-Khujun-logo.png';

// ==========================================
// ১. লোগো কম্পোনেন্ট (নির্ধারিত লোগো ফাইল সহ)
// ==========================================
const AppLogo = ({ onClick }: { onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className="flex items-center gap-2.5 cursor-pointer group select-none active:scale-95 transition-transform"
  >
    <img 
      src={biryaniLogo} 
      alt="Biryani Khujun Logo" 
      className="w-10 h-10 rounded-2xl object-cover shadow-sm border border-amber-500/20"
      onError={(e) => {
        // Fallback for dev environments if path isn't reached immediately
        (e.target as HTMLElement).style.display = 'none';
      }}
    />
    <div>
      <h1 className="font-extrabold text-base text-stone-900 leading-tight tracking-tight group-hover:text-[#5A5A40] transition-colors">
        Biryani Khujun
      </h1>
      <p className="text-[10px] text-stone-500 font-semibold tracking-wide">রমজান ইফতার ফাইন্ডার</p>
    </div>
  </div>
);

// ==========================================
// ২. হেলপার ফাংশনসমূহ
// ==========================================
const cleanFoodType = (typeStr?: string | null): string => {
  if (!typeStr) return 'বিরিয়ানি';
  if (typeStr.includes('-')) {
    const parts = typeStr.split('-');
    return parts[parts.length - 1].trim();
  }
  return typeStr.trim();
};

const formatDistance = (km: number) => {
  if (km < 1) {
    return `${Math.round(km * 1000)} মি. দূরে`;
  }
  return `${km.toFixed(1)} কিমি দূরে`;
};

const COMMENT_SHORTCUTS = [
  "খাবার খুব সুস্বাদু ছিল! 😋",
  "অসাধারণ আয়োজন, আলহামদুলিল্লাহ ❤️",
  "খাবার পর্যাপ্ত ছিল না, দ্রুত শেষ হয়ে গেছে ⚠️",
  "অনেক ভিড় ছিল কিন্তু খাবারের মান ভালো ছিল 👍",
  "স্বাদ মোটামুটি, তবে পরিবেশ ভালো 🕌",
  "খুবই সুশৃঙ্খলভাবে বিতরণ করা হয়েছে 👏"
];

// ==========================================
// ৩. আল্ট্রা-মডার্ন ডিজিটাল ইফতার কাউন্টডাউন
// ==========================================
function RamadaneSchedule() {
  const [locationName, setLocationName] = useState<string>('ঢাকা, বাংলাদেশ');
  const [loading, setLoading] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<{ sehri: string; iftar: string; iftarTimeObj?: Date } | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hrs: number; mins: number; secs: number; isOver: boolean }>({ hrs: 0, mins: 0, secs: 0, isOver: false });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (schedule?.iftarTimeObj) {
        const diff = schedule.iftarTimeObj.getTime() - now.getTime();
        if (diff > 0) {
          const hrs = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft({ hrs, mins, secs, isOver: false });
        } else {
          setTimeLeft({ hrs: 0, mins: 0, secs: 0, isOver: true });
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [schedule]);

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
            const area = geoData?.address?.city || geoData?.address?.town || geoData?.address?.suburb || 'ঢাকা';
            setLocationName(`${area}, বাংলাদেশ`);
          } catch (e) {
            setLocationName('ঢাকা, বাংলাদেশ');
          }
        }

        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${targetLat}&longitude=${targetLng}&method=1`);
        const data = await res.json();

        if (data.code === 200) {
          const timings = data.data.timings;
          const [iftarHour, iftarMinute] = timings.Maghrib.split(':');
          const iftarDate = new Date();
          iftarDate.setHours(parseInt(iftarHour, 10), parseInt(iftarMinute, 10), 0);

          const format12 = (t: string) => {
            const [h, m] = t.split(':');
            let hour = parseInt(h, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            return `${hour < 10 ? '0' + hour : hour}:${m} ${ampm}`;
          };

          setSchedule({
            sehri: format12(timings.Fajr),
            iftar: format12(timings.Maghrib),
            iftarTimeObj: iftarDate
          });
        }
      } catch (err) {
        console.error("Failed to fetch timings", err);
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchScheduleData(pos.coords.latitude, pos.coords.longitude),
        () => fetchScheduleData()
      );
    } else {
      fetchScheduleData();
    }
  }, []);

  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-black text-white rounded-[2rem] p-5 shadow-2xl relative overflow-hidden border border-amber-500/20">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-[11px] bg-white/10 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 font-medium border border-white/10 text-stone-200">
          <MapPin size={12} className="text-amber-400" /> {locationName}
        </span>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
          অটো-ডিলিট: রাত ১১:৫৯
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="animate-spin text-amber-400" size={22} />
          <p className="text-xs text-stone-300">ডিজিটাল সময়সূচী লোড হচ্ছে...</p>
        </div>
      ) : schedule ? (
        <div className="space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-stone-400 font-medium">সেহরির শেষ সময়</p>
              <p className="text-lg font-black text-stone-200 mt-0.5">{schedule.sehri}</p>
            </div>
            <div className="bg-amber-500/10 backdrop-blur-md p-3 rounded-2xl border border-amber-500/20 text-center">
              <p className="text-[10px] text-amber-300 font-bold">ইফতারের সময়</p>
              <p className="text-lg font-black text-amber-400 mt-0.5">{schedule.iftar}</p>
            </div>
          </div>

          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-3.5 text-center shadow-inner">
            <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-bold mb-2 flex items-center justify-center gap-1">
              <Clock size={12} /> ইফতারের বাকি সময়
            </p>
            {timeLeft.isOver ? (
              <p className="text-sm font-bold text-emerald-400 animate-pulse">আজকের ইফতারের সময় সম্পন্ন হয়েছে!</p>
            ) : (
              <div className="flex justify-center items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="bg-stone-900 border border-amber-500/30 text-amber-300 text-xl font-black px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    {String(timeLeft.hrs).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] text-stone-400 mt-1">ঘণ্টা</span>
                </div>
                <span className="text-amber-400 text-lg font-bold -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <div className="bg-stone-900 border border-amber-500/30 text-amber-300 text-xl font-black px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    {String(timeLeft.mins).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] text-stone-400 mt-1">মিনিট</span>
                </div>
                <span className="text-amber-400 text-lg font-bold -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <div className="bg-stone-900 border border-amber-500/30 text-amber-300 text-xl font-black px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    {String(timeLeft.secs).padStart(2, '0')}
                  </div>
                  <span className="text-[9px] text-stone-400 mt-1">সেকেন্ড</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ==========================================
// ৪. মূল App কম্পোনেন্ট
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'saved'>('home');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{ text: string; places: any[] } | null>(null);
  const [userSpots, setUserSpots] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [savedSpots, setSavedSpots] = useState<number[]>([]);
  
  const [selectedSpotForComment, setSelectedSpotForComment] = useState<any | null>(null);
  const [userNameInput, setUserNameInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');
  const [shortcutSelect, setShortcutSelect] = useState<string>('');

  const [formData, setFormData] = useState({
    mosque: '',
    area: '',
    type: 'বিরিয়ানি',
    images: [] as string[],
    commitment: false
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchUserSpots();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location error", err)
      );
    }
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleSearch = async () => {
    setActiveTab('search');
    setLoading(true);

    let currentLat = location?.lat;
    let currentLng = location?.lng;

    if (!currentLat || !currentLng) {
      try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        currentLat = pos.coords.latitude;
        currentLng = pos.coords.longitude;
        setLocation({ lat: currentLat, lng: currentLng });
      } catch (e) {
        console.warn("Location failed");
      }
    }

    try {
      const res = await fetch('/api/spots');
      const dbData = await res.json();
      let allSpots = dbData.success && dbData.spots ? dbData.spots : [];

      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (apiKey && currentLat && currentLng) {
        try {
          const aiData = await findBiryaniPlaces(currentLat, currentLng);
          if (aiData?.places) {
            const aiSpots = aiData.places.map((place: any, idx: number) => ({
              id: 99000 + idx,
              mosque_name: place.title,
              area: "AI রেজাল্ট",
              food_type: "বিরিয়ানি",
              lat: currentLat,
              lng: currentLng,
              uri: place.uri,
              source: 'ai',
              likes_count: 0,
              comments: [],
              images: "[]"
            }));
            allSpots = [...allSpots, ...aiSpots];
          }
        } catch (aiErr) {
          console.error("AI Search failed", aiErr);
        }
      }

      if (currentLat && currentLng) {
        allSpots = allSpots.map(spot => ({
          ...spot,
          distance: calculateDistance(currentLat!, currentLng!, Number(spot.lat), Number(spot.lng))
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setResults({
        text: allSpots.length > 0 ? `${allSpots.length}টি বিরিয়ানি স্পট পাওয়া গেছে` : "কোনো স্পট পাওয়া যায়নি",
        places: allSpots
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (spotId: number) => {
    setSavedSpots(prev => 
      prev.includes(spotId) ? prev.filter(id => id !== spotId) : [...prev, spotId]
    );
  };

  // ছবি আপলোডের হ্যান্ডলার (Base64 হিসেবে রূপান্তর)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, reader.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // রিয়েল-টাইমে ডাটাবেসে লাইক
  const toggleLike = async (spotId: number) => {
    try {
      const res = await fetch('/api/spots/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotId })
      });
      if (res.ok) {
        fetchUserSpots();
      }
    } catch (e) {
      console.error("Like failed", e);
    }
  };

  // রিয়েল-টাইমে ডাটাবেসে কমেন্ট সেভ
  const handleAddComment = async (spotId: number) => {
    const finalComment = shortcutSelect || commentInput.trim();
    if (!userNameInput.trim()) {
      alert("অনুগ্রহ করে আপনার নাম দিন।");
      return;
    }
    if (!finalComment) {
      alert("কমেন্ট অথবা কোনো শর্টকাট অপশন নির্বাচন করুন।");
      return;
    }

    try {
      const res = await fetch('/api/spots/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotId,
          userName: userNameInput.trim(),
          text: finalComment
        })
      });

      if (res.ok) {
        setCommentInput('');
        setShortcutSelect('');
        await fetchUserSpots();
        const updated = userSpots.find(s => s.id === spotId);
        if (updated) setSelectedSpotForComment(updated);
      }
    } catch (e) {
      alert("কমেন্ট যোগ করতে সমস্যা হয়েছে");
    }
  };

  const shareSpot = (spot: any) => {
    if (navigator.share) {
      navigator.share({
        title: spot.mosque_name,
        text: `${spot.mosque_name} - ইফতারের বিরিয়ানি স্পট (${spot.area})`,
        url: `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`
      });
    } else {
      navigator.clipboard.writeText(`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`);
      alert("ম্যাপ লিঙ্ক কপি করা হয়েছে!");
    }
  };

  const getImages = (images: any): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-24 font-sans select-none antialiased">
      {/* App Header with Interactive Logo */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm max-w-md mx-auto">
        <AppLogo onClick={() => setActiveTab('home')} />

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-[#5A5A40] hover:bg-[#4a4a34] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all"
        >
          <Plus size={16} /> স্পট যোগ
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Countdown Schedule */}
        <RamadaneSchedule />

        {/* Tab 1: Home Feed */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div 
              onClick={handleSearch}
              className="bg-white p-3.5 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between cursor-pointer active:bg-stone-50 transition-all"
            >
              <div className="flex items-center gap-3 text-stone-400 text-sm font-medium">
                <Search size={18} className="text-[#5A5A40]" />
                <span>কাছের বিরিয়ানি স্পট খুঁজুন...</span>
              </div>
              <span className="bg-[#5A5A40] text-white text-xs px-3 py-1 rounded-xl font-bold shadow-sm">
                সার্চ
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils size={14} className="text-[#5A5A40]" /> আজকের ইফতার স্পট
                </h2>
                <span className="text-[11px] text-stone-400 font-medium">{userSpots.length} টি পাওয়া গেছে</span>
              </div>

              {userSpots.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-stone-200 space-y-3">
                  <Compass className="mx-auto text-stone-300 animate-bounce" size={36} />
                  <p className="text-xs text-stone-500 font-medium">আজকে এখনো কোনো স্পট যুক্ত করা হয়নি।</p>
                  <button onClick={() => setShowAddModal(true)} className="text-xs text-[#5A5A40] font-bold underline">
                    প্রথম স্পটটি আপনি যোগ করুন
                  </button>
                </div>
              ) : (
                userSpots.map((spot) => {
                  const imgs = getImages(spot.images);
                  const isSaved = savedSpots.includes(spot.id);
                  const commentsList = spot.comments || [];

                  return (
                    <motion.div 
                      key={spot.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden"
                    >
                      {imgs.length > 0 && (
                        <div className="h-44 bg-stone-100 relative">
                          <img src={imgs[0]} alt={spot.mosque_name} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => toggleBookmark(spot.id)}
                            className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md text-white rounded-full active:scale-90 transition-transform"
                          >
                            <Bookmark size={16} className={cn(isSaved && "fill-amber-400 text-amber-400")} />
                          </button>
                        </div>
                      )}

                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base text-stone-800 leading-tight">{spot.mosque_name}</h3>
                            <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={12} /> {spot.area}
                            </p>
                          </div>
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-bold">
                            {cleanFoodType(spot.food_type)}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-600">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleLike(spot.id)}
                              className="flex items-center gap-1 text-xs font-semibold hover:text-red-500 transition-colors"
                            >
                              <Heart size={16} className={cn(spot.likes_count > 0 && "fill-red-500 text-red-500")} />
                              <span>{spot.likes_count || 0}</span>
                            </button>

                            <button 
                              onClick={() => setSelectedSpotForComment(spot)}
                              className="flex items-center gap-1 text-xs font-semibold hover:text-[#5A5A40] transition-colors"
                            >
                              <MessageSquare size={16} />
                              <span>{commentsList.length}</span>
                            </button>

                            <button 
                              onClick={() => shareSpot(spot)}
                              className="flex items-center gap-1 text-xs font-semibold hover:text-[#5A5A40] transition-colors"
                            >
                              <Share2 size={16} />
                            </button>
                          </div>

                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#5A5A40] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform shadow-sm"
                          >
                            ম্যাপ <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Search */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-[#5A5A40] text-white py-3.5 rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Compass size={18} />}
              নিকটস্থ এলাকা অনুযায়ী রিফ্রেশ করুন
            </button>

            {results && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-stone-500">{results.text}</p>
                {results.places.map((spot, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-stone-800">{spot.mosque_name}</h4>
                      <p className="text-xs text-stone-500 mt-0.5">{spot.area}</p>
                      {spot.distance !== undefined && (
                        <span className="text-[10px] bg-stone-100 text-[#5A5A40] font-bold px-2 py-0.5 rounded-md mt-1.5 inline-block">
                          {formatDistance(spot.distance)}
                        </span>
                      )}
                    </div>
                    <a 
                      href={spot.uri || `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl active:scale-90 transition-transform"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved */}
        {activeTab === 'saved' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
              <BookmarkCheck size={16} className="text-[#5A5A40]" /> সেভ করা স্পটসমূহ
            </h2>
            {savedSpots.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-stone-200 text-xs text-stone-500">
                আপনি এখনো কোনো স্পট সেভ করেননি।
              </div>
            ) : (
              userSpots.filter(s => savedSpots.includes(s.id)).map(spot => (
                <div key={spot.id} className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-stone-800">{spot.mosque_name}</h4>
                    <p className="text-xs text-stone-500">{spot.area}</p>
                  </div>
                  <button onClick={() => toggleBookmark(spot.id)} className="text-amber-500">
                    <BookmarkCheck size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* DEVELOPER FOOTER CARD */}
        <section className="pt-6">
          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl p-5 shadow-xl border border-amber-500/30 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={profilePic} 
                  alt="Abdul Latif Ayan" 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md" 
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black p-1 rounded-full text-[9px] font-black">
                  <Code size={10} />
                </span>
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Developer</span>
                </div>
                <h3 className="font-extrabold text-base text-white leading-snug">Abdul Latif Ayan</h3>
                <p className="text-[11px] text-stone-300">Web Developer</p>
                
                <a 
                  href="https://www.facebook.com/abdullatifayan321" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 bg-blue-600/90 hover:bg-blue-600 text-white px-3 py-1 rounded-xl text-[11px] font-bold transition-all shadow-sm active:scale-95 border border-blue-400/30"
                >
                  <Facebook size={12} />
                  <span>Facebook Profile</span>
                </a>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-stone-400 font-medium">
              <span>© 2026 Biryani Khujun</span>
              <span>Dhaka, Bangladesh</span>
            </div>
          </div>
        </section>

      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-stone-200 px-6 py-2 flex justify-around items-center max-w-md mx-auto shadow-lg">
        <button 
          onClick={() => setActiveTab('home')}
          className={cn("flex flex-col items-center gap-1 text-[10px] font-bold transition-colors", activeTab === 'home' ? "text-[#5A5A40]" : "text-stone-400")}
        >
          <Home size={20} /> হোম
        </button>
        <button 
          onClick={handleSearch}
          className={cn("flex flex-col items-center gap-1 text-[10px] font-bold transition-colors", activeTab === 'search' ? "text-[#5A5A40]" : "text-stone-400")}
        >
          <Compass size={20} /> সার্চ
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={cn("flex flex-col items-center gap-1 text-[10px] font-bold transition-colors", activeTab === 'saved' ? "text-[#5A5A40]" : "text-stone-400")}
        >
          <Bookmark size={20} /> সেভড
        </button>
      </nav>

      {/* Comment Modal */}
      <AnimatePresence>
        {selectedSpotForComment && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[2rem] p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-stone-800">{selectedSpotForComment.mosque_name}</h3>
                  <p className="text-[11px] text-stone-400">খাবারের মান ও রিভিউ দিন</p>
                </div>
                <button onClick={() => setSelectedSpotForComment(null)} className="p-1 hover:bg-stone-100 rounded-full"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                {(!selectedSpotForComment.comments || selectedSpotForComment.comments.length === 0) ? (
                  <p className="text-xs text-stone-400 text-center py-6">এখনো কোনো কমেন্ট করা হয়নি। প্রথম কমেন্টটি আপনি দিন!</p>
                ) : (
                  selectedSpotForComment.comments.map((c: any, i: number) => (
                    <div key={i} className="bg-stone-50 p-3 rounded-2xl border border-stone-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-[#5A5A40] flex items-center gap-1">
                          <User size={12} /> {c.userName || c.user_name}
                        </span>
                        <span className="text-[9px] text-stone-400">{c.date || "এখনই"}</span>
                      </div>
                      <p className="text-xs text-stone-700 font-medium">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2.5 pt-2 border-t">
                <input 
                  type="text"
                  value={userNameInput}
                  onChange={e => setUserNameInput(e.target.value)}
                  placeholder="আপনার নাম লিখুন..."
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />

                <select 
                  value={shortcutSelect}
                  onChange={e => {
                    setShortcutSelect(e.target.value);
                    if (e.target.value) setCommentInput('');
                  }}
                  className="w-full text-xs px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 outline-none"
                >
                  <option value="">-- দ্রুত শর্টকাট অপশন বেছে নিন --</option>
                  {COMMENT_SHORTCUTS.map((sc, i) => (
                    <option key={i} value={sc}>{sc}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={commentInput}
                    disabled={!!shortcutSelect}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder={shortcutSelect ? "শর্টকাট সিলেক্ট করা হয়েছে" : "নিজের মন্তব্য লিখুন..."}
                    className="flex-1 text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none disabled:bg-stone-100"
                  />
                  <button 
                    onClick={() => handleAddComment(selectedSpotForComment.id)}
                    className="bg-[#5A5A40] text-white px-4 text-xs font-bold rounded-xl active:scale-95 transition-transform"
                  >
                    পোস্ট
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Spot Modal (WITH FILE IMAGE UPLOAD OPTION) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white rounded-t-[2rem] w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base text-[#5A5A40]">নতুন ইফতার স্পট যোগ করুন</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!location) return alert("লোকেশন পারমিশন দিন");
                setIsSubmitting(true);
                try {
                  const res = await fetch('/api/spots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...formData, lat: location.lat, lng: location.lng })
                  });
                  if ((await res.json()).success) {
                    setShowAddModal(false);
                    setFormData({ mosque: '', area: '', type: 'বিরিয়ানি', images: [], commitment: false });
                    fetchUserSpots();
                  }
                } catch (err) { alert("ত্রুটি হয়েছে"); }
                finally { setIsSubmitting(false); }
              }} className="space-y-4">
                
                <div>
                  <label className="text-xs font-semibold text-stone-700">মসজিদের নাম</label>
                  <input required type="text" value={formData.mosque} onChange={e => setFormData(p => ({...p, mosque: e.target.value}))} placeholder="যেমন: বাইতুল মামুর জামে মসজিদ" className="w-full text-xs p-3 bg-stone-50 rounded-xl border mt-1 outline-none focus:ring-1 focus:ring-[#5A5A40]" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700">এলাকা</label>
                  <input required type="text" value={formData.area} onChange={e => setFormData(p => ({...p, area: e.target.value}))} placeholder="যেমন: ধানমন্ডি, ঢাকা" className="w-full text-xs p-3 bg-stone-50 rounded-xl border mt-1 outline-none focus:ring-1 focus:ring-[#5A5A40]" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700">খাবারের ধরন</label>
                  <select value={formData.type} onChange={e => setFormData(p => ({...p, type: e.target.value}))} className="w-full text-xs p-3 bg-stone-50 rounded-xl border mt-1 outline-none focus:ring-1 focus:ring-[#5A5A40]">
                    <option value="খাবার নির্বাচন করুন">খাবার নির্বাচন করুন</option>
                    <option value="বিরিয়ানি">বিরিয়ানি</option>
                    <option value="তেহারি">তেহারি</option>
                    <option value="গরুর মাংস">গরুর মাংস</option>
                    <option value="খিচুড়ি">খিচুড়ি</option>
                  </select>
                </div>

                {/* IMAGE UPLOAD FIELD */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">স্পটের ছবি যুক্ত করুন (ঐচ্ছিক)</label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 p-3 rounded-xl cursor-pointer transition-colors text-xs text-stone-600 font-medium">
                    <ImagePlus size={18} className="text-[#5A5A40]" />
                    <span>গ্যালারি থেকে ছবি বেছে নিন</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>

                  {/* Uploaded Previews */}
                  {formData.images.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto py-1">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border">
                          <img src={img} alt="preview" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white p-0.5 rounded-full"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* OATH BANNER */}
                <div className="bg-[#FFF8F0] p-4 rounded-3xl border border-[#FDE6D2] space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-600 font-extrabold text-2xl leading-none">❝</span>
                    <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                      <input 
                        type="checkbox" 
                        checked={formData.commitment} 
                        onChange={e => setFormData(p => ({...p, commitment: e.target.checked}))} 
                        className="mt-1 w-4 h-4 accent-amber-600 rounded" 
                      />
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-sm leading-snug">আমি অঙ্গীকার করছি</h4>
                        <p className="text-xs text-stone-700 font-medium leading-relaxed mt-1">
                          আমি রোজা রেখে অঙ্গীকার করছি যে উপরে যে সকল তথ্য পূরণ করেছি তা <span className="text-orange-600 font-bold">সঠিক ও সত্য</span>। যদি কোন তথ্য মিথ্যা প্রমাণিত হয়, তাহলে আমি এর জন্য দায়ী থাকব।
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-2xl border border-stone-200/60 shadow-sm space-y-1">
                    <p className="text-xs text-stone-700 italic leading-relaxed font-medium">
                      "তোমরা সত্যকে মিথ্যার সাথে মিশিয়ে দিও না এবং জেনে-শুনে সত্য গোপন করো না"
                    </p>
                    <p className="text-[11px] font-bold text-amber-600">
                      (সূরা আল-বাক্বারাহ্, আয়াত ৪২)
                    </p>
                  </div>
                </div>

                <button disabled={isSubmitting || !formData.commitment} className="w-full py-3.5 bg-[#5A5A40] hover:bg-[#4a4a34] text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50 transition-all">
                  {isSubmitting ? "পাবলিশ হচ্ছে..." : "পাবলিশ করুন"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
