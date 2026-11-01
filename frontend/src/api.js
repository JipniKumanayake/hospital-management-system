const API_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

export const getPatients = () => request("/patients");
export const getDoctors = () => request("/doctors");
export const getDepartments = () => request("/departments");
export const getAppointments = () => request("/appointments");

export const createPatient = (data) =>
  request("/patients", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const createDoctor = (data) =>
  request("/doctors", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const createDepartment = (data) =>
  request("/departments", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const createAppointment = (data) =>
  request("/appointments", {
    method: "POST",
    body: JSON.stringify(data)
  });