import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-123';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));

  // --- API Routes ---

  // Auth
  app.post('/api/auth/register', async (req, res) => {
    const { name, phone, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (name, phone, password, role) VALUES (?, ?, ?, ?)');
      const info = stmt.run(name, phone, hashedPassword, role);
      const token = jwt.sign({ id: info.lastInsertRowid, role }, JWT_SECRET);
      res.json({ token, user: { id: info.lastInsertRowid, name, role } });
    } catch (error: any) {
      res.status(400).json({ error: 'User already exists or invalid data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { phone, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  });

  // Projects
  app.get('/api/projects', (req, res) => {
    // In a real app, filter by user ID/membership
    const projects = db.prepare('SELECT * FROM projects').all();
    res.json(projects);
  });

  app.post('/api/projects', (req, res) => {
    const { name, owner_id, ...details } = req.body;
    const stmt = db.prepare(`
      INSERT INTO projects (name, owner_id, construction_type, plot_size, built_up_area, floors, budget, loan_amount, start_date, completion_date, site_address, city, pincode, architect_details, contractor_details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      name, owner_id, details.construction_type, details.plot_size, details.built_up_area, details.floors, details.budget, details.loan_amount, details.start_date, details.completion_date, details.site_address, details.city, details.pincode, details.architect_details, details.contractor_details
    );
    
    // Add owner as member
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(info.lastInsertRowid, owner_id, 'owner');
    
    // Create default checklist
    const checklistStmt = db.prepare('INSERT INTO checklist_items (project_id, stage, task) VALUES (?, ?, ?)');
    const defaultTasks = [
      { stage: 'Planning', task: 'Finalize Architecture Plan' },
      { stage: 'Planning', task: 'Get Municipal Approval' },
      { stage: 'Foundation', task: 'Excavation' },
      { stage: 'Foundation', task: 'PCC Work' },
      { stage: 'Structure', task: 'Column Raising' },
      { stage: 'Structure', task: 'Slab Casting' },
      { stage: 'Finishing', task: 'Plastering' },
      { stage: 'Finishing', task: 'Painting' },
    ];
    defaultTasks.forEach(t => checklistStmt.run(info.lastInsertRowid, t.stage, t.task));

    res.json({ id: info.lastInsertRowid });
  });

  app.get('/api/projects/:id', (req, res) => {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    
    const members = db.prepare(`
      SELECT u.id, u.name, u.role, u.phone 
      FROM project_members pm 
      JOIN users u ON pm.user_id = u.id 
      WHERE pm.project_id = ?
    `).all(req.params.id);
    
    res.json({ ...project, members });
  });

  // Workers
  app.get('/api/projects/:id/workers', (req, res) => {
    const workers = db.prepare('SELECT * FROM workers WHERE project_id = ?').all(req.params.id);
    res.json(workers);
  });

  app.post('/api/workers', (req, res) => {
    const { project_id, name, phone, work_type, daily_wage } = req.body;
    const info = db.prepare('INSERT INTO workers (project_id, name, phone, work_type, daily_wage) VALUES (?, ?, ?, ?, ?)').run(project_id, name, phone, work_type, daily_wage);
    res.json({ id: info.lastInsertRowid });
  });

  // Checklist
  app.get('/api/projects/:id/checklist', (req, res) => {
    const items = db.prepare('SELECT * FROM checklist_items WHERE project_id = ?').all(req.params.id);
    res.json(items);
  });

  app.put('/api/checklist/:id', (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE checklist_items SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  // Expenses
  app.get('/api/projects/:id/expenses', (req, res) => {
    const expenses = db.prepare('SELECT * FROM expenses WHERE project_id = ? ORDER BY date DESC').all(req.params.id);
    res.json(expenses);
  });

  app.post('/api/expenses', (req, res) => {
    const { project_id, item_name, cost, quantity, vendor, category } = req.body;
    const info = db.prepare('INSERT INTO expenses (project_id, item_name, cost, quantity, vendor, category) VALUES (?, ?, ?, ?, ?, ?)').run(project_id, item_name, cost, quantity, vendor, category);
    res.json({ id: info.lastInsertRowid });
  });

  // Files
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { project_id, uploader_id, tags } = req.body;
    const url = `/uploads/${req.file.filename}`;
    
    const info = db.prepare('INSERT INTO files (project_id, uploader_id, filename, url, file_type, tags) VALUES (?, ?, ?, ?, ?, ?)').run(project_id, uploader_id, req.file.originalname, url, req.file.mimetype, tags);
    
    res.json({ id: info.lastInsertRowid, url });
  });

  app.get('/api/projects/:id/files', (req, res) => {
    const files = db.prepare(`
      SELECT f.*, u.name as uploader_name 
      FROM files f 
      JOIN users u ON f.uploader_id = u.id 
      WHERE f.project_id = ? 
      ORDER BY f.timestamp DESC
    `).all(req.params.id);
    res.json(files);
  });

  // Chat History
  app.get('/api/projects/:id/messages', (req, res) => {
    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.project_id = ?
      ORDER BY m.timestamp ASC
    `).all(req.params.id);
    res.json(messages);
  });

  // AI Assistant
  app.post('/api/ai/chat', async (req, res) => {
    const { message, context } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API Key not configured" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemPrompt = `You are an expert Construction AI Assistant for a home building app. 
      Context: ${JSON.stringify(context)}
      Answer questions about construction stages, material estimation, budget, safety, and timelines.
      Keep answers concise and practical for a home owner.`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite-latest",
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\nUser Question: " + message }] }
        ]
      });
      
      res.json({ reply: result.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // AI Supplier Suggestions
  app.post('/api/ai/suppliers', async (req, res) => {
    const { location, material } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API Key not configured" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Suggest 3 real or realistic ${material} suppliers near ${location}. 
      Return ONLY a JSON array with objects containing: name, phone (fake if unknown), distance (approx).`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite-latest",
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ]
      });
      
      let text = result.text;
      // Clean up markdown code blocks if present
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      res.json({ suppliers: JSON.parse(text) });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });


  // --- Server Setup ---
  
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Setup
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'chat_message') {
          // Save to DB
          const stmt = db.prepare('INSERT INTO messages (project_id, sender_id, content) VALUES (?, ?, ?)');
          const info = stmt.run(data.project_id, data.sender_id, data.content);
          
          // Broadcast to all clients (in a real app, filter by project room)
          const broadcastData = JSON.stringify({
            type: 'new_message',
            message: {
              id: info.lastInsertRowid,
              project_id: data.project_id,
              sender_id: data.sender_id,
              sender_name: data.sender_name, 
              content: data.content,
              timestamp: new Date().toISOString()
            }
          });
          
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        }
      } catch (e) {
        console.error('WS Error', e);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }
}

startServer();
