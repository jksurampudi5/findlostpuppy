import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PawPrint,
  User as UserIcon,
  MapPin,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LocationPicker } from '../components/LocationPicker';
import { ImageUploader } from '../components/ImageUploader';
import { storageService } from '../services/storageService';
import type { DogGender, DogSize, ContactMethod, OwnerProfile, DogProfile, LostReport } from '../types';

export const ReportWizardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [createdReportId, setCreatedReportId] = useState<string>('');

  // ----------------------------------------------------
  // CHAPTER 1: OWNER DETAILS
  // ----------------------------------------------------
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContact, setPreferredContact] = useState<ContactMethod>('phone');

  // Location fields
  const [state, setState] = useState('Andhra Pradesh');
  const [district, setDistrict] = useState('Vijayawada');
  const [mandalOrMunicipality, setMandalOrMunicipality] = useState('');
  const [streetOrLocality, setStreetOrLocality] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [privateAddress, setPrivateAddress] = useState('');
  const [hasLocationConsent, setHasLocationConsent] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [approximateArea, setApproximateArea] = useState('Near Benz Circle, Vijayawada');

  // ----------------------------------------------------
  // CHAPTER 2: DOG DETAILS & PHOTOS
  // ----------------------------------------------------
  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<DogGender>('Male');
  const [age, setAge] = useState('');
  const [size, setSize] = useState<DogSize>('Medium (10-25kg)');
  const [color, setColor] = useState('');
  const [coatDescription, setCoatDescription] = useState('');
  const [distinguishingMarks, setDistinguishingMarks] = useState('');
  const [collarInfo, setCollarInfo] = useState('');
  const [microchipId, setMicrochipId] = useState('');
  const [temperament, setTemperament] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [primaryPhoto, setPrimaryPhoto] = useState('');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);

  // ----------------------------------------------------
  // CHAPTER 3: LAST SEEN EVENT & CONTACT VISIBILITY
  // ----------------------------------------------------
  const today = new Date().toISOString().split('T')[0];
  const [dateLost, setDateLost] = useState(today);
  const [timeLost, setTimeLost] = useState('06:00 PM');
  const [lastKnownLocation, setLastKnownLocation] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showPhonePublicly, setShowPhonePublicly] = useState(true);
  const [showEmailPublicly, setShowEmailPublicly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prepopulate owner info from authenticated user or existing profile
  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.name);
      setEmail((prev) => prev || user.email);
      if (user.phone) setPhone((prev) => prev || user.phone || '');

      const existingProfile = storageService.getOwnerProfileByUserId(user.id);
      if (existingProfile) {
        setFullName(existingProfile.fullName);
        setPhone(existingProfile.phone);
        setEmail(existingProfile.email);
        setState(existingProfile.state || 'Andhra Pradesh');
        setDistrict(existingProfile.district || '');
        setMandalOrMunicipality(existingProfile.mandalOrMunicipality || '');
        setStreetOrLocality(existingProfile.streetOrLocality || '');
        setPinCode(existingProfile.pinCode || '');
        setPrivateAddress(existingProfile.address || '');
        setHasLocationConsent(existingProfile.hasLocationConsent);
        setLatitude(existingProfile.latitude);
        setLongitude(existingProfile.longitude);
        setApproximateArea(existingProfile.approximateArea || '');
      }
    }
  }, [user]);

  // AUTH GUARD: If not authenticated, prompt user cleanly
  if (!isAuthenticated) {
    return (
      <div className="app-container report-auth-gate">
        <div className="auth-gate-card card text-center">
          <div className="auth-gate-icon-bubble">
            <Lock size={36} />
          </div>
          <h2 className="auth-gate-title">🐾 Pet Owner Authentication Required</h2>
          <p className="auth-gate-desc">
            To prevent spam and keep missing pet reports authentic and safe, owners must sign in before reporting a lost dog.
          </p>

          <div className="auth-gate-actions">
            <Link to="/" className="btn btn-primary btn-lg">
              <span>🐾 Sign In with Email</span>
            </Link>
          </div>

          <div className="auth-gate-benefits">
            <div className="benefit-item">
              <Shield size={16} />
              <span>Strictly protects your personal phone & exact address</span>
            </div>
            <div className="benefit-item">
              <Eye size={16} />
              <span>Real-time dashboard alerts when sightings are submitted</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VALIDATION: Step 1 (Owner Details)
  const handleProceedToPup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      showToast('Please provide your name, phone number, and email address.', 'warning');
      return;
    }
    if (!state.trim() || !district.trim() || !streetOrLocality.trim() || !privateAddress.trim()) {
      showToast('Please complete the location details.', 'warning');
      return;
    }

    // Save profile to storage
    const ownerProfile: OwnerProfile = {
      id: `owner-${user?.id || Date.now()}`,
      userId: user!.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: privateAddress.trim(),
      state: state.trim(),
      district: district.trim(),
      mandalOrMunicipality: mandalOrMunicipality.trim(),
      streetOrLocality: streetOrLocality.trim(),
      pinCode: pinCode.trim(),
      preferredContact,
      hasLocationConsent,
      latitude,
      longitude,
      approximateArea: approximateArea.trim() || `Near ${streetOrLocality}, ${district}`,
      updatedAt: new Date().toISOString(),
    };

    storageService.saveOwnerProfile(ownerProfile);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('🐾 Owner profile saved! Now tell us about your pup.', 'success');
  };

  // VALIDATION: Step 2 (Dog Details)
  const handleProceedToLostReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dogName.trim()) {
      showToast('Please tell us your pup’s name.', 'warning');
      return;
    }
    if (!breed.trim()) {
      showToast('Please specify the breed.', 'warning');
      return;
    }
    if (!color.trim()) {
      showToast('Please mention the primary color of your pup.', 'warning');
      return;
    }
    if (!distinguishingMarks.trim()) {
      showToast('Please enter distinguishing marks or characteristics to help identify your pup.', 'warning');
      return;
    }
    if (!primaryPhoto) {
      showToast('📸 Please upload at least one clear primary photo of your pup.', 'warning');
      return;
    }

    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // FINAL SUBMISSION: Step 3 (Lost Report)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateLost || !lastKnownLocation.trim()) {
      showToast('Please mention the date and landmark where your dog was last seen.', 'warning');
      return;
    }

    setSubmitting(true);

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const cleanDogPrefix = dogName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'PUP';
    const reportId = `LOST-${cleanDogPrefix}-${randomSuffix}`;
    const dogId = `dog-${Date.now()}`;
    const ownerId = `owner-${user!.id}`;

    const dogProfile: DogProfile = {
      id: dogId,
      ownerId,
      name: dogName.trim(),
      breed: breed.trim(),
      gender,
      age: age.trim() || 'Approx. 2 years',
      size,
      color: color.trim(),
      coatDescription: coatDescription.trim() || undefined,
      distinguishingMarks: distinguishingMarks.trim(),
      collarInfo: collarInfo.trim() || undefined,
      microchipId: microchipId.trim() || undefined,
      temperament: temperament.trim() || undefined,
      medicalNotes: medicalNotes.trim() || undefined,
      primaryPhoto,
      photos: additionalPhotos,
      createdAt: new Date().toISOString(),
    };

    const finalReport: LostReport = {
      id: reportId,
      dogId,
      ownerId,
      dog: dogProfile,
      ownerApproximateLocation: approximateArea,
      lastKnownLocation: lastKnownLocation.trim(),
      lastKnownLatitude: latitude,
      lastKnownLongitude: longitude,
      dateLost,
      timeLost,
      additionalNotes: additionalNotes.trim() || undefined,
      status: 'LOST',
      contactMechanism: {
        showPhone: showPhonePublicly,
        showEmail: showEmailPublicly,
        safeContactPhone: phone,
        safeContactEmail: email,
        contactNote: `Preferred contact: ${preferredContact.toUpperCase()}. Please reach out immediately if spotted!`,
      },
      sightingCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      storageService.createReport(finalReport);
      setSubmitting(false);
      setCreatedReportId(reportId);
      setStep(4);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#E06D44', '#44775D', '#FFB703', '#2563EB'],
        });
      } catch (err) {
        console.log(err);
      }

      showToast(`🐾 Lost dog report created! ${dogName}'s profile is now live.`, 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitting(false);
      showToast('Could not save report. Please check details and try again.', 'error');
    }
  };

  return (
    <div className="report-wizard-page">
      <div className="app-container wizard-container">
        {/* Wizard Stepper Bar */}
        {step !== 4 && (
          <nav className="stepper-nav" aria-label="Report Creation Progress">
            <div className={`stepper-step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
              <UserIcon size={16} />
              <span>🐾 1. Owner Details</span>
            </div>
            <div className="stepper-divider" />
            <div className={`stepper-step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
              <PawPrint size={16} />
              <span>🐶 2. Pup Profile</span>
            </div>
            <div className="stepper-divider" />
            <div className={`stepper-step ${step === 3 ? 'active' : ''}`}>
              <MapPin size={16} />
              <span>📍 3. Lost Report</span>
            </div>
          </nav>
        )}

        {/* ============================================================
            STEP 1: CHAPTER 1 — OWNER DETAILS FORM
            ============================================================ */}
        {step === 1 && (
          <div className="wizard-chapter-card card">
            <div className="chapter-header">
              <div className="chapter-badge">Chapter 1 of 3</div>
              <h1 className="chapter-title">🐾 Tell us about you</h1>
              <p className="chapter-subtitle">
                "First, let's make sure we know who is looking for their pup."
                Your private contact info allows verified rescuers to safely coordinate handoffs.
              </p>
            </div>

            <form onSubmit={handleProceedToPup}>
              {/* Contact Information */}
              <div className="form-section-group">
                <h3 className="section-title-sm">Primary Contact Information</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="owner-name">
                      Full Legal Name <span className="required-tag">*</span>
                    </label>
                    <input
                      id="owner-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Suresh Varma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="owner-phone">
                      Contact Phone Number <span className="required-tag">*</span>
                    </label>
                    <input
                      id="owner-phone"
                      type="tel"
                      className="form-input"
                      placeholder="+91 98480 22334"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="owner-email">
                      Email Address <span className="required-tag">*</span>
                    </label>
                    <input
                      id="owner-email"
                      type="email"
                      className="form-input"
                      placeholder="suresh.varma@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="owner-pref-contact">
                      Preferred Contact Method <span className="required-tag">*</span>
                    </label>
                    <select
                      id="owner-pref-contact"
                      className="form-select"
                      value={preferredContact}
                      onChange={(e) => setPreferredContact(e.target.value as ContactMethod)}
                    >
                      <option value="phone">Direct Phone Call</option>
                      <option value="whatsapp">WhatsApp Message</option>
                      <option value="email">Email Notification</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location & Safe Approximation Component */}
              <div className="form-section-group">
                <h3 className="section-title-sm">Home & Base Location</h3>
                <LocationPicker
                  state={state}
                  district={district}
                  mandalOrMunicipality={mandalOrMunicipality}
                  streetOrLocality={streetOrLocality}
                  pinCode={pinCode}
                  privateAddress={privateAddress}
                  hasLocationConsent={hasLocationConsent}
                  latitude={latitude}
                  longitude={longitude}
                  approximateArea={approximateArea}
                  onChange={(fields) => {
                    setState(fields.state);
                    setDistrict(fields.district);
                    setMandalOrMunicipality(fields.mandalOrMunicipality);
                    setStreetOrLocality(fields.streetOrLocality);
                    setPinCode(fields.pinCode);
                    setPrivateAddress(fields.privateAddress);
                    setHasLocationConsent(fields.hasLocationConsent);
                    setLatitude(fields.latitude);
                    setLongitude(fields.longitude);
                    setApproximateArea(fields.approximateArea);
                  }}
                />
              </div>

              <div className="wizard-actions-footer">
                <div className="privacy-reassurance">
                  <Shield size={16} />
                  <span>Exact house address is kept strictly private</span>
                </div>
                <button type="submit" className="btn btn-primary btn-lg">
                  <span>🐾 Continue to Pup Profile</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================
            STEP 2: CHAPTER 2 — DOG DETAILS & PHOTOS FORM
            ============================================================ */}
        {step === 2 && (
          <div className="wizard-chapter-card card">
            <div className="chapter-header">
              <div className="chapter-badge">Chapter 2 of 3</div>
              <h1 className="chapter-title">🐶 Tell us about your pup</h1>
              <p className="chapter-subtitle">
                "Now let's create a profile that helps people recognize them."
                Clear photos and specific distinctive markings give searchers the best chance.
              </p>
            </div>

            <form onSubmit={handleProceedToLostReport}>
              {/* Photo Upload Section */}
              <div className="form-section-group">
                <ImageUploader
                  primaryPhoto={primaryPhoto}
                  additionalPhotos={additionalPhotos}
                  dogName={dogName || 'your pup'}
                  onChange={(prim, add) => {
                    setPrimaryPhoto(prim);
                    setAdditionalPhotos(add);
                  }}
                />
              </div>

              {/* Core Dog Details */}
              <div className="form-section-group">
                <h3 className="section-title-sm">Basic Identity</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-name">
                      Dog Name <span className="required-tag">*</span>
                    </label>
                    <input
                      id="dog-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bruno, Bella, Milo"
                      value={dogName}
                      onChange={(e) => setDogName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-breed">
                      Breed <span className="required-tag">*</span>
                    </label>
                    <input
                      id="dog-breed"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Golden Retriever, Indie / Desi, Beagle"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-gender">
                      Gender <span className="required-tag">*</span>
                    </label>
                    <select
                      id="dog-gender"
                      className="form-select"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as DogGender)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-age">
                      Age <span className="optional-tag">(Approximate)</span>
                    </label>
                    <input
                      id="dog-age"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 2.5 years or 6 months puppy"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-size">
                      Size Category <span className="required-tag">*</span>
                    </label>
                    <select
                      id="dog-size"
                      className="form-select"
                      value={size}
                      onChange={(e) => setSize(e.target.value as DogSize)}
                    >
                      <option value="Toy (under 5kg)">Toy (under 5kg)</option>
                      <option value="Small (5-10kg)">Small (5-10kg)</option>
                      <option value="Medium (10-25kg)">Medium (10-25kg)</option>
                      <option value="Large (25-45kg)">Large (25-45kg)</option>
                      <option value="Extra Large (45kg+)">Extra Large (45kg+)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-color">
                      Primary Color(s) <span className="required-tag">*</span>
                    </label>
                    <input
                      id="dog-color"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Golden Cream, Tricolor, Sandy Fawn"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Distinctive Features */}
              <div className="form-section-group">
                <h3 className="section-title-sm">Distinctive Features & Identification</h3>

                <div className="form-group">
                  <label className="form-label" htmlFor="dog-marks">
                    Distinguishing Marks & Characteristics <span className="required-tag">*</span>
                  </label>
                  <textarea
                    id="dog-marks"
                    className="form-textarea"
                    rows={3}
                    placeholder="e.g. White patch on chest, left ear flops slightly, small scar on snout, responds to whistling."
                    value={distinguishingMarks}
                    onChange={(e) => setDistinguishingMarks(e.target.value)}
                    required
                  />
                  <span className="form-hint">
                    These specific details help neighbors immediately tell your dog apart from other similar dogs.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dog-coat">
                    Coat Description <span className="optional-tag">(Optional)</span>
                  </label>
                  <input
                    id="dog-coat"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Short sleek fur, thick double coat, fluffy curly coat"
                    value={coatDescription}
                    onChange={(e) => setCoatDescription(e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-collar">
                      Collar & Tags <span className="optional-tag">(Optional)</span>
                    </label>
                    <input
                      id="dog-collar"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Navy blue reflective collar with brass bell"
                      value={collarInfo}
                      onChange={(e) => setCollarInfo(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-microchip">
                      Microchip ID <span className="optional-tag">(Optional)</span>
                    </label>
                    <input
                      id="dog-microchip"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 985141002348901"
                      value={microchipId}
                      onChange={(e) => setMicrochipId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-temperament">
                      Temperament / Approach Advice <span className="optional-tag">(Optional)</span>
                    </label>
                    <input
                      id="dog-temperament"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Friendly, loves treats; timid around loud motorbikes"
                      value={temperament}
                      onChange={(e) => setTemperament(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dog-meds">
                      Urgent Medical Needs <span className="optional-tag">(Optional)</span>
                    </label>
                    <input
                      id="dog-meds"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Daily epilepsy medication, needs water"
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="wizard-actions-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ArrowLeft size={18} />
                  <span>Back to Owner Details</span>
                </button>

                <button type="submit" className="btn btn-primary btn-lg">
                  <span>📍 Continue to Lost Event Details</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================
            STEP 3: CHAPTER 3 — LOST REPORT & CIRCUMSTANCES
            ============================================================ */}
        {step === 3 && (
          <div className="wizard-chapter-card card">
            <div className="chapter-header">
              <div className="chapter-badge">Chapter 3 of 3</div>
              <h1 className="chapter-title">📍 When & Where was {dogName} Lost?</h1>
              <p className="chapter-subtitle">
                Specify the exact time, last seen landmark, and how community members should contact you.
              </p>
            </div>

            <form onSubmit={handleFinalSubmit}>
              <div className="form-section-group">
                <h3 className="section-title-sm">Disappearance Details</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="report-date-lost">
                      Date Lost <span className="required-tag">*</span>
                    </label>
                    <input
                      id="report-date-lost"
                      type="date"
                      className="form-input"
                      value={dateLost}
                      onChange={(e) => setDateLost(e.target.value)}
                      max={today}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="report-time-lost">
                      Approximate Time Lost <span className="required-tag">*</span>
                    </label>
                    <input
                      id="report-time-lost"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 06:30 PM (Evening walk)"
                      value={timeLost}
                      onChange={(e) => setTimeLost(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="report-landmark">
                    Specific Landmark / Area Last Seen <span className="required-tag">*</span>
                  </label>
                  <input
                    id="report-landmark"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Near Municipal Water Works & Benz Circle flyover entrance"
                    value={lastKnownLocation}
                    onChange={(e) => setLastKnownLocation(e.target.value)}
                    required
                  />
                  <span className="form-hint">
                    Public searchers will look around this specific landmark.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="report-notes">
                    Circumstances & Additional Notes <span className="optional-tag">(Optional)</span>
                  </label>
                  <textarea
                    id="report-notes"
                    className="form-textarea"
                    rows={3}
                    placeholder="e.g. Slipped collar when startled by fireworks. Sighted running towards the park."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Contact Visibility Controls */}
              <div className="form-section-group">
                <h3 className="section-title-sm">Community Contact Preferences</h3>
                <p className="form-hint" style={{ marginBottom: '1rem' }}>
                  Choose which contact details to reveal to community members when they find {dogName}.
                </p>

                <div className="checkbox-pill-group">
                  <label className="checkbox-card-item">
                    <input
                      type="checkbox"
                      checked={showPhonePublicly}
                      onChange={(e) => setShowPhonePublicly(e.target.checked)}
                    />
                    <div>
                      <strong>Allow Phone Calls / WhatsApp ({phone || 'Your Phone'})</strong>
                      <p>Recommended so rescuers can call you immediately when they see {dogName}.</p>
                    </div>
                  </label>

                  <label className="checkbox-card-item">
                    <input
                      type="checkbox"
                      checked={showEmailPublicly}
                      onChange={(e) => setShowEmailPublicly(e.target.checked)}
                    />
                    <div>
                      <strong>Allow Direct Email ({email || 'Your Email'})</strong>
                      <p>Enables rescuers to message you with sightings via email.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="wizard-actions-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={submitting}
                >
                  <ArrowLeft size={18} />
                  <span>Back to Pup Profile</span>
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span>Publishing Lost Dog Report...</span>
                  ) : (
                    <span>🐾 Publish Lost Dog Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================
            STEP 4: CELEBRATION & SUCCESS CONFIRMATION
            ============================================================ */}
        {step === 4 && (
          <div className="wizard-chapter-card card success-chapter-card text-center">
            <div className="success-badge-circle">
              <Sparkles size={40} className="sparkle-gold" />
            </div>

            <h1 className="success-title">🐾 {dogName}'s Lost Dog Report is Live!</h1>
            <p className="success-desc">
              Your report has been broadcast to the local community network.
              Keep your phone nearby for real-time sighting alerts.
            </p>

            <div className="report-id-highlight-box">
              <span className="id-label">Official Report Identifier:</span>
              <span className="id-code">{createdReportId}</span>
            </div>

            <div className="success-cta-group">
              <Link to={`/dog/${createdReportId}`} className="btn btn-primary btn-lg">
                <span>View {dogName}'s Live Profile</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/dashboard" className="btn btn-outline btn-lg">
                <span>Go to My Pet Dashboard</span>
              </Link>
            </div>

            <div className="success-next-steps">
              <h4>Immediate steps while the community searches:</h4>
              <ul className="steps-checklist">
                <li>Share {dogName}’s report link on local WhatsApp groups and neighborhood chats.</li>
                <li>Leave an article of your unwashed clothing outside where they were last seen.</li>
                <li>Alert nearby vet clinics and pet shelters with the Report ID <code>{createdReportId}</code>.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
