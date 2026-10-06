import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/users";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getMyProfile = async () => {
  const response = await axios.get(`${API_BASE_URL}/me`, { headers: authHeader() });
  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await axios.put(`${API_BASE_URL}/me`, data, { headers: authHeader() });
  return response.data;
};

export const changeMyPassword = async (data) => {
  const response = await axios.put(`${API_BASE_URL}/me/password`, data, { headers: authHeader() });
  return response.data;
};
