import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Shield, Heart, MapPin, Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="app-container footer-content">
        <div className="footer-grid">
          {/* Brand & Mission */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <div className="footer-paw-icon">
                <PawPrint size={22} />
              </div>
              <span className="footer-title">FindLostPuppy</span>
            </div>
            <p className="footer-mission">
              "Every paw deserves to find its way home."
              A compassionate, community-powered network connecting loving pet owners with watchful neighbors.
            </p>
            <div className="footer-trust-badge">
              <Shield size={16} className="trust-icon" />
              <span>Private addresses & GPS coordinates are never exposed publicly.</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="footer-col">
            <h4 className="footer-heading">Community Network</h4>
            <ul className="footer-links">
              <li>
                <Link to="/find">
                  <Compass size={15} />
                  <span>Browse Lost Dogs</span>
                </Link>
              </li>
              <li>
                <Link to="/report">
                  <PawPrint size={15} />
                  <span>Report a Lost Dog</span>
                </Link>
              </li>
              <li>
                <Link to="/find?status=SIGHTED">
                  <MapPin size={15} />
                  <span>Recent Sightings</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Immediate Steps Guidance */}
          <div className="footer-col guidance-col">
            <h4 className="footer-heading">
              <Heart size={16} />
              <span>Lost Pup Quick Steps</span>
            </h4>
            <ol className="guidance-list">
              <li>Post a report with your pup’s distinct characteristics.</li>
              <li>Leave a worn t-shirt or familiar blanket near the last seen location.</li>
              <li>Check nearby local parks, food stalls, and animal shelters.</li>
              <li>Ask neighbors to keep eyes out for sightings on this portal.</li>
            </ol>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 FindLostPuppy 🐾 Community Initiative. Designed with love for pups everywhere.</p>
          <div className="footer-bottom-links">
            <span className="privacy-pill">Privacy First Platform</span>
            <span>Mobile-First Experience</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
