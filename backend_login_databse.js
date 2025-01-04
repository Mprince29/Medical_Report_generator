const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "masterprince2002",
  database: "user_management",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Database connected!");
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).send("Server error");
    if (results.length === 0) return res.status(400).send("User not found");

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) return res.status(400).send("Incorrect password");

    res.send("Login successful");
  });
});

// Register endpoint
app.post("/register", async (req, res) => {
  const { username, password, phone_number, login_type } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO users (username, password, phone_number, login_type) VALUES (?, ?, ?, ?)";
  db.query(sql, [username, hashedPassword, phone_number, login_type], (err, result) => {
    if (err) return res.status(500).send("Error registering user");
    res.send("User registered successfully");
  });
});

// Forgot Password endpoint
app.post("/forgot-password", (req, res) => {
  const { phone_number, new_password } = req.body;

  const sql = "SELECT * FROM users WHERE phone_number = ?";
  db.query(sql, [phone_number], async (err, results) => {
    if (err) return res.status(500).send("Server error");
    if (results.length === 0) return res.status(400).send("Phone number not found");

    const hashedPassword = await bcrypt.hash(new_password, 10);
    const updateSql = "UPDATE users SET password = ? WHERE phone_number = ?";
    db.query(updateSql, [hashedPassword, phone_number], (err) => {
      if (err) return res.status(500).send("Error updating password");
      res.send("Password updated successfully");
    });
  });
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
 
