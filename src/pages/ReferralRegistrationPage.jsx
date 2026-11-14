import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, KeyRound, Landmark, Lock, ShieldCheck, UserCheck, UserRound } from 'lucide-react'
import PasswordField from '../components/common/PasswordField'
import { api } from '../lib/api'
import logo from '../assets/ayurvapro-logo.png'
import './registration.css'
import './partner-application.css'

const CATEGORIES = [
  { value: 'ayurvedic_practitioner', label: 'Ayurvedic Practitioner' },
  { value: 'wellness_professional', label: 'Wellness Professional' },
  { value: 'health_advocate', label: 'Health & Wellness Advocate' },
  { value: 'other', label: 'Other' },
]

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const UNDERTAKINGS = [
  'I confirm that I will not make exaggerated medical cure claims (for example, claiming a complete cure for any condition or guaranteed outcomes) and will follow applicable advertising and Ayush guidelines.',
  'I understand that no earnings are guaranteed and that participation is subject to the published programme terms.',
  'I agree to the AyuvaPro Referral Code of Conduct, Privacy Policy and Grievance Terms of Service.',
]

const STEPS = [
  { label: 'Profile & Contact' },
  { label: 'Credentials' },
  { label: 'Banking & Undertaking' },
  { label: 'Account & Package' },
]

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/
const RESEND_SECONDS = 30

// Accepts "9876543210", "+91 98765 43210" and similar; backend expects +<country><number>.
const normalizePhone = (value) => {
  const compact = value.replace(/[\s()-]/g, '')
  if (/^\d{10}$/.test(compact)) return `+91${compact}`
  if (/^91\d{10}$/.test(compact)) return `+${compact}`
  return compact
}

const maskTail = (value) => (value.length > 4 ? `${'•'.repeat(value.length - 4)}${value.slice(-4)}` : value)
const digitsOnly = (value, max) => value.replace(/\D/g, '').slice(0, max)

