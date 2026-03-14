import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Auth
export const register = (data) => axios.post(`${API}/auth/register`, data);
export const login = (data) => axios.post(`${API}/auth/login`, data);
export const getMe = () => axios.get(`${API}/auth/me`);
export const forgotPassword = (email) => axios.post(`${API}/auth/forgot-password`, { email });
export const resetPassword = (token, password) => axios.post(`${API}/auth/reset-password`, { token, password });

// Properties (Django REST Framework needs trailing slashes for viewsets)
export const getProperties = () => axios.get(`${API}/properties/`);
export const getProperty = (id) => axios.get(`${API}/properties/${id}/`);
export const createProperty = (data) => axios.post(`${API}/properties/`, data);
export const updateProperty = (id, data) => axios.put(`${API}/properties/${id}/`, data);
export const deleteProperty = (id) => axios.delete(`${API}/properties/${id}/`);

// Users
export const getUsers = (role) => axios.get(`${API}/users/`, { params: { role } });
export const getUser = (id) => axios.get(`${API}/users/${id}/`);
export const createUser = (data) => axios.post(`${API}/users/`, data);
export const deleteUser = (id) => axios.delete(`${API}/users/${id}/`);

// Leases
export const getLeases = () => axios.get(`${API}/leases/`);
export const getLease = (id) => axios.get(`${API}/leases/${id}/`);
export const createLease = (data) => axios.post(`${API}/leases/`, data);
export const updateLease = (id, data) => axios.put(`${API}/leases/${id}/`, data);
export const deleteLease = (id) => axios.delete(`${API}/leases/${id}/`);

// Rents
export const getRents = () => axios.get(`${API}/rents/`);
export const createRent = (data) => axios.post(`${API}/rents/`, data);
export const updateRent = (id, data) => axios.put(`${API}/rents/${id}/`, data);

// Complaints
export const getComplaints = () => axios.get(`${API}/complaints/`);
export const createComplaint = (data) => axios.post(`${API}/complaints/`, data);
export const updateComplaint = (id, data) => axios.put(`${API}/complaints/${id}/`, data);

// Notifications
export const getNotifications = () => axios.get(`${API}/notifications/`);
export const markNotificationRead = (id) => axios.put(`${API}/notifications/${id}/read/`);
export const markAllNotificationsRead = () => axios.put(`${API}/notifications/read-all/`);

// Dashboard (non-viewset endpoints don't need trailing slash)
export const getDashboardStats = () => axios.get(`${API}/dashboard/stats`);
