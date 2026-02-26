import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "./server/db";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "detox-secret-key";
const upload = multer({ storage: multer.memoryStorage() });

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

  // Seed Demo User
  const seedDemoUser = async () => {
    const existing = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    if (existing.count === 0) {
      console.log("Seeding demo user...");
      const hashedPassword = await bcrypt.hash("password123", 8);
      const result = db.prepare("INSERT INTO users (username, password, is_verified) VALUES (?, ?, ?)").run("demo", hashedPassword, 1);
      const userId = result.lastInsertRowid;
      db.prepare("INSERT INTO user_permissions (user_id) VALUES (?)").run(userId);
      db.prepare("INSERT INTO user_preferences (user_id) VALUES (?)").run(userId);
      console.log("Demo user 'demo' created with password 'password123'");
    }
  };
  await seedDemoUser();

  // WebSocket Connection Handling
  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected to WebSocket");
    ws.send(JSON.stringify({ type: "SYSTEM_STATUS", status: "Connected to DataDetox Neural Link" }));
  });

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Registration attempt for: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    try {
      const stmt = db.prepare("INSERT INTO users (username, password, is_verified) VALUES (?, ?, ?)");
      const result = stmt.run(username.trim(), hashedPassword, 1);
      const userId = result.lastInsertRowid;
      
      // Initialize permissions and preferences
      db.prepare("INSERT INTO user_permissions (user_id) VALUES (?)").run(userId);
      db.prepare("INSERT INTO user_preferences (user_id) VALUES (?)").run(userId);

      console.log(`User registered successfully: ${username} (ID: ${userId})`);
      
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        token,
        user: { id: userId, username: username.trim() }
      });
    } catch (e: any) {
      console.error("Registration Error:", e);
      let errorMessage = "Username already exists";
      if (e.message.includes("users.username")) {
        errorMessage = "This username is already taken.";
      }
      res.status(400).json({ error: errorMessage });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username.trim());
    
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
        console.log(`User logged in successfully: ${username}`);
        return res.json({ token, user: { id: user.id, username: user.username } });
      } else {
        console.log(`Invalid password for user: ${username}`);
      }
    } else {
      console.log(`User not found: ${username}`);
    }
    
    res.status(401).json({ error: "Invalid credentials" });
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
    const preferences = db.prepare("SELECT * FROM user_preferences WHERE user_id = ?").get(userId) as any;

    res.json({ 
      files, 
      trends, 
      recommendations, 
      cleanupGoal: preferences?.cleanup_goal || null 
    });
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

  // Connections
  app.get("/api/connections/:userId", (req, res) => {
    const connections = db.prepare("SELECT * FROM user_connections WHERE user_id = ?").all(req.params.userId);
    res.json(connections);
  });

  app.post("/api/connections/connect", (req, res) => {
    const { userId, providerId } = req.body;
    if (!userId || !providerId) return res.status(400).json({ error: "User ID and Provider ID required" });

    db.prepare(`
      INSERT INTO user_connections (user_id, provider_id, connected, last_sync, storage_used)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(user_id, provider_id) DO UPDATE SET
        connected = 1,
        last_sync = CURRENT_TIMESTAMP,
        storage_used = EXCLUDED.storage_used
    `).run(userId, providerId, "14.2 GB");

    res.json({ success: true });
  });

  app.post("/api/connections/disconnect", (req, res) => {
    const { userId, providerId } = req.body;
    if (!userId || !providerId) return res.status(400).json({ error: "User ID and Provider ID required" });

    db.prepare("UPDATE user_connections SET connected = 0 WHERE user_id = ? AND provider_id = ?").run(userId, providerId);
    res.json({ success: true });
  });

  // Permissions
  app.post("/api/permissions", (req, res) => {
    const { userId, photos_access, videos_access, email_access, documents_access, files_access } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    db.prepare(`
      INSERT INTO user_permissions (user_id, photos_access, videos_access, email_access, documents_access, files_access)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        photos_access = EXCLUDED.photos_access,
        videos_access = EXCLUDED.videos_access,
        email_access = EXCLUDED.email_access,
        documents_access = EXCLUDED.documents_access,
        files_access = EXCLUDED.files_access
    `).run(userId, photos_access, videos_access, email_access, documents_access, files_access);

    res.json({ success: true });
  });

  // Theme Preference
  app.get("/api/preferences/:userId", (req, res) => {
    const prefs = db.prepare("SELECT * FROM user_preferences WHERE user_id = ?").get(req.params.userId);
    res.json(prefs || { theme: 'light' });
  });

  app.post("/api/preferences", (req, res) => {
    const { userId, theme, cleanupGoal } = req.body;
    
    if (theme !== undefined) {
      db.prepare(`
        INSERT INTO user_preferences (user_id, theme)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET theme = EXCLUDED.theme
      `).run(userId, theme);
    }
    
    if (cleanupGoal !== undefined) {
      db.prepare(`
        INSERT INTO user_preferences (user_id, cleanup_goal)
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET cleanup_goal = EXCLUDED.cleanup_goal
      `).run(userId, cleanupGoal);
    }
    
    res.json({ success: true });
  });

  // Google Drive Sync (Simulated)
  app.post("/api/drive/sync", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    console.log(`Syncing Google Drive for user ${userId}`);
    
    // Simulate fetching files
    const mockFiles = [
      { name: 'Family_Photos_2023.zip', type: 'image', size: 1024 * 1024 * 450 },
      { name: 'Work_Project_Final_v2.mp4', type: 'video', size: 1024 * 1024 * 890 },
      { name: 'Tax_Returns_2022.pdf', type: 'document', size: 1024 * 1024 * 2 },
      { name: 'Old_Backup_iPhone.tar', type: 'app', size: 1024 * 1024 * 1024 * 5 },
    ];

    const insert = db.prepare(`
      INSERT INTO files_metadata (user_id, name, path, size, hash, file_type, last_accessed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((files) => {
      for (const file of files) {
        insert.run(userId, file.name, "Google Drive", file.size, "drive-" + Math.random(), file.type, new Date().toISOString());
      }
    });
    transaction(mockFiles);

    db.prepare("UPDATE user_connections SET last_sync = CURRENT_TIMESTAMP WHERE user_id = ? AND provider_id = 'google_drive'").run(userId);

    res.json({ success: true, count: mockFiles.length });
  });

  // Manual File Upload
  app.post("/api/upload", upload.array("files"), async (req, res) => {
    const { userId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!userId || !files || files.length === 0) {
      return res.status(400).json({ error: "User ID and files required" });
    }

    const insert = db.prepare(`
      INSERT INTO files_metadata (user_id, name, path, size, hash, file_type, last_accessed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertRecommendation = db.prepare(`
      INSERT INTO cleanup_recommendations (file_id, confidence_score, risk_level, reason)
      VALUES (?, ?, ?, ?)
    `);

    try {
      const results: any[] = [];
      const transaction = db.transaction((files) => {
        for (const file of files) {
          let fileType = 'document';
          if (file.mimetype.startsWith('image/')) fileType = 'image';
          else if (file.mimetype.startsWith('video/')) fileType = 'video';
          else if (file.mimetype.startsWith('audio/')) fileType = 'audio';

          const result = insert.run(userId, file.originalname, "Manual Upload", file.size, "manual-" + Date.now() + "-" + Math.random(), fileType, new Date().toISOString());
          const fileId = result.lastInsertRowid;

          // Basic heuristic analysis
          let flagged = false;
          let reason = "";
          let risk = "low";
          let confidence = 0;

          if (file.size > 50 * 1024 * 1024) { // > 50MB
            flagged = true;
            reason = "Large file detected. Consider archiving or deleting if not needed.";
            risk = "medium";
            confidence = 85;
          } else if (file.originalname.includes("copy") || file.originalname.includes("(1)")) {
            flagged = true;
            reason = "Potential duplicate detected based on filename pattern.";
            risk = "high";
            confidence = 90;
          }

          if (flagged) {
            insertRecommendation.run(fileId, confidence, risk, reason);
            results.push({ name: file.originalname, flagged, reason, risk });
          } else {
            results.push({ name: file.originalname, flagged: false });
          }
        }
      });
      transaction(files);

      db.prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)")
        .run(userId, "FILES_UPLOADED", `Uploaded ${files.length} files manually`);

      // Optional: Get a quick AI summary of the upload
      let aiSummary = "";
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
          Analyze these recently uploaded files for a user:
          ${files.map(f => `- ${f.originalname} (${(f.size / 1024).toFixed(1)} KB)`).join('\n')}
          
          Provide a very brief (2 sentence) summary of the upload quality and any immediate concerns.
        `;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        aiSummary = response.text || "";
      } catch (aiErr) {
        console.error("AI Upload Summary Error:", aiErr);
        aiSummary = "Files successfully indexed and analyzed by local heuristics.";
      }

      res.json({ 
        success: true, 
        count: files.length, 
        analysis: results,
        aiSummary
      });
    } catch (e: any) {
      console.error("Upload Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Google Drive OAuth (Simulated)
  app.get("/api/auth/google/url", (req, res) => {
    const { userId } = req.query;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "mock_client_id",
      redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: String(userId || "")
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  app.get("/api/auth/google/callback", (req, res) => {
    const { code, state } = req.query;
    // In a real app, exchange code for tokens here
    // For demo, we'll use a fixed userId from state or just assume the first user for simplicity if not provided
    // But better to pass userId in state
    const userId = state || 1; 

    db.prepare(`
      INSERT INTO user_connections (user_id, provider_id, connected, last_sync, storage_used)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(user_id, provider_id) DO UPDATE SET
        connected = 1,
        last_sync = CURRENT_TIMESTAMP,
        storage_used = EXCLUDED.storage_used
    `).run(userId, 'google_drive', "14.2 GB");

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google_drive' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  // Backups
  app.get("/api/backups/:userId", (req, res) => {
    const backups = db.prepare("SELECT * FROM backups WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
    res.json(backups);
  });

  app.post("/api/backups", (req, res) => {
    const { userId, name, size } = req.body;
    const result = db.prepare("INSERT INTO backups (user_id, name, size) VALUES (?, ?, ?)").run(userId, name, size);
    res.json({ id: result.lastInsertRowid, success: true });
  });

  // Permissions
  app.get("/api/permissions/:userId", (req, res) => {
    const permissions = db.prepare("SELECT * FROM user_permissions WHERE user_id = ?").get(req.params.userId);
    res.json(permissions || { 
      photos_access: 1, 
      videos_access: 1, 
      email_access: 1, 
      documents_access: 1, 
      files_access: 1 
    });
  });

  app.post("/api/permissions", (req, res) => {
    const { userId, photos_access, videos_access, email_access, documents_access, files_access } = req.body;
    db.prepare(`
      INSERT INTO user_permissions (user_id, photos_access, videos_access, email_access, documents_access, files_access)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        photos_access = excluded.photos_access,
        videos_access = excluded.videos_access,
        email_access = excluded.email_access,
        documents_access = excluded.documents_access,
        files_access = excluded.files_access
    `).run(userId, photos_access ? 1 : 0, videos_access ? 1 : 0, email_access ? 1 : 0, documents_access ? 1 : 0, files_access ? 1 : 0);
    res.json({ success: true });
  });

  // User Preferences
  app.get("/api/preferences/:userId", (req, res) => {
    const prefs = db.prepare("SELECT * FROM user_preferences WHERE user_id = ?").get(req.params.userId);
    res.json(prefs || { theme: 'light', auto_scan_enabled: false, notification_threshold: 80 });
  });

  app.post("/api/preferences", (req, res) => {
    const { userId, theme, auto_scan_enabled, notification_threshold } = req.body;
    db.prepare(`
      INSERT INTO user_preferences (user_id, theme, auto_scan_enabled, notification_threshold)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        theme = excluded.theme,
        auto_scan_enabled = excluded.auto_scan_enabled,
        notification_threshold = excluded.notification_threshold
    `).run(userId, theme, auto_scan_enabled ? 1 : 0, notification_threshold);
    res.json({ success: true });
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
