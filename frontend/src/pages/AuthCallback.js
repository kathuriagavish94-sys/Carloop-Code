import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/');
      return;
    }

    const exchangeSession = async () => {
      try {
        const response = await axios.post(
          `${API}/customer/auth/session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true,
          }
        );
        
        navigate('/dashboard', { state: { user: response.data }, replace: true });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/');
      }
    };

    exchangeSession();
  }, [navigate, location.hash]);

  return (
    <div className="min-h-screen bg-ceramic flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
        <p className="font-manrope text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
};