import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/apartments";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const createApartment = async (data) => {
  const response = await axios.post(API_BASE_URL, data, { headers: authHeader() });
  return response.data;
};

export const updateApartment = async (apartmentId, data) => {
  const response = await axios.put(`${API_BASE_URL}/${apartmentId}`, data, { headers: authHeader() });
  return response.data;
};

export const approveApartment = async (apartmentId, operationsManagerId) => {
  const response = await axios.put(
    `${API_BASE_URL}/${apartmentId}/approve`,
    null,
    { params: { operationsManagerId }, headers: authHeader() }
  );
  return response.data;
};

export const rejectApartment = async (apartmentId, operationsManagerId, reason) => {
  const response = await axios.put(
    `${API_BASE_URL}/${apartmentId}/reject`,
    null,
    { params: { operationsManagerId, reason }, headers: authHeader() }
  );
  return response.data;
};

export const markApartmentSold = async (apartmentId) => {
  const response = await axios.put(`${API_BASE_URL}/${apartmentId}/mark-sold`, null, { headers: authHeader() });
  return response.data;
};

export const getApprovedApartments = async ({ minPrice, maxPrice, roomCount } = {}) => {
  const response = await axios.get(API_BASE_URL, { params: { minPrice, maxPrice, roomCount } });
  return response.data;
};

export const getApartmentById = async (apartmentId) => {
  const response = await axios.get(`${API_BASE_URL}/${apartmentId}`);
  return response.data;
};

export const searchApartments = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null && v !== false));
  const response = await axios.get(`${API_BASE_URL}/search`, { params: clean });
  return response.data;
};

export const getPriceRange = async () => {
  const response = await axios.get(`${API_BASE_URL}/price-range`);
  return response.data;
};

export const getSimilarApartments = async (apartmentId) => {
  const response = await axios.get(`${API_BASE_URL}/${apartmentId}/similar`);
  return response.data;
};

export const getFeaturedApartments = async () => {
  const response = await axios.get(`${API_BASE_URL}/featured`);
  return response.data;
};

export const getApartmentForEdit = async (apartmentId) => {
  const response = await axios.get(`${API_BASE_URL}/${apartmentId}/manage`, { headers: authHeader() });
  return response.data;
};

export const getPendingApartments = async () => {
  const response = await axios.get(`${API_BASE_URL}/pending`, { headers: authHeader() });
  return response.data;
};

export const getMyApartments = async (staffId) => {
  const response = await axios.get(`${API_BASE_URL}/mine/${staffId}`, { headers: authHeader() });
  return response.data;
};

export const deleteApartment = async (apartmentId) => {
  await axios.delete(`${API_BASE_URL}/${apartmentId}`, { headers: authHeader() });
};

const API_ORIGIN = "http://localhost:8080";

/** Full address of an apartment photo, or null when the listing has none. */
export const apartmentImageSrc = (imageUrl) => (imageUrl ? `${API_ORIGIN}${imageUrl}` : null);

export const uploadApartmentImage = async (apartmentId, file) => {
  const form = new FormData();
  form.append("file", file);
  const response = await axios.post(`${API_BASE_URL}/${apartmentId}/image`, form, { headers: authHeader() });
  return response.data;
};

export const removeApartmentImage = async (apartmentId) => {
  const response = await axios.delete(`${API_BASE_URL}/${apartmentId}/image`, { headers: authHeader() });
  return response.data;
};
