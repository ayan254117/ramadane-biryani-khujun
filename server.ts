import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Auto-cleanup logic: Delete spots every day at 7:00 PM
  const cleanupOldSpots = async () => {
    if (!supabaseUrl || !supabaseKey) return;

    const now = new Date();
    const hours = now.getHours();
    
    // Delete spots not from today (UTC comparison, might need adjustment for local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
      // Delete spots older than today
      await supabase
        .from('spots')
        .delete()
        .lt('created_at', today.toISOString());
      
      // If it's past 7 PM (19:00), delete today's spots too
      if (hours >= 19) {
        await supabase
          .from('spots')
          .delete()
          .gte('created_at', today.toISOString());
        console.log("7:00 PM Cleanup: All spots cleared for the day from Supabase.");
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };

  // Run cleanup on startup and every 5 minutes
  cleanupOldSpots();
  setInterval(cleanupOldSpots, 300000);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/spots", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ success: true, spots: data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/spots", async (req, res) => {
    const { mosque, area, type, lat, lng, images } = req.body;

    if (!mosque || !area || !type || !lat || !lng) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
      const { data, error } = await supabase
        .from('spots')
        .insert([
          { 
            mosque_name: mosque, 
            area, 
            food_type: type, 
            lat, 
            lng, 
            images: JSON.stringify(images || []) 
          }
        ])
        .select();

      if (error) throw error;
      res.json({ success: true, id: data[0].id, message: "Spot added successfully!" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
