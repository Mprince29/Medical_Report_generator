app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  try {
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        return res.status(500).send("Internal server error.");
      }

      if (results.length === 0) {
        return res.status(404).send("User not found.");
      }

      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).send("Invalid email or password.");
      }

      res.send("Login successful!");
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal server error.");
  }
});
