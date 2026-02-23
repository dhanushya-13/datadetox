import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "./server/db";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "detox-secret-key";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // WebSocket Connection Handling
  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected to WebSocket");
    ws.send(JSON.stringify({ type: "SYSTEM_STATUS", status: "Connected to DataDetox Neural Link" }));
  });

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);
    try {
      const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
      const result = stmt.run(username, hashedPassword);
      const userId = result.lastInsertRowid;
      
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        token, 
        user: { id: userId, username } 
      });
    } catch (e: any) {
      console.error("Registration Error:", e);
      res.status(400).json({ error: e.message || "Username already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, username: user.username } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // File Metadata Upload (Simulating Agent)
  app.post("/api/metadata/upload", (req, res) => {
    const { userId, files } = req.body;
    const insert = db.prepare(`
      INSERT INTO files_metadata (user_id, name, path, size, hash, file_type, last_accessed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((files) => {
      for (const file of files) {
        insert.run(userId, file.name, file.path, file.size, file.hash, file.type, file.lastAccessed);
      }
    });

    transaction(files);
    
    // Trigger Analysis Broadcast
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "SCAN_COMPLETE", count: files.length }));
      }
    });

    res.json({ success: true });
  });

  // Dashboard Data
  app.get("/api/dashboard/:userId", (req, res) => {
    const userId = req.params.userId;
    const files = db.prepare("SELECT * FROM files_metadata WHERE user_id = ?").all(userId);
    const trends = db.prepare("SELECT * FROM storage_trends WHERE user_id = ? ORDER BY timestamp DESC LIMIT 30").all(userId);
    const recommendations = db.prepare(`
      SELECT r.*, f.name, f.size, f.path 
      FROM cleanup_recommendations r
      JOIN files_metadata f ON r.file_id = f.id
      WHERE f.user_id = ? AND r.status = 'pending'
    `).all(userId);

    res.json({ files, trends, recommendations });
  });

  // Deep Scan Simulation
  app.post("/api/scan", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    console.log(`Starting Real-time Deep Scan for user ${userId}`);

    // Send initial start message
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "SCAN_STARTED", userId }));
      }
    });

    // Simulate a multi-step scan process
    const steps = 5;
    const fileTypes = ['image', 'video', 'document', 'app'];
    
    for (let i = 1; i <= steps; i++) {
      // Wait a bit between steps
      await new Promise(resolve => setTimeout(resolve, 800));

      const newFiles = Array.from({ length: 3 }).map((_, j) => ({
        name: `realtime_file_${i}_${j}_${Math.floor(Math.random() * 1000)}.${fileTypes[Math.floor(Math.random() * fileTypes.length)] === 'image' ? 'jpg' : 'mp4'}`,
        path: `/Users/detox/System/Scan/step_${i}`,
        size: Math.floor(Math.random() * 200 * 1024 * 1024),
        hash: Math.random().toString(36).substring(7),
        type: fileTypes[Math.floor(Math.random() * fileTypes.length)],
        lastAccessed: new Date(Date.now() - Math.random() * 10000000000).toISOString()
      }));

      const insertFile = db.prepare(`
        INSERT INTO files_metadata (user_id, name, path, size, hash, file_type, last_accessed)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const insertRecommendation = db.prepare(`
        INSERT INTO cleanup_recommendations (file_id, confidence_score, risk_level, reason)
        VALUES (?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        for (const file of newFiles) {
          const result = insertFile.run(userId, file.name, file.path, file.size, file.hash, file.type, file.lastAccessed);
          const fileId = result.lastInsertRowid;

          if (Math.random() > 0.6) {
            const confidence = 80 + Math.floor(Math.random() * 19);
            const risk = Math.random() > 0.5 ? 'high' : 'medium';
            insertRecommendation.run(fileId, confidence, risk, "Real-time scan identified this as a potential cleanup candidate.");
          }
        }
      });

      transaction();

      // Broadcast progress
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: "SCAN_PROGRESS", 
            progress: (i / steps) * 100,
            newFilesCount: newFiles.length,
            currentFile: newFiles[0].name
          }));
        }
      });
    }

    // Update storage trends at the end
    const totalUsed = db.prepare("SELECT SUM(size) as total FROM files_metadata WHERE user_id = ?").get(userId) as any;
    db.prepare("INSERT INTO storage_trends (user_id, total_used_size) VALUES (?, ?)").run(userId, totalUsed.total || 0);

    // Final completion message
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "SCAN_COMPLETE", count: steps * 3 }));
      }
    });

    res.json({ success: true });
  });

  // Cleanup Execution
  app.post("/api/cleanup", (req, res) => {
    const { userId, itemIds } = req.body;
    if (!userId || !itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: "User ID and item IDs array required" });
    }

    const placeholders = itemIds.map(() => '?').join(',');
    const deleteRecommendations = db.prepare(`
      UPDATE cleanup_recommendations 
      SET status = 'approved' 
      WHERE id IN (${placeholders})
    `);

    try {
      deleteRecommendations.run(...itemIds);
      db.prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)")
        .run(userId, "CLEANUP_EXECUTED", `Deleted ${itemIds.length} items`);
      res.json({ success: true, count: itemIds.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Analysis Generation
  app.post("/api/analyze", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    const files = db.prepare("SELECT * FROM files_metadata WHERE user_id = ?").all(userId) as any[];
    const recommendations = db.prepare(`
      SELECT r.*, f.name, f.size 
      FROM cleanup_recommendations r
      JOIN files_metadata f ON r.file_id = f.id
      WHERE f.user_id = ? AND r.status = 'pending'
    `).all(userId) as any[];

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
      flaggedCount: recommendations.length,
      flaggedSize: recommendations.reduce((acc, r) => acc + r.size, 0),
    };

    const prompt = `
      As a Digital Detox Specialist, analyze this user's storage profile:
      - Total Files: ${stats.totalFiles}
      - Total Storage: ${(stats.totalSize / (1024**3)).toFixed(2)} GB
      - Flagged for Cleanup: ${stats.flaggedCount} items (${(stats.flaggedSize / (1024**2)).toFixed(2)} MB)
      
      Provide a concise, professional report in Markdown. 
      Include:
      1. A "Neural Balance" assessment.
      2. Specific observations about their storage habits.
      3. A 3-step action plan for their "Digital Detox".
      Use a sophisticated, slightly futuristic tone.
    `;

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (e: any) {
      console.error("AI Analysis Error:", e);
      res.status(500).json({ error: "Failed to generate AI analysis" });
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
