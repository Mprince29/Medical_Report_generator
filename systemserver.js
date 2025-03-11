const express = require("express");
const path = require("path");  
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require('cors');
const jwt = require("jsonwebtoken");
const session = require('express-session'); // Add this line
const fs = require('fs'); // Add this line for file operations
const JWT_SECRET = "your-secret-key"; // In production, use environment variable
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
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', }
}));

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.session.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.redirect('/login');
  }
};

// Database configuration
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "masterprince2002",
  database: "user_management",
  waitForConnections: true,
  connectionLimit: 10,  // ✅ Allows multiple queries without closing connection
  queueLimit: 0
});

// Database connection with retry logic
function connectDatabase() {
  return new Promise((resolve, reject) => {
    console.log("Attempting database connection...");

    db.getConnection((err, connection) => {
      if (err) {
        console.error("Database connection failed:", err);
        reject(err); // ✅ Reject the promise on failure
        return;
      }

      console.log("Connected to MySQL database.");
      connection.release(); // ✅ Release connection back to the pool
      resolve(); // ✅ Resolve the promise on success
    });
  });
}

// ✅ Handle database errors & automatic reconnection
db.on("error", (err) => {
  console.error("Database error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST" || err.fatal) {
    console.log("Attempting to reconnect to the database...");
    connectDatabase().catch((err) => console.error("Reconnection failed:", err));
  } else {
    throw err;
  }
});

// ✅ Ensure the database connects when the server starts
connectDatabase()
  .then(() => console.log("Database ready for queries."))
  .catch((err) => console.error("Initial database connection failed:", err));

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
  res.redirect("Luchkee_homepage.html");
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Luchkee_homepage.html"));
});

// Protected dashboard route
app.get("/dashboard", authenticateUser, (req, res) => {
  // Read the dashboard HTML file
  const dashboardPath = path.join(__dirname, "public", "Luchkee Dashboard.html");
  
  // Read the file content
  fs.readFile(dashboardPath, 'utf8', (err, html) => {
    if (err) {
      console.error("Error reading dashboard file:", err);
      return res.status(500).send("Error loading dashboard");
    }

    // Insert the username into the HTML
    const modifiedHtml = html.replace(
      '<span class="logo-text">HMS</span>',
      `<span class="logo-text">HMS</span>
      <span class="user-info">Welcome, ${req.user.username}</span>`
    );

    res.send(modifiedHtml);
  });
});

// Contact form endpoint
app.post("/contact", async (req, res) => {
  const { fullName, email, phoneNumber, message } = req.body;
  
  // Validate input
  if (!fullName || !email || !phoneNumber || !message) {
    return res.status(400).json({
      success: false,
      error: "All fields are required"
    });
  }
  
  try {
    // Store contact form submission in database
    const query = "INSERT INTO contact_submissions (full_name, email, phone_number, message) VALUES (?, ?, ?, ?)";
    db.query(query, [fullName, email, phoneNumber, message], (err, result) => {
      if (err) {
        console.error("Database error during contact submission:", err);
        return res.status(500).json({
          success: false,
          error: "Error submitting contact form"
        });
      }
      
      res.json({
        success: true,
        message: "Message sent successfully"
      });
    });
  } catch (error) {
    console.error("Error in contact form:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

//Authenticaation middleware 
app.get(["/Login", "Login.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Login.html"));
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

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

  // Generate JWT token for the new user
  const token = jwt.sign(
    { 
      id: result.insertId, 
      username: username 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Store token in session
  req.session.token = token;
  req.session.user = {
    id: result.insertId,
    username: username
  };

  console.log("Account created successfully");
  res.json({ 
    success: true,
    message: "Account created successfully",
    token: token,
    user: {
      username: username
    }
  });
});

} catch (error) {
console.error("Error in signup:", error);
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
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Store token in session
        req.session.token = token;
        req.session.user = {
          id: user.id,
          username: user.username
        };

        res.json({
          success: true,
          message: "Login successful",
          token: token,
          user: {
            username: user.username
          }
        });
      } else {
        res.status(401).json({ error: "Invalid Password" });
      }
    });
  } catch (error) {
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

// Contact form endpoint with error logging
app.post("/contact", async (req, res) => {
  console.log("Contact form submission received:", req.body);  // Debug log
  
  const { fullName, email, phoneNumber, message } = req.body;
  
  // Validate input
  if (!fullName || !email || !phoneNumber || !message) {
    console.log("Missing fields:", { fullName, email, phoneNumber, message });  // Debug log
    return res.status(400).json({
      success: false,
      error: "All fields are required"
    });
  }
  
  try {
    // Store contact form submission in database
    const query = "INSERT INTO contact_submissions (full_name, email, phone_number, message) VALUES (?, ?, ?, ?)";
    db.query(query, [fullName, email, phoneNumber, message], (err, result) => {
      if (err) {
        console.error("Database error during contact submission:", err);
        return res.status(500).json({
          success: false,
          error: "Error submitting contact form"
        });
      }
      
      console.log("Contact form submitted successfully");  // Debug log
      res.json({
        success: true,
        message: "Message sent successfully"
      });
    });
  } catch (error) {
    console.error("Error in contact form:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Search endpoint (basic implementation)
app.get("/search", (req, res) => {
  const { query } = req.query;
  console.log("Search query received:", query);  // Debug log
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: "Search query is required"
    });
  }
  
  // Implement your search logic here
  res.json({
    success: true,
    message: "Search functionality coming soon",
    query: query
  });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Error logging out" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// Get current user endpoint
app.get('/api/user', authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: {
      username: req.user.username
    }
  });
});

app.get("/api/next-visit-id", async (req, res) => {
  const connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "masterprince2002",
      database: "user_management"
  });

  connection.connect();

  try {
      const [rows] = await connection.promise().query("SELECT MAX(visit_id) as lastId FROM patients");
      let nextId = rows[0].lastId ? parseInt(rows[0].lastId.replace("LH", ""), 10) + 1 : 1001;
      res.json({ nextVisitId: `LH${nextId}` });
  } catch (error) {
      console.error("Error fetching next visit ID:", error);
      res.status(500).json({ error: "Internal server error" });
  } finally {
      connection.end(); // Close the connection after query execution
  }
});


