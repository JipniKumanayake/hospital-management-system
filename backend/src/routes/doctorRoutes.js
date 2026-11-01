const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ========================================
// GET ALL DOCTORS
// ========================================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, dep.department_name
       FROM doctors d
       LEFT JOIN departments dep
       ON d.department_id = dep.department_id
       ORDER BY d.doctor_id DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get doctors error:", error.message);

    res.status(500).json({
      message: "Failed to fetch doctors"
    });
  }
});


// ========================================
// GET DOCTOR BY ID
// ========================================
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM doctors WHERE doctor_id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Get doctor error:", error.message);

    res.status(500).json({
      message: "Failed to fetch doctor"
    });
  }
});


// ========================================
// CREATE DOCTOR
// ========================================
router.post("/", async (req, res) => {
  try {
    const {
      doctor_code,
      full_name,
      specialization,
      phone,
      email,
      department_id,
      status
    } = req.body;

    if (!doctor_code || !full_name) {
      return res.status(400).json({
        message: "Doctor code and full name are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO doctors
       (
         doctor_code,
         full_name,
         specialization,
         phone,
         email,
         department_id,
         status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        doctor_code,
        full_name,
        specialization || null,
        phone || null,
        email || null,
        department_id || null,
        status || "Active"
      ]
    );

    res.status(201).json({
      message: "Doctor created successfully",
      doctor: result.rows[0]
    });

  } catch (error) {
    console.error("Create doctor error:", error.message);

    res.status(500).json({
      message: "Failed to create doctor"
    });
  }
});


// ========================================
// UPDATE DOCTOR
// ========================================
router.put("/:id", async (req, res) => {
  try {
    const {
      full_name,
      specialization,
      phone,
      email,
      department_id,
      status
    } = req.body;

    if (!full_name) {
      return res.status(400).json({
        message: "Doctor name is required"
      });
    }

    const result = await pool.query(
      `UPDATE doctors SET
       full_name = $1,
       specialization = $2,
       phone = $3,
       email = $4,
       department_id = $5,
       status = $6
       WHERE doctor_id = $7
       RETURNING *`,
      [
        full_name,
        specialization || null,
        phone || null,
        email || null,
        department_id || null,
        status || "Active",
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    res.json({
      message: "Doctor updated successfully",
      doctor: result.rows[0]
    });

  } catch (error) {
    console.error("Update doctor error:", error.message);

    res.status(500).json({
      message: "Failed to update doctor"
    });
  }
});


// ========================================
// DELETE DOCTOR
// ========================================
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM doctors WHERE doctor_id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    res.json({
      message: "Doctor deleted successfully"
    });

  } catch (error) {
    console.error("Delete doctor error:", error.message);

    res.status(500).json({
      message: "Failed to delete doctor"
    });
  }
});


// ========================================
// EXPORT ROUTER
// ========================================
module.exports = router;