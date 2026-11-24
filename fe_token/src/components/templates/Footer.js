import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';

import logoWhite from '../../assets/images/logo/logo-white-trim.png';
import  logos from "../../components/templates/ImagesLoader"

const Footer = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
    {/*  <!--Footer Start--> */}
    <div className="footer-wrap">
      <div className="container">
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <div className="ftabout"> 
              {/* <img src={logos.logo} alt=""/> */}
             <img src={logoWhite} width="602" height="148" alt="TeluguSambandham – Telugu Matrimony" loading="lazy" />
              <p>Exclusive Launch Offer — Register free and be among the first to find your perfect Telugu match. A safe, secure matrimony platform built with love for Telugu families.</p>
              {/* <ul className="socialLinks">
                <li><a href="#" onClick={(e) => e.preventDefault()} title="Facebook"><i className="fab fa-facebook-f"></i></a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} title="Twitter"><i className="fab fa-twitter"></i></a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} title="Google+"><i className="fab fa-instagram"></i></a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} title="Whatsapp"><i className="fab fa-google-plus-g"></i></a></li>
              </ul> */}
            </div>
          </div>
          {!isMobile && (
          <div className="col-lg-3 col-md-6">
            <h3>Site Links</h3>
            <ul className="footernav">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/signup">Register Free</Link></li>
              {/* <li><a href="#" onClick={(e) => e.preventDefault()}>About Us</a></li> */}
              <li><Link to="/contact-us">Contact Us</Link></li>
              <li><Link to="/terms-and-conditions">Terms &amp; Conditions</Link></li>
              {/* <li><a href="#" onClick={(e) => e.preventDefault()}>FAQs</a></li> */}
            </ul>
          </div>
          )}
          {/* <div className="col-lg-3 col-md-6">
            <h3>Wedding Services</h3>
            <ul className="footernav">
              <li><a href="#" onClick={(e) => e.preventDefault()}>Search Bride</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Search Groom</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Profile Tips</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Security Tips</a></li>
            </ul>
          </div> */}
          <div className="col-lg-3 col-md-6">
            <h3>Contact Us</h3>
            <ul className="footer-adress">
              <li className="footer_email"><i className="fas fa-map-marker-alt"></i><span> Kukatpally & Alwal, Hyderabad, Telangana, India</span></li>
              {/* <li className="footer-phone"><i className="fas fa-phone-alt"></i><span><a href="tel:">(91) 9666633948</a></span></li> */}
            </ul>
          </div>
        </div>
      </div>
    </div>
    {/* <!--Footer End-->  */}
    
    {/* <!--Copyright Start--> */}
    <div className="copyright-wrap">
      <div className="container">
        <div className="row">
          <div className="col-lg-6 col-md-6">
            <div className="copyight">Copyright © 2026 Telugu Sambandham. All rights reserved.</div>
          </div>
          <div className="col-lg-6 col-md-6">
            <div className="policy"><Link to="/contact-us">Contact Us</Link> &nbsp;·&nbsp; <Link to="/terms-and-conditions">Terms &amp; Conditions</Link></div>
            {/* <div className="policy">Design and Developed by: <a href="#" onClick={(e) => e.preventDefault()}>Mahesh</a></div> */}
          </div>
        </div>
      </div>
    </div>
    {/* <!--Copyright End-->  */}
    </>
  )
}

export default Footer