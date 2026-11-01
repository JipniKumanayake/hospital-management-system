
const express = require("express");
const pool = require("../config/db");
const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// View medical records
router.get(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "Doctor", "Nurse"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          mr.record_id,
          mr.patient_id,
          p.full_name AS patient_name,
          mr.doctor_id,
          d.full_name AS doctor_name,
          mr.appointment_id,
          mr.diagnosis,
          mr.treatment,
          mr.notes,
          mr.record_date
        FROM medical_records mr
        JOIN patients p ON mr.patient_id = p.patient_id
        LEFT JOIN doctors d ON mr.doctor_id = d.doctor_id
        ORDER BY mr.record_date DESC, mr.record_id DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to retrieve medical records"
      });
    }
  }
);

// Add medical record
router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "Doctor", "Nurse"),
  async (req, res) => {
    try {
      const {
        patient_id,
        doctor_id,
        appointment_id,
        diagnosis,
        treatment,
        notes,
        record_date
      } = req.body;

      if (!patient_id || !diagnosis || !treatment) {
        return res.status(400).json({
          message: "Patient, diagnosis and treatment are required"
        });
      }

      const result = await pool.query(
        `INSERT INTO medical_records
        (patient_id, doctor_id, appointment_id,
         diagnosis, treatment, notes, record_date)
        VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::date, CURRENT_DATE))
        RETURNING *`,
        [
          patient_id,
          doctor_id || null,
          appointment_id || null,
          diagnosis,
          treatment,
          notes || null,
          record_date || null
        ]
      );

      res.status(201).json({
        message: "Medical record added successfully",
        record: result.rows[0]
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to add medical record"
      });
    }
  }
);

// Update medical record
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin", "Doctor"),
  async (req, res) => {
    try {
      const {
        patient_id,
        doctor_id,
        appointment_id,
        diagnosis,
        treatment,
        notes,
        record_date
      } = req.body;

      if (!patient_id || !diagnosis || !treatment) {
        return res.status(400).json({
          message: "Patient, diagnosis and treatment are required"
        });
      }

      const result = await pool.query(
        `UPDATE medical_records
         SET patient_id = $1,
             doctor_id = $2,
             appointment_id = $3,
             diagnosis = $4,
             treatment = $5,
             notes = $6,
             record_date = COALESCE($7::date, record_date)
         WHERE record_id = $8
         RETURNING *`,
        [
          patient_id,
          doctor_id || null,
          appointment_id || null,
          diagnosis,
          treatment,
          notes || null,
          record_date || null,
          req.params.id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Medical record not found"
        });
      }

      res.json({
        message: "Medical record updated successfully",
        record: result.rows[0]
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to update medical record"
      });
    }
  }
);

// Delete medical record - Admin only
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM medical_records WHERE record_id = $1 RETURNING record_id",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Medical record not found"
        });
      }

      res.json({
        message: "Medical record deleted successfully"
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to delete medical record"
      });
    }
  }
);

module.exports = router;
