import axios from 'axios';

// URL Construction Helper
// Removes trailing slash if present to avoid double slashes
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_URL = `${BASE_URL}/api`;

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/validate`, formData);
    return response.data;
};

export const compressFile = async (file, targetSize) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetSize', targetSize);
    const response = await axios.post(`${API_URL}/compress`, formData);
    return response.data;
};

export const mergeFiles = async (files) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const response = await axios.post(`${API_URL}/merge`, formData);
    return response.data;
};

export const renameFile = async (file, details) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(details).forEach(key => formData.append(key, details[key]));
    const response = await axios.post(`${API_URL}/rename`, formData);
    return response.data;
};
// ... existing exports ...

export const convertImagesToPdf = async (files) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const response = await axios.post(`${API_URL}/image-to-pdf`, formData);
    return response.data;
};

export const updateMetadata = async (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(metadata).forEach(key => formData.append(key, metadata[key]));
    const response = await axios.post(`${API_URL}/metadata`, formData);
    return response.data;
};

export const splitFile = async (file, pages) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pages', pages);
    const response = await axios.post(`${API_URL}/split`, formData);
    return response.data;
};

export const organiseFile = async (file, pageOrder) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pageOrder', pageOrder);
    const response = await axios.post(`${API_URL}/organise`, formData);
    return response.data;
};

export const rotateFile = async (file, rotations) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('rotations', JSON.stringify(rotations));
    const response = await axios.post(`${API_URL}/rotate`, formData);
    return response.data;
};

export const pdfToWord = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/pdf-to-word`, formData);
    return response.data;
};
