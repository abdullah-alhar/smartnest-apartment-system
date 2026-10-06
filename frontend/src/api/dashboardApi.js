import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/dashboard";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getDashboardSummary = async () => {
  const response = await axios.get(`${API_BASE_URL}/summary`, { headers: authHeader() });
  return response.data;
};
