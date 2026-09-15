import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/promotions";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

/** POST /api/promotions — SalesStaff/Admin creates a promotion */
export const createPromotion = async (data) => {
  const response = await axios.post(API_BASE_URL, data, {
    headers: authHeader(),
  });
  return response.data;
};

/** PUT /api/promotions/{id}/approve?operationsManagerId={id} — OperationsManager approves */
export const approvePromotion = async (promotionId, operationsManagerId) => {
  const response = await axios.put(
    `${API_BASE_URL}/${promotionId}/approve`,
    null,
    {
      params: { operationsManagerId },
      headers: authHeader(),
    }
  );
  return response.data;
};

/** PUT /api/promotions/{id}/reject?operationsManagerId={id}&reason={reason} — OperationsManager rejects */
export const rejectPromotion = async (promotionId, operationsManagerId, reason) => {
  const response = await axios.put(
    `${API_BASE_URL}/${promotionId}/reject`,
    null,
    {
      params: { operationsManagerId, reason },
      headers: authHeader(),
    }
  );
  return response.data;
};

/** GET /api/promotions — Public: all APPROVED promotions */
export const getActivePromotions = async () => {
  const response = await axios.get(API_BASE_URL);
  return response.data;
};

/** GET /api/promotions/my/{salesStaffId} — SalesStaff's own submitted promotions */
export const getMyPromotions = async (salesStaffId) => {
  const response = await axios.get(`${API_BASE_URL}/my/${salesStaffId}`, {
    headers: authHeader(),
  });
  return response.data;
};

/** GET /api/promotions/pending — OperationsManager: all PENDING promotions */
export const getPendingPromotions = async () => {
  const response = await axios.get(`${API_BASE_URL}/pending`, {
    headers: authHeader(),
  });
  return response.data;
};
