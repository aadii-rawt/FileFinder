import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Your backend server
  withCredentials: false,
});

export default instance;
