
import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { User } from "./types";

// Mock data for initial state
const MOCK_WATCHLIST = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', exchange: 'FOREX', ltp: 1.0845, change: 0.0012, percentChange: 0.11, isUp: true },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', exchange: 'FOREX', ltp: 1.2634, change: -0.0045, percentChange: -0.35, isUp: false },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', exchange: 'FOREX', ltp: 150.12, change: 0.42, percentChange: 0.28, isUp: true },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', exchange: 'FOREX', ltp: 0.6542, change: -0.0018, percentChange: -0.27, isUp: false },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', exchange: 'FOREX', ltp: 1.3521, change: 0.0008, percentChange: 0.06, isUp: true },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', exchange: 'FOREX', ltp: 0.8812, change: -0.0022, percentChange: -0.25, isUp: false },
  { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', exchange: 'FOREX', ltp: 162.85, change: 0.15, percentChange: 0.09, isUp: true },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', exchange: 'CRYPTO', ltp: 62450.00, change: -840.40, percentChange: -1.33, isUp: false },
];

let currentStocks = [...MOCK_WATCHLIST];

// In-memory user state (for demo purposes)
let userBalance = 10000; // Starting balance
const transactions: any[] = [];

// User Management State
let users: User[] = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    role: 'user'
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '9998887776',
    registrationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    role: 'user'
  },
  {
    id: '3',
    fullName: 'Blocked User',
    email: 'blocked@example.com',
    phone: '1234567890',
    registrationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'blocked',
    blockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    blockedBy: 'admin_1',
    blockReason: 'Suspicious activity',
    role: 'user'
  }
];

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // WebSocket logic
  wss.on("connection", (ws) => {
    // Send initial state
    ws.send(JSON.stringify({ type: "INITIAL_STATE", data: currentStocks }));

    ws.on("close", () => {
    });
  });

  // Price update loop
  setInterval(() => {
    const notifications: any[] = [];
    currentStocks = currentStocks.map(s => {
      const precision = s.symbol.includes('JPY') || s.symbol.includes('BTC') ? 2 : 5;
      const drift = (Math.random() - 0.5) * (1.0 / Math.pow(10, precision - 1));
      const newPrice = Math.max(0.00001, s.ltp + drift);
      const newChange = drift;
      const newPercent = (newChange / s.ltp) * 100.0;
      
      // Check for "significant" movement (e.g., > 0.05% in a single tick for demo)
      if (Math.abs(newPercent) > 0.05) {
        notifications.push({
          id: `market_${Date.now()}_${s.symbol}`,
          type: 'MARKET',
          title: 'Market Movement',
          message: `${s.symbol} is ${newPercent > 0 ? 'surging' : 'dropping'}! Current price: ${newPrice.toFixed(precision)}`,
          timestamp: new Date().toISOString()
        });
      }

      return {
        ...s,
        ltp: parseFloat(newPrice.toFixed(precision)),
        change: parseFloat((s.change + newChange).toFixed(precision)),
        percentChange: parseFloat((s.percentChange + newPercent).toFixed(2)),
        isUp: s.change + newChange >= 0
      };
    });

    // Broadcast updates
    const updateMessage = JSON.stringify({ type: "UPDATE", data: currentStocks });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(updateMessage);
        
        // Send notifications if any
        notifications.forEach(n => {
          client.send(JSON.stringify({ type: "NOTIFICATION", data: n }));
        });
      }
    });
  }, 1000); // Update every second for "instantaneous" feel

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Balance and Transactions
  app.get("/api/user/balance", (req, res) => {
    res.json({ balance: userBalance });
  });

  app.get("/api/user/transactions", (req, res) => {
    res.json(transactions);
  });

  // Razorpay Integration
  app.get("/api/payments/razorpay-key", (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID });
  });

  app.post("/api/payments/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      
      const key_id = process.env.RAZORPAY_KEY_ID;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;

      if (!key_id || !key_secret) {
        return res.status(500).json({ 
          error: "Razorpay API keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables." 
        });
      }

      // Lazy import/init of Razorpay
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id,
        key_secret,
      });

      const options = {
        amount: Math.round(amount * 100), // amount in smallest currency unit (paise for INR)
        currency,
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error("Razorpay Order Creation Error:", error);
      res.status(500).json({ error: error.message || "Failed to create Razorpay order" });
    }
  });

  app.post("/api/payments/verify", async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        amount 
      } = req.body;

      const crypto = await import("crypto");
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest("hex");

      if (generated_signature === razorpay_signature) {
        // Payment is verified
        userBalance += amount;
        const transaction = {
          id: razorpay_payment_id,
          type: 'DEPOSIT',
          amount,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        };
        transactions.push(transaction);

        // Broadcast notification
        const notification = {
          id: `deposit_${Date.now()}`,
          type: 'ACCOUNT',
          title: 'Funds Added',
          message: `Successfully deposited $${amount.toFixed(2)} to your account.`,
          timestamp: new Date().toISOString()
        };
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "NOTIFICATION", data: notification }));
          }
        });

        res.json({ status: "ok", balance: userBalance });
      } else {
        res.status(400).json({ status: "error", message: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user/withdraw", async (req, res) => {
    try {
      const { amount, bankDetails } = req.body;
      if (amount > userBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      userBalance -= amount;
      const transaction = {
        id: `withdraw_${Date.now()}`,
        type: 'WITHDRAW',
        amount,
        status: 'PROCESSING',
        bankDetails,
        timestamp: new Date().toISOString()
      };
      transactions.push(transaction);

      // Broadcast notification
      const notification = {
        id: `withdraw_notif_${Date.now()}`,
        type: 'ACCOUNT',
        title: 'Withdrawal Initiated',
        message: `Your withdrawal of $${amount.toFixed(2)} is being processed.`,
        timestamp: new Date().toISOString()
      };
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "NOTIFICATION", data: notification }));
        }
      });

      res.json({ status: "ok", balance: userBalance });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Management Admin Routes
  app.get("/api/admin/users", (req, res) => {
    res.json(users);
  });

  app.post("/api/admin/users/block", (req, res) => {
    const { userId, reason, adminId } = req.body;
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        status: 'blocked',
        blockedAt: new Date().toISOString(),
        blockedBy: adminId || 'system_admin',
        blockReason: reason || 'Violation of terms'
      };
      
      // Force logout by broadcasting a message if we had session tracking
      // For now, we just update the status.
      
      res.json({ status: "ok", user: users[userIndex] });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/admin/users/unblock", (req, res) => {
    const { userId } = req.body;
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        status: 'active',
        blockedAt: undefined,
        blockedBy: undefined,
        blockReason: undefined
      };
      res.json({ status: "ok", user: users[userIndex] });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.post("/api/auth/check-status", (req, res) => {
    const { identifier } = req.body; // email or phone
    const user = users.find(u => u.email === identifier || u.phone === identifier);
    if (user) {
      res.json({ status: user.status, blockReason: user.blockReason });
    } else {
      res.json({ status: 'not_found' });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { fullName, email, phone } = req.body;
    
    // Check if blocked
    const existingBlocked = users.find(u => (u.email === email || u.phone === phone) && u.status === 'blocked');
    if (existingBlocked) {
      return res.status(403).json({ error: "This account has been blocked and cannot be re-registered." });
    }

    // Check if already exists
    const existing = users.find(u => u.email === email || u.phone === phone);
    if (existing) {
      return res.json({ status: 'ok', user: existing }); // Simulate existing user login
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      fullName: fullName || 'New User',
      email,
      phone,
      registrationDate: new Date().toISOString(),
      status: 'active',
      role: 'user'
    };
    users.push(newUser);
    res.json({ status: "ok", user: newUser });
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
  }

  server.listen(PORT, "0.0.0.0", () => {
  });
}

startServer();
