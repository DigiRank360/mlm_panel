import { useEffect, useState } from 'react'
import { ArrowRight, Leaf, UserPlus } from 'lucide-react'
import PasswordField from '../components/common/PasswordField'
import { api } from '../lib/api'
import './registration.css'

export default function ReferralRegistrationPage({ referralId, onRegister, onToast }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [packageId, setPackageId] = useState('starter')
  const [placementCode, setPlacementCode] = useState('')
  const [placementLeg, setPlacementLeg] = useState('')
  const [referral, setReferral] = useState(null)
  const [referralWarning, setReferralWarning] = useState('')
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let cancelled = false
    const referralRequest = referralId
      ? api.getReferralPlacements(referralId).then((data) => ({ data })).catch((error) => ({ error }))
      : Promise.resolve({ data: { sponsor: { memberCode: '', name: 'Direct registration' }, placements: [] } })
    Promise.all([referralRequest, api.getPackages()])
      .then(([referralResult, packageData]) => {
        if (cancelled) return
        setPackages(packageData)
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

  const selectedPlacement = referral?.placements.find((item) => item.memberCode === placementCode && item.leg === placementLeg)
  const hasSponsorInvite = Boolean(referralId && referral?.sponsor.memberCode)

  const submit = async (event) => {
    event.preventDefault()
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.')
      onToast('Password must be at least 8 characters long.', 'error')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      onToast('Passwords do not match.', 'error')
      return
    }
    if (hasSponsorInvite && !selectedPlacement) {
      setFormError('Select an available binary position.')
      onToast('Select an available binary position.', 'error')
      return
    }

    setFormError('')
    setSubmitting(true)
    try {
      await onRegister({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        packageId,
        sponsorCode: referral.sponsor.memberCode || undefined,
        placementCode: selectedPlacement?.memberCode,
        placementLeg: selectedPlacement?.leg,
      })
    } catch (error) {
      setFormError(error.message)
      onToast(error.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPackage = packages.find((item) => item.id === packageId)

  return <main className="join-page">
    <header className="join-header"><span className="brand-mark"><Leaf size={19} /></span><strong>ayurva<span>pro</span></strong><small>MEMBER REGISTRATION</small></header>
    <section className="join-content">
      <div className="join-intro"><p className="eyebrow">YOUR WELLNESS NETWORK</p><h1>Start your AyurvaPro journey.</h1><p>{hasSponsorInvite ? `Choose a package and join ${referral?.sponsor.name || 'your sponsor'}’s team.` : 'Choose a package to create your member account.'}</p></div>
      {loading ? <div className="join-error" role="status">Loading sponsor and package details…</div> : !referral ? <div className="join-error"><strong>Registration is temporarily unavailable.</strong><p>{formError || 'Please refresh and try again.'}</p></div> : <form className="join-form" onSubmit={submit}>
        <div className="join-form-heading"><span className="join-form-icon"><UserPlus size={19} /></span><div><strong>Create your member profile</strong><small>{hasSponsorInvite ? `Invited by ${referral.sponsor.name} · ${referral.sponsor.memberCode}` : 'Direct registration'}</small></div></div>
        {referralWarning && <p className="join-form-error" role="status">{referralWarning}</p>}
        <div className="join-fields"><label>Full name<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" /></label><label>Email address<input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Phone number<input autoComplete="tel" type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" /></label><label>Create password<PasswordField autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label><label>Confirm password<PasswordField autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter password" /></label>
          {hasSponsorInvite && <label>Binary position<select value={placementCode && placementLeg ? `${placementCode}:${placementLeg}` : ''} onChange={(event) => { const [code, leg] = event.target.value.split(':'); setPlacementCode(code); setPlacementLeg(leg) }} required>{referral.placements.map((option) => <option key={`${option.memberCode}:${option.leg}`} value={`${option.memberCode}:${option.leg}`}>{option.name} · {option.leg} leg</option>)}</select></label>}</div>
        <fieldset className="package-choices"><legend>Choose your package</legend>{packages.map((item) => <label className={`package-choice ${packageId === item.id ? 'package-choice-active' : ''}`} key={item.id}><input type="radio" name="package" value={item.id} checked={packageId === item.id} onChange={() => setPackageId(item.id)} /><span><strong>{item.name}</strong><small>BV {item.businessVolume.toLocaleString('en-IN')} · Daily cap ₹{item.dailyMatchingCap.toLocaleString('en-IN')}</small><b>Matching bonus ₹{item.matchingBonus.toLocaleString('en-IN')} / pair</b></span><strong className="package-choice-price">₹{item.discountedPrice.toLocaleString('en-IN')}</strong></label>)}</fieldset>
        {selectedPackage && <p className="join-note">Package purchase value ₹{selectedPackage.discountedPrice.toLocaleString('en-IN')}. Account activation is pending until payment is verified by an administrator.</p>}
        {hasSponsorInvite && referral.placements.length === 0 && <p className="join-form-error" role="alert">No open binary positions are available for this sponsor.</p>}
        {formError && <p className="join-form-error" role="alert">{formError}</p>}
        <button className="primary-button join-submit" type="submit" disabled={submitting || (hasSponsorInvite && !selectedPlacement) || !selectedPackage}>{submitting ? 'Creating account…' : 'Create member account'} <ArrowRight size={16} /></button>
        <p className="login-register">Already registered? <a href="/">Sign in</a></p>
      </form>}
    </section>
  </main>
}