import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/reservations";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const createReservation = async (data) => {
  const response = await axios.post(API_BASE_URL, data, { headers: authHeader() });
  return response.data;
};

export const addPayment = async (reservationId, data) => {
  const response = await axios.post(`${API_BASE_URL}/${reservationId}/payments`, data, { headers: authHeader() });
  return response.data;
};

export const getPayments = async (reservationId) => {
  const response = await axios.get(`${API_BASE_URL}/${reservationId}/payments`, { headers: authHeader() });
  return response.data;
};

export const getCustomerReservations = async (customerId) => {
  const response = await axios.get(`${API_BASE_URL}/customer/${customerId}`, { headers: authHeader() });
  return response.data;
};

export const getPendingReservations = async () => {
  const response = await axios.get(`${API_BASE_URL}/pending`, { headers: authHeader() });
  return response.data;
};

export const getAllReservations = async () => {
  const response = await axios.get(API_BASE_URL, { headers: authHeader() });
  return response.data;
};

export const approveReservation = async (reservationId, operationsManagerId) => {
  const response = await axios.put(
    `${API_BASE_URL}/${reservationId}/approve`,
    null,
    { params: { operationsManagerId }, headers: authHeader() }
  );
  return response.data;
};

export const rejectReservation = async (reservationId, operationsManagerId, reason) => {
  const response = await axios.put(
    `${API_BASE_URL}/${reservationId}/reject`,
    null,
    { params: { operationsManagerId, reason }, headers: authHeader() }
  );
  return response.data;
};

export const cancelReservation = async (reservationId) => {
  const response = await axios.put(`${API_BASE_URL}/${reservationId}/cancel`, null, { headers: authHeader() });
  return response.data;
};

export const updateReservation = async (reservationId, { amount, paymentMethod, apartmentId }) => {
  const response = await axios.put(`${API_BASE_URL}/${reservationId}`, { amount, paymentMethod, apartmentId }, { headers: authHeader() });
  return response.data;
};

export const deleteReservation = async (reservationId) => {
  await axios.delete(`${API_BASE_URL}/${reservationId}`, { headers: authHeader() });
};

export const uploadPaymentProof = async (reservationId, file) => {
  const form = new FormData();
  form.append("file", file);
  const response = await axios.post(`${API_BASE_URL}/${reservationId}/proof`, form, { headers: authHeader() });
  return response.data;
};

/** Opens the uploaded payment-proof PDF in a new tab (the request needs the auth header, so it's fetched as a blob). */
export const openPaymentProof = async (reservationId) => {
  const tab = window.open("", "_blank");
  try {
    const response = await axios.get(`${API_BASE_URL}/${reservationId}/proof`, { headers: authHeader(), responseType: "blob" });
    const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    if (tab) tab.location.href = url; else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) {
    tab?.close();
    if (err?.response?.data instanceof Blob) {
      try { err.response.data = JSON.parse(await err.response.data.text()); } catch { /* keep original */ }
    }
    throw err;
  }
};
