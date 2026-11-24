// src/components/admin/AdminProtectedRoute.js
//
// Gate for all admin pages. On mount it calls GET /adminhub/me (the admin
// instance carries the adminToken cookie). While the check is pending it shows a
// minimal "Checking…" state; on success it renders its children; on failure it
// redirects to the admin login. Uses LOCAL component state only — admin auth is
// completely separate from the user AuthContext.

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import adminApi from './adminApi';
import { AdminAuthContext } from './AdminAuthContext';
import '../../assets/css/pages/admin.css';

const AdminProtectedRoute = ({ children }) => {
  // 'pending' | 'ok' | 'fail'
  const [authState, setAuthState] = useState('pending');
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const { data } = await adminApi.get('/adminhub/me');
        if (!active) return;
        if (data.status === 'Success') {
          setAdmin(data.data || null);
          setAuthState('ok');
        } else {
          setAuthState('fail');
        }
      } catch (err) {
        // 401 (no interceptor on adminApi) or any error -> not authenticated
        if (active) setAuthState('fail');
      }
    };

    checkAuth();
    return () => {
      active = false;
    };
  }, []);

  if (authState === 'pending') {
    return (
      <div className="adm-loader-page">
        <div className="adm-loader-card">
          <div className="adm-spinner" aria-hidden="true" />
          <div className="adm-loader-card__text">Checking…</div>
        </div>
      </div>
    );
  }

  if (authState === 'fail') {
    return <Navigate to="/adminhub/matrimony/login" replace />;
  }

  const permissions = admin?.permissions || [];
  const value = { admin, can: (permission) => permissions.includes(permission) };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export default AdminProtectedRoute;
