import { useState, useEffect, useCallback } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

const makeCode = (prefix) => `${prefix}${Date.now()}`;

const emptyPatientForm = {
  name: "",
  age: "",
  gender: "Male",
  phone: ""
};

const emptyDoctorForm = {
  name: "",
  specialization: "",
  phone: ""
};

const emptyDepartmentForm = {
  name: "",
  description: "",
  location: ""
};

const emptyAppointmentForm = {
  patient: "",
  doctor: "",
  date: "",
  reason: "",
  status: "Scheduled"
};

const emptyUserForm = {
  full_name: "",
  email: "",
  password: "",
  role_id: "",
  status: "Active"
};

const emptyMedicalRecordForm = {
  patient_id: "",
  doctor_id: "",
  appointment_id: "",
  diagnosis: "",
  treatment: "",
  notes: "",
  record_date: new Date().toISOString().slice(0, 10)
};

function App() {
  // LOGIN
  const [token, setToken] = useState(
    sessionStorage.getItem("token") || ""
  );

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // NAVIGATION
  const [activePage, setActivePage] = useState("Dashboard");

  // DATA
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // SEARCH
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [medicalRecordSearch, setMedicalRecordSearch] = useState("");

  // FORM VISIBILITY
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);

  // EDITING IDs
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingMedicalRecordId, setEditingMedicalRecordId] = useState(null);

  // FORMS
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [medicalRecordForm, setMedicalRecordForm] = useState(
    emptyMedicalRecordForm
  );

  // HOSPITAL SETTINGS
  const [hospital, setHospital] = useState({
    name: "City Hospital Matara",
    address: "Matara, Sri Lanka",
    phone: "",
    email: ""
  });

  // LOGOUT
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setToken("");
    setCurrentUser(null);

    setPatients([]);
    setDoctors([]);
    setDepartments([]);
    setAppointments([]);
    setUsers([]);
    setRoles([]);
    setMedicalRecords([]);

    setActivePage("Dashboard");
    setError("");
    setMessage("");
    setLoginEmail("");
    setLoginPassword("");
  }, []);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoginLoading(true);
      setLoginError("");

      const result = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword
        })
      });

      sessionStorage.setItem("token", result.token);
      sessionStorage.setItem("user", JSON.stringify(result.user));

      setToken(result.token);
      setCurrentUser(result.user);
      setLoginPassword("");
      setActivePage("Dashboard");
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // LOAD DATA
  const loadData = useCallback(async () => {
    if (!token || !currentUser) return false;

    try {
      setLoading(true);
      setError("");

      const canViewRecords = [
        "Admin",
        "Doctor",
        "Nurse"
      ].includes(currentUser.role);

      const requests = [
        request("/patients"),
        request("/doctors"),
        request("/departments"),
        request("/appointments")
      ];

      if (canViewRecords) {
        requests.push(request("/medical-records"));
      }

      if (currentUser.role === "Admin") {
        requests.push(request("/users"));
        requests.push(request("/users/roles"));
      }

      const results = await Promise.all(requests);

      setPatients(Array.isArray(results[0]) ? results[0] : []);
      setDoctors(Array.isArray(results[1]) ? results[1] : []);
      setDepartments(Array.isArray(results[2]) ? results[2] : []);
      setAppointments(Array.isArray(results[3]) ? results[3] : []);

      let index = 4;

      if (canViewRecords) {
        setMedicalRecords(
          Array.isArray(results[index]) ? results[index] : []
        );
        index++;
      } else {
        setMedicalRecords([]);
      }

      if (currentUser.role === "Admin") {
        setUsers(
          Array.isArray(results[index]) ? results[index] : []
        );

        setRoles(
          Array.isArray(results[index + 1]) ? results[index + 1] : []
        );
      }

      return true;
    } catch (err) {
      setError(err.message);

      if (
        err.message.toLowerCase().includes("token") ||
        err.message.toLowerCase().includes("login") ||
        err.message.toLowerCase().includes("access denied")
      ) {
        handleLogout();
      }

      return false;
    } finally {
      setLoading(false);
    }
  }, [token, currentUser, handleLogout]);

  useEffect(() => {
    if (token && currentUser) {
      loadData();
    }
  }, [token, currentUser, loadData]);

  // NOTIFICATION
  const notify = (text) => {
    setMessage(text);
    setError("");

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // COMMON ACTION
  const runAction = async (action, successText) => {
    try {
      await action();

      const refreshed = await loadData();

      if (!refreshed) {
        throw new Error("Record saved, but data could not be refreshed.");
      }

      notify(successText);
      return true;
    } catch (err) {
      setError(err.message);
      setMessage("");
      return false;
    }
  };

  // PATIENT ADD / UPDATE
  const addPatient = async (e) => {
    e.preventDefault();

    const patientData = {
      full_name: patientForm.name.trim(),
      age: Number(patientForm.age),
      gender: patientForm.gender,
      phone: patientForm.phone.trim()
    };

    const isEditing = editingPatientId !== null;

    const success = await runAction(async () => {
      if (isEditing) {
        await request(`/patients/${editingPatientId}`, {
          method: "PUT",
          body: JSON.stringify(patientData)
        });
      } else {
        await request("/patients", {
          method: "POST",
          body: JSON.stringify({
            patient_code: makeCode("P"),
            ...patientData
          })
        });
      }
    }, isEditing ? "Patient updated successfully!" : "Patient added successfully!");

    if (!success) return;

    setPatientForm(emptyPatientForm);
    setEditingPatientId(null);
    setShowPatientForm(false);
  };

  const editPatient = (patient) => {
    setEditingPatientId(patient.patient_id);

    setPatientForm({
      name: patient.full_name || "",
      age: patient.age ?? "",
      gender: patient.gender || "Male",
      phone: patient.phone || ""
    });

    setShowPatientForm(true);
    setError("");
    setMessage("");
  };

  // DOCTOR ADD / UPDATE
  const addDoctor = async (e) => {
    e.preventDefault();

    const doctorData = {
      full_name: doctorForm.name.trim(),
      specialization: doctorForm.specialization.trim(),
      phone: doctorForm.phone.trim()
    };

    const isEditing = editingDoctorId !== null;

    const success = await runAction(async () => {
      if (isEditing) {
        await request(`/doctors/${editingDoctorId}`, {
          method: "PUT",
          body: JSON.stringify(doctorData)
        });
      } else {
        await request("/doctors", {
          method: "POST",
          body: JSON.stringify({
            doctor_code: makeCode("D"),
            ...doctorData,
            status: "Active"
          })
        });
      }
    }, isEditing ? "Doctor updated successfully!" : "Doctor added successfully!");

    if (!success) return;

    setDoctorForm(emptyDoctorForm);
    setEditingDoctorId(null);
    setShowDoctorForm(false);
  };

  const editDoctor = (doctor) => {
    setEditingDoctorId(doctor.doctor_id);

    setDoctorForm({
      name: doctor.full_name || "",
      specialization: doctor.specialization || "",
      phone: doctor.phone || ""
    });

    setShowDoctorForm(true);
    setError("");
    setMessage("");
  };

  // DEPARTMENT ADD / UPDATE
  const addDepartment = async (e) => {
    e.preventDefault();

    const departmentData = {
      department_name: departmentForm.name.trim(),
      description: departmentForm.description.trim(),
      location: departmentForm.location.trim()
    };

    const isEditing = editingDepartmentId !== null;

    const success = await runAction(async () => {
      if (isEditing) {
        await request(`/departments/${editingDepartmentId}`, {
          method: "PUT",
          body: JSON.stringify(departmentData)
        });
      } else {
        await request("/departments", {
          method: "POST",
          body: JSON.stringify(departmentData)
        });
      }
    }, isEditing ? "Department updated successfully!" : "Department added successfully!");

    if (!success) return;

    setDepartmentForm(emptyDepartmentForm);
    setEditingDepartmentId(null);
    setShowDepartmentForm(false);
  };

  const editDepartment = (department) => {
    setEditingDepartmentId(department.department_id);

    setDepartmentForm({
      name: department.department_name || "",
      description: department.description || "",
      location: department.location || ""
    });

    setShowDepartmentForm(true);
    setError("");
    setMessage("");
  };

  // APPOINTMENT ADD / UPDATE
  const addAppointment = async (e) => {
    e.preventDefault();

    const appointmentData = {
      patient_id: Number(appointmentForm.patient),
      doctor_id: Number(appointmentForm.doctor),
      appointment_date: appointmentForm.date,
      reason: appointmentForm.reason.trim(),
      status: appointmentForm.status
    };

    const isEditing = editingAppointmentId !== null;

    const success = await runAction(async () => {
      if (isEditing) {
        const existing = appointments.find(
          (a) => a.appointment_id === editingAppointmentId
        );

        if (!existing) {
          throw new Error("Appointment not found. Please refresh and try again.");
        }

        await request(`/appointments/${editingAppointmentId}`, {
          method: "PUT",
          body: JSON.stringify({
            appointment_code: existing.appointment_code,
            ...appointmentData
          })
        });
      } else {
        await request("/appointments", {
          method: "POST",
          body: JSON.stringify({
            appointment_code: makeCode("A"),
            ...appointmentData
          })
        });
      }
    }, isEditing ? "Appointment updated successfully!" : "Appointment added successfully!");

    if (!success) return;

    setAppointmentForm(emptyAppointmentForm);
    setEditingAppointmentId(null);
    setShowAppointmentForm(false);
  };

  const editAppointment = (appointment) => {
    const date = new Date(appointment.appointment_date);

    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 16);

    setEditingAppointmentId(appointment.appointment_id);

    setAppointmentForm({
      patient: String(appointment.patient_id),
      doctor: String(appointment.doctor_id),
      date: localDate,
      reason: appointment.reason || "",
      status: appointment.status || "Scheduled"
    });

    setShowAppointmentForm(true);
    setError("");
    setMessage("");
  };

  // USER MANAGEMENT
  const saveUser = async (e) => {
    e.preventDefault();

    const isEditing = editingUserId !== null;

    const userData = {
      full_name: userForm.full_name.trim(),
      email: userForm.email.trim(),
      role_id: Number(userForm.role_id),
      status: userForm.status
    };

    if (userForm.password.trim()) {
      userData.password = userForm.password;
    }

    if (!isEditing && !userData.password) {
      setError("Password is required for a new user.");
      return;
    }

    const success = await runAction(async () => {
      if (isEditing) {
        await request(`/users/${editingUserId}`, {
          method: "PUT",
          body: JSON.stringify(userData)
        });
      } else {
        await request("/users", {
          method: "POST",
          body: JSON.stringify(userData)
        });
      }
    }, isEditing ? "User updated successfully!" : "User created successfully!");

    if (!success) return;

    setUserForm(emptyUserForm);
    setEditingUserId(null);
    setShowUserForm(false);
  };

  const editUser = (user) => {
    setEditingUserId(user.user_id);

    setUserForm({
      full_name: user.full_name || "",
      email: user.email || "",
      password: "",
      role_id: String(user.role_id || ""),
      status: user.status || "Active"
    });

    setShowUserForm(true);
    setError("");
    setMessage("");
  };

  // MEDICAL RECORDS
  const saveMedicalRecord = async (e) => {
    e.preventDefault();

    const isEditing = editingMedicalRecordId !== null;

    const recordData = {
      patient_id: Number(medicalRecordForm.patient_id),
      doctor_id: medicalRecordForm.doctor_id
        ? Number(medicalRecordForm.doctor_id)
        : null,
      appointment_id: medicalRecordForm.appointment_id
        ? Number(medicalRecordForm.appointment_id)
        : null,
      diagnosis: medicalRecordForm.diagnosis.trim(),
      treatment: medicalRecordForm.treatment.trim(),
      notes: medicalRecordForm.notes.trim(),
      record_date: medicalRecordForm.record_date || null
    };

    const success = await runAction(async () => {
      if (isEditing) {
        await request(`/medical-records/${editingMedicalRecordId}`, {
          method: "PUT",
          body: JSON.stringify(recordData)
        });
      } else {
        await request("/medical-records", {
          method: "POST",
          body: JSON.stringify(recordData)
        });
      }
    }, isEditing ? "Medical record updated successfully!" : "Medical record added successfully!");

    if (!success) return;

    setMedicalRecordForm(emptyMedicalRecordForm);
    setEditingMedicalRecordId(null);
    setShowMedicalRecordForm(false);
  };

  const editMedicalRecord = (record) => {
    setEditingMedicalRecordId(record.record_id);

    setMedicalRecordForm({
      patient_id: String(record.patient_id),
      doctor_id: record.doctor_id ? String(record.doctor_id) : "",
      appointment_id: record.appointment_id ? String(record.appointment_id) : "",
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
      record_date: record.record_date
        ? String(record.record_date).slice(0, 10)
        : ""
    });

    setShowMedicalRecordForm(true);
    setError("");
    setMessage("");
  };

  // DELETE RECORD
  const removeRecord = async (endpoint, id, label) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${label}?`
    );

    if (!confirmed) return;

    await runAction(async () => {
      await request(`${endpoint}/${id}`, {
        method: "DELETE"
      });
    }, `${label} deleted successfully!`);
  };

  // SEARCH FILTERS
  const filteredPatients = patients.filter((p) =>
    `${p.full_name || ""} ${p.patient_code || ""}`
      .toLowerCase()
      .includes(patientSearch.toLowerCase())
  );

  const filteredDoctors = doctors.filter((d) =>
    `${d.full_name || ""} ${d.specialization || ""}`
      .toLowerCase()
      .includes(doctorSearch.toLowerCase())
  );

  const filteredDepartments = departments.filter((d) =>
    `${d.department_name || ""} ${d.description || ""}`
      .toLowerCase()
      .includes(departmentSearch.toLowerCase())
  );

  const filteredAppointments = appointments.filter((a) =>
    `${a.appointment_code || ""} ${a.patient_name || ""} ${a.doctor_name || ""}`
      .toLowerCase()
      .includes(appointmentSearch.toLowerCase())
  );

  const filteredUsers = users.filter((user) =>
    `${user.full_name || ""} ${user.email || ""} ${user.role_name || ""}`
      .toLowerCase()
      .includes(userSearch.toLowerCase())
  );

  const filteredMedicalRecords = medicalRecords.filter((record) =>
    `${record.patient_name || ""} ${record.doctor_name || ""} ${record.diagnosis || ""}`
      .toLowerCase()
      .includes(medicalRecordSearch.toLowerCase())
  );

  // ROLE PERMISSIONS
  const isAdmin = currentUser?.role === "Admin";

  const canViewMedicalRecords = [
    "Admin",
    "Doctor",
    "Nurse"
  ].includes(currentUser?.role);

  const canAddMedicalRecords = [
    "Admin",
    "Doctor",
    "Nurse"
  ].includes(currentUser?.role);

  const canEditMedicalRecords = [
    "Admin",
    "Doctor"
  ].includes(currentUser?.role);

  const canDeleteMedicalRecords = isAdmin;

  const menuItems = [
    "Dashboard",
    "Patients",
    "Doctors",
    "Appointments",
    "Departments",
    ...(isAdmin ? ["User Management"] : []),
    ...(canViewMedicalRecords ? ["Medical Records"] : []),
    "Settings"
  ];

  // DASHBOARD WITH HOSPITAL IMAGE
  const renderDashboard = () => (
    <div className="page-content">

      <div className="dashboard-hero">
        <div className="dashboard-hero-text">
          <span className="dashboard-label">CITY HOSPITAL MATARA</span>

          <h2>Welcome to City Hospital Matara</h2>

          <p>
            Providing quality healthcare services with care,
            compassion and commitment.
          </p>

          <p className="dashboard-location">
            Matara, Sri Lanka
          </p>
        </div>

        <img
          src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=85"
          alt="Hospital building"
          className="dashboard-hospital-image"
        />
      </div>

      <div className="dashboard-cards">
        <div className="stat-card">
          <h3>Total Patients</h3>
          <h2>{patients.length}</h2>
        </div>

        <div className="stat-card">
          <h3>Total Doctors</h3>
          <h2>{doctors.length}</h2>
        </div>

        <div className="stat-card">
          <h3>Appointments</h3>
          <h2>{appointments.length}</h2>
        </div>

        <div className="stat-card">
          <h3>Departments</h3>
          <h2>{departments.length}</h2>
        </div>

        {canViewMedicalRecords && (
          <div className="stat-card">
            <h3>Medical Records</h3>
            <h2>{medicalRecords.length}</h2>
          </div>
        )}
      </div>

      <div className="management-page">
        <h3>Recent Appointments</h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {appointments.slice(0, 5).map((a) => (
                <tr key={a.appointment_id}>
                  <td>{a.appointment_code}</td>
                  <td>{a.patient_name}</td>
                  <td>{a.doctor_name}</td>
                  <td>{new Date(a.appointment_date).toLocaleString()}</td>
                  <td>{a.status}</td>
                </tr>
              ))}

              {appointments.length === 0 && (
                <tr>
                  <td colSpan="5">No appointments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // PATIENTS PAGE
  const renderPatients = () => (
    <div className="management-page">
      <div className="management-header">
        <div>
          <h2>Patient Management</h2>
          <p>Manage hospital patient records</p>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setShowPatientForm(!showPatientForm);
            setEditingPatientId(null);
            setPatientForm(emptyPatientForm);
          }}
        >
          {showPatientForm ? "Close Form" : "+ Add Patient"}
        </button>
      </div>

      {showPatientForm && (
        <form className="data-form" onSubmit={addPatient}>
          <h3>
            {editingPatientId !== null ? "Edit Patient" : "Add New Patient"}
          </h3>

          <div className="form-grid">
            <input
              required
              placeholder="Patient Name"
              value={patientForm.name}
              onChange={(e) =>
                setPatientForm({ ...patientForm, name: e.target.value })
              }
            />

            <input
              required
              type="number"
              min="0"
              placeholder="Age"
              value={patientForm.age}
              onChange={(e) =>
                setPatientForm({ ...patientForm, age: e.target.value })
              }
            />

            <select
              value={patientForm.gender}
              onChange={(e) =>
                setPatientForm({ ...patientForm, gender: e.target.value })
              }
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>

            <input
              required
              placeholder="Phone Number"
              value={patientForm.phone}
              onChange={(e) =>
                setPatientForm({ ...patientForm, phone: e.target.value })
              }
            />
          </div>

          <button className="primary-btn" type="submit">
            {editingPatientId !== null ? "Update Patient" : "Save Patient"}
          </button>

          {editingPatientId !== null && (
            <button
              type="button"
              className="delete-btn"
              onClick={() => {
                setEditingPatientId(null);
                setPatientForm(emptyPatientForm);
                setShowPatientForm(false);
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>
      )}

      <input
        className="search-input"
        placeholder="Search patients..."
        value={patientSearch}
        onChange={(e) => setPatientSearch(e.target.value)}
      />

      <p className="total-count">Total Patients: {patients.length}</p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredPatients.map((p) => (
              <tr key={p.patient_id}>
                <td>{p.patient_code}</td>
                <td>{p.full_name}</td>
                <td>{p.age}</td>
                <td>{p.gender}</td>
                <td>{p.phone}</td>
                <td>
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={() => editPatient(p)}
                  >
                    Edit
                  </button>{" "}
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() =>
                      removeRecord("/patients", p.patient_id, "Patient")
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan="6">No patients found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // DOCTORS PAGE
  const renderDoctors = () => (
    <div className="management-page">
      <div className="management-header">
        <div>
          <h2>Doctor Management</h2>
          <p>Manage hospital doctors</p>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setShowDoctorForm(!showDoctorForm);
            setEditingDoctorId(null);
            setDoctorForm(emptyDoctorForm);
          }}
        >
          {showDoctorForm ? "Close Form" : "+ Add Doctor"}
        </button>
      </div>

      {showDoctorForm && (
        <form className="data-form" onSubmit={addDoctor}>
          <h3>
            {editingDoctorId !== null ? "Edit Doctor" : "Add New Doctor"}
          </h3>

          <div className="form-grid">
            <input
              required
              placeholder="Doctor Name"
              value={doctorForm.name}
              onChange={(e) =>
                setDoctorForm({ ...doctorForm, name: e.target.value })
              }
            />

            <input
              required
              placeholder="Specialization"
              value={doctorForm.specialization}
              onChange={(e) =>
                setDoctorForm({
                  ...doctorForm,
                  specialization: e.target.value
                })
              }
            />

            <input
              required
              placeholder="Phone Number"
              value={doctorForm.phone}
              onChange={(e) =>
                setDoctorForm({ ...doctorForm, phone: e.target.value })
              }
            />
          </div>

          <button className="primary-btn" type="submit">
            {editingDoctorId !== null ? "Update Doctor" : "Save Doctor"}
          </button>

          {editingDoctorId !== null && (
            <button
              type="button"
              className="delete-btn"
              onClick={() => {
                setEditingDoctorId(null);
                setDoctorForm(emptyDoctorForm);
                setShowDoctorForm(false);
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>
      )}

      <input
        className="search-input"
        placeholder="Search doctors..."
        value={doctorSearch}
        onChange={(e) => setDoctorSearch(e.target.value)}
      />

      <p className="total-count">Total Doctors: {doctors.length}</p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Specialization</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDoctors.map((d) => (
              <tr key={d.doctor_id}>
                <td>{d.doctor_code}</td>
                <td>{d.full_name}</td>
                <td>{d.specialization}</td>
                <td>{d.phone}</td>
                <td>
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={() => editDoctor(d)}
                  >
                    Edit
                  </button>{" "}
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() =>
                      removeRecord("/doctors", d.doctor_id, "Doctor")
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredDoctors.length === 0 && (
              <tr>
                <td colSpan="5">No doctors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // DEPARTMENTS PAGE
  const renderDepartments = () => (
    <div className="management-page">
      <div className="management-header">
        <div>
          <h2>Department Management</h2>
          <p>Manage hospital departments</p>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setShowDepartmentForm(!showDepartmentForm);
            setEditingDepartmentId(null);
            setDepartmentForm(emptyDepartmentForm);
          }}
        >
          {showDepartmentForm ? "Close Form" : "+ Add Department"}
        </button>
      </div>

      {showDepartmentForm && (
        <form className="data-form" onSubmit={addDepartment}>
          <h3>
            {editingDepartmentId !== null
              ? "Edit Department"
              : "Add New Department"}
          </h3>

          <div className="form-grid">
            <input
              required
              placeholder="Department Name"
              value={departmentForm.name}
              onChange={(e) =>
                setDepartmentForm({
                  ...departmentForm,
                  name: e.target.value
                })
              }
            />

            <input
              placeholder="Description"
              value={departmentForm.description}
              onChange={(e) =>
                setDepartmentForm({
                  ...departmentForm,
                  description: e.target.value
                })
              }
            />

            <input
              placeholder="Location"
              value={departmentForm.location}
              onChange={(e) =>
                setDepartmentForm({
                  ...departmentForm,
                  location: e.target.value
                })
              }
            />
          </div>

          <button className="primary-btn" type="submit">
            {editingDepartmentId !== null
              ? "Update Department"
              : "Save Department"}
          </button>

          {editingDepartmentId !== null && (
            <button
              type="button"
              className="delete-btn"
              onClick={() => {
                setEditingDepartmentId(null);
                setDepartmentForm(emptyDepartmentForm);
                setShowDepartmentForm(false);
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>
      )}

      <input
        className="search-input"
        placeholder="Search departments..."
        value={departmentSearch}
        onChange={(e) => setDepartmentSearch(e.target.value)}
      />

      <p className="total-count">Total Departments: {departments.length}</p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Department</th>
              <th>Description</th>
              <th>Location</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDepartments.map((d) => (
              <tr key={d.department_id}>
                <td>{d.department_id}</td>
                <td>{d.department_name}</td>
                <td>{d.description || "-"}</td>
                <td>{d.location || "-"}</td>
                <td>
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={() => editDepartment(d)}
                  >
                    Edit
                  </button>{" "}
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() =>
                      removeRecord("/departments", d.department_id, "Department")
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredDepartments.length === 0 && (
              <tr>
                <td colSpan="5">No departments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // APPOINTMENTS PAGE
  const renderAppointments = () => (
    <div className="management-page">
      <div className="management-header">
        <div>
          <h2>Appointment Management</h2>
          <p>Manage patient appointments</p>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setShowAppointmentForm(!showAppointmentForm);
            setEditingAppointmentId(null);
            setAppointmentForm(emptyAppointmentForm);
          }}
        >
          {showAppointmentForm ? "Close Form" : "+ Add Appointment"}
        </button>
      </div>

      {showAppointmentForm && (
        <form className="data-form" onSubmit={addAppointment}>
          <h3>
            {editingAppointmentId !== null
              ? "Edit Appointment"
              : "Add New Appointment"}
          </h3>

          <div className="form-grid">
            <select
              required
              value={appointmentForm.patient}
              onChange={(e) =>
                setAppointmentForm({
                  ...appointmentForm,
                  patient: e.target.value
                })
              }
            >
              <option value="">Select Patient</option>

              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.full_name}
                </option>
              ))}
            </select>

            <select
              required
              value={appointmentForm.doctor}
              onChange={(e) =>
                setAppointmentForm({
                  ...appointmentForm,
                  doctor: e.target.value
                })
              }
            >
              <option value="">Select Doctor</option>

              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  {d.full_name}
                </option>
              ))}
            </select>

            <input
              required
              type="datetime-local"
              value={appointmentForm.date}
              onChange={(e) =>
                setAppointmentForm({
                  ...appointmentForm,
                  date: e.target.value
                })
              }
            />

            <input
              required
              placeholder="Reason"
              value={appointmentForm.reason}
              onChange={(e) =>
                setAppointmentForm({
                  ...appointmentForm,
                  reason: e.target.value
                })
              }
            />

            <select
              value={appointmentForm.status}
              onChange={(e) =>
                setAppointmentForm({
                  ...appointmentForm,
                  status: e.target.value
                })
              }
            >
              <option>Scheduled</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>

          <button className="primary-btn" type="submit">
            {editingAppointmentId !== null
              ? "Update Appointment"
              : "Save Appointment"}
          </button>

          {editingAppointmentId !== null && (
            <button
              type="button"
              className="delete-btn"
              onClick={() => {
                setEditingAppointmentId(null);
                setAppointmentForm(emptyAppointmentForm);
                setShowAppointmentForm(false);
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>
      )}

      <input
        className="search-input"
        placeholder="Search appointments..."
        value={appointmentSearch}
        onChange={(e) => setAppointmentSearch(e.target.value)}
      />

      <p className="total-count">
        Total Appointments: {appointments.length}
      </p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredAppointments.map((a) => (
              <tr key={a.appointment_id}>
                <td>{a.appointment_code}</td>
                <td>{a.patient_name}</td>
                <td>{a.doctor_name}</td>
                <td>{new Date(a.appointment_date).toLocaleString()}</td>
                <td>{a.reason || "-"}</td>
                <td>{a.status}</td>
                <td>
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={() => editAppointment(a)}
                  >
                    Edit
                  </button>{" "}
                  <button
                    className="delete-btn"
                    type="button"
                    onClick={() =>
                      removeRecord("/appointments", a.appointment_id, "Appointment")
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredAppointments.length === 0 && (
              <tr>
                <td colSpan="7">No appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // USER MANAGEMENT PAGE
  const renderUsers = () => (
    <div className="management-page">
      <div className="management-header">
        <div>
          <h2>User Management</h2>
          <p>Manage hospital system users and access roles</p>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() => {
            setShowUserForm(!showUserForm);
            setEditingUserId(null);
            setUserForm(emptyUserForm);
            setError("");
          }}
        >
          {showUserForm ? "Close Form" : "+ Add User"}
        </button>
      </div>

      {showUserForm && (
        <form className="data-form" onSubmit={saveUser}>
          <h3>{editingUserId !== null ? "Edit User" : "Create New User"}</h3>

          <div className="form-grid">
            <input
              required
              placeholder="Full Name"
              value={userForm.full_name}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  full_name: e.target.value
                })
              }
            />

            <input
              required
              type="email"
              placeholder="Email Address"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  email: e.target.value
                })
              }
            />

            <input
              type="password"
              required={!editingUserId}
              minLength="8"
              placeholder={
                editingUserId
                  ? "New Password (optional)"
                  : "Password (minimum 8 characters)"
              }
              value={userForm.password}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  password: e.target.value
                })
              }
            />

            <select
              required
              value={userForm.role_id}
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  role_id: e.target.value
                })
              }
            >
              <option value="">Select Role</option>

              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </select>

            {editingUserId !== null && (
              <select
                value={userForm.status}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    status: e.target.value
                  })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            )}
          </div>

          <button className="primary-btn" type="submit">
            {editingUserId !== null ? "Update User" : "Create User"}
          </button>

          <button
            type="button"
            className="delete-btn"
            onClick={() => {
              setShowUserForm(false);
              setEditingUserId(null);
              setUserForm(emptyUserForm);
            }}
          >
            Cancel
          </button>
        </form>
      )}

      <input
        className="search-input"
        placeholder="Search users..."
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
      />

      <p className="total-count">Total Users: {users.length}</p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.role_name}</td>
                <td>{user.status}</td>
                <td>
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={() => editUser(user)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // MEDICAL RECORDS PAGE
  const renderMedicalRecords = () => (
    <div className="management-page">
      <div className="management-header">
        <div>
          <h2>Medical Records</h2>
          <p>Manage patient diagnosis and treatment records</p>
        </div>

        {canAddMedicalRecords && (
          <button
            className="primary-btn"
            type="button"
            onClick={() => {
              setShowMedicalRecordForm(!showMedicalRecordForm);
              setEditingMedicalRecordId(null);
              setMedicalRecordForm(emptyMedicalRecordForm);
            }}
          >
            {showMedicalRecordForm ? "Close Form" : "+ Add Medical Record"}
          </button>
        )}
      </div>

      {showMedicalRecordForm && canAddMedicalRecords && (
        <form className="data-form" onSubmit={saveMedicalRecord}>
          <h3>
            {editingMedicalRecordId !== null
              ? "Edit Medical Record"
              : "Add Medical Record"}
          </h3>

          <div className="form-grid">
            <select
              required
              value={medicalRecordForm.patient_id}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  patient_id: e.target.value
                })
              }
            >
              <option value="">Select Patient</option>

              {patients.map((patient) => (
                <option key={patient.patient_id} value={patient.patient_id}>
                  {patient.full_name}
                </option>
              ))}
            </select>

            <select
              value={medicalRecordForm.doctor_id}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  doctor_id: e.target.value
                })
              }
            >
              <option value="">Select Doctor (Optional)</option>

              {doctors.map((doctor) => (
                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>

            <select
              value={medicalRecordForm.appointment_id}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  appointment_id: e.target.value
                })
              }
            >
              <option value="">Select Appointment (Optional)</option>

              {appointments.map((appointment) => (
                <option
                  key={appointment.appointment_id}
                  value={appointment.appointment_id}
                >
                  {appointment.appointment_code} - {appointment.patient_name}
                </option>
              ))}
            </select>

            <input
              type="date"
              required
              value={medicalRecordForm.record_date}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  record_date: e.target.value
                })
              }
            />

            <input
              required
              placeholder="Diagnosis"
              value={medicalRecordForm.diagnosis}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  diagnosis: e.target.value
                })
              }
            />

            <input
              required
              placeholder="Treatment"
              value={medicalRecordForm.treatment}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  treatment: e.target.value
                })
              }
            />

            <textarea
              placeholder="Additional Notes"
              value={medicalRecordForm.notes}
              onChange={(e) =>
                setMedicalRecordForm({
                  ...medicalRecordForm,
                  notes: e.target.value
                })
              }
            />
          </div>

          <button className="primary-btn" type="submit">
            {editingMedicalRecordId !== null ? "Update Record" : "Save Record"}
          </button>

          <button
            type="button"
            className="delete-btn"
            onClick={() => {
              setShowMedicalRecordForm(false);
              setEditingMedicalRecordId(null);
              setMedicalRecordForm(emptyMedicalRecordForm);
            }}
          >
            Cancel
          </button>
        </form>
      )}

      <input
        className="search-input"
        placeholder="Search by patient, doctor or diagnosis..."
        value={medicalRecordSearch}
        onChange={(e) => setMedicalRecordSearch(e.target.value)}
      />

      <p className="total-count">
        Total Medical Records: {medicalRecords.length}
      </p>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Diagnosis</th>
              <th>Treatment</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredMedicalRecords.map((record) => (
              <tr key={record.record_id}>
                <td>{record.record_id}</td>
                <td>{record.patient_name}</td>
                <td>{record.doctor_name || "-"}</td>
                <td>
                  {record.record_date
                    ? String(record.record_date).slice(0, 10)
                    : "-"}
                </td>
                <td>{record.diagnosis}</td>
                <td>{record.treatment}</td>
                <td>{record.notes || "-"}</td>
                <td>
                  {canEditMedicalRecords && (
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() => editMedicalRecord(record)}
                    >
                      Edit
                    </button>
                  )}

                  {canDeleteMedicalRecords && (
                    <button
                      className="delete-btn"
                      type="button"
                      onClick={() =>
                        removeRecord(
                          "/medical-records",
                          record.record_id,
                          "Medical Record"
                        )
                      }
                    >
                      Delete
                    </button>
                  )}

                  {!canEditMedicalRecords &&
                    !canDeleteMedicalRecords &&
                    "View Only"}
                </td>
              </tr>
            ))}

            {filteredMedicalRecords.length === 0 && (
              <tr>
                <td colSpan="8">No medical records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // SETTINGS PAGE
  const renderSettings = () => (
    <div className="management-page">
      <h2>System Settings</h2>

      <form
        className="data-form"
        onSubmit={(e) => {
          e.preventDefault();
          notify("Hospital details saved for this session.");
        }}
      >
        <h3>Hospital Information</h3>

        <div className="form-grid">
          <input
            value={hospital.name}
            placeholder="Hospital Name"
            onChange={(e) =>
              setHospital({ ...hospital, name: e.target.value })
            }
          />

          <input
            value={hospital.address}
            placeholder="Address"
            onChange={(e) =>
              setHospital({ ...hospital, address: e.target.value })
            }
          />

          <input
            value={hospital.phone}
            placeholder="Phone"
            onChange={(e) =>
              setHospital({ ...hospital, phone: e.target.value })
            }
          />

          <input
            type="email"
            value={hospital.email}
            placeholder="Email"
            onChange={(e) =>
              setHospital({ ...hospital, email: e.target.value })
            }
          />
        </div>

        <button className="primary-btn" type="submit">
          Save Settings
        </button>
      </form>

      <div className="data-form">
        <h3>System Information</h3>
        <p>
          Patient, doctor, department, appointment, user and
          medical record management modules are connected to PostgreSQL.
        </p>
      </div>
    </div>
  );

  // LOGIN SCREEN
  if (!token || !currentUser) {
    return (
      <div className="login-container">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>CITY HOSPITAL MATARA</h1>
          <h2>Welcome Back</h2>
          <p>Please login to continue</p>

          {loginError && (
            <p style={{ color: "red" }}>{loginError}</p>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />

          <button
            className="primary-btn"
            type="submit"
            disabled={loginLoading}
          >
            {loginLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  // MAIN APP
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <h2>City Hospital</h2>
          <p className="sidebar-subtitle">
            Matara | Hospital Management
          </p>
        </div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              className={`menu-item ${activePage === item ? "active" : ""}`}
              onClick={() => {
                setActivePage(item);
                setError("");
                setMessage("");
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h2>{activePage}</h2>

          <div>
            <span>
              {currentUser.full_name} ({currentUser.role})
            </span>

            <button
              className="delete-btn"
              type="button"
              onClick={handleLogout}
              style={{ marginLeft: "15px" }}
            >
              Logout
            </button>
          </div>
        </header>

        {message && (
          <p className="total-count">{message}</p>
        )}

        {error && (
          <div className="data-form">
            <p style={{ color: "red" }}>{error}</p>

            <button
              className="primary-btn"
              type="button"
              onClick={loadData}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <p>Loading hospital data...</p>
        ) : !error ? (
          <>
            {activePage === "Dashboard" && renderDashboard()}
            {activePage === "Patients" && renderPatients()}
            {activePage === "Doctors" && renderDoctors()}
            {activePage === "Appointments" && renderAppointments()}
            {activePage === "Departments" && renderDepartments()}

            {activePage === "User Management" &&
              isAdmin &&
              renderUsers()}

            {activePage === "Medical Records" &&
              canViewMedicalRecords &&
              renderMedicalRecords()}

            {activePage === "Settings" && renderSettings()}
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;