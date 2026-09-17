import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/promotions";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const createPromotion = async (data) => {
  const response = await axios.post(API_BASE_URL, data, { headers: authHeader() });
  return response.data;
};

export const approvePromotion = async (promotionId, operationsManagerId) => {
  const response = await axios.put(
    `${API_BASE_URL}/${promotionId}/approve`,
    null,
    { params: { operationsManagerId }, headers: authHeader() }
  );
  return response.data;
};

export const rejectPromotion = async (promotionId, operationsManagerId, reason) => {
  const response = await axios.put(
    `${API_BASE_URL}/${promotionId}/reject`,
    null,
    { params: { operationsManagerId, reason }, headers: authHeader() }
  );
  return response.data;
};

// public — no auth header needed
export const getActivePromotions = async () => {
  const response = await axios.get(API_BASE_URL);
  return response.data;
};

export const getPendingPromotions = async () => {
  const response = await axios.get(`${API_BASE_URL}/pending`, { headers: authHeader() });
  return response.data;
};

export const getMyPromotions = async (salesStaffId) => {
  const response = await axios.get(`${API_BASE_URL}/my/${salesStaffId}`, { headers: authHeader() });
  return response.data;
};

export const deletePromotion = async (promotionId) => {
  await axios.delete(`${API_BASE_URL}/${promotionId}`, { headers: authHeader() });
};

export const updatePromotion = async (promotionId, data) => {
  const response = await axios.put(`${API_BASE_URL}/${promotionId}`, data, { headers: authHeader() });
  return response.data;
};