app.get("/api/tests", authenticateUser, async (req, res) => {
  try {
    // Query to fetch tests from database
    const query = "SELECT * FROM medical_tests";
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          error: "Error fetching tests"
        });
      }
      
      res.json({
        success: true,
        tests: results
      });
    });
  } catch (error) {
    console.error("Error in /api/tests:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

app.put("/api/tests/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, normal_range, category, description } = req.body;

  const query = `UPDATE medical_tests SET name = ?, price = ?, normal_range = ?, category = ?, description = ? WHERE id = ?`;
  db.query(query, [name, price, normal_range, category, description, id], (err, result) => {
      if (err) {
          console.error("Error updating test:", err);
          return res.status(500).json({ error: "Database update failed" });
      }
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Test not found" });
      }
      res.json({ success: true, message: "Test updated successfully" });
  });
});


app.post("/api/patients", async (req, res) => {
  const { 
      visitId, 
      patientName, 
      age, 
      gender, 
      contactNumber, 
      doctorName, 
      reportedDate, 
      collectionDate, 
      selectedTests, 
      testResults, 
      billing 
  } = req.body;

  if (!visitId || !patientName || !age || !gender || !contactNumber || !doctorName || !reportedDate || !collectionDate) {
      return res.status(400).json({ success: false, error: "All fields are required" });
  }

  let connection;
  try {
    connection = await db.promise().getConnection(); // ✅ Get a connection from the pool

    await connection.beginTransaction(); // ✅ Start transaction properly

    // ✅ Insert patient record
    await connection.query(
      `INSERT INTO patients (visit_id, patient_name, age, gender, contact_number, doctor_name, reported_date, collection_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [visitId, patientName, age, gender, contactNumber, doctorName, reportedDate, collectionDate]
    );

    // ✅ Insert selected tests
    if (selectedTests && selectedTests.length > 0) {
      for (const test of selectedTests) {
        await connection.query(
          `INSERT INTO patient_tests (visit_id, test_id, test_name, price) VALUES (?, ?, ?, ?)`,
          [visitId, test.id, test.name, test.price]
        );
      }
    }

    // ✅ Insert test results
    if (testResults && testResults.length > 0) {
      for (const test of testResults) {
        await connection.query(
          `INSERT INTO test_results (visit_id, test_id, test_name, result_value, result_status) VALUES (?, ?, ?, ?, ?)`,
          [visitId, test.testId, test.testName, test.resultValue, test.resultStatus]
        );
      }
    }

    // ✅ Insert billing details
    await connection.query(
      `INSERT INTO patient_billing (visit_id, subtotal, discount_percentage, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount, grand_total) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        visitId,
        billing.subtotal,
        billing.discountPercentage,
        billing.cgstRate,
        billing.cgstAmount,
        billing.sgstRate,
        billing.sgstAmount,
        billing.igstRate,
        billing.igstAmount,
        billing.grandTotal
      ]
    );

    await connection.commit(); // ✅ Commit transaction

    res.json({ success: true, message: "Patient entry, test results, and related data saved successfully" });

  } catch (error) {
    if (connection) {
      await connection.rollback(); // ✅ Ensure rollback works properly
    }
    console.error("Error saving patient entry:", error);
    res.status(500).json({ success: false, error: "Internal server error" });

  } finally {
    if (connection) {
      connection.release(); // ✅ Correct way to release a connection
    }
  }
});

