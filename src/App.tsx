/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Moon, Utensils, Loader2, ExternalLink, Plus, X, 
  Camera, CheckCircle2, Check, Clock, Calendar, Heart, Star, 
  Share2, Bookmark, MessageSquare, Home, Compass, BookmarkCheck, User, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { findBiryaniPlaces } from './services/geminiService';
import { cn } from './lib/utils';
import profilePic from '../assets/Abdul Latif-Ayan.jpg';

// ==========================================
// ১. হেলপার ফাংশন
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

// কমেন্টের জন্য শর্টকাট অপশনসমূহ
const COMMENT_SHORTCUTS = [
  "খাবার খুব সুস্বাদু ছিল! 😋",
  "অসাধারণ আয়োজন, আলহামদুলিল্লাহ ❤️",
  "খাবার পর্যাপ্ত ছিল না, দ্রুত শেষ হয়ে গেছে ⚠️",
  "অনেক ভিড় ছিল কিন্তু খাবারের মান ভালো ছিল 👍",
  "স্বাদ মোটামুটি, তবে পরিবেশ ভালো 🕌",
  "খুবই সুশৃঙ্খলভাবে বিতরণ করা হয়েছে 👏"
];

// ==========================================
// ২. ইফতার কাউন্টডাউন ও সময়সূচী
// ==========================================
function RamadaneSchedule() {
  const [locationName, setLocationName] = useState<string>('ঢাকা, বাংলাদেশ');
  const [loading, setLoading] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<{ sehri: string; iftar: string; iftarTimeObj?: Date } | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (schedule?.iftarTimeObj) {
        const diff = schedule.iftarTimeObj.getTime() - now.getTime();
        if (diff > 0) {
          const hrs = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hrs > 0 ? hrs + 'ঘণ্টা ' : ''}${mins}মি. ${secs}সে. বাকি`);
        } else {
          setTimeLeft('ইফতারের সময় হয়েছে!');
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
    <div className="bg-gradient-to-br from-[#5A5A40] to-[#383827] text-white rounded-[2rem] p-5 shadow-xl relative overflow-hidden border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] bg-white/15 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1 font-medium">
          <MapPin size={12} /> {locationName}
        </span>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
          অটো-ডিলিট: রাত ১১:৫৯
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2">
          <Loader2 className="animate-spin text-white/70" size={20} />
          <p className="text-xs text-white/70">সময়সূচী লোড হচ্ছে...</p>
        </div>
      ) : schedule ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-white/70 font-medium">সেহরির শেষ সময়</p>
              <p className="text-xl font-black mt-0.5" style={{ fontFamily: 'sans-serif' }}>{schedule.sehri}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-center">
              <p className="text-[10px] text-amber-200 font-bold">ইফতারের সময়</p>
              <p className="text-xl font-black text-amber-300 mt-0.5" style={{ fontFamily: 'sans-serif' }}>{schedule.iftar}</p>
            </div>
          </div>

          {timeLeft && (
            <div className="bg-amber-400/20 border border-amber-300/30 rounded-2xl p-2.5 text-center backdrop-blur-sm flex items-center justify-center gap-2">
              <Clock size={16} className="text-amber-300" />
              <p className="text-xs font-bold text-white">{timeLeft}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ==========================================
// ৩. মূল App কম্পোনেন্ট (Mobile App UI/UX)
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'saved'>('home');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{ text: string; places: any[] } | null>(null);
  const [userSpots, setUserSpots] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Local State
  const [savedSpots, setSavedSpots] = useState<number[]>([]);
  const [reactions, setReactions] = useState<Record<number, { likes: number; liked: boolean }>>({});
  
  // Comment System with Name & Shortcuts
  const [selectedSpotForComment, setSelectedSpotForComment] = useState<any | null>(null);
  const [userNameInput, setUserNameInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');
  const [shortcutSelect, setShortcutSelect] = useState<string>('');
  const [spotComments, setSpotComments] = useState<Record<number, { userName: string; text: string; date: string }[]>>({});

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
    setError(null);

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
      setError("স্পট লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (spotId: number) => {
    setSavedSpots(prev => 
      prev.includes(spotId) ? prev.filter(id => id !== spotId) : [...prev, spotId]
    );
  };

  const toggleLike = (spotId: number) => {
    setReactions(prev => {
      const current = prev[spotId] || { likes: 0, liked: false };
      return {
        ...prev,
        [spotId]: {
          likes: current.liked ? current.likes - 1 : current.likes + 1,
          liked: !current.liked
        }
      };
    });
  };

  // কমেন্ট ও শর্টকাট সাবমিট লজিক
  const handleAddComment = (spotId: number) => {
    const finalComment = shortcutSelect || commentInput.trim();
    if (!userNameInput.trim()) {
      alert("অনুগ্রহ করে আপনার নাম দিন।");
      return;
    }
    if (!finalComment) {
      alert("কমেন্ট অথবা কোনো শর্টকাট অপশন নির্বাচন করুন।");
      return;
    }

    const newEntry = {
      userName: userNameInput.trim(),
      text: finalComment,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSpotComments(prev => ({
      ...prev,
      [spotId]: [...(prev[spotId] || []), newEntry]
    }));

    setCommentInput('');
    setShortcutSelect('');
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
      {/* Mobile App Glass Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#5A5A40] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-[#5A5A40]/20">
            র
          </div>
          <div>
            <h1 className="font-bold text-base text-stone-800 leading-tight">বিরিয়ানি খুঁজুন</h1>
            <p className="text-[10px] text-stone-500 font-medium">রমজান ইফতার ফাইন্ডার</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-[#5A5A40] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} /> স্পট যোগ
        </button>
      </header>

      {/* Main Mobile App Container */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Schedule Widget */}
        <RamadaneSchedule />

        {/* Tab 1: Home Feed */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Quick Search Card */}
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

            {/* Spots Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils size={14} className="text-[#5A5A40]" /> আজকের ইফতার স্পট
                </h2>
                <span className="text-[11px] text-stone-400 font-medium">{userSpots.length} টি পাওয়া গেছে</span>
              </div>

              {userSpots.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-stone-200/80 space-y-3">
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
                  const react = reactions[spot.id] || { likes: 0, liked: false };
                  const comments = spotComments[spot.id] || [];

                  return (
                    <motion.div 
                      key={spot.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden"
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

                        {/* Interactive App Bar */}
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-600">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => toggleLike(spot.id)}
                              className="flex items-center gap-1 text-xs font-semibold hover:text-red-500 transition-colors"
                            >
                              <Heart size={16} className={cn(react.liked && "fill-red-500 text-red-500")} />
                              <span>{react.likes}</span>
                            </button>

                            <button 
                              onClick={() => setSelectedSpotForComment(spot)}
                              className="flex items-center gap-1 text-xs font-semibold hover:text-[#5A5A40] transition-colors"
                            >
                              <MessageSquare size={16} />
                              <span>{comments.length}</span>
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

        {/* Tab 2: Distance Search */}
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
                  <div key={idx} className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-sm flex items-center justify-between">
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

        {/* Tab 3: Saved Spots */}
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
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-stone-400 text-[11px] space-y-2 border-t border-stone-200/60 bg-white">
        <div className="flex items-center justify-center gap-2">
          <img src={profilePic} alt="Ayan" className="w-6 h-6 rounded-full object-cover border" />
          <span className="font-medium text-stone-600">Abdul Latif Ayan</span>
        </div>
        <p>© 2026 Ramadan Biryani Khujun • Dhaka</p>
      </footer>

      {/* Mobile App Bottom Navigation Bar */}
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

      {/* Comment & Review Modal with Shortcuts and Name */}
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

              {/* Comment Feed */}
              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                {(spotComments[selectedSpotForComment.id] || []).length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-6">এখনো কোনো কমেন্ট করা হয়নি। প্রথম কমেন্টটি আপনি দিন!</p>
                ) : (
                  (spotComments[selectedSpotForComment.id] || []).map((c, i) => (
                    <div key={i} className="bg-stone-50 p-3 rounded-2xl border border-stone-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-[#5A5A40] flex items-center gap-1">
                          <User size={12} /> {c.userName}
                        </span>
                        <span className="text-[9px] text-stone-400">{c.date}</span>
                      </div>
                      <p className="text-xs text-stone-700 font-medium">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Input Form with Name & Shortcut Dropdown */}
              <div className="space-y-2.5 pt-2 border-t">
                {/* User Name Input */}
                <div className="relative">
                  <input 
                    type="text"
                    value={userNameInput}
                    onChange={e => setUserNameInput(e.target.value)}
                    placeholder="আপনার নাম লিখুন..."
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                  />
                </div>

                {/* Shortcuts Dropdown */}
                <div className="relative">
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
                </div>

                {/* Custom Text Input or Shortcut Preview */}
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

      {/* Add Spot Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-md p-5 space-y-4 max-h-[85vh] overflow-y-auto"
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
                    setFormData({ mosque: '', area: '', type: 'কাচ্চি বিরিয়ানি', images: [], commitment: false });
                    fetchUserSpots();
                  }
                } catch (err) { alert("ত্রুটি হয়েছে"); }
                finally { setIsSubmitting(false); }
              }} className="space-y-3">
                
                <div>
                  <label className="text-xs font-medium text-stone-600">মসজিদের নাম</label>
                  <input required type="text" value={formData.mosque} onChange={e => setFormData(p => ({...p, mosque: e.target.value}))} placeholder="যেমন: বাইতুল মামুর জামে মসজিদ" className="w-full text-xs p-3 bg-stone-50 rounded-xl border mt-1 outline-none" />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-600">এলাকা</label>
                  <input required type="text" value={formData.area} onChange={e => setFormData(p => ({...p, area: e.target.value}))} placeholder="যেমন: ধানমন্ডি, ঢাকা" className="w-full text-xs p-3 bg-stone-50 rounded-xl border mt-1 outline-none" />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-600">খাবারের ধরন</label>
                  <select value={formData.type} onChange={e => setFormData(p => ({...p, type: e.target.value}))} className="w-full text-xs p-3 bg-stone-50 rounded-xl border mt-1 outline-none">
                    <option value="কাচ্চি বিরিয়ানি">কাচ্চি বিরিয়ানি</option>
                    <option value="তেহারি">তেহারি</option>
                    <option value="গরুর মাংস">গরুর মাংস</option>
                    <option value="খিচুড়ি">খিচুড়ি</option>
                  </select>
                </div>

                <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-xs space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.commitment} onChange={e => setFormData(p => ({...p, commitment: e.target.checked}))} className="mt-0.5" />
                    <span>আমি রোজা রেখে অঙ্গীকার করছি যে প্রদানকৃত তথ্য সত্য।</span>
                  </label>
                </div>

                <button disabled={isSubmitting || !formData.commitment} className="w-full py-3.5 bg-[#5A5A40] text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50">
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
