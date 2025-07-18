import axios from 'axios';

const API_BASE = 'https://your-python-backend-url.com'; // Replace with real backend URL

export async function sendFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE}/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data;
}
