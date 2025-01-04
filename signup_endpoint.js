const bcrypt = require('bcrypt');
const express = require('express');
const app = express();
app.use(express.json());  // Body parser middleware

const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'masterprince2002',
  database: 'user_management',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database!');
});

app.post("/signup", async (req, res) => {
  console.log("Received data:", req.body); // Debug log
  const { username, password, phone_number, login_type } = req.body;

  // Input validation
  if (!username || !password || !phone_number || !login_type) {
    console.log("Missing fields:", { username, password, phone_number, login_type });
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Assuming username is used as email
    const email = username;

    const query = "INSERT INTO users (username, email, password, phone_number, login_type) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.promise().query(query, [username, email, hashedPassword, phone_number, login_type]);

    res.json({ success: true, message: "Account created successfully!" });
  } catch (error) {
    console.error("Error inserting user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Username or email already exists." });
    }
    res.status(500).json({ error: "Error creating account." });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