// API for fetching reports
app.get("/api/reports", (req, res) => {
  const searchQuery = req.query.q || "";

  const query = `SELECT * FROM patients WHERE visit_id LIKE ? OR patient_name LIKE ?`;
  db.query(query, [`%${searchQuery}%`, `%${searchQuery}%`], (err, results) => {
    if (err) {
      console.error("Error fetching reports:", err);
      return res.status(500).json({ error: "Failed to fetch reports" });
    }
    res.json(results);
  });
});

// API to get details for a specific report
app.get("/api/report/:visitId", async (req, res) => {
  const visitId = req.params.visitId;
  console.log(`Fetching report for visitId: ${visitId}`); // Debugging log

  try {
      // Fetch patient data
      const query = `SELECT * FROM patients WHERE visit_id = ?`;
      const [patientData] = await db.promise().query(query, [visitId]);

      console.log("Patient Data:", patientData); // Debugging log

      if (!patientData || patientData.length === 0) {
          return res.status(404).json({ error: "Report not found" });
      }

      // ✅ Fetch test results (including reference range & unit)
      const testResultsQuery = `
    SELECT 
        tr.test_id, 
        tr.test_name, 
        tr.result_value, 
        tr.result_status, 
        COALESCE(rr.reference_range, 'Not Available') AS reference_range,
        COALESCE(rr.unit, '-') AS unit
    FROM test_results tr
    LEFT JOIN reference_ranges rr 
    ON TRIM(tr.test_name) = TRIM(rr.test_name)
    WHERE tr.visit_id = ?`;

      const [testResults] = await db.promise().query(testResultsQuery, [visitId]);

      console.log("Test Results:", testResults); // Debugging log

      // Fetch billing details
      const billingQuery = `SELECT * FROM patient_billing WHERE visit_id = ?`;
      const [billingData] = await db.promise().query(billingQuery, [visitId]);

      console.log("Billing Data:", billingData); // Debugging log

      // ✅ Ensure test results have valid reference range & unit
      const formattedTestResults = testResults.map(tr => ({
          test_id: tr.test_id,
          test_name: tr.test_name,
          result_value: tr.result_value,
          result_status: tr.result_status,
          reference_range: tr.reference_range ? tr.reference_range.trim() : "Not Available",
          unit: tr.unit ? tr.unit.trim() : "-"
      }));

      const report = {
          ...patientData[0],
          test_results: formattedTestResults,
          billing: billingData.length > 0 ? billingData[0] : { 
              subtotal: 0, discount_percentage: 0, 
              cgst_amount: 0, sgst_amount: 0, igst_amount: 0, 
              grand_total: 0 
          } // Ensure billing is never undefined
      };

      console.log("Final Report Data:", report); // Debugging log
      res.json(report);
  } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

// Update report details
app.put("/api/report/:visitId", (req, res) => {
  const visitId = req.params.visitId;
  const {
      patientName,
      age,
      gender,
      contactNumber = "N/A", // Default value if missing
      doctorName,
      reportedDate = new Date().toISOString().split("T")[0], // Default to today
      collectionDate = new Date().toISOString().split("T")[0] // Default to today
  } = req.body;

  const query = `
      UPDATE patients 
      SET patient_name = ?, age = ?, gender = ?, contact_number = ?, 
          doctor_name = ?, reported_date = ?, collection_date = ? 
      WHERE visit_id = ?`;

  db.query(
      query,
      [patientName, age, gender, contactNumber, doctorName, reportedDate, collectionDate, visitId],
      (err) => {
          if (err) {
              console.error("Error updating report:", err);
              return res.status(500).json({ error: "Failed to update report" });
          }
          res.json({ success: true, message: "Report updated successfully" });
      }
  );
});

app.get("/api/get-report/:visitId", (req, res) => {
  const { visitId } = req.params;
  const pdfPath = path.join(__dirname, "reports", `${visitId}.pdf`);

  // ✅ Ensure file exists and serve updated version
  if (fs.existsSync(pdfPath)) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Expires", "0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Content-Type", "application/pdf");
      res.sendFile(pdfPath);
  } else {
      res.status(404).json({ error: "PDF report not found" });
  }
});

const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log("✅ Server running on http://127.0.0.1:3000");
});