export default function ReferralRegistrationPage({ referralId, onRegister, onToast }) {
  const formRef = useRef(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', category: '',
    councilRegistrationNo: '', organizationName: '', state: '', city: '', pinCode: '',
    pan: '', accountHolderName: '', accountNumber: '', confirmAccountNumber: '', ifsc: '',
    password: '', confirmPassword: '',
  })
  const [undertakings, setUndertakings] = useState([false, false, false])
  const [packageId, setPackageId] = useState('starter')
  const [placementCode, setPlacementCode] = useState('')
  const [placementLeg, setPlacementLeg] = useState('')
  const [referral, setReferral] = useState(null)
  const [referralWarning, setReferralWarning] = useState('')
  const [packages, setPackages] = useState([])
  const [config, setConfig] = useState({ phoneOtpEnabled: false, payoutDetailsEnabled: false })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [otpStage, setOtpStage] = useState('idle')
  const [otpCode, setOtpCode] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [verificationToken, setVerificationToken] = useState('')

  const setField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const setUpper = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value.toUpperCase().replace(/\s/g, '') }))
  const setDigits = (key, max) => (event) => setForm((current) => ({ ...current, [key]: digitsOnly(event.target.value, max) }))

  useEffect(() => {
    let cancelled = false
    const referralRequest = referralId
      ? api.getReferralPlacements(referralId).then((data) => ({ data })).catch((error) => ({ error }))
      : Promise.resolve({ data: { sponsor: { memberCode: '', name: 'Direct registration' }, placements: [] } })
    Promise.all([referralRequest, api.getPackages(), api.getRegistrationConfig().catch(() => null)])
      .then(([referralResult, packageData, configData]) => {
        if (cancelled) return
        setPackages(packageData)
        if (configData) setConfig(configData)
        const referralData = referralResult.error
          ? { sponsor: { memberCode: '', name: 'Direct registration' }, placements: [] }
          : referralResult.data
        setReferral(referralData)
        setReferralWarning(referralResult.error ? 'This invite is no longer active. You can continue with direct registration; no sponsor will be attached.' : '')
        setPlacementCode(referralData.placements[0]?.memberCode || '')
        setPlacementLeg(referralData.placements[0]?.leg || '')
        setPackageId(packageData[0]?.id || '')
      })
      .catch((error) => {
        if (!cancelled) setFormError(error.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [referralId])

  useEffect(() => {
    if (otpCooldown <= 0) return undefined
    const timer = window.setTimeout(() => setOtpCooldown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [otpCooldown])

  const phone = normalizePhone(form.phone)
  const phoneVerified = otpStage === 'verified' && verifiedPhone === phone

  const fail = (message) => {
    setFormError(message)
    onToast(message, 'error')
    return false
  }

  const onPhoneChange = (event) => {
    setField('phone')(event)
    if (otpStage !== 'idle') {
      setOtpStage('idle')
      setOtpCode('')
      setVerificationToken('')
      setVerifiedPhone('')
    }
  }

  const sendOtp = async () => {
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return fail('Enter a valid mobile number before requesting an OTP.')
    setOtpBusy(true)
    setFormError('')
    try {
      await api.sendRegistrationOtp(phone)
      setOtpStage('sent')
      setOtpCooldown(RESEND_SECONDS)
      onToast(`OTP sent to ${maskTail(phone)}.`, 'success')
    } catch (error) {
      fail(error.message)
    } finally {
      setOtpBusy(false)
    }
    return undefined
  }

  const confirmOtp = async () => {
    setOtpBusy(true)
    setFormError('')
    try {
      const result = await api.verifyRegistrationOtp(phone, otpCode)
      setVerificationToken(result.verificationToken)
      setVerifiedPhone(phone)
      setOtpStage('verified')
      onToast('Mobile number verified.', 'success')
    } catch (error) {
      fail(error.message)
    } finally {
      setOtpBusy(false)
    }
  }

  const selectedPlacement = referral?.placements.find((item) => item.memberCode === placementCode && item.leg === placementLeg)
  const hasSponsorInvite = Boolean(referralId && referral?.sponsor.memberCode)
  const selectedPackage = packages.find((item) => item.id === packageId)
  const allUndertaken = undertakings.every(Boolean)
  const normalizeName = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase()
  const holderMismatch = Boolean(form.accountHolderName.trim() && form.name.trim() && normalizeName(form.accountHolderName) !== normalizeName(form.name))

  // Native HTML validation first, then rules the browser cannot express.
  const validateStep = (index) => {
    if (formRef.current && !formRef.current.reportValidity()) return false
    if (index === 0 && config.phoneOtpEnabled && !phoneVerified) return fail('Verify your mobile number with the OTP to continue.')
    if (index === 1 && !/^[1-9]\d{5}$/.test(form.pinCode.trim())) return fail('Enter a valid 6-digit PIN code.')
    if (index === 2) {
      if (config.payoutDetailsEnabled) {
        if (!PAN_PATTERN.test(form.pan)) return fail('Enter a valid 10-character PAN, such as ABCDE1234F.')
        if (!/^\d{9,18}$/.test(form.accountNumber)) return fail('Enter a valid bank account number (9-18 digits).')
        if (form.accountNumber !== form.confirmAccountNumber) return fail('Bank account numbers do not match.')
        if (!IFSC_PATTERN.test(form.ifsc)) return fail('Enter a valid IFSC code, such as HDFC0001234.')
      }
      if (!allUndertaken) return fail('Please accept all declarations to continue.')
    }
    if (index === 3) {
      if (form.password.length < 8) return fail('Password must be at least 8 characters long.')
      if (form.password !== form.confirmPassword) return fail('Passwords do not match.')
      if (hasSponsorInvite && !selectedPlacement) return fail('Select an available binary position.')
    }
    setFormError('')
    return true
  }

  const goNext = () => {
    if (validateStep(step)) setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }
  const goBack = () => {
    setFormError('')
    setStep((current) => Math.max(current - 1, 0))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (step < STEPS.length - 1) {
      goNext()
      return
    }
    if (!validateStep(step)) return

    setSubmitting(true)
    try {
      await onRegister({
        name: form.name.trim(),
        email: form.email.trim(),
        phone,
        password: form.password,
        packageId,
        sponsorCode: referral.sponsor.memberCode || undefined,
        placementCode: selectedPlacement?.memberCode,
        placementLeg: selectedPlacement?.leg,
        phoneVerificationToken: verificationToken || undefined,
        applicantProfile: {
          category: form.category,
          councilRegistrationNo: form.councilRegistrationNo,
          organizationName: form.organizationName,
          state: form.state,
          city: form.city,
          pinCode: form.pinCode,
          undertakingAccepted: true,
        },
        payoutAccount: config.payoutDetailsEnabled ? {
          pan: form.pan,
          accountHolderName: form.accountHolderName,
          accountNumber: form.accountNumber,
          confirmAccountNumber: form.confirmAccountNumber,
          ifsc: form.ifsc,
        } : undefined,
      })
    } catch (error) {
      setFormError(error.message)
      onToast(error.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const stepDone = [
    Boolean(form.name.trim() && form.email.trim() && form.phone.trim() && form.category && (!config.phoneOtpEnabled || phoneVerified)),
    Boolean(form.state && form.city.trim() && form.pinCode.trim()),
    Boolean(allUndertaken && (!config.payoutDetailsEnabled || (form.pan && form.accountNumber && form.ifsc && form.accountHolderName))),
    Boolean(form.password && form.confirmPassword),
  ]
  const isLast = step === STEPS.length - 1

  return <main className="pa-page">
    <aside className="pa-story" aria-label="About the AyurvaPro partner programme">
      <a className="pa-story-brand" href="/" aria-label="AyurvaPro member portal home">
        <img src={logo} alt="AyurvaPro" />
        <span>MEMBER PORTAL</span>
      </a>
      <div className="pa-story-copy">
        <p className="pa-story-kicker"><BadgeCheck size={15} /> YOUR NEXT STEP STARTS HERE</p>
        <h1>Make wellness part of your journey.</h1>
        <p>Join the AyurvaPro community with a guided application designed to make getting started clear and simple.</p>
        <ul>
          <li><span><UserCheck size={17} /></span><div><strong>A guided application</strong><small>Complete your profile one step at a time.</small></div></li>
          <li><span><ShieldCheck size={17} /></span><div><strong>Clear account setup</strong><small>Review your details before you submit.</small></div></li>
        </ul>
      </div>
      <p className="pa-story-footer">Ancient wisdom. Modern wellness.</p>
    </aside>
    <header className="pa-topbar">
      <a className="auth-brand" href="/" aria-label="AyurvaPro member portal home">
        <img src={logo} alt="AyurvaPro" />
        <span>MEMBER PORTAL</span>
      </a>
      <span className="pa-topbar-label">MLM MEMBER REGISTRATION</span>
    </header>
    <div className="pa-card">
      <div className="pa-banner">
        <div className="pa-banner-top">
          <div>
            <p className="pa-eyebrow">MLM member registration</p>
            <h1>MLM Member Application &amp; Onboarding</h1>
            <p className="pa-sub">{hasSponsorInvite ? `Invited by ${referral?.sponsor.name} · ${referral?.sponsor.memberCode}` : 'Register for the MLM member programme. Affiliate applications use a separate workspace.'}</p>
          </div>
          <UserCheck className="pa-banner-icon" size={30} aria-hidden="true" />
        </div>
        <ol className="pa-steps" aria-label="Application progress">
          {STEPS.map((item, index) => {
            const done = stepDone[index] && index !== step
            return <li key={item.label} className={`${index === step ? 'pa-step-current' : ''} ${done ? 'pa-step-done' : ''}`} aria-current={index === step ? 'step' : undefined}>
              <span>{done ? <Check size={12} /> : index + 1}</span>{item.label}
            </li>
          })}
        </ol>
        <div className="pa-progress" aria-hidden="true"><i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>

      {loading ? <div className="pa-state" role="status">Loading sponsor and package details…</div>
        : !referral ? <div className="pa-state pa-state-error"><strong>Registration is temporarily unavailable.</strong><p>{formError || 'Please refresh and try again.'}</p></div>
        : <form className="pa-body" ref={formRef} onSubmit={submit}>
          {referralWarning && <p className="pa-error" role="status">{referralWarning}</p>}

          {step === 0 && <section>
            <h2><UserRound size={16} aria-hidden="true" /> Step 1: Personal &amp; Professional Profile</h2>
            <div className="pa-grid">
              <label>Full Legal Name (as per PAN) *<input autoComplete="name" required value={form.name} onChange={setField('name')} placeholder="e.g. Dr. Rajeshwar Sharma" /></label>
              <label>Email Address (for settlements) *<input autoComplete="email" type="email" required value={form.email} onChange={setField('email')} placeholder="rajeshwar@clinicwellness.in" /></label>
              <div className="pa-field">
                <label htmlFor="pa-phone">Mobile Number (WhatsApp linked) *</label>
                <div className="pa-input-action">
                  <input id="pa-phone" autoComplete="tel" type="tel" required value={form.phone} onChange={onPhoneChange} placeholder="+91 98765 43210" />
                  {phoneVerified
                    ? <span className="pa-verified"><BadgeCheck size={13} /> Verified</span>
                    : <button type="button" className="pa-mini" onClick={sendOtp} disabled={!config.phoneOtpEnabled || otpBusy || otpCooldown > 0} title={config.phoneOtpEnabled ? undefined : 'OTP verification is not enabled yet'}>
                      {otpBusy && otpStage === 'idle' ? 'Sending…' : otpStage === 'sent' ? (otpCooldown > 0 ? `Resend ${otpCooldown}s` : 'Resend OTP') : 'Verify OTP'}
                    </button>}
                </div>
                {!config.phoneOtpEnabled && <small className="pa-hint">OTP verification is not enabled on this server yet.</small>}
              </div>
              <label>Applicant Category *
                <select required value={form.category} onChange={setField('category')}>
                  <option value="">Select Category...</option>
                  {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>
            {otpStage === 'sent' && !phoneVerified && <div className="pa-otp" role="group" aria-label="Enter OTP">
              <label htmlFor="pa-otp">Enter the code sent to {maskTail(phone)}</label>
              <div className="pa-otp-row">
                <input id="pa-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={otpCode} onChange={(event) => setOtpCode(digitsOnly(event.target.value, 8))} placeholder="Enter code" />
                <button type="button" className="pa-mini pa-mini-solid" onClick={confirmOtp} disabled={otpBusy || otpCode.length < 4}>{otpBusy ? 'Checking…' : 'Confirm OTP'}</button>
              </div>
            </div>}
          </section>}

          {step === 1 && <section>
            <h2><Building2 size={16} aria-hidden="true" /> Step 2: Credential &amp; Business Details</h2>
            <div className="pa-grid">
              <label>Council Registration No. (if practitioner)<input value={form.councilRegistrationNo} onChange={setField('councilRegistrationNo')} maxLength={60} placeholder="e.g. AYUSH-DL-2018-9842" /></label>
              <label>Clinic / Wellness Organization Name<input value={form.organizationName} onChange={setField('organizationName')} maxLength={120} placeholder="e.g. Sanjeevani Ayurveda Clinic" /></label>
            </div>
            <div className="pa-grid pa-grid-3">
              <label>State / UT *
                <select required value={form.state} onChange={setField('state')}>
                  <option value="">Select State...</option>
                  {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </label>
              <label>City *<input autoComplete="address-level2" required value={form.city} onChange={setField('city')} maxLength={60} placeholder="e.g. Pune" /></label>
              <label>PIN Code *<input autoComplete="postal-code" inputMode="numeric" required value={form.pinCode} onChange={setDigits('pinCode', 6)} placeholder="411001" /></label>
            </div>
          </section>}

          {step === 2 && <section>
            <h2><Landmark size={16} aria-hidden="true" /> Step 3: Banking &amp; Statutory Undertaking</h2>
            {config.payoutDetailsEnabled ? <>
              <div className="pa-grid">
                <label>PAN Card Number (Strictly Mandatory for TDS) *<input required autoComplete="off" value={form.pan} onChange={setUpper('pan')} maxLength={10} placeholder="ABCDE1234F" /></label>
                <label>Bank Account Holder Name *<input required autoComplete="off" value={form.accountHolderName} onChange={setField('accountHolderName')} maxLength={120} placeholder="Must match PAN exactly" /></label>
                <label>Bank Account Number *<input required autoComplete="off" inputMode="numeric" value={form.accountNumber} onChange={setDigits('accountNumber', 18)} placeholder="Enter Savings / Current Account" /></label>
                <label>Confirm Account Number *<input required autoComplete="off" inputMode="numeric" value={form.confirmAccountNumber} onChange={setDigits('confirmAccountNumber', 18)} onPaste={(event) => event.preventDefault()} placeholder="Re-enter account number" /></label>
                <label>Bank IFSC Code *<input required autoComplete="off" value={form.ifsc} onChange={setUpper('ifsc')} maxLength={11} placeholder="HDFC0001234" /></label>
              </div>
              {holderMismatch && <p className="pa-hint pa-hint-warn">Account holder name differs from your legal name. It will be checked against your PAN during review.</p>}
            </> : <p className="pa-note">Secure PAN and bank storage is not enabled on this server yet. These details will be requested later during KYC verification.</p>}

            <div className="pa-undertakings">
              {UNDERTAKINGS.map((text, index) => <label key={text}>
                <input type="checkbox" required checked={undertakings[index]} onChange={(event) => setUndertakings((current) => current.map((value, i) => (i === index ? event.target.checked : value)))} />
                <span>{text}</span>
              </label>)}
            </div>
          </section>}

          {step === 3 && <section>
            <h2><ShieldCheck size={16} aria-hidden="true" /> Step 4: <KeyRound size={14} aria-hidden="true" /> Account &amp; Package</h2>
            <div className="pa-grid">
              <label>Create Password *<PasswordField autoComplete="new-password" minLength={8} required value={form.password} onChange={setField('password')} placeholder="At least 8 characters" /></label>
              <label>Confirm Password *<PasswordField autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={setField('confirmPassword')} placeholder="Re-enter password" /></label>
              {hasSponsorInvite && <label className="pa-span">Binary Position *
                <select required value={placementCode && placementLeg ? `${placementCode}:${placementLeg}` : ''} onChange={(event) => { const [code, leg] = event.target.value.split(':'); setPlacementCode(code); setPlacementLeg(leg) }}>
                  {referral.placements.map((option) => <option key={`${option.memberCode}:${option.leg}`} value={`${option.memberCode}:${option.leg}`}>{option.name} · {option.leg} leg</option>)}
                </select>
              </label>}
            </div>

            <fieldset className="pa-packages"><legend>Choose your package *</legend>
              {packages.map((item) => <label className={`pa-package ${packageId === item.id ? 'pa-package-active' : ''}`} key={item.id}>
                <input type="radio" name="package" value={item.id} checked={packageId === item.id} onChange={() => setPackageId(item.id)} />
                <span className="pa-package-body">
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                  {item.contents?.length > 0 && <ul>{item.contents.map((line) => <li key={line}><Check size={11} aria-hidden="true" /> {line}</li>)}</ul>}
                </span>
                <span className="pa-package-price"><b>₹{item.discountedPrice.toLocaleString('en-IN')}</b>{item.mrp > item.discountedPrice && <s>₹{item.mrp.toLocaleString('en-IN')}</s>}</span>
              </label>)}
            </fieldset>
            {selectedPackage && <p className="pa-note">Prices include applicable taxes as per the invoice. Package contents and terms are subject to confirmation at order. Account activation is pending until payment is verified by an administrator. No earnings are guaranteed.</p>}

            <dl className="pa-review" aria-label="Application summary">
              <div><dt>Applicant</dt><dd>{form.name} · {CATEGORIES.find((item) => item.value === form.category)?.label}</dd></div>
              <div><dt>Contact</dt><dd>{form.email} · {phone}{phoneVerified ? ' (verified)' : ''}</dd></div>
              {selectedPackage && <div><dt>Package</dt><dd>{selectedPackage.name} · ₹{selectedPackage.discountedPrice.toLocaleString('en-IN')}</dd></div>}
              <div><dt>Location</dt><dd>{form.city}, {form.state} {form.pinCode}</dd></div>
              {config.payoutDetailsEnabled && <div><dt>PAN / Bank</dt><dd>{maskTail(form.pan)} · A/c {maskTail(form.accountNumber)} · {form.ifsc}</dd></div>}
            </dl>
          </section>}

          {hasSponsorInvite && referral.placements.length === 0 && <p className="pa-error" role="alert">No open binary positions are available for this sponsor.</p>}
          {formError && <p className="pa-error" role="alert">{formError}</p>}

          <footer className="pa-footer">
            <span className="pa-secure"><Lock size={13} aria-hidden="true" /> PAN &amp; bank details stored AES-256 encrypted</span>
            <div className="pa-actions">
              {step > 0 && <button type="button" className="pa-back" onClick={goBack} disabled={submitting}><ArrowLeft size={15} /> Back</button>}
              {isLast
                ? <button className="pa-submit" type="submit" disabled={submitting || (hasSponsorInvite && !selectedPlacement) || !selectedPackage}>
                  {submitting ? 'Submitting…' : 'Submit Verified Application'} <BadgeCheck size={16} />
                </button>
                : <button className="pa-submit" type="submit">Continue <ArrowRight size={16} /></button>}
            </div>
          </footer>
          <p className="pa-signin">Already registered? <a href="/">Sign in</a></p>
          <p className="pa-signin">Looking to apply for the affiliate programme? <a href="/affiliate">Open the affiliate workspace</a></p>
        </form>}
    </div>
  </main>
}
