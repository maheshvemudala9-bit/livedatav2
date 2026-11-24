// src/components/admin/AdminAuthContext.js
//
// Holds the logged-in admin ({username, name, role, permissions}) loaded from
// GET /adminhub/me by AdminProtectedRoute. `can(permission)` is false when the
// admin lacks it. The server enforces the same permissions; this only drives UI.

import { createContext, useContext } from 'react';

export const AdminAuthContext = createContext({ admin: null, can: () => false });

export const useAdminAuth = () => useContext(AdminAuthContext);
