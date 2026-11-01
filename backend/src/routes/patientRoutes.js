
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/authMiddleware");

// ========================================
// GET ALL PATIENTS
// Admin, Doctor, Receptionist, Nurse
// ========================================
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "Doctor", "Receptionist", "Nurse"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM patients ORDER BY patient_id DESC"
      );

      res.json(result.rows);

    } catch (error) {
      console.error("Get patients error:", error.message);

      res.status(500).json({
        message: "Failed to fetch patients"
      });
    }
  }
);

// ========================================
// GET PATIENT BY ID
// ========================================
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin", "Doctor", "Receptionist", "Nurse"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM patients WHERE patient_id = $1",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Patient not found"
        });
      }

      res.json(result.rows[0]);

    } catch (error) {
      console.error("Get patient error:", error.message);

      res.status(500).json({
        message: "Failed to fetch patient"
      });
    }
  }
);

// ========================================
// CREATE PATIENT
// Admin, Receptionist
// ========================================
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "Receptionist"),
  async (req, res) => {
    try {
      const {
        patient_code,
        full_name,
        date_of_birth,
        age,
        gender,
        phone,
        email,
        address,
        blood_group,
        emergency_contact
      } = req.body;

      if (!patient_code || !full_name) {
        return res.status(400).json({
          message: "Patient code and full name are required"
        });
      }

      const result = await pool.query(
        `INSERT INTO patients
        (
          patient_code,
          full_name,
          date_of_birth,
          age,
          gender,
          phone,
          email,
          address,
          blood_group,
          emergency_contact
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *`,
        [
          patient_code,
          full_name,
          date_of_birth || null,
          age || null,
          gender || null,
          phone || null,
          email || null,
          address || null,
          blood_group || null,
          emergency_contact || null
        ]
      );

      res.status(201).json({
        message: "Patient created successfully",
        patient: result.rows[0]
      });

    } catch (error) {
      console.error("Create patient error:", error.message);

      res.status(500).json({
        message: "Failed to create patient"
      });
    }
  }
);

// ========================================
// UPDATE PATIENT
// Admin, Receptionist
// ========================================
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin", "Receptionist"),
  async (req, res) => {
    try {
      const {
        full_name,
        date_of_birth,
        age,
        gender,
        phone,
        email,
        address,
        blood_group,
        emergency_contact
      } = req.body;

      if (!full_name) {
        return res.status(400).json({
          message: "Patient name is required"
        });
      }

      const result = await pool.query(
        `UPDATE patients SET
          full_name = $1,
          date_of_birth = $2,
          age = $3,
          gender = $4,
          phone = $5,
          email = $6,
          address = $7,
          blood_group = $8,
          emergency_contact = $9
        WHERE patient_id = $10
        RETURNING *`,
        [
          full_name,
          date_of_birth || null,
          age || null,
          gender || null,
          phone || null,
          email || null,
          address || null,
          blood_group || null,
          emergency_contact || null,
          req.params.id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Patient not found"
        });
      }

      res.json({
        message: "Patient updated successfully",
        patient: result.rows[0]
      });

    } catch (error) {
      console.error("Update patient error:", error.message);

      res.status(500).json({
        message: "Failed to update patient"
      });
    }
  }
);

// ========================================
// DELETE PATIENT
// Admin only
// ========================================
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM patients WHERE patient_id = $1 RETURNING *",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Patient not found"
        });
      }

      res.json({
        message: "Patient deleted successfully"
      });

    } catch (error) {
      console.error("Delete patient error:", error.message);

      res.status(500).json({
        message: "Failed to delete patient"
      });
    }
  }
);

module.exports = router;
