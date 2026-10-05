import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/inquiries";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const createInquiry = async (data) => {
  const response = await axios.post(API_BASE_URL, data, { headers: authHeader() });
  return response.data;
};

export const getCustomerInquiries = async (customerId) => {
  const response = await axios.get(`${API_BASE_URL}/customer/${customerId}`, { headers: authHeader() });
  return response.data;
};

export const getNewInquiries = async () => {
  const response = await axios.get(`${API_BASE_URL}/new`, { headers: authHeader() });
  return response.data;
};

export const getCROInquiries = async (croId) => {
  const response = await axios.get(`${API_BASE_URL}/cro/${croId}`, { headers: authHeader() });
  return response.data;
};

export const getAllInquiries = async () => {
  const response = await axios.get(API_BASE_URL, { headers: authHeader() });
  return response.data;
};

export const claimInquiry = async (inquiryId) => {
  const response = await axios.put(`${API_BASE_URL}/${inquiryId}/claim`, null, { headers: authHeader() });
  return response.data;
};

export const respondToInquiry = async (inquiryId, reply) => {
  const response = await axios.put(`${API_BASE_URL}/${inquiryId}/respond`, { reply }, { headers: authHeader() });
  return response.data;
};

export const closeInquiry = async (inquiryId) => {
  const response = await axios.put(`${API_BASE_URL}/${inquiryId}/close`, null, { headers: authHeader() });
  return response.data;
};

export const updateInquiry = async (inquiryId, question) => {
  const response = await axios.put(`${API_BASE_URL}/${inquiryId}`, { question }, { headers: authHeader() });
  return response.data;
};

export const deleteInquiry = async (inquiryId) => {
  await axios.delete(`${API_BASE_URL}/${inquiryId}`, { headers: authHeader() });
};
