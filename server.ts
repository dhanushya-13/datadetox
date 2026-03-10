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
    const demoUser = db.prepare("SELECT id FROM users WHERE username = ?").get("demo");
    if (!demoUser) {
      console.log("Seeding demo user...");
      const hashedPassword = await bcrypt.hash("password123", 8);
      const result = db.prepare("INSERT INTO users (username, password, is_verified) VALUES (?, ?, ?)").run("demo", hashedPassword, 1);
      const userId = result.lastInsertRowid;
      db.prepare("INSERT INTO user_permissions (user_id) VALUES (?)").run(userId);
      db.prepare("INSERT INTO user_preferences (user_id) VALUES (?)").run(userId);
      console.log("Demo user 'demo' created with password 'password123'");
    } else {
      console.log("Demo user 'demo' already exists.");
    }
  };
  await seedDemoUser();

  // WebSocket Connection Handling
  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected to WebSocket");
    ws.send(JSON.stringify({ type: "SYSTEM_STATUS", status: "Connected to DataDetox Neural Link" }));
  });

  // --- API ROUTES ---
  
  // Helper to check if user exists
  const getUserId = (userId: any): number | null => {
    if (!userId) return null;
    const id = typeof userId === 'string' && !isNaN(Number(userId)) ? Number(userId) : userId;
    return typeof id === 'number' ? id : null;
  };

  const userExists = (userId: any) => {
    const id = getUserId(userId);
    if (id === null) return false;
    try {
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
      return !!user;
    } catch (e) {
      console.error("userExists check failed:", e);
      return false;
    }
  };

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Registration attempt for: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const registerTransaction = db.transaction((username, hashedPassword) => {
      const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
      if (existingUser) {
        throw new Error("USER_EXISTS");
      }

      const stmt = db.prepare("INSERT INTO users (username, password, is_verified) VALUES (?, ?, ?)");
      const result = stmt.run(username, hashedPassword, 1);
      const userId = result.lastInsertRowid;
      
      db.prepare("INSERT INTO user_permissions (user_id) VALUES (?)").run(userId);
      
      const seed = username.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const initialScore = 40 + (seed % 40);
      const initialOffset = (seed % 200) * 1024 * 1024 * 1024;

      db.prepare("INSERT INTO user_preferences (user_id, wellness_score, storage_offset) VALUES (?, ?, ?)").run(userId, initialScore, initialOffset);
      
      return userId;
    });

    try {
      const userId = registerTransaction(username.trim(), hashedPassword);
      console.log(`User registered successfully: ${username} (ID: ${userId})`);
      
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        token,
        user: { id: userId, username: username.trim() }
      });
    } catch (e: any) {
      if (e.message === "USER_EXISTS" || e.message.includes("UNIQUE constraint failed: users.username")) {
        console.warn(`Registration attempt failed: Username '${username}' is already taken.`);
        return res.status(400).json({ error: "This username is already taken." });
      }
      
      console.error("Registration Error:", e);
      res.status(500).json({ error: "Internal server error during registration" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const trimmedUsername = username?.trim();
    console.log(`Login attempt for: ${trimmedUsername}`);

    if (!trimmedUsername || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    try {
      const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(trimmedUsername);
      
      if (user) {
        console.log(`User found: ${trimmedUsername}. Comparing passwords...`);
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
          console.log(`User logged in successfully: ${trimmedUsername}`);
          return res.json({ token, user: { id: user.id, username: user.username } });
        } else {
          console.warn(`Invalid password for user: ${trimmedUsername}`);
        }
      } else {
        console.warn(`User not found: ${trimmedUsername}`);
      }
    } catch (error) {
      console.error("Login Database Error:", error);
      return res.status(500).json({ error: "Internal server error during login" });
    }
    
    res.status(401).json({ error: "Invalid credentials" });
  });

  // File Metadata Upload (Simulating Agent)
  app.post("/api/metadata/upload", (req, res) => {
    const { userId, files } = req.body;
    
    if (!userExists(userId)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

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
    const id = getUserId(req.params.userId);
    if (!id) return res.status(400).json({ error: "Invalid User ID" });

    const files = db.prepare("SELECT * FROM files_metadata WHERE user_id = ?").all(id);
    const trends = db.prepare("SELECT * FROM storage_trends WHERE user_id = ? ORDER BY timestamp DESC LIMIT 30").all(id);
    const recommendations = db.prepare(`
      SELECT r.*, f.name, f.size, f.path 
      FROM cleanup_recommendations r
      JOIN files_metadata f ON r.file_id = f.id
      WHERE f.user_id = ? AND r.status = 'pending'
    `).all(id);
    const preferences = db.prepare("SELECT * FROM user_preferences WHERE user_id = ?").get(id) as any;

    // Generate deterministic forecast
    const seed = id || 1;
    const forecast = Array.from({ length: 12 }).map((_, i) => {
      const baseSize = (300 + (seed % 150)) * 1024 * 1024 * 1024; // 300-450GB base
      const growth = i * (5 + (seed % 10)) * 1024 * 1024 * 1024; // 5-15GB growth per month
      return {
        date: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString(),
        predictedSize: baseSize + growth + (Math.sin(seed + i) * 10 * 1024 * 1024 * 1024)
      };
    });

    res.json({ 
      files, 
      trends, 
      recommendations, 
      cleanupGoal: preferences?.cleanup_goal || null,
      wellnessScore: preferences?.wellness_score || 50,
      storageOffset: preferences?.storage_offset || 0,
      forecast
    });
  });

  // Deep Scan Simulation
  app.post("/api/scan", async (req, res) => {
    const id = getUserId(req.body.userId);
    if (!id) return res.status(400).json({ error: "User ID required" });

    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    console.log(`Starting Real-time Deep Scan for user ${id}`);

    // Fetch user permissions
    const permissions = db.prepare("SELECT * FROM user_permissions WHERE user_id = ?").get(id) as any;

    // Send initial start message
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "SCAN_STARTED", userId: id }));
      }
    });

    // Determine which file types to generate based on permissions
    const allowedTypes: string[] = [];
    if (permissions?.photos_access) allowedTypes.push('image');
    if (permissions?.videos_access) allowedTypes.push('video');
    if (permissions?.documents_access) allowedTypes.push('document');
    if (permissions?.files_access) allowedTypes.push('app', 'archive');
    if (permissions?.email_access) allowedTypes.push('email');

    if (allowedTypes.length === 0) {
      allowedTypes.push('other'); // Fallback
    }

    // Simulate a multi-step scan process
    const steps = 5;
    
    for (let i = 1; i <= steps; i++) {
      // Wait a bit between steps
      await new Promise(resolve => setTimeout(resolve, 800));

      const newFiles = Array.from({ length: 3 }).map((_, j) => {
        const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        let extension = 'dat';
        let path = '/Users/detox/System/Scan';
        let baseName = 'file';
        
        const imageNames = ['IMG_4920', 'Vacation_Shot', 'Profile_Pic', 'Screenshot_2024', 'Family_Dinner', 'Sunset_Beach'];
        const videoNames = ['Wedding_Video', 'Project_Demo', 'Movie_Draft', 'Vlog_01', 'Tutorial_Final', 'Concert_Clip'];
        const docNames = ['Tax_Return_2023', 'Resume_Updated', 'Contract_Signed', 'Meeting_Notes', 'Project_Proposal', 'Invoice_Jan'];
        const emailNames = ['Newsletter_Sub', 'Order_Confirmation', 'Bank_Statement', 'Flight_Ticket', 'Welcome_Mail'];
        const appNames = ['Adobe_Photoshop', 'VS_Code', 'Slack', 'Spotify', 'Zoom', 'Chrome_Cache'];
        const archiveNames = ['Backup_2023', 'Old_Photos_Archive', 'Project_Files_v1', 'System_Dump', 'Log_Files'];

        switch(type) {
          case 'image': 
            extension = 'jpg'; 
            path = '/Users/detox/Photos/2024'; 
            baseName = imageNames[Math.floor(Math.random() * imageNames.length)];
            break;
          case 'video': 
            extension = 'mp4'; 
            path = '/Users/detox/Videos/Archive'; 
            baseName = videoNames[Math.floor(Math.random() * videoNames.length)];
            break;
          case 'document': 
            extension = 'pdf'; 
            path = '/Users/detox/Documents/Work'; 
            baseName = docNames[Math.floor(Math.random() * docNames.length)];
            break;
          case 'email': 
            extension = 'eml'; 
            path = '/Users/detox/Mail/Inbox'; 
            baseName = emailNames[Math.floor(Math.random() * emailNames.length)];
            break;
          case 'app': 
            extension = 'app'; 
            path = '/Applications'; 
            baseName = appNames[Math.floor(Math.random() * appNames.length)];
            break;
          case 'archive': 
            extension = 'zip'; 
            path = '/Users/detox/Backups'; 
            baseName = archiveNames[Math.floor(Math.random() * archiveNames.length)];
            break;
        }

        return {
          name: `${baseName}_${Math.floor(Math.random() * 1000)}.${extension}`,
          path: path,
          size: Math.floor(Math.random() * (type === 'video' ? 500 : 50) * 1024 * 1024),
          hash: Math.random().toString(36).substring(7),
          type: type,
          lastAccessed: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          content: type === 'email' ? `From: system@datadetox.ai\nSubject: ${baseName}\n\nThis is a simulated email content for ${baseName}. It contains neural patterns and digital residue that should be cleaned up.` : 
                   type === 'document' ? `Neural Report for ${baseName}\n\nStatus: ARCHIVED\nIntegrity: 99.8%\n\nThis document contains sensitive system metadata.` : null
        };
      });

      const insertFile = db.prepare(`
        INSERT INTO files_metadata (user_id, name, path, size, hash, file_type, last_accessed, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertRecommendation = db.prepare(`
        INSERT INTO cleanup_recommendations (file_id, confidence_score, risk_level, reason)
        VALUES (?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        for (const file of newFiles) {
          const result = insertFile.run(id, file.name, file.path, file.size, file.hash, file.type, file.lastAccessed, file.content);
          const fileId = result.lastInsertRowid;

          if (Math.random() > 0.5) {
            const confidence = 75 + Math.floor(Math.random() * 24);
            const risk = Math.random() > 0.7 ? 'high' : 'medium';
            let reason = "Neural analysis suggests this file is redundant.";
            if (file.type === 'email') reason = "Old email thread with no recent activity.";
            if (file.type === 'image') reason = "Potential duplicate or low-quality burst photo.";
            if (file.type === 'video') reason = "Large media file not accessed in over 6 months.";
            
            insertRecommendation.run(fileId, confidence, risk, reason);
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
    const totalUsed = db.prepare("SELECT SUM(size) as total FROM files_metadata WHERE user_id = ?").get(id) as any;
    db.prepare("INSERT INTO storage_trends (user_id, total_used_size) VALUES (?, ?)").run(id, totalUsed.total || 0);

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
    const id = getUserId(req.body.userId);
    const { itemIds } = req.body;
    if (!id || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: "User ID and non-empty item IDs array required" });
    }

    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    const placeholders = itemIds.map(() => '?').join(',');
    
    try {
      // Get file IDs and total size first to create a backup record
      const items = db.prepare(`
        SELECT f.id as file_id, f.name, f.size, f.file_type, f.path, f.content FROM cleanup_recommendations r
        JOIN files_metadata f ON r.file_id = f.id
        WHERE r.id IN (${placeholders})
      `).all(...itemIds) as any[];

      const fileIds = [...new Set(items.map(i => i.file_id))];
      const totalSize = items.reduce((acc, i) => acc + i.size, 0);

      // Create a backup record for these files
      if (totalSize > 0) {
        const backupResult = db.prepare(`
          INSERT INTO backups (user_id, name, size, status)
          VALUES (?, ?, ?, ?)
        `).run(id, `Cleanup_Archive_${new Date().toISOString().split('T')[0]}_${Math.floor(Math.random() * 1000)}`, totalSize, 'completed');
        
        const backupId = backupResult.lastInsertRowid;
        
        // Insert items into backup_items
        const insertBackupItem = db.prepare(`
          INSERT INTO backup_items (backup_id, name, size, file_type, original_path, content)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const archiveTransaction = db.transaction((items) => {
          for (const item of items) {
            insertBackupItem.run(backupId, item.name, item.size, item.file_type, item.path, item.content);
          }
        });
        archiveTransaction(items);
      }

      if (fileIds.length > 0) {
        const filePlaceholders = fileIds.map(() => '?').join(',');
        
        // Find ALL recommendations for these files, not just the ones selected
        // This is necessary to avoid FK violations when deleting the files
        const allRecs = db.prepare(`
          SELECT id FROM cleanup_recommendations 
          WHERE file_id IN (${filePlaceholders})
        `).all(...fileIds) as any[];
        
        const allRecIds = allRecs.map(r => r.id);
        
        if (allRecIds.length > 0) {
          const allRecPlaceholders = allRecIds.map(() => '?').join(',');
          
          // Delete user decisions first (children of recommendations)
          db.prepare(`
            DELETE FROM user_decisions 
            WHERE recommendation_id IN (${allRecPlaceholders})
          `).run(...allRecIds);

          // Delete ALL recommendations for these files
          db.prepare(`
            DELETE FROM cleanup_recommendations 
            WHERE id IN (${allRecPlaceholders})
          `).run(...allRecIds);
        }
        
        // Then delete the actual files from metadata (the parents)
        db.prepare(`
          DELETE FROM files_metadata 
          WHERE id IN (${filePlaceholders})
        `).run(...fileIds);
      }

      // Record trend after cleanup
      const totalUsed = db.prepare("SELECT SUM(size) as total FROM files_metadata WHERE user_id = ?").get(id) as any;
      db.prepare("INSERT INTO storage_trends (user_id, total_used_size) VALUES (?, ?)").run(id, totalUsed.total || 0);

      db.prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)")
        .run(id, "CLEANUP_EXECUTED", `Deleted ${itemIds.length} items`);
      res.json({ success: true, count: itemIds.length });
    } catch (e: any) {
      console.error("Cleanup Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Storage Trends
  app.get("/api/trends/:userId", (req, res) => {
    const { userId } = req.params;
    const trends = db.prepare(`
      SELECT total_used_size as size, timestamp 
      FROM storage_trends 
      WHERE user_id = ? 
      ORDER BY timestamp ASC
    `).all(userId) as any[];

    // If no trends, provide some mock historical data for visualization
    if (trends.length < 2) {
      const now = Date.now();
      const seed = parseInt(userId) || 1;
      const mockTrends = Array.from({ length: 7 }).map((_, i) => {
        // Deterministic but unique per user
        const baseSize = (20 + (seed % 30)) * 1024 * 1024 * 1024; // 20-50GB base
        const variance = Math.sin(seed + i) * 5 * 1024 * 1024 * 1024; // +/- 5GB
        return {
          size: Math.floor(baseSize + variance + (i * 1024 * 1024 * 1024)), // Growing trend
          timestamp: new Date(now - (7 - i) * 24 * 60 * 60 * 1000).toISOString()
        };
      });
      return res.json(mockTrends);
    }

    res.json(trends);
  });

  // AI Analysis Stats
  app.post("/api/analyze/stats", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    if (!userExists(userId)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    try {
      const id = typeof userId === 'string' && !isNaN(Number(userId)) ? Number(userId) : userId;
      const files = db.prepare("SELECT * FROM files_metadata WHERE user_id = ?").all(id) as any[];
      const recommendations = db.prepare(`
        SELECT r.*, f.name, f.size 
        FROM cleanup_recommendations r
        JOIN files_metadata f ON r.file_id = f.id
        WHERE f.user_id = ? AND r.status = 'pending'
      `).all(id) as any[];

      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((acc, f) => acc + f.size, 0),
        flaggedCount: recommendations.length,
        flaggedSize: recommendations.reduce((acc, r) => acc + r.size, 0),
      };

      res.json(stats);
    } catch (error: any) {
      console.error("Analyze Stats Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Connections
  app.get("/api/connections/:userId", (req, res) => {
    const id = getUserId(req.params.userId);
    if (!id) return res.status(400).json({ error: "Invalid User ID" });
    const connections = db.prepare("SELECT * FROM user_connections WHERE user_id = ?").all(id);
    res.json(connections);
  });

  app.post("/api/connections/connect", (req, res) => {
    const id = getUserId(req.body.userId);
    const { providerId } = req.body;
    if (!id || !providerId) return res.status(400).json({ error: "User ID and Provider ID required" });

    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    db.prepare(`
      INSERT INTO user_connections (user_id, provider_id, connected, last_sync, storage_used)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(user_id, provider_id) DO UPDATE SET
        connected = 1,
        last_sync = CURRENT_TIMESTAMP,
        storage_used = EXCLUDED.storage_used
    `).run(id, providerId, "14.2 GB");

    res.json({ success: true });
  });

  app.post("/api/connections/disconnect", (req, res) => {
    const id = getUserId(req.body.userId);
    const { providerId } = req.body;
    if (!id || !providerId) return res.status(400).json({ error: "User ID and Provider ID required" });

    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    db.prepare("UPDATE user_connections SET connected = 0 WHERE user_id = ? AND provider_id = ?").run(id, providerId);
    res.json({ success: true });
  });

  // Permissions
  app.get("/api/permissions/:userId", (req, res) => {
    const id = getUserId(req.params.userId);
    if (!id) return res.status(400).json({ error: "Invalid User ID" });
    const permissions = db.prepare("SELECT * FROM user_permissions WHERE user_id = ?").get(id);
    res.json(permissions || { 
      photos_access: 1, 
      videos_access: 1, 
      email_access: 1, 
      documents_access: 1, 
      files_access: 1 
    });
  });

  // Google Drive Sync (Simulated)
  app.post("/api/drive/sync", async (req, res) => {
    const id = getUserId(req.body.userId);
    if (!id) return res.status(400).json({ error: "User ID required" });

    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    console.log(`Syncing Google Drive for user ${id}`);
    
    // Simulate fetching files
    const mockFiles = [
      { name: 'Family_Photos_2023.zip', type: 'image', size: 1024 * 1024 * 450 },
      { name: 'Work_Project_Final_v2.mp4', type: 'video', size: 1024 * 1024 * 890 },
      { name: 'Tax_Returns_2022.pdf', type: 'document', size: 1024 * 1024 * 2 },
      { name: 'Old_Backup_iPhone.tar', type: 'app', size: 1024 * 1024 * 1024 * 5 },
      { name: 'Client_Meeting_01.mp4', type: 'video', size: 1024 * 1024 * 1200 },
      { name: 'Design_Assets_v4.zip', type: 'archive', size: 1024 * 1024 * 3200 },
    ];

    const insert = db.prepare(`
      INSERT INTO files_metadata (user_id, name, path, size, hash, file_type, last_accessed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((files) => {
      for (const file of files) {
        insert.run(id, file.name, "Google Drive", file.size, "drive-" + Math.random(), file.type, new Date().toISOString());
      }
    });
    transaction(mockFiles);

    db.prepare("UPDATE user_connections SET last_sync = CURRENT_TIMESTAMP WHERE user_id = ? AND provider_id = 'google_drive'").run(id);

    res.json({ success: true, count: mockFiles.length });
  });

  // Manual File Upload
  app.post("/api/upload", upload.array("files"), async (req, res) => {
    const id = getUserId(req.body.userId);
    const files = req.files as Express.Multer.File[];

    if (!id || !files || files.length === 0) {
      return res.status(400).json({ error: "User ID and files required" });
    }

    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
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

          const result = insert.run(id, file.originalname, "Manual Upload", file.size, "manual-" + Date.now() + "-" + Math.random(), fileType, new Date().toISOString());
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
            results.push({ name: file.originalname, flagged, reason, risk, size: file.size, type: fileType });
          } else {
            results.push({ name: file.originalname, flagged: false, size: file.size, type: fileType });
          }
        }
      });
      transaction(files);

      // Prepare data for frontend AI analysis
      const fileSummary = results.map(r => `- ${r.name} (${(r.size / 1024 / 1024).toFixed(2)} MB, Type: ${r.type})${r.flagged ? ' [FLAGGED: ' + r.reason + ']' : ''}`).join('\n');

      // Prepare visualization data
      const typeDistribution = results.reduce((acc: any, r: any) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {});

      db.prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)")
        .run(id, "FILES_UPLOADED", JSON.stringify({ count: files.length }));

      res.json({ 
        success: true, 
        count: files.length, 
        analysis: results,
        fileSummary, // Send summary to frontend for AI analysis
        visualization: {
          typeDistribution: Object.entries(typeDistribution).map(([name, value]) => ({ name, value })),
          totalSize: results.reduce((acc, r) => acc + r.size, 0)
        }
      });
    } catch (e: any) {
      console.error("Upload Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Google Drive OAuth (Simulated/Mock fallback)
  app.get("/api/auth/google/url", (req, res) => {
    const { userId } = req.query;
    
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const clientId = process.env.GOOGLE_CLIENT_ID;

    // If no client ID is configured, use a mock flow
    if (!clientId || clientId === "mock_client_id") {
      const mockParams = new URLSearchParams({
        redirect_uri: redirectUri,
        state: String(userId || ""),
        provider: 'google_drive'
      });
      return res.json({ url: `${baseUrl}/api/auth/google/mock-login?${mockParams.toString()}` });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: String(userId || "")
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  // Google Login OAuth (Simulated/Mock fallback)
  app.get("/api/auth/google/login/url", (req, res) => {
    const { login_hint } = req.query;
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/auth/google/login/callback`;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    // If no client ID is configured, use a mock flow to avoid 401 errors
    if (!clientId || clientId === "mock_client_id") {
      const mockParams = new URLSearchParams({
        redirect_uri: redirectUri,
        login_hint: String(login_hint || ""),
      });
      return res.json({ url: `${baseUrl}/api/auth/google/mock-login?${mockParams.toString()}` });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    if (login_hint) {
      params.append('login_hint', String(login_hint));
    }

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  // Mock Google Login Page for demo purposes
  app.get("/api/auth/google/mock-login", (req, res) => {
    const { redirect_uri, login_hint, provider, state } = req.query;
    const isDrive = provider === 'google_drive';
    
    res.send(`
      <html>
        <head>
          <title>Mock Google Sign-In</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
          <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div class="flex flex-col items-center mb-8">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" class="w-12 h-12 mb-4" />
              <h1 class="text-2xl font-semibold text-gray-900">${isDrive ? 'Connect to Google Drive' : 'Sign in with Google'}</h1>
              <p class="text-gray-500 text-sm mt-2">Demo Mode: No real credentials required</p>
              ${isDrive ? '<p class="text-blue-600 text-[10px] font-bold uppercase tracking-widest mt-2">DataDetox wants to access your Drive metadata</p>' : ''}
            </div>
            
            <div class="space-y-4">
              <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onclick="login('demo@datadetox.ai', 'Demo User')">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white font-bold">D</div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Demo User</p>
                    <p class="text-xs text-gray-500">demo@datadetox.ai</p>
                  </div>
                </div>
              </div>
              
              ${login_hint && login_hint !== "null" ? `
              <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onclick="login('${login_hint}', 'Previous User')">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">${String(login_hint)[0].toUpperCase()}</div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Last Used Account</p>
                    <p class="text-xs text-gray-500">${login_hint}</p>
                  </div>
                </div>
              </div>
              ` : ''}
              
              <div class="pt-4 border-t border-gray-100">
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Or enter any email to simulate actual account</label>
                <div class="flex gap-2">
                  <input type="email" id="customEmail" placeholder="you@example.com" class="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                  <button onclick="login(document.getElementById('customEmail').value || 'newuser@example.com', 'New User')" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Sign In
                  </button>
                </div>
              </div>
            </div>
            
            <div class="mt-8 pt-6 border-t border-gray-100 text-[11px] text-gray-400 text-center">
              This is a simulated Google login for the DataDetox demo environment. 
              Real Google OAuth requires CLIENT_ID and CLIENT_SECRET environment variables.
            </div>
          </div>
          
          <script>
            function login(email, name) {
              if (!email) return alert('Please enter an email');
              const url = new URL('${redirect_uri}');
              url.searchParams.set('code', 'mock_code_' + Math.random().toString(36).substring(7));
              url.searchParams.set('mock_email', email);
              url.searchParams.set('mock_name', name);
              if ('${state || ""}') {
                url.searchParams.set('state', '${state || ""}');
              }
              window.location.href = url.toString();
            }
          </script>
        </body>
      </html>
    `);
  });

  app.get("/api/auth/google/login/callback", async (req, res) => {
    const { code, mock_email, mock_name } = req.query;
    
    // Use mock data if provided (from our mock login page)
    const email = (mock_email as string) || "user@example.com";
    const name = (mock_name as string) || "Google User";

    // Find or create user
    let user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(email);
    
    if (!user) {
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 8);
      
      const googleLoginTransaction = db.transaction((email, hashedPassword) => {
        const result = db.prepare("INSERT INTO users (username, password, is_verified) VALUES (?, ?, ?)")
          .run(email, hashedPassword, 1);
        const userId = result.lastInsertRowid;
        db.prepare("INSERT INTO user_permissions (user_id) VALUES (?)").run(userId);
        
        // Generate deterministic but unique stats based on email
        const seed = email.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const initialScore = 30 + (seed % 50); // 30-80
        const initialOffset = (seed % 300) * 1024 * 1024 * 1024; // 0-300GB
        
        db.prepare("INSERT INTO user_preferences (user_id, wellness_score, storage_offset) VALUES (?, ?, ?)").run(userId, initialScore, initialOffset);
        return { id: userId, username: email };
      });

      try {
        user = googleLoginTransaction(email, hashedPassword);
      } catch (e: any) {
        console.error("Google Login User Creation Error:", e);
        // Fallback: try to fetch user again in case of race condition
        user = db.prepare("SELECT * FROM users WHERE username = ?").get(email);
        if (!user) {
          return res.status(500).send("Failed to create user account");
        }
      }
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_LOGIN_SUCCESS', 
                token: '${token}',
                user: ${JSON.stringify({ id: user.id, username: user.username })}
              }, '*');
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

  app.get("/api/auth/google/callback", (req, res) => {
    const { code, state } = req.query;
    // In a real app, exchange code for tokens here
    // For demo, we'll use a fixed userId from state or just assume the first user for simplicity if not provided
    // But better to pass userId in state
    const userId = Number(state) || 1; 

    // Verify user exists before inserting connection
    const userExists = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!userExists) {
      console.error(`OAuth Callback Error: User with ID ${userId} not found.`);
      return res.status(400).send("User account not found. Please log in again.");
    }

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
    const id = getUserId(req.params.userId);
    if (!id) return res.status(400).json({ error: "Invalid User ID" });
    const backups = db.prepare("SELECT * FROM backups WHERE user_id = ? ORDER BY created_at DESC").all(id);
    res.json(backups);
  });

  app.post("/api/backups", (req, res) => {
    const id = getUserId(req.body.userId);
    const { name, size } = req.body;
    
    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    const result = db.prepare("INSERT INTO backups (user_id, name, size) VALUES (?, ?, ?)").run(id, name, size);
    res.json({ id: result.lastInsertRowid, success: true });
  });

  app.get("/api/backups/:backupId/items", (req, res) => {
    const items = db.prepare("SELECT * FROM backup_items WHERE backup_id = ?").all(req.params.backupId);
    res.json(items);
  });

  // Snapshot Integrity Check
  app.post("/api/snapshots/verify", (req, res) => {
    const { userId } = req.body;
    // Simulate integrity check
    res.json({ 
      success: true, 
      integrityScore: 99.8, 
      lastCheck: new Date().toISOString(),
      status: 'verified'
    });
  });

  // Snapshot Restore
  app.post("/api/snapshots/restore", (req, res) => {
    const id = getUserId(req.body.userId);
    const { snapshotId } = req.body;
    
    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    try {
      const items = db.prepare("SELECT * FROM backup_items WHERE backup_id = ?").all(snapshotId) as any[];
      
      if (items.length === 0) {
        return res.status(404).json({ error: "No items found in this snapshot" });
      }

      const insertFile = db.prepare(`
        INSERT INTO files_metadata (user_id, name, size, file_type, path, last_accessed, content)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const restoreTransaction = db.transaction((items) => {
        for (const item of items) {
          insertFile.run(id, item.name, item.size, item.file_type, item.original_path, new Date().toISOString(), item.content);
        }
      });

      restoreTransaction(items);

      // Record trend after restore
      const totalUsed = db.prepare("SELECT SUM(size) as total FROM files_metadata WHERE user_id = ?").get(id) as any;
      db.prepare("INSERT INTO storage_trends (user_id, total_used_size) VALUES (?, ?)").run(id, totalUsed.total || 0);

      res.json({ 
        success: true, 
        message: `${items.length} files restored successfully.`,
        restoredAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Restore failed:', err);
      res.status(500).json({ error: "Failed to restore snapshot" });
    }
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
    const id = getUserId(req.body.userId);
    const { photos_access, videos_access, email_access, documents_access, files_access } = req.body;
    
    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    db.prepare(`
      INSERT INTO user_permissions (user_id, photos_access, videos_access, email_access, documents_access, files_access)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        photos_access = excluded.photos_access,
        videos_access = excluded.videos_access,
        email_access = excluded.email_access,
        documents_access = excluded.documents_access,
        files_access = excluded.files_access
    `).run(id, photos_access ? 1 : 0, videos_access ? 1 : 0, email_access ? 1 : 0, documents_access ? 1 : 0, files_access ? 1 : 0);
    res.json({ success: true });
  });

  // User Preferences
  app.get("/api/preferences/:userId", (req, res) => {
    const id = getUserId(req.params.userId);
    if (!id) return res.status(400).json({ error: "Invalid User ID" });
    const prefs = db.prepare("SELECT * FROM user_preferences WHERE user_id = ?").get(id);
    res.json(prefs || { theme: 'light', auto_scan_enabled: false, notification_threshold: 80 });
  });

  app.post("/api/preferences", (req, res) => {
    const id = getUserId(req.body.userId);
    const { theme, auto_scan_enabled, notification_threshold, cleanupGoal } = req.body;
    
    if (!userExists(id)) {
      return res.status(401).json({ error: "Invalid user session" });
    }

    if (theme !== undefined || auto_scan_enabled !== undefined || notification_threshold !== undefined || cleanupGoal !== undefined) {
      db.prepare(`
        INSERT INTO user_preferences (user_id, theme, auto_scan_enabled, notification_threshold, cleanup_goal)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          theme = COALESCE(excluded.theme, user_preferences.theme),
          auto_scan_enabled = COALESCE(excluded.auto_scan_enabled, user_preferences.auto_scan_enabled),
          notification_threshold = COALESCE(excluded.notification_threshold, user_preferences.notification_threshold),
          cleanup_goal = COALESCE(excluded.cleanup_goal, user_preferences.cleanup_goal)
      `).run(
        id, 
        theme ?? null, 
        auto_scan_enabled !== undefined ? (auto_scan_enabled ? 1 : 0) : null, 
        notification_threshold ?? null,
        cleanupGoal ?? null
      );
    }
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
