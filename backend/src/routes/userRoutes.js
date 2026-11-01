
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();
// GET: View available roles
router.get(
  "/roles",
  authenticateToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT role_id, role_name FROM roles ORDER BY role_id"
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Get roles error:", error.message);
      res.status(500).json({ message: "Failed to retrieve roles" });
    }
  }
);
// GET: View all users
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          u.user_id,
          u.full_name,
          u.email,
          u.role_id,
          r.role_name,
          u.status,
          u.created_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        ORDER BY u.user_id
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Get users error:", error.message);
      res.status(500).json({ message: "Failed to retrieve users" });
    }
  }
);

// POST: Create a new user
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const { full_name, email, password, role_id } = req.body;

      if (!full_name || !email || !password || !role_id) {
        return res.status(400).json({
          message: "All fields are required"
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must contain at least 8 characters"
        });
      }

      const existingUser = await pool.query(
        "SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)",
        [email.trim()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          message: "Email already exists"
        });
      }

      const role = await pool.query(
        "SELECT role_id FROM roles WHERE role_id = $1",
        [role_id]
      );

      if (role.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid role"
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users
          (full_name, email, password_hash, role_id, status)
         VALUES ($1, $2, $3, $4, 'Active')
         RETURNING user_id, full_name, email, role_id, status`,
        [full_name.trim(), email.trim(), passwordHash, role_id]
      );

      res.status(201).json({
        message: "User created successfully",
        user: result.rows[0]
      });

    } catch (error) {
      console.error("Create user error:", error.message);
      res.status(500).json({ message: "Failed to create user" });
    }
  }
);

// PUT: Update user details
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const { full_name, email, role_id, status, password } = req.body;
      const userId = req.params.id;

      if (!full_name || !email || !role_id ||
          !["Active", "Inactive"].includes(status)) {
        return res.status(400).json({
          message: "Valid user details are required"
        });
      }

      const existing = await pool.query(
        "SELECT user_id FROM users WHERE user_id = $1",
        [userId]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const duplicate = await pool.query(
        `SELECT user_id FROM users
         WHERE LOWER(email) = LOWER($1) AND user_id <> $2`,
        [email.trim(), userId]
      );

      if (duplicate.rows.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const role = await pool.query(
        "SELECT role_id FROM roles WHERE role_id = $1",
        [role_id]
      );

      if (role.rows.length === 0) {
        return res.status(400).json({ message: "Invalid role" });
      }

      let result;

      if (password && password.trim() !== "") {
        if (password.length < 8) {
          return res.status(400).json({
            message: "Password must contain at least 8 characters"
          });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        result = await pool.query(
          `UPDATE users
           SET full_name = $1, email = $2, role_id = $3,
               status = $4, password_hash = $5
           WHERE user_id = $6
           RETURNING user_id, full_name, email, role_id, status`,
          [full_name.trim(), email.trim(), role_id, status, passwordHash, userId]
        );
      } else {
        result = await pool.query(
          `UPDATE users
           SET full_name = $1, email = $2, role_id = $3, status = $4
           WHERE user_id = $5
           RETURNING user_id, full_name, email, role_id, status`,
          [full_name.trim(), email.trim(), role_id, status, userId]
        );
      }

      res.json({
        message: "User updated successfully",
        user: result.rows[0]
      });

    } catch (error) {
      console.error("Update user error:", error.message);
      res.status(500).json({ message: "Failed to update user" });
    }
  }
);

module.exports = router;
