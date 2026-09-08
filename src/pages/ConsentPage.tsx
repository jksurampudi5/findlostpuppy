import React, { useState, useEffect } from 'react';
import { LegalModal } from '../components/LegalModal';

interface ConsentPageProps {
  onConsentAgreed: () => void;
}

export const ConsentPage: React.FC<ConsentPageProps> = ({ onConsentAgreed }) => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [activeModalDocId, setActiveModalDocId] = useState<
    'terms' | 'privacy' | 'disclaimer' | 'guidelines' | null
  >(null);

  // Ensure user is scrolled to top on initial mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleContinue = () => {
    if (!hasAgreed) return;
    onConsentAgreed();
  };

  return (
    <div className="consent-page-wrapper">
      {/* Top Banner / Brand */}
      <header className="consent-header">
        <div className="consent-header-content">
          <div className="consent-brand-row">
            <span className="consent-logo-icon">🐾</span>
            <div className="consent-brand-title">
              <h1>FIND LOST PUPPY</h1>
              <span className="consent-brand-tagline">
                Community Pet Reunion Bulletin & Missing Dog Information Platform
              </span>
            </div>
          </div>
          <div className="consent-legal-ref">
            <span>Ref: <strong>FLP-CONSENT-FORM-v1.0</strong></span>
            <span>Effective: <strong>September 2026</strong></span>
            <span className="badge-mandatory">Mandatory Pre-Sign In Declaration</span>
          </div>
        </div>
      </header>

      <main className="consent-main-container">
        {/* Document Frame / Legal Agreement Paper Container */}
        <article className="consent-document-paper" aria-labelledby="consent-title">
          {/* Document Title & Subtitle */}
          <div className="consent-doc-heading-block">
            <div className="doc-seal">📜 OFFICIAL PLATFORM DECLARATION</div>
            <h2 id="consent-title">🐾 Before You Continue</h2>
            <p className="consent-subtitle">
              Please read and understand how Find Lost Puppy works before signing in.
            </p>
          </div>

          {/* Critical Highlight Notice */}
          <div className="critical-notice-banner" role="alert">
            <div className="notice-icon">⚠️</div>
            <div className="notice-text">
              <strong>CRITICAL NOTICE: ZERO LIABILITY & STRICT DIGITAL-ONLY PLATFORM</strong>
              <p>
                Find Lost Puppy is exclusively an information-sharing platform designed to help
                people upload, view and search photographs and information about missing dogs.
                Neither the application developers, owners, operators, hosting providers, nor any
                guest users, finders, sighting reporters, or volunteers assume any legal liability,
                responsibility, or duty of care whatsoever for any dog, person, location, injury,
                or event.
              </p>
            </div>
          </div>

          {/* SECTION 1: What the App Does */}
          <section className="consent-section-card" aria-labelledby="sec-does">
            <div className="section-header-row">
              <span className="section-icon">🐶</span>
              <h3 id="sec-does">1. What Find Lost Puppy Does</h3>
            </div>
            <div className="section-body">
              <p className="section-intro">
                Find Lost Puppy operates solely as a passive digital bulletin board and communication medium:
              </p>
              <ul className="consent-bullets">
                <li>• Allows users to upload photographs of missing dogs.</li>
                <li>• Allows users to provide information about missing dogs.</li>
                <li>• Allows users to provide an area/location where a dog was reported missing or last seen.</li>
                <li>• Allows other users to search and view missing-dog information.</li>
                <li>• Helps users discover missing-dog reports based on available information and nearby areas.</li>
                <li>• Provides a digital platform only.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 2: What We Do NOT Do (Non-Responsibility) */}
          <section className="consent-section-card card-alert" aria-labelledby="sec-not">
            <div className="section-header-row">
              <span className="section-icon">🚫</span>
              <h3 id="sec-not">2. What We Do NOT Do (Neither Developers Nor Guest Users)</h3>
            </div>
            <div className="section-body">
              <p className="section-intro text-danger-bold">
                Neither the app developers, platform, nor any guest users are responsible for anything. We explicitly disclaim:
              </p>
              <div className="disclaimer-grid">
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not physically search for dogs.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not rescue dogs.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not catch dogs.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not take custody of dogs.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not keep or shelter dogs.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not transport dogs.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not provide veterinary care.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not guarantee that a dog will be found.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not guarantee that a dog will be returned to its owner.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not guarantee the safety, health or future welfare of any dog.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not determine legal ownership of a dog.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not guarantee that a person claiming to be the owner is the actual owner.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We do not guarantee the accuracy of every photograph, description or location uploaded by users.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We are not a police service or legal service.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We are not an emergency service or veterinary hospital.</span>
                </div>
                <div className="disclaimer-item">
                  <span className="disclaimer-x">✕</span>
                  <span>We are not a professional animal-rescue organization.</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: All Dog Problems Disclaimed */}
          <section className="consent-section-card" aria-labelledby="sec-dog-problems">
            <div className="section-header-row">
              <span className="section-icon">🐕</span>
              <h3 id="sec-dog-problems">3. Important: About the Dog & Dog Problems Disclaimed</h3>
            </div>
            <div className="section-body">
              <div className="quote-callout">
                <strong>Find Lost Puppy does not take physical custody or responsibility for any dog listed on the platform.</strong>
              </div>
              <p>
                The application does not control what happens to a dog before, during or after a listing is viewed.
                Neither the platform developers nor guest users are responsible for any dog problems, including:
              </p>
              <ul className="consent-bullets">
                <li>• <strong>Dog Bites, Attacks & Aggression:</strong> An unfamiliar dog may be terrified, aggressive, or diseased (including rabies). Neither developers nor guest users are liable if a dog attacks or injures any adult, child, or other animal.</li>
                <li>• <strong>Accidents, Injuries & Death:</strong> Neither developers nor guest users are responsible if a dog is hit by a vehicle, injured, poisoned, or dies before, during, or after being reported.</li>
                <li>• <strong>Third-Party Retention:</strong> If a finder, stranger, or guest takes a dog, keeps it, sells it, or refuses to return it, the platform has no custody or control over third parties.</li>
                <li>• <strong>Veterinary Care:</strong> Whether the dog receives medical care, food, or shelter is an independent matter between the people involved.</li>
                <li>• <strong>Independent Decision:</strong> Any physical assistance, care, transportation, meeting or handover is independently decided and undertaken at personal risk.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 4: Location Disclaimer */}
          <section className="consent-section-card" aria-labelledby="sec-loc">
            <div className="section-header-row">
              <span className="section-icon">📍</span>
              <h3 id="sec-loc">4. About Dog Locations</h3>
            </div>
            <div className="section-body">
              <p className="section-intro">
                Do not treat a displayed location as the dog's guaranteed current position:
              </p>
              <ul className="consent-bullets">
                <li>• A location shown represents the location provided or detected when the report was created.</li>
                <li>• A dog's location can change at any time.</li>
                <li>• A dog may no longer be at the displayed location.</li>
                <li>• The displayed location may be approximate.</li>
                <li>• GPS or user-provided information may be inaccurate or outdated.</li>
                <li>• Find Lost Puppy cannot guarantee that a dog is currently at the displayed location.</li>
                <li>• Users must independently verify information before taking action or traveling.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 5: Photos & User Information */}
          <section className="consent-section-card" aria-labelledby="sec-photos">
            <div className="section-header-row">
              <span className="section-icon">📸</span>
              <h3 id="sec-photos">5. Photos & Information</h3>
            </div>
            <div className="section-body">
              <ul className="consent-bullets">
                <li>• Photos and information are submitted by users.</li>
                <li>• Users are responsible for the content they upload.</li>
                <li>• Users must have the necessary rights or permission to upload photographs.</li>
                <li>• Users must not intentionally upload false or misleading information.</li>
                <li>• Find Lost Puppy does not guarantee that every uploaded photograph or description is accurate.</li>
                <li>• Find Lost Puppy does not guarantee that the person submitting a report is the actual owner of the dog.</li>
                <li>• Information may become outdated.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 6: User Responsibility */}
          <section className="consent-section-card" aria-labelledby="sec-user-resp">
            <div className="section-header-row">
              <span className="section-icon">👤</span>
              <h3 id="sec-user-resp">6. Your Responsibility</h3>
            </div>
            <div className="section-body">
              <p className="section-intro">
                By using Find Lost Puppy, you explicitly acknowledge and agree:
              </p>
              <ul className="consent-bullets">
                <li>• I am responsible for information and photographs that I upload.</li>
                <li>• I am responsible for my own actions.</li>
                <li>• I am responsible for my decisions based on information shown in the application.</li>
                <li>• I am responsible for my communication and interactions with other users.</li>
                <li>• I will independently verify information before taking action.</li>
                <li>• I will follow applicable laws.</li>
                <li>• I will use the application only for its intended purpose.</li>
                <li>• I will not intentionally provide false information.</li>
                <li>• I will not falsely claim ownership of a dog.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 7: User-to-User Interactions */}
          <section className="consent-section-card" aria-labelledby="sec-interactions">
            <div className="section-header-row">
              <span className="section-icon">🤝</span>
              <h3 id="sec-interactions">7. Interactions With Other Users</h3>
            </div>
            <div className="section-body">
              <p className="section-intro">
                Find Lost Puppy provides the platform only. The application does not guarantee:
              </p>
              <ul className="consent-bullets">
                <li>• Identity of another user.</li>
                <li>• Ownership of a dog.</li>
                <li>• Accuracy of another user's information.</li>
                <li>• Safety of a meeting.</li>
                <li>• Behavior or intentions of another user.</li>
                <li>• Any agreement between users.</li>
                <li>• Any pet handover.</li>
                <li>• Any financial arrangement between users.</li>
              </ul>
              <div className="safety-tip-box">
                💡 <strong>Safety Notice:</strong> If users communicate, meet, exchange information, assist with a dog, arrange transportation or hand over a dog, those actions are independently undertaken by the users. Always meet in safe, public places and independently verify proof of ownership (vet records, municipal registrations, collar tags).
              </div>
            </div>
          </section>

          {/* SECTION 8: Prohibited Use */}
          <section className="consent-section-card card-alert" aria-labelledby="sec-prohibited">
            <div className="section-header-row">
              <span className="section-icon">🚫</span>
              <h3 id="sec-prohibited">8. You Must Not Use This App For</h3>
            </div>
            <div className="section-body">
              <ul className="consent-bullets">
                <li>• Criminal activity, fraud, harassment, threats, or stalking.</li>
                <li>• Impersonation, false ownership claims, or extortion.</li>
                <li>• Abuse, privacy violations, or malicious sharing of personal information.</li>
                <li>• Illegal transactions, buying/selling animals, or commercial solicitation.</li>
                <li>• Deliberately misleading other users or filing fabricated sighting reports.</li>
                <li>• Any activity prohibited by applicable law.</li>
              </ul>
              <p className="prohibited-subtext">
                The application may remove content, restrict accounts, or suspend/terminate accounts in accordance with applicable law and community safety policies.
              </p>
            </div>
          </section>

          {/* SECTION 9: Legal, Police & Emergency Disclaimers */}
          <section className="consent-section-card" aria-labelledby="sec-legal-police">
            <div className="section-header-row">
              <span className="section-icon">⚖️</span>
              <h3 id="sec-legal-police">9. Legal, Official & Emergency Matters</h3>
            </div>
            <div className="section-body">
              <div className="two-column-disclaimer">
                <div className="disclaimer-subcard">
                  <h4>⚖️ Legal & Official Notice</h4>
                  <p>
                    Find Lost Puppy is not a police, law-enforcement, legal, court, investigation, veterinary or emergency service.
                    The application does not provide legal advice or legal representation.
                    Users must not represent Find Lost Puppy as a government, police, legal, veterinary, rescue or emergency organization.
                  </p>
                </div>
                <div className="disclaimer-subcard">
                  <h4>🚨 Emergency Situations</h4>
                  <p>
                    <strong>Find Lost Puppy is not an emergency-response service.</strong>
                    If a situation involves immediate danger to a person, animal or property, users should contact the appropriate emergency, veterinary, animal-welfare or law-enforcement service immediately.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Full Legal Policy Review Buttons */}
          <div className="legal-policy-access-section">
            <span className="policy-access-title">
              Read Complete Legal Policies & Framework Documents:
            </span>
            <div className="policy-buttons-row">
              <button
                type="button"
                className="policy-open-btn"
                onClick={() => setActiveModalDocId('terms')}
              >
                📄 Terms & Conditions (16 Sections)
              </button>
              <button
                type="button"
                className="policy-open-btn"
                onClick={() => setActiveModalDocId('privacy')}
              >
                🔒 Privacy Policy
              </button>
              <button
                type="button"
                className="policy-open-btn"
                onClick={() => setActiveModalDocId('disclaimer')}
              >
                ⚖️ Platform Disclaimer
              </button>
              <button
                type="button"
                className="policy-open-btn"
                onClick={() => setActiveModalDocId('guidelines')}
              >
                📋 User Guidelines
              </button>
            </div>
          </div>

          {/* Form Declaration & Checkbox Acknowledgment */}
          <div className="consent-declaration-box">
            <div className="declaration-header">
              <span className="declaration-badge">REQUIRED FORM SIGNATURE / DECLARATION</span>
              <h3>Solemn Acknowledgment & User Agreement</h3>
            </div>

            <label className={`consent-checkbox-label ${hasAgreed ? 'is-checked' : ''}`}>
              <input
                type="checkbox"
                id="consent-acknowledgment-checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="consent-checkbox-input"
                aria-required="true"
              />
              <span className="consent-checkbox-custom" aria-hidden="true"></span>
              <span className="consent-checkbox-text">
                <strong>
                  I have read, understood and agree to all conditions, disclaimers, and policies above,
                  including the Find Lost Puppy Terms & Conditions, Privacy Policy, Disclaimer and User
                  Guidelines. I understand and agree that neither the app developers, platform operators,
                  nor any guest users are responsible or liable for anything regarding any dog, location,
                  listing, meeting, injury, or outcome, and that I am solely responsible for my own
                  actions, information, decisions, and interactions with other users.
                </strong>
              </span>
            </label>

            <div className="consent-action-footer">
              <button
                type="button"
                id="agree-continue-button"
                className={`btn-agree-continue ${hasAgreed ? 'enabled' : 'disabled'}`}
                disabled={!hasAgreed}
                onClick={handleContinue}
                aria-disabled={!hasAgreed}
              >
                {hasAgreed ? (
                  <>
                    <span>Agree & Continue to Sign In</span>
                    <span className="arrow-icon">→</span>
                  </>
                ) : (
                  <>
                    <span className="lock-icon">🔒</span>
                    <span>Please Check Agreement Box to Continue</span>
                  </>
                )}
              </button>
              <p className="consent-stamp-note">
                ✓ Clicking Agree & Continue records your consent version (v1.0) and unlocks email authentication.
              </p>
            </div>
          </div>
        </article>
      </main>

      {/* Embedded Legal Document Viewer Modal */}
      <LegalModal
        documentId={activeModalDocId}
        onClose={() => setActiveModalDocId(null)}
      />
    </div>
  );
};
