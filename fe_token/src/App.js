import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import './App.css';
import { AuthContext, AuthProvider } from './components/hooks/AuthContext';
import { ToastProvider } from './components/hooks/ToastContext';  // ← ADD
import Listing from './components/pages/public/Listing';
import ProfileDetails from './components/pages/public/ProfileDetails';
import SignIn from './components/pages/public/SignIn';
import Signup from './components/pages/public/Signup';
import TermsAndConditions from './components/pages/public/TermsAndConditions';
import ContactUs from './components/pages/public/ContactUs';
import Footer from './components/templates/Footer';
import Header from './components/templates/Header';
import BottomNav from './components/templates/BottomNav';
import AdvanceSearch from "./components/pages/public/AdvanceSearch";
import Dashboard from "./components/pages/private/Dashboard";
import EditProfile from "./components/pages/private/EditProfile";
import ChangePassword from "./components/pages/private/ChangePassword";
import AddGallery from "./components/pages/private/AddGallery";
import ProfileSecurity from "./components/pages/private/ProfileSecurity";
import Messages from "./components/pages/private/Messages";
import ProtectedRoute from "./components/hooks/ProtectedRoute";
import CloseAccount from "./components/pages/private/CloseAccount";
 import ForgotPassword from "./components/pages/public/ForgotPassword";
   import Home from './components/pages/public/Home';
// Admin panel — separate shell (own routes, own axios, no public Header/Footer)
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import RequirePermission from "./components/admin/RequirePermission";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminUsers from "./components/admin/AdminUsers";
import AdminPhotos from "./components/admin/AdminPhotos";
import AdminMessagesList from "./components/admin/AdminMessagesList";
import AdminContactLimit from "./components/admin/AdminContactLimit";
import AdminEmailOtps from "./components/admin/AdminEmailOtps";
import AdminContactQueries from "./components/admin/AdminContactQueries";
import AdminBlockedUsers from "./components/admin/AdminBlockedUsers";
import Impersonate from "./components/admin/Impersonate";
import NotFound from "./components/pages/public/NotFound";
import Seo from "./components/seo/Seo";
import { ROUTE_SEO } from "./seo/siteConfig";

function App() {
  const authcontext=useContext(AuthContext)
  return (<>
    <AuthProvider> 
        <ToastProvider> 
    <Router>
        <Routes> 
          <Route path="/" element={<> <Seo {...ROUTE_SEO.home} /> <Header/> <Home/> <Footer/> </>} />
          <Route path="/signup" element={<><Seo {...ROUTE_SEO.signup} /><Header/><Signup /><Footer/></>} />
          <Route path="/login"  element={<><Seo {...ROUTE_SEO.login} /><Header/><SignIn /><Footer/></>} />
          <Route path="/profiles" element={<><Seo {...ROUTE_SEO.profiles} /><ProtectedRoute>
            <Header/><Listing /><Footer/>
              </ProtectedRoute></> } />
          <Route path="/profiledetails/:uid" element={<><Seo {...ROUTE_SEO.profileDetails} /><Header/><ProfileDetails /><Footer/></>} />
          <Route path="/advancesearch" element={<> <Seo {...ROUTE_SEO.advanceSearch} /> <ProtectedRoute>  <Header/> <AdvanceSearch />  <Footer/>  </ProtectedRoute> </>} />
          <Route path="/dashboard" element={<><Seo {...ROUTE_SEO.dashboard} /><ProtectedRoute>  <Header/><Dashboard /><Footer/>  </ProtectedRoute></> } />
          <Route path="/editprofile" element={<><Seo {...ROUTE_SEO.editProfile} /><ProtectedRoute>  <Header/> <EditProfile /> <Footer/>  </ProtectedRoute> </>} />
          <Route path="/changepassword" element={<><Seo {...ROUTE_SEO.changePassword} /><ProtectedRoute>  <Header/> <ChangePassword /> <Footer/>  </ProtectedRoute> </>} />
          <Route path="/closeaccount" element={
  <><Seo {...ROUTE_SEO.closeAccount} /><ProtectedRoute><Header/><CloseAccount /><Footer/></ProtectedRoute></>
} />
          <Route path="/addgallery" element={<><Seo {...ROUTE_SEO.addGallery} /><Header/><AddGallery /><Footer/></>} />
          <Route path="/profilesecurity" element={<><Seo {...ROUTE_SEO.profileSecurity} /><Header/><ProfileSecurity /><Footer/></>} />
          <Route path="/messages" element={<><Seo {...ROUTE_SEO.messages} /><Header/><Messages /><Footer/></>} /> 

<Route path="/forgotpassword" element={<><Seo {...ROUTE_SEO.forgotPassword} /><Header/><ForgotPassword /><Footer/></>} />
          <Route path="/terms-and-conditions" element={<><Seo {...ROUTE_SEO.terms} /><Header/><TermsAndConditions /><Footer/></>} />
          <Route path="/contact-us" element={<><Seo {...ROUTE_SEO.contact} /><Header/><ContactUs /><Footer/></>} />

          {/* Admin — separate shell, no public Header/Footer */}
          <Route path="/adminhub/matrimony/login" element={<><Seo {...ROUTE_SEO.adminLogin} /><AdminLogin /></>} />
          <Route path="/adminhub/matrimony" element={<><Seo {...ROUTE_SEO.admin} /><AdminProtectedRoute><AdminLayout /></AdminProtectedRoute></>}>
            <Route path="dashboard"    element={<AdminDashboard />} />
            <Route path="users"        element={<AdminUsers />} />
            <Route path="photos"       element={<AdminPhotos />} />
            <Route path="messageslist" element={<AdminMessagesList />} />
            <Route path="contact-limit" element={<RequirePermission permission="settings.contactLimit"><AdminContactLimit /></RequirePermission>} />
            <Route path="email-otps"   element={<RequirePermission permission="emailOtps.view"><AdminEmailOtps /></RequirePermission>} />
            <Route path="contact-queries" element={<AdminContactQueries />} />
            <Route path="blocked-users" element={<AdminBlockedUsers />} />
          </Route>

          {/* Public impersonation handler — mints user session from a one-time token */}
          <Route path="/impersonate" element={<><Seo {...ROUTE_SEO.impersonate} /><Impersonate /></>} />

          {/* 404 — must stay last */}
          <Route path="*" element={<><Seo {...ROUTE_SEO.notFound} /><Header/><NotFound /><Footer/></>} />
          </Routes>
        {/* Mobile-only fixed bottom navigation (hidden on desktop + admin) */}
        <BottomNav />
    </Router>
   </ToastProvider>  
    </AuthProvider></>
  );
}

export default App;
