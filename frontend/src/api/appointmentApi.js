import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/appointments";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const createAppointment = async (data) => {
  const response = await axios.post(API_BASE_URL, data, { headers: authHeader() });
  return response.data;
};

export const getCustomerAppointments = async (customerId) => {
  const response = await axios.get(`${API_BASE_URL}/customer/${customerId}`, { headers: authHeader() });
  return response.data;
};

export const getAvailableSlots = async (apartmentId, date) => {
  const response = await axios.get(`${API_BASE_URL}/available-slots/${apartmentId}`, {
    params: { date }, headers: authHeader(),
  });
  return response.data;
};

export const getPendingAppointments = async () => {
  const response = await axios.get(`${API_BASE_URL}/pending`, { headers: authHeader() });
  return response.data;
};

export const getCROAppointments = async (croId) => {
  const response = await axios.get(`${API_BASE_URL}/cro/${croId}`, { headers: authHeader() });
  return response.data;
};

export const getAllAppointments = async () => {
  const response = await axios.get(API_BASE_URL, { headers: authHeader() });
  return response.data;
};

export const approveAppointment = async (appointmentId) => {
  const response = await axios.put(`${API_BASE_URL}/${appointmentId}/approve`, null, { headers: authHeader() });
  return response.data;
};

export const rescheduleAppointment = async (appointmentId, newScheduledDate) => {
  const response = await axios.put(`${API_BASE_URL}/${appointmentId}/reschedule`, { newScheduledDate }, { headers: authHeader() });
  return response.data;
};

export const declineAppointment = async (appointmentId, reason) => {
  const response = await axios.put(`${API_BASE_URL}/${appointmentId}/decline`, { reason }, { headers: authHeader() });
  return response.data;
};

export const completeAppointment = async (appointmentId) => {
  const response = await axios.put(`${API_BASE_URL}/${appointmentId}/complete`, null, { headers: authHeader() });
  return response.data;
};

export const cancelAppointment = async (appointmentId) => {
  const response = await axios.put(`${API_BASE_URL}/${appointmentId}/cancel`, null, { headers: authHeader() });
  return response.data;
};

export const updateAppointment = async (appointmentId, { apartmentId, requestedDate }) => {
  const response = await axios.put(`${API_BASE_URL}/${appointmentId}`, { apartmentId, requestedDate }, { headers: authHeader() });
  return response.data;
};

export const deleteAppointment = async (appointmentId) => {
  await axios.delete(`${API_BASE_URL}/${appointmentId}`, { headers: authHeader() });
};
