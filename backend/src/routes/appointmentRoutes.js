
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET all appointments
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        a.*,
        p.full_name AS patient_name,
        d.full_name AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       ORDER BY a.appointment_date DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get appointments error:", error.message);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// GET appointment by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, p.full_name AS patient_name,
              d.full_name AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.appointment_id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get appointment error:", error.message);
    res.status(500).json({ message: "Failed to fetch appointment" });
  }
});

// CREATE appointment
router.post("/", async (req, res) => {
  try {
    const {
      appointment_code,
      patient_id,
      doctor_id,
      appointment_date,
      reason,
      status
    } = req.body;

    if (
      !appointment_code ||
      !patient_id ||
      !doctor_id ||
      !appointment_date
    ) {
      return res.status(400).json({
        message: "Appointment code, patient, doctor and date are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO appointments
       (appointment_code, patient_id, doctor_id,
        appointment_date, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        appointment_code,
        patient_id,
        doctor_id,
        appointment_date,
        reason || null,
        status || "Scheduled"
      ]
    );

    res.status(201).json({
      message: "Appointment created successfully",
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error("Create appointment error:", error.message);
    res.status(500).json({ message: "Failed to create appointment" });
  }
});

// UPDATE appointment
router.put("/:id", async (req, res) => {
  try {
    const {
      appointment_code,
      patient_id,
      doctor_id,
      appointment_date,
      reason,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE appointments SET
       appointment_code=$1, patient_id=$2, doctor_id=$3,
       appointment_date=$4, reason=$5, status=$6
       WHERE appointment_id=$7
       RETURNING *`,
      [
        appointment_code,
        patient_id,
        doctor_id,
        appointment_date,
        reason || null,
        status || "Scheduled",
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
      message: "Appointment updated successfully",
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error("Update appointment error:", error.message);
    res.status(500).json({ message: "Failed to update appointment" });
  }
});

// DELETE appointment
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM appointments WHERE appointment_id=$1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete appointment error:", error.message);
    res.status(500).json({ message: "Failed to delete appointment" });
  }
});

module.exports = router;
