
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
require("dotenv").config();

const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Hospital Management System Backend is running!"
  });
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");

    res.json({
      status: "OK",
      message: "Backend API and PostgreSQL are working!"
    });
  } catch (error) {
    console.error("Database health check error:", error.message);

    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed"
    });
  }
});

// API routes
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/medical-records", medicalRecordRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
