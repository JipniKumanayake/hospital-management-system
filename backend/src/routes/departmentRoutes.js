
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET all departments
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM departments ORDER BY department_id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get departments error:", error.message);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
});

// GET department by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM departments WHERE department_id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get department error:", error.message);
    res.status(500).json({ message: "Failed to fetch department" });
  }
});

// CREATE department
router.post("/", async (req, res) => {
  try {
    const { department_name, description, location } = req.body;

    if (!department_name) {
      return res.status(400).json({
        message: "Department name is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO departments
       (department_name, description, location)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        department_name,
        description || null,
        location || null
      ]
    );

    res.status(201).json({
      message: "Department created successfully",
      department: result.rows[0]
    });
  } catch (error) {
    console.error("Create department error:", error.message);
    res.status(500).json({ message: "Failed to create department" });
  }
});

// UPDATE department
router.put("/:id", async (req, res) => {
  try {
    const { department_name, description, location } = req.body;

    if (!department_name) {
      return res.status(400).json({
        message: "Department name is required"
      });
    }

    const result = await pool.query(
      `UPDATE departments SET
       department_name=$1,
       description=$2,
       location=$3
       WHERE department_id=$4
       RETURNING *`,
      [
        department_name,
        description || null,
        location || null,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({
      message: "Department updated successfully",
      department: result.rows[0]
    });
  } catch (error) {
    console.error("Update department error:", error.message);
    res.status(500).json({ message: "Failed to update department" });
  }
});

// DELETE department
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM departments WHERE department_id=$1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Delete department error:", error.message);
    res.status(500).json({ message: "Failed to delete department" });
  }
});

module.exports = router;
