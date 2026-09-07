import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, PlusCircle, Search, ShieldCheck, Heart, Users, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import type { LostReport } from '../types';
import { storageService } from '../services/storageService';
import { DogCard } from '../components/DogCard';

export const HomePage: React.FC = () => {
  const [reports, setReports] = useState<LostReport[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LOST' | 'SIGHTED' | 'REUNITED'>('ALL');

  useEffect(() => {
    const all = storageService.getAllReports();
    setReports(all);
  }, []);

  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'ALL') return true;
    return r.status === activeFilter;
  });

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="app-container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} className="badge-sparkle" />
              <span>Community-Powered Pet Rescue Network</span>
            </div>

            <h1 className="hero-title">
              Help Bring Lost Dogs <span className="highlight-text">Home</span> 🐾
            </h1>

            <p className="hero-subtitle">
              "Every paw deserves to find its way home."
              When a beloved dog goes missing, every second counts. Connect with caring neighbors, share real-time sightings, and safely reunite families.
            </p>

            <div className="hero-cta-group">
              <Link to="/report" className="btn btn-primary btn-lg hero-cta-primary">
                <PlusCircle size={20} />
                <span>Report a Lost Dog</span>
              </Link>
              <Link to="/find" className="btn btn-outline btn-lg hero-cta-secondary">
                <Search size={20} />
                <span>Find a Lost Dog</span>
              </Link>
            </div>

            <div className="hero-guarantees">
              <div className="guarantee-item">
                <ShieldCheck size={16} />
                <span>100% Address Privacy</span>
              </div>
              <div className="guarantee-item">
                <Heart size={16} />
                <span>Free & Community-Driven</span>
              </div>
              <div className="guarantee-item">
                <Users size={16} />
                <span>Active Local Alerts</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-dog-card-featured">
                <img
                  src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80"
                  alt="Bruno the Golden Retriever"
                  className="hero-dog-img"
                />
                <div className="hero-card-floating-badge">
                  <span className="pulse-dot" />
                  <span>LOST: Bruno (Vijayawada)</span>
                </div>
                <div className="hero-card-sighting-tag">
                  <span>🐾 2 Community Sightings Reported</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="stats-bar">
        <div className="app-container stats-grid">
          <div className="stat-card">
            <span className="stat-number">1,420+</span>
            <span className="stat-label">Pups Safely Reunited</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">8,900+</span>
            <span className="stat-label">Watchful Neighbors</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">15 min</span>
            <span className="stat-label">Average First Sighting Alert</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">100%</span>
            <span className="stat-label">Owner Privacy Protection</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="app-container">
          <div className="section-header text-center">
            <div className="section-eyebrow">
              <PawPrint size={16} />
              <span>Simple 4-Step Journey</span>
            </div>
            <h2 className="section-title">How FindLostPuppy Works</h2>
            <p className="section-subtitle">
              Designed specifically so any pet owner in distress can post in minutes, with zero technical complexity.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number-bubble">1</div>
              <div className="step-icon-wrapper step-icon-orange">
                <PlusCircle size={28} />
              </div>
              <h3 className="step-title">1. Report Your Pup</h3>
              <p className="step-desc">
                Log in and share your dog's photos, collar details, breed, and distinct marks in two simple chapters.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number-bubble">2</div>
              <div className="step-icon-wrapper step-icon-sage">
                <MapPin size={28} />
              </div>
              <h3 className="step-title">2. Share Safe Area</h3>
              <p className="step-desc">
                Select where they were last seen. We compute a privacy-safe approximate area without exposing your home address.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number-bubble">3</div>
              <div className="step-icon-wrapper step-icon-blue">
                <Users size={28} />
              </div>
              <h3 className="step-title">3. Community Watches</h3>
              <p className="step-desc">
                Nearby neighbors, shop owners, and volunteers receive alerts and report visual sightings with photos.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number-bubble">4</div>
              <div className="step-icon-wrapper step-icon-green">
                <Heart size={28} />
              </div>
              <h3 className="step-title">4. Safe Reunion</h3>
              <p className="step-desc">
                Review verified sightings on your dashboard and coordinate safe handoff to bring your furry family home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Lost Dogs Section */}
      <section className="recent-dogs-section">
        <div className="app-container">
          <div className="section-header-flex">
            <div>
              <div className="section-eyebrow">
                <Search size={16} />
                <span>Urgent Community Attention</span>
              </div>
              <h2 className="section-title">Recent Lost Dogs Needing Eyes</h2>
            </div>

            {/* Filter Pills */}
            <div className="filter-pill-group">
              <button
                className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveFilter('ALL')}
              >
                All Dogs ({reports.length})
              </button>
              <button
                className={`filter-pill ${activeFilter === 'LOST' ? 'active' : ''}`}
                onClick={() => setActiveFilter('LOST')}
              >
                Lost
              </button>
              <button
                className={`filter-pill ${activeFilter === 'SIGHTED' ? 'active' : ''}`}
                onClick={() => setActiveFilter('SIGHTED')}
              >
                Sighted
              </button>
              <button
                className={`filter-pill ${activeFilter === 'REUNITED' ? 'active' : ''}`}
                onClick={() => setActiveFilter('REUNITED')}
              >
                Reunited ❤️
              </button>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="empty-state-card">
              <PawPrint size={48} className="empty-icon" />
              <h3>No lost pups under this status right now</h3>
              <p>Keep your eyes open in your neighborhood, or report a sighting if you spot a wandering dog.</p>
            </div>
          ) : (
            <div className="dogs-grid">
              {filteredReports.slice(0, 6).map((report) => (
                <DogCard key={report.id} report={report} />
              ))}
            </div>
          )}

          <div className="view-all-row">
            <Link to="/find" className="btn btn-outline btn-lg">
              <span>Browse All Lost Dogs Across Regions</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Community Callout Banner */}
      <section className="community-banner-section">
        <div className="app-container">
          <div className="community-banner-card">
            <div className="banner-text">
              <h2 className="banner-title">"One sighting can make all the difference."</h2>
              <p className="banner-desc">
                If you see a dog wandering without an owner, snap a photo and record the location. You might be the hero who brings someone's best friend home today.
              </p>
            </div>
            <div className="banner-cta">
              <Link to="/find" className="btn btn-primary btn-lg">
                <Search size={20} />
                <span>Search by Neighborhood</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
