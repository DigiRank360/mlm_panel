import { useState } from 'react'
import { ShieldCheck, Upload } from 'lucide-react'
import { useToast } from '../context/useToast'

const statusLabels = {
  not_submitted: 'Not submitted',
  submitted: 'Submitted',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function KycPage({ member, enabled, onSubmit }) {
  const { showToast } = useToast()
  const [legalName, setLegalName] = useState(member.name)
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [identityDocumentType, setIdentityDocumentType] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [panDocument, setPanDocument] = useState(null)
  const [identityDocument, setIdentityDocument] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)
  const kyc = member.kycDetails || { status: member.kycStatus || 'not_submitted' }
  const canSubmit = enabled && ['not_submitted', 'rejected'].includes(kyc.status)

  const submit = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    setMessage('')
    setMessageError(false)
    const validDocumentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])
    for (const [label, file] of [['PAN document', panDocument], ['Government ID document', identityDocument]]) {
      if (!file) {
        setMessageError(true)
        setMessage(`${label} is required.`)
        showToast(`${label} is required.`, 'error')
        return
      }
      if (file.size > 3 * 1024 * 1024) {
        setMessageError(true)
        setMessage(`${label} must be 3 MB or smaller.`)
        showToast(`${label} must be 3 MB or smaller.`, 'error')
        return
      }
      if (!validDocumentTypes.has(file.type)) {
        setMessageError(true)
        setMessage(`${label} must be a PDF, JPEG, or PNG file.`)
        showToast(`${label} must be a PDF, JPEG, or PNG file.`, 'error')
        return
      }
    }
    setBusy(true)
    const form = new FormData()
    form.set('legalName', legalName.trim())
    form.set('dateOfBirth', dateOfBirth)
    form.set('panNumber', panNumber.trim().toUpperCase())
    form.set('identityDocumentType', identityDocumentType)
    form.set('addressLine1', addressLine1.trim())
    form.set('addressLine2', addressLine2.trim())
    form.set('city', city.trim())
    form.set('state', state.trim())
    form.set('pincode', pincode.trim())
    if (panDocument) form.set('panDocument', panDocument)
    if (identityDocument) form.set('identityDocument', identityDocument)

    try {
      await onSubmit(form)
      setPanNumber('')
      setPanDocument(null)
      setIdentityDocument(null)
      formElement.reset()
      setMessage('KYC submitted securely. We will update the status after document review.')
      showToast('KYC documents submitted for review.')
    } catch (error) {
      setMessageError(true)
      setMessage(error.message)
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return <div className="kyc-page">
    <section className="panel kyc-status-panel">
      <div className="kyc-status-icon"><ShieldCheck size={21} /></div>
      <div><p className="eyebrow">MEMBER VERIFICATION</p><h2>{statusLabels[kyc.status] || 'Not submitted'}</h2><p>{kyc.status === 'approved' ? 'Your KYC has been approved. Withdrawals are available.' : kyc.status === 'submitted' || kyc.status === 'under_review' ? 'Your documents are in the admin review queue.' : 'Submit identity details and documents for manual verification.'}</p>{kyc.panLastFour && <small>PAN ending in {kyc.panLastFour}</small>}{kyc.rejectionReason && <p className="kyc-rejection">Review note: {kyc.rejectionReason}</p>}</div>
    </section>

    {!enabled && <div className="activation-notice"><strong>Secure KYC storage is not configured</strong><span>Your documents are not being uploaded. Contact support to enable encrypted KYC storage.</span></div>}
    {message && <p className={messageError ? 'kyc-error-message' : 'withdrawal-notice'} role={messageError ? 'alert' : 'status'}>{message}</p>}

    {canSubmit && <form className="panel kyc-form" onSubmit={submit}>
      <div className="panel-header"><div><h2>Submit KYC details</h2><p>Documents are encrypted in storage and visible only to authorized reviewers.</p></div></div>
      <div className="settings-fields">
        <label>Legal name<input required minLength={2} maxLength={120} value={legalName} onChange={(event) => setLegalName(event.target.value)} autoComplete="name" placeholder="Name as printed on PAN" /></label>
        <label>Date of birth<input required type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} placeholder="Select date of birth" /></label>
        <label>PAN number<input required maxLength={10} pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" value={panNumber} onChange={(event) => setPanNumber(event.target.value.toUpperCase())} autoComplete="off" placeholder="ABCDE1234F" /></label>
        <label>Government ID type<select required value={identityDocumentType} onChange={(event) => setIdentityDocumentType(event.target.value)}><option value="" disabled>Select government ID type</option><option value="aadhaar">Aadhaar card</option><option value="passport">Passport</option><option value="voter_id">Voter ID</option><option value="driving_license">Driving licence</option></select></label>
        <label>Address line 1<input required maxLength={160} value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} autoComplete="address-line1" placeholder="House number and street" /></label>
        <label>Address line 2<input maxLength={160} value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} autoComplete="address-line2" placeholder="Area, landmark (optional)" /></label>
        <label>City<input required value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" placeholder="Your city" /></label>
        <label>State<input required value={state} onChange={(event) => setState(event.target.value)} autoComplete="address-level1" placeholder="Your state" /></label>
        <label>PIN code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="postal-code" placeholder="6-digit PIN code" /></label>
        <label>PAN document<input required type="file" title="Choose PAN card file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setPanDocument(event.target.files?.[0] || null)} /></label>
        <label>Government ID document<input required type="file" title="Choose government ID file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setIdentityDocument(event.target.files?.[0] || null)} /></label>
      </div>
      <p className="kyc-file-note"><Upload size={14} /> PDF, JPEG or PNG; max 3 MB per file. Use masked Aadhaar where applicable.</p>
      <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Submitting securely…' : 'Submit for verification'}</button>
    </form>}
  </div>
}
