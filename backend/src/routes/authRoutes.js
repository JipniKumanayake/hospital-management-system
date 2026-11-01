
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find user with role
    const result = await pool.query(
      `SELECT
         u.user_id,
         u.full_name,
         u.email,
         u.password_hash,
         u.status,
         r.role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // Check account status
    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Your account is inactive. Contact the administrator."
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (!user.role_name) {
      return res.status(403).json({
        message: "User role is not assigned"
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role_name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

    // Send response
    res.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role_name
      }
    });

  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Server error during login"
    });
  }
});

module.exports = router;
