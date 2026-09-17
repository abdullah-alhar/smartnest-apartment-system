import axios from "axios";

const ADMIN_BASE = "http://localhost:8080/api/admin";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// department is left out of the payload on purpose — backend just saves it as null
export const createStaff = async (staffData) => {
  const response = await axios.post(
    `${ADMIN_BASE}/create-staff`,
    staffData,
    { headers: authHeader() }
  );
  return response.data;
};

export const listAllUsers = async () => {
  const response = await axios.get(`${ADMIN_BASE}/users`, { headers: authHeader() });
  return response.data;
};

export const deactivateUser = async (userId) => {
  const response = await axios.put(`${ADMIN_BASE}/users/${userId}/deactivate`, null, { headers: authHeader() });
  return response.data;
};

export const reactivateUser = async (userId) => {
  const response = await axios.put(`${ADMIN_BASE}/users/${userId}/reactivate`, null, { headers: authHeader() });
  return response.data;
};
