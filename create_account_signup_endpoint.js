const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "masterprince2002",
  database: "user_management",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database.");
});

// User Signup Endpoint
app.post("/signup", (req, res) => {
  const { username, password, phone_number, login_type } = req.body;

  // Validate inputs
  if (!username || !password || !phone_number || !login_type) {
    return res.status(400).send("All fields are required.");
  }

  if (!["manual", "Google"].includes(login_type)) {
    return res.status(400).send("Invalid login type. Must be 'manual' or 'Google'.");
  }

  // Hash the password for security
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).send("Error creating account.");
    }

    // Assuming `username` is the email for 'manual' login
    const email = username;  // If username is used as the email

    // Insert the user into the database
    const query = "INSERT INTO users (username, email, password, phone_number, login_type) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [username, email, hashedPassword, phone_number, login_type], (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send("Username or phone number already exists.");
        }
        return res.status(500).send("Error creating account.");
      }
      res.send("Account created successfully!");
    });
  });
});

// Server Listener
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
