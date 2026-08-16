import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration using your provided credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dqqyinrvfdnwlwvcsdgh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_Ipr6twunyEJs42KiEhc8jA_HHSFTwnc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch all user added spots
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(200).json({ success: true, spots: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
    }
  }

  // POST: Add a new spot
  if (req.method === 'POST') {
    try {
      const { mosque, area, type, images, lat, lng } = req.body || {};

      if (!mosque || !area || !lat || !lng) {
        return res.status(400).json({ success: false, message: 'প্রয়োজনীয় তথ্যসমূহ দেওয়া হয়নি।' });
      }

      const { data, error } = await supabase
        .from('spots')
        .insert([
          {
            mosque_name: mosque,
            area: area,
            food_type: type || 'কাচ্চি বিরিয়ানি',
            images: JSON.stringify(images || []),
            lat: Number(lat),
            lng: Number(lng)
          }
        ])
        .select();

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(200).json({ success: true, spot: data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Server Error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}