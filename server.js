const express = require("express");
const path = require("path");  
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require('cors');

const app = express();
const otpStore = {}; // Initialize an empty object to store OTPs

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // or your frontend URL
  credentials: true
}));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Database configuration
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "masterprince2002",
  database: "user_management",
  connectTimeout: 10000
});

// Database connection with retry logic
function connectDatabase() {
  return new Promise((resolve, reject) => {
    console.log('Attempting database connection...');
  db.connect((err) => {
    if (err) {
      console.error("Database connection failed:", err);
      reject(err);
    } else {
      console.log('Database connected successfully');
                resolve();
    }
  });

  db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      connectDatabase();
    } else {
      throw err;
    }
  });
});
}

connectDatabase();

// Input validation middleware
const validateUserInput = (req, res, next) => {
  const { username, password, phone_number } = req.body;
  
  if (!username || !username.includes('@')) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  
  if (password && password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  
  if (phone_number && !/^\d{10}$/.test(phone_number)) {
    return res.status(400).json({ error: "Invalid phone number format" });
  }
  
  next();
};

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Signup endpoint
app.post("/signup", validateUserInput, async (req, res) => {
    const { username, password, phone_number } = req.body;
  
    console.log("Payload received:", req.body); // Log received data
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const query = "INSERT INTO users (username, password, phone_number, login_type) VALUES (?, ?, ?, 'manual')";
      db.query(query, [username, hashedPassword, phone_number], (err, result) => {
  
  if (err) {
    console.error("Database error during insertion:", err); // Log any errors
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "User already exists" });
    }
    return res.status(500).json({ error: "Error creating account" });
  }

  console.log("Insert successful:", result); // Log successful insertion
  res.json({ message: "Account created successfully" });
});

    } catch (error) {
      console.error("Error in signup:", error); // Log server-side error
      res.status(500).json({ error: "Internal server error" });
    }
  });  
// Login endpoint
app.post("/login", async (req, res) => {
  console.log("Login attempt received:", req.body); // Log incoming request

  const { username, password } = req.body; // Extract username and password from the request body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Email and password are required",
    });
  }

  try {
    const query = "SELECT * FROM users WHERE username = ? AND login_type = 'manual'";
    console.log("Executing query for username:", username); // Debug log

    db.query(query, [username], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          error: "Database error occurred",
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
      }

      const user = results[0];

      // Check if password exists (for manual login users)
      if (!user.password) {
        return res.status(401).json({
          success: false,
          error: "This account uses a different login method",
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      console.log("Password match:", passwordMatch); // Debug log

      if (passwordMatch) {
        // Send user data without password
        const userData = {
          id: user.id,
          username: user.username,
          phone_number: user.phone_number,
        };
        res.json({
          success: true,
          message: "Login successful",
          user: userData,
        });
      } else {
        res.status(401).json({ error: "Invalid Password" });
      }
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});
const crypto = require("crypto"); // For generating random OTP

// Request OTP endpoint
app.post("/request-otp", (req, res) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required"
      });
    }

    // For testing purposes, using a fixed OTP
    const testOtp = "123456";
    
    // Store the OTP with the phone number
    otpStore[phone_number] = testOtp;
    
    console.log("Stored OTP for", phone_number, ":", testOtp); // Debug log
    
    return res.json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    console.error("Error in request-otp:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Verify OTP endpoint
app.post("/verify-otp", (req, res) => {
  try {
    const { phone_number, otp } = req.body;
    console.log("Received verification request:", { phone_number, otp }); // Debug log
    console.log("Stored OTPs:", otpStore); // Debug log

    if (!phone_number || !otp) {
      return res.status(400).json({
        success: false,
        error: "Phone number and OTP are required"
      });
    }

    const storedOtp = otpStore[phone_number];
    console.log("Stored OTP for comparison:", storedOtp); // Debug log

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        error: "No OTP found for this phone number. Please request a new OTP."
      });
    }

    if (storedOtp === otp) {
      // OTP matches, fetch user from database
      const query = "SELECT * FROM users WHERE phone_number = ?";
      
      db.query(query, [phone_number], (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            error: "Database error occurred"
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            error: "User not found"
          });
        }

        // Clear the OTP after successful verification
        delete otpStore[phone_number];

        const user = results[0];
        const userData = {
          id: user.id,
          username: user.username,
          phone_number: user.phone_number,
        };

        return res.json({
          success: true,
          message: "Login successful",
          user: userData
        });
      });
    } else {
      return res.status(401).json({
        success: false,
        error: "Invalid OTP"
      });
    }
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

const PORT = 3000; // Change the port if needed
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});