import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/notifications";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// every call is scoped server-side to the JWT's own user — no user id is ever sent

export const getNotifications = async () => {
  const response = await axios.get(API_BASE_URL, { headers: authHeader() });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await axios.get(`${API_BASE_URL}/unread-count`, { headers: authHeader() });
  return response.data.count;
};

export const markNotificationRead = async (id) => {
  const response = await axios.put(`${API_BASE_URL}/${id}/read`, null, { headers: authHeader() });
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await axios.put(`${API_BASE_URL}/read-all`, null, { headers: authHeader() });
  return response.data;
};

// relatedEntityType → where clicking the notification should go; add APARTMENT/INQUIRY/etc. as those modules land
export const ENTITY_ROUTES = {
  PROMOTION: () => "/promotions",
};
