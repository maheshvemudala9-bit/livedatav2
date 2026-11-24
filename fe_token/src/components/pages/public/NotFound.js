import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="inner-content">
    <div className="container" style={{ textAlign: 'center', padding: '60px 15px' }}>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or has moved.</p>
      <Link to="/">Back to home</Link>
    </div>
  </div>
);

export default NotFound;
