// src/components/admin/RequirePermission.js
//
// Route guard: renders children only when the admin holds `permission`;
// otherwise shows a short access message instead of loading the page.

import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';
import '../../assets/css/pages/admin.css';

const RequirePermission = ({ permission, children }) => {
  const { can } = useAdminAuth();
  if (can(permission)) return children;
  return (
    <div>
      <h1 className="adm-page-title">Access denied</h1>
      <p>You don't have access to this page.</p>
      <Link to="/adminhub/matrimony/dashboard" className="adm-btn adm-btn--dark">Back to dashboard</Link>
    </div>
  );
};

export default RequirePermission;
