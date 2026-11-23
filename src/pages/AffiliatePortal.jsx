import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeIndianRupee,
  Bell,
  Check,
  CircleHelp,
  Clipboard,
  FileCheck2,
  Link2,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from 'lucide-react'
import QRCode from 'qrcode'
import { api, clearAccessToken, getAccessToken, setAccessToken } from '../lib/api'
import logo from '../assets/ayurvapro-logo.png'
import { useToast } from '../context/useToast'
import './affiliate-portal.css'

const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '')).replace(/\/$/, '')
const SECTIONS = [
  { name: 'Overview', icon: Sparkles },
  { name: 'Referral links', icon: Link2 },
  { name: 'Activity', icon: RefreshCw },
  { name: 'Earnings & payouts', icon: Wallet },
  { name: 'KYC verification', icon: ShieldCheck },
  { name: 'Support sessions', icon: CircleHelp },
  { name: 'Notifications', icon: Bell },
  { name: 'Profile', icon: UserRound },
]

const initialProfile = {
  legalName: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
}

const initialShipping = {
  name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
}

const money = (value, currency = 'INR') => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

const minorMoney = (value, currency = 'INR') => money(Number(value || 0) / 100, currency)

const dateLabel = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)
}

const statusClass = (value) => `affiliate-status affiliate-status-${String(value || 'unknown').toLowerCase().replaceAll('_', '-')}`

function requestKey() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `affiliate-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-checkout]')
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', () => reject(new Error('Secure checkout could not be loaded. Please try again.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.dataset.razorpayCheckout = 'true'
    script.onload = resolve
    script.onerror = () => reject(new Error('Secure checkout could not be loaded. Please try again.'))
    document.body.appendChild(script)
  })
}

function normalizeAffiliatePhone(value) {
  const compact = value.replace(/[\s()-]/g, '')
  if (/^\d{10}$/.test(compact)) return `+91${compact}`
  if (/^91\d{10}$/.test(compact)) return `+${compact}`
  return compact
}

function PortalLogin({ onLogin, onSendOtp, onVerifyOtp, onClearError, error, busy }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [localError, setLocalError] = useState('')
  const isPhoneMode = mode !== 'login'

  const sendCode = async (event) => {
    event.preventDefault()
    const normalizedPhone = normalizeAffiliatePhone(phone)
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setLocalError('Enter a valid mobile number with country code, for example +91 98765 43210.')
      return
    }
    setLocalError('')
    try {
      await onSendOtp(normalizedPhone)
      setPhone(normalizedPhone)
      setOtpSent(true)
    } catch (sendError) {
      setLocalError(sendError.message)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    if (mode === 'create' && !name.trim()) {
      setLocalError('Enter your full name to create your account.')
      return
    }
    setLocalError('')
    await onVerifyOtp(phone, otp.trim(), mode === 'create' ? name.trim() : '')
  }

  return <main className="affiliate-auth">
    <section className="affiliate-auth-card">
      <aside className="affiliate-auth-story">
        <a className="affiliate-logo" href="/" aria-label="AyurvaPro member portal"><img src={logo} alt="AyurvaPro" /><span>PARTNER PROGRAM</span></a>
        <div className="affiliate-story-copy">
          <p className="affiliate-story-kicker"><Sparkles size={14} /> YOUR AFFILIATE WORKSPACE</p>
          <h1>Wellness grows better together.</h1>
          <p>Build meaningful connections and grow with a wellness brand that puts people first.</p>
        </div>
        <div className="affiliate-auth-steps">
          <strong>Your journey, made simple</strong>
          <span><i>1</i> Create an account and verify your phone.</span>
          <span><i>2</i> Complete your profile and programme documents.</span>
          <span><i>3</i> Choose an active package and check out.</span>
        </div>
        <div className="affiliate-story-foot">
          <ShieldCheck size={16} />
          <span>Secure access, no separate affiliate password. Affiliate membership is separate from MLM.</span>
        </div>
      </aside>
      <section className="affiliate-auth-panel">
        <div className="affiliate-auth-heading">
          <p className="affiliate-eyebrow">PARTNER PORTAL</p>
          <h2>{isPhoneMode ? (mode === 'create' ? 'Create your account' : 'Sign in with your phone') : 'Welcome back'}</h2>
          <p className="affiliate-muted">{isPhoneMode
            ? (mode === 'create' ? 'Create an AyurvaPro account with your mobile number to continue.' : 'We’ll text a one-time code to sign you in securely.')
            : 'Sign in with your AyurvaPro account, or create one with your mobile number.'}</p>
        </div>
        <div className="affiliate-auth-switch" role="group" aria-label="Choose sign-in option">
          <button type="button" aria-pressed={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setLocalError(''); onClearError() }}>Email &amp; password</button>
          <button type="button" aria-pressed={mode === 'create'} className={mode === 'create' ? 'active' : ''} onClick={() => { setMode('create'); setOtpSent(false); setOtp(''); setLocalError(''); onClearError() }}>Create account</button>
          <button type="button" aria-pressed={mode === 'otp-login'} className={mode === 'otp-login' ? 'active' : ''} onClick={() => { setMode('otp-login'); setOtpSent(false); setOtp(''); setLocalError(''); onClearError() }}>Phone OTP</button>
        </div>
        {!isPhoneMode ? <form className="affiliate-form" onSubmit={(event) => { event.preventDefault(); onLogin(email.trim(), password) }}>
          <label>Email address<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /></label>
          {(localError || error) && <p className="affiliate-error" role="alert">{localError || error}</p>}
          <button className="affiliate-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
        </form> : <form className="affiliate-form" onSubmit={otpSent ? verifyCode : sendCode}>
          {mode === 'create' && <label>Full name<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" /></label>}
          <label>Mobile number<input type="tel" autoComplete="tel" required disabled={otpSent} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" /></label>
          {otpSent && <label>One-time code<input inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter the code sent to your phone" /></label>}
          {(localError || error) && <p className="affiliate-error" role="alert">{localError || error}</p>}
          <button className="affiliate-primary" type="submit" disabled={busy || (otpSent && otp.trim().length < 4)}>
            {busy ? (otpSent ? 'Verifying…' : 'Sending code…') : otpSent ? (mode === 'create' ? 'Verify & continue' : 'Verify & sign in') : 'Send verification code'} <ArrowRight size={17} />
          </button>
          {otpSent && <button className="affiliate-text-button" type="button" disabled={busy} onClick={() => { setOtpSent(false); setOtp('') }}>Use a different number</button>}
        </form>}
        <a className="affiliate-back-link" href="/">Return to member portal <ArrowRight size={14} /></a>
      </section>
    </section>
  </main>
}

function AffiliatePortal() {
  const { showToast } = useToast()
  const [token, setToken] = useState(() => getAccessToken())
  const [status, setStatus] = useState(null)
  const [settings, setSettings] = useState(null)
  const [packages, setPackages] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [activity, setActivity] = useState(null)
  const [activityPage, setActivityPage] = useState(1)
  const [kyc, setKyc] = useState(null)
  const [payoutMethod, setPayoutMethod] = useState(null)
  const [payouts, setPayouts] = useState(null)
  const [supportSessions, setSupportSessions] = useState(null)
  const [notifications, setNotifications] = useState(null)
  const [sectionErrors, setSectionErrors] = useState({})
  const [loading, setLoading] = useState(Boolean(getAccessToken()))
  const [busy, setBusy] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [page, setPage] = useState('Overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [profileForm, setProfileForm] = useState(initialProfile)
  const [shipping, setShipping] = useState(initialShipping)
  const [selectedPackage, setSelectedPackage] = useState('')
  const [acceptedPolicies, setAcceptedPolicies] = useState({})
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [linkKind, setLinkKind] = useState('GENERAL')
  const [linkPackageId, setLinkPackageId] = useState('')
  const [kycForm, setKycForm] = useState({ legalName: '', dateOfBirth: '', pan: '', line1: '', line2: '', city: '', state: '', postalCode: '' })
  const [kycDocuments, setKycDocuments] = useState({ panDocument: null, identityDocument: null })
  const [kycConsent, setKycConsent] = useState(false)
  const [payoutForm, setPayoutForm] = useState({ method: 'UPI', holderName: '', upiId: '', accountNumber: '', ifsc: '' })
  const [payoutAmount, setPayoutAmount] = useState('')
  const [supportConsent, setSupportConsent] = useState(false)
  const [supportForm, setSupportForm] = useState({ entitlementId: '', scheduledAt: '' })
  const [profileEdit, setProfileEdit] = useState(false)
  const [packageOrderAttempt, setPackageOrderAttempt] = useState(null)
  const [payoutAttempt, setPayoutAttempt] = useState(null)

  const profile = status?.profile || null
  const user = status?.user || null
  const activeSection = useMemo(() => SECTIONS.find((item) => item.name === page), [page])
  const available = dashboard?.earnings?.available || 0

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'AyurvaPro | Affiliate Partner Workspace'
    return () => { document.title = previousTitle }
  }, [])

  const refresh = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    setSectionErrors({})
    try {
      const currentStatus = await api.getAffiliateProfileStatus()
      setLoginError('')
      setStatus(currentStatus)
      setProfileForm({
        legalName: currentStatus.profile?.profile?.legalName || '',
        dateOfBirth: currentStatus.profile?.profile?.dateOfBirth ? new Date(currentStatus.profile.profile.dateOfBirth).toISOString().slice(0, 10) : '',
        address: currentStatus.profile?.profile?.address || '',
        city: currentStatus.profile?.profile?.city || '',
        state: currentStatus.profile?.profile?.state || '',
        postalCode: currentStatus.profile?.profile?.postalCode || '',
      })
      setShipping((previous) => ({
        ...previous,
        name: currentStatus.profile?.profile?.legalName || currentStatus.user?.name || '',
        phone: currentStatus.user?.phone || '',
        address: currentStatus.profile?.profile?.address || previous.address,
        city: currentStatus.profile?.profile?.city || previous.city,
        state: currentStatus.profile?.profile?.state || previous.state,
        postalCode: currentStatus.profile?.profile?.postalCode || previous.postalCode,
      }))
      const settingsResult = await Promise.allSettled([
        api.getAffiliatePortalSettings(),
        api.getAffiliatePackages(),
      ])
      if (settingsResult[0].status === 'fulfilled') setSettings(settingsResult[0].value)
      else setSectionErrors((previous) => ({ ...previous, settings: settingsResult[0].reason.message }))
      if (settingsResult[1].status === 'fulfilled') setPackages(settingsResult[1].value)
      else setSectionErrors((previous) => ({ ...previous, packages: settingsResult[1].reason.message }))

      if (currentStatus.profile) {
        const requests = [
          ['dashboard', api.getAffiliateDashboard()],
          ['activity', api.getAffiliateActivity(1)],
          ['kyc', api.getAffiliateKycStatus()],
          ['payoutMethod', api.getAffiliatePayoutMethod()],
          ['payouts', api.getAffiliatePayouts()],
          ['supportSessions', api.getAffiliateSupportSessions()],
          ['notifications', api.getAffiliateNotifications()],
        ]
        const results = await Promise.allSettled(requests.map(([, request]) => request))
        const nextErrors = {}
        results.forEach((result, index) => {
          const [key] = requests[index]
          if (result.status === 'fulfilled') {
            if (key === 'dashboard') setDashboard(result.value)
            if (key === 'activity') setActivity(result.value)
            if (key === 'kyc') setKyc(result.value)
            if (key === 'payoutMethod') setPayoutMethod(result.value)
            if (key === 'payouts') setPayouts(result.value)
            if (key === 'supportSessions') setSupportSessions(result.value)
            if (key === 'notifications') setNotifications(result.value)
          } else {
            nextErrors[key] = result.reason.message
          }
        })
        setSectionErrors((previous) => ({ ...previous, ...nextErrors }))
      } else {
        setDashboard(null)
        setActivity(null)
        setActivityPage(1)
        setKyc(null)
        setPayoutMethod(null)
        setPayouts(null)
        setSupportSessions(null)
        setNotifications(null)
      }
    } catch (error) {
      if (error.message.includes('Not authorized') || error.message.includes('token')) {
        clearAccessToken()
        setToken(null)
      } else {
        setLoginError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (token) void refresh()
      else setLoading(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [token, refresh])

  const handleLogin = async (email, password) => {
    setBusy(true)
    setLoading(true)
    setLoginError('')
    try {
      const result = await api.login(email, password)
      if (!result?.token) throw new Error(result?.message || 'This account could not complete affiliate sign-in. Please use a customer or affiliate account.')
      setAccessToken(result.token)
      setToken(result.token)
      showToast('Signed in to your affiliate workspace.')
    } catch (error) {
      setLoginError(error.message)
      setLoading(false)
    } finally {
      setBusy(false)
    }
  }

  const sendAffiliateOtp = async (phone) => {
    setBusy(true)
    setLoginError('')
    try {
      await api.sendPhoneOtp(phone)
    } finally {
      setBusy(false)
    }
  }

  const verifyAffiliateOtp = async (phone, otp, name) => {
    setBusy(true)
    setLoading(true)
    setLoginError('')
    try {
      const result = await api.verifyPhoneOtp(phone, otp)
      if (!result?.token) throw new Error('Phone verification did not return a sign-in token. Please try again.')
      let token = result.token
      let profileNameError = ''
      setAccessToken(token)
      if (name) {
        try {
          const updated = await api.updateProfile({ name })
          if (updated?.token) token = updated.token
          setAccessToken(token)
        } catch (error) {
          profileNameError = `Account created, but the name could not be saved to your profile. You can enter it in the affiliate application. ${error.message}`
        }
      }
      setToken(token)
      if (profileNameError) showToast(profileNameError, 'error')
      else showToast(name ? 'Account created. Continue with your affiliate application.' : 'Signed in with your mobile number.')
    } catch (error) {
      setLoginError(error.message)
      setLoading(false)
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    setBusy(true)
    try {
      await api.logout()
      showToast('You have signed out.')
    } catch (error) {
      showToast(`Signed out on this device. Server sign-out could not be confirmed: ${error.message}`, 'error')
    } finally {
      clearAccessToken()
      setToken(null)
      setStatus(null)
      setSettings(null)
      setPackages([])
      setDashboard(null)
      setActivity(null)
      setKyc(null)
      setPayoutMethod(null)
      setPayouts(null)
      setSupportSessions(null)
      setNotifications(null)
      setBusy(false)
    }
  }

  const verifyPhone = async () => {
    setBusy(true)
    try {
      if (!otpSent) {
        await api.sendPhoneOtp(user.phone)
        setOtpSent(true)
        showToast('Verification code sent to your registered phone.')
      } else {
        const verified = await api.verifyPhoneOtp(user.phone, otpCode.trim())
        if (verified?.token) {
          setAccessToken(verified.token)
          setToken(verified.token)
        }
        setOtpSent(false)
        setOtpCode('')
        await refresh(false)
        showToast('Mobile number verified.')
      }
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const enroll = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const policies = settings?.policies
      if (!settings?.enabled || !policies) throw new Error('Affiliate enrollment is not currently available.')
      await api.enrollAffiliate({
        profile: profileForm,
        affiliateAgreementVersion: policies.affiliateAgreementVersion,
        termsVersion: policies.termsVersion,
        privacyVersion: policies.privacyVersion,
      })
      await refresh(false)
      showToast('Application saved. Continue with the active affiliate package to proceed.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const payForPackage = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const selected = packages.find((item) => item._id === selectedPackage)
      if (!selected) throw new Error('Select an active package first.')
      const signature = JSON.stringify({ packageId: selected._id, shipping })
      const idempotencyKey = packageOrderAttempt?.signature === signature ? packageOrderAttempt.key : requestKey()
      setPackageOrderAttempt({ signature, key: idempotencyKey })
      const order = await api.createAffiliatePackageOrder(selected._id, shipping, idempotencyKey)
      const paymentOrder = await api.createPaymentOrder(order._id)
      await loadRazorpay()
      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: paymentOrder.keyId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: 'AyurvaPro',
          description: `${selected.name} affiliate package`,
          order_id: paymentOrder.orderId,
          prefill: { name: user?.name || shipping.name, email: user?.email || '' },
          theme: { color: '#315b4e' },
          handler: async (response) => {
            try {
              await api.verifyPayment(response)
              await refresh(false)
              resolve()
            } catch (error) {
              reject(error)
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment was not completed. Your order reservation will expire automatically.')) },
        })
        checkout.on('payment.failed', (response) => reject(new Error(response.error?.description || 'Payment failed. Please try again.')))
        checkout.open()
      })
      showToast('Payment verified. Your affiliate activation status is being updated.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const createLink = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      if (linkKind === 'PACKAGE' && !linkPackageId) throw new Error('Select an active package for this referral link.')
      await api.createAffiliateLink({ kind: linkKind, ...(linkKind === 'PACKAGE' ? { packageId: linkPackageId } : {}) })
      await refresh(false)
      showToast('Referral link created.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const savePayoutMethod = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await api.setAffiliatePayoutMethod(payoutForm)
      await refresh(false)
      showToast('Payout method submitted for verification. Full account details are not stored in the portal.')
      setPayoutForm((previous) => ({ ...previous, accountNumber: '', upiId: '' }))
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const requestPayout = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const idempotencyKey = payoutAttempt?.amount === payoutAmount ? payoutAttempt.key : requestKey()
      setPayoutAttempt({ amount: payoutAmount, key: idempotencyKey })
      await api.requestAffiliatePayout(payoutAmount, idempotencyKey)
      setPayoutAmount('')
      setPayoutAttempt(null)
      await refresh(false)
      showToast('Payout request submitted.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const submitKyc = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      if (!settings?.policies?.kycConsentVersion) throw new Error('Current KYC consent policy is unavailable.')
      if (!kycConsent) throw new Error('Accept the current KYC privacy consent before submitting documents.')
      await api.recordAffiliateConsent('PAYOUT_KYC', settings.policies.kycConsentVersion, true)
      const formData = new FormData()
      formData.append('legalName', kycForm.legalName)
      formData.append('dateOfBirth', kycForm.dateOfBirth)
      formData.append('pan', kycForm.pan)
      formData.append('address[line1]', kycForm.line1)
      formData.append('address[line2]', kycForm.line2)
      formData.append('address[city]', kycForm.city)
      formData.append('address[state]', kycForm.state)
      formData.append('address[postalCode]', kycForm.postalCode)
      if (kycDocuments.panDocument) formData.append('panDocument', kycDocuments.panDocument)
      if (kycDocuments.identityDocument) formData.append('identityDocument', kycDocuments.identityDocument)
      await api.submitAffiliateKyc(formData)
      await refresh(false)
      showToast('KYC documents submitted for review.')
      setKycConsent(false)
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const scheduleSupport = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      if (!settings?.policies?.supportConsentVersion) throw new Error('Current support consent policy is unavailable.')
      if (!supportConsent) throw new Error('Consent is required before scheduling a support session.')
      await api.recordAffiliateConsent('DOCTOR_SUPPORT', settings.policies.supportConsentVersion, true)
      await api.scheduleAffiliateSupport(supportForm.entitlementId, new Date(supportForm.scheduledAt).toISOString())
      await refresh(false)
      showToast('Support session scheduled.')
      setSupportConsent(false)
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const markRead = async (id) => {
    try {
      await api.markAffiliateNotificationRead(id)
      await refresh(false)
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const loadActivityPage = async (nextPage) => {
    setBusy(true)
    try {
      const result = await api.getAffiliateActivity(nextPage)
      setActivity(result)
      setActivityPage(result.page)
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await api.updateAffiliateProfile(profileForm)
      await refresh(false)
      setProfileEdit(false)
      showToast('Profile updated.')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const downloadReferralQr = async (url, link) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, width: 320 })
      const download = document.createElement('a')
      download.href = dataUrl
      download.download = `ayurvapro-${String(link.kind || 'referral').toLowerCase()}-qr.png`
      document.body.appendChild(download)
      download.click()
      download.remove()
    } catch (error) {
      showToast(`Could not create the QR code: ${error.message}`, 'error')
    }
  }

  if (loading) return <main className="affiliate-loading"><span className="affiliate-spinner" /> Loading your affiliate workspace…</main>
  if (!token) return <PortalLogin onLogin={handleLogin} onSendOtp={sendAffiliateOtp} onVerifyOtp={verifyAffiliateOtp} onClearError={() => setLoginError('')} error={loginError} busy={busy} />

  const title = page === 'Overview' ? `Welcome, ${(user?.name || 'partner').split(' ')[0]}` : page
  const description = page === 'Overview'
    ? 'Your affiliate programme status, activity, and next steps in one place.'
    : 'Manage your information using the current affiliate programme services.'

  const renderEnrollment = () => {
    if (!profile) {
      const policies = settings?.policies
      return <section className="affiliate-card affiliate-onboarding">
        <div className="affiliate-card-heading"><span className="affiliate-icon"><FileCheck2 size={20} /></span><div><h2>Your affiliate application</h2><p>You’re signed in, but you are not enrolled as an affiliate yet. Enrollment is separate from creating your AyurvaPro account.</p></div></div>
        {!settings?.enabled ? <div className="affiliate-notice"><strong>Affiliate applications are currently closed.</strong><span>No application has been submitted and no affiliate ID has been issued. Enrollment can begin once the approved programme configuration is active. Please check back later.</span></div>
          : <form className="affiliate-form affiliate-form-grid" onSubmit={enroll}>
            {!status?.phoneVerifiedAt && <div className="affiliate-notice affiliate-form-wide"><strong>Verify your registered mobile number to continue.</strong><span>{user?.phone ? `We’ll send a one-time code to ${user.phone}.` : 'No phone number is attached to this account. Contact support to update it.'}</span>
              {user?.phone && (otpSent ? <div className="affiliate-inline-field"><input aria-label="Verification code" inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="Enter verification code" /><button className="affiliate-secondary" type="button" disabled={busy || otpCode.trim().length < 4} onClick={verifyPhone}>Verify code</button></div>
                : <button className="affiliate-secondary" type="button" disabled={busy} onClick={verifyPhone}>Send verification code</button>)}
            </div>}
            <label>Legal name<input required value={profileForm.legalName} onChange={(event) => setProfileForm({ ...profileForm, legalName: event.target.value })} /></label>
            <label>Date of birth<input type="date" required value={profileForm.dateOfBirth} onChange={(event) => setProfileForm({ ...profileForm, dateOfBirth: event.target.value })} /></label>
            <label className="affiliate-form-wide">Address<input required value={profileForm.address} onChange={(event) => setProfileForm({ ...profileForm, address: event.target.value })} /></label>
            <label>City<input required value={profileForm.city} onChange={(event) => setProfileForm({ ...profileForm, city: event.target.value })} /></label>
            <label>State<input required value={profileForm.state} onChange={(event) => setProfileForm({ ...profileForm, state: event.target.value })} /></label>
            <label>Postal code<input required value={profileForm.postalCode} onChange={(event) => setProfileForm({ ...profileForm, postalCode: event.target.value })} /></label>
            {policies && <div className="affiliate-policy-list affiliate-form-wide">
              <p>These are the current policy versions on file. Confirm that you have been provided the official documents before accepting; contact support if you have not.</p>
              {[
                ['affiliateAgreementVersion', 'Affiliate agreement'],
                ['termsVersion', 'Terms of service'],
                ['privacyVersion', 'Privacy notice'],
              ].map(([key, label]) => <label className="affiliate-check" key={key}><input type="checkbox" checked={Boolean(acceptedPolicies[key])} onChange={(event) => setAcceptedPolicies({ ...acceptedPolicies, [key]: event.target.checked })} /><span>I accept {label} <strong>{policies[key]}</strong></span></label>)}
            </div>}
            <button className="affiliate-primary affiliate-form-wide" type="submit" disabled={busy || !status?.phoneVerifiedAt || !policies || !acceptedPolicies.affiliateAgreementVersion || !acceptedPolicies.termsVersion || !acceptedPolicies.privacyVersion}>{busy ? 'Saving application…' : 'Submit affiliate application'} <ArrowRight size={17} /></button>
          </form>}
        {sectionErrors.settings && <p className="affiliate-error" role="alert">{sectionErrors.settings}</p>}
      </section>
    }

    if (profile.status === 'PENDING_PAYMENT') return <section className="affiliate-card affiliate-onboarding">
      <div className="affiliate-card-heading"><span className="affiliate-icon"><Wallet size={20} /></span><div><h2>Complete package checkout</h2><p>Your application is saved. Choose an active package and pay through Razorpay to continue.</p></div></div>
      {sectionErrors.packages && <p className="affiliate-error" role="alert">{sectionErrors.packages}</p>}
      {settings?.enabled && packages.length ? <form className="affiliate-form" onSubmit={payForPackage}>
        <div className="affiliate-package-grid">{packages.map((item) => <label className={`affiliate-package-choice ${selectedPackage === item._id ? 'selected' : ''}`} key={item._id}>
          <input type="radio" name="affiliatePackage" value={item._id} checked={selectedPackage === item._id} onChange={() => setSelectedPackage(item._id)} />
          <span className="affiliate-package-name">{item.name} · v{item.version}</span>
          <strong>{money(item.offerPrice)}</strong>
          <small>MRP {money(item.mrp)} · {item.durationMonths} month programme</small>
          <small>Video reward setting: {money(item.videoReward)} · {item.dailyReferralCap} daily cap · {item.rewardWindowDays}-day window</small>
          <small>Doctor support: {item.doctorSessionsPerMonth} session(s) per month</small>
          <span className="affiliate-package-products">{item.items?.map((entry) => `${entry.nameSnapshot} × ${entry.quantity}`).join(' · ') || 'Product details unavailable'}</span>
        </label>)}</div>
        <div className="affiliate-form-grid">
          <label>Recipient name<input required value={shipping.name} onChange={(event) => setShipping({ ...shipping, name: event.target.value })} /></label>
          <label>Phone<input required type="tel" value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} /></label>
          <label className="affiliate-form-wide">Shipping address<input required value={shipping.address} onChange={(event) => setShipping({ ...shipping, address: event.target.value })} /></label>
          <label>City<input required value={shipping.city} onChange={(event) => setShipping({ ...shipping, city: event.target.value })} /></label>
          <label>State<input required value={shipping.state} onChange={(event) => setShipping({ ...shipping, state: event.target.value })} /></label>
          <label>Postal code<input required value={shipping.postalCode} onChange={(event) => setShipping({ ...shipping, postalCode: event.target.value })} /></label>
          <label>Country<input required value={shipping.country} onChange={(event) => setShipping({ ...shipping, country: event.target.value })} /></label>
        </div>
        <div className="affiliate-notice"><strong>Secure payment</strong><span>Your order price and package contents are validated by the server. Payment is confirmed by Razorpay before affiliate activation.</span></div>
        <button className="affiliate-primary" type="submit" disabled={busy || !settings?.enabled || !selectedPackage}>{busy ? 'Opening secure checkout…' : 'Continue to secure payment'} <ArrowRight size={17} /></button>
      </form> : <div className="affiliate-notice"><strong>Packages are not available.</strong><span>{settings?.enabled ? 'No active affiliate packages are configured right now.' : 'The affiliate programme is currently unavailable.'}</span></div>}
    </section>

    if (profile.status !== 'ACTIVE' && profile.status !== 'REWARD_WINDOW_EXPIRED') return <section className="affiliate-card affiliate-onboarding">
      <div className="affiliate-card-heading"><span className="affiliate-icon"><FileCheck2 size={20} /></span><div><h2>Application status</h2><p>Your application is saved and awaiting the next programme step.</p></div></div>
      <div className="affiliate-status-row"><span>Current status</span><strong className={statusClass(profile.status)}>{profile.status?.replaceAll('_', ' ')}</strong></div>
      {profile.statusReason && <p className="affiliate-notice">{profile.statusReason}</p>}
      <button className="affiliate-secondary" onClick={() => refresh()}>Refresh status <RefreshCw size={15} /></button>
    </section>
    return null
  }

  const renderOverview = () => {
    if (profile?.status !== 'ACTIVE' && profile?.status !== 'REWARD_WINDOW_EXPIRED') return renderEnrollment()
    if (!dashboard) return <section className="affiliate-card"><div className="affiliate-notice"><strong>Partner dashboard is not available yet.</strong><span>{sectionErrors.dashboard || 'Your application is visible, but this account does not yet have affiliate dashboard access. Activation and role approval are managed by the programme team.'}</span></div><button className="affiliate-secondary" onClick={() => refresh()}>Try again <RefreshCw size={15} /></button></section>
    const wallet = dashboard.earnings || {}
    return <>
      <div className="affiliate-status-banner"><div><span className="affiliate-eyebrow">PARTNER STATUS</span><strong>{dashboard.affiliate?.status?.replaceAll('_', ' ') || '—'}</strong></div><span className={statusClass(dashboard.affiliate?.status)}>{dashboard.affiliate?.packageTier || 'Affiliate'}</span><small>Partner ID {dashboard.affiliate?.affiliateId || '—'}</small></div>
      {dashboard.affiliate?.status === 'REWARD_WINDOW_EXPIRED' && <div className="affiliate-notice"><strong>Reward window ended.</strong><span>Your current reward window has expired. Any renewal options depend on the active programme configuration.</span></div>}
      <div className="affiliate-stat-grid">
        <article className="affiliate-stat-card"><span>Available balance</span><strong>{minorMoney(wallet.available, wallet.currency)}</strong><small>Ready for a payout request</small></article>
        <article className="affiliate-stat-card"><span>Pending rewards</span><strong>{minorMoney(wallet.pending, wallet.currency)}</strong><small>Subject to review and programme rules</small></article>
        <article className="affiliate-stat-card"><span>Attributed package sales</span><strong>{dashboard.attributedPackageSales ?? '—'}</strong><small>Paid, non-cancelled partner-package orders</small></article>
        <article className="affiliate-stat-card"><span>Referral events</span><strong>{Object.values(dashboard.eventCounts || {}).reduce((sum, count) => sum + Number(count || 0), 0)}</strong><small>Recorded across your links</small></article>
      </div>
      <div className="affiliate-content-grid">
        <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Today’s referral tracker</h2><p>{dashboard.dailyReferralTracker?.date || 'Current India Standard Time day'}</p></div><RefreshCw size={18} /></div>
          {dashboard.dailyReferralTracker?.cap == null
            ? <p className="affiliate-empty">No daily limit is configured for the current package.</p>
            : <div className="affiliate-window">
              <div><span>Configured daily cap</span><strong>{dashboard.dailyReferralTracker.cap}</strong></div>
              <div><span>Approved / reserved</span><strong>{dashboard.dailyReferralTracker.approved || 0} / {dashboard.dailyReferralTracker.reserved || 0}</strong></div>
            </div>}
          <p className="affiliate-inline-hint">Daily totals use the server’s India Standard Time date. Reserved events may still be reviewed.</p>
        </section>
        <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Current package</h2><p>Effective package snapshot attached to your account</p></div><Sparkles size={18} /></div>
          {dashboard.affiliate?.activePackage ? <>
            <div className="affiliate-package-summary"><strong>{dashboard.affiliate.activePackage.name} · {dashboard.affiliate.activePackage.code}</strong><span>Version {dashboard.affiliate.activePackage.version} · {dashboard.affiliate.activePackage.durationMonths} months</span></div>
            <div className="affiliate-event-list">
              <div><span>Offer / MRP</span><strong>{money(dashboard.affiliate.activePackage.offerPrice)} / {money(dashboard.affiliate.activePackage.mrp)}</strong></div>
              <div><span>Configured video reward</span><strong>{money(dashboard.affiliate.activePackage.videoReward)}</strong></div>
              <div><span>Daily limit / reward window</span><strong>{dashboard.affiliate.activePackage.dailyReferralCap} / {dashboard.affiliate.activePackage.rewardWindowDays} days</strong></div>
              <div><span>Doctor sessions per month</span><strong>{dashboard.affiliate.activePackage.doctorSessionsPerMonth}</strong></div>
            </div>
            <p className="affiliate-inline-hint">Rewards and support remain subject to current approved programme rules and eligibility.</p>
          </> : <p className="affiliate-empty">No active package snapshot is attached to this account.</p>}
        </section>
        <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Reward window</h2><p>Current server-managed qualification period</p></div><Sparkles size={18} /></div>
          {dashboard.rewardWindow ? <div className="affiliate-window"><div><span>Starts</span><strong>{dateLabel(dashboard.rewardWindow.startsAt)}</strong></div><div><span>Ends</span><strong>{dateLabel(dashboard.rewardWindow.endsAt)}</strong></div></div> : <p className="affiliate-empty">No active reward window is currently attached to this account.</p>}
          <div className="affiliate-event-list">{Object.entries(dashboard.eventCounts || {}).map(([event, count]) => <div key={event}><span>{event.replaceAll('_', ' ').toLowerCase()}</span><strong>{count}</strong></div>)}</div>
        </section>
        <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Recent commissions</h2><p>Most recent backend records</p></div><BadgeIndianRupee size={18} /></div>
          {dashboard.commissions?.slice(0, 5).map((commission) => <div className="affiliate-list-row" key={commission._id}><div><strong>{commission.packageSnapshot?.name || 'Package commission'}</strong><small>{dateLabel(commission.createdAt)}</small></div><span className={statusClass(commission.status)}>{commission.status || '—'}</span><b>{money(commission.commissionAmount, commission.currency || 'INR')}</b></div>)}
          {!dashboard.commissions?.length && <p className="affiliate-empty">No commission records yet.</p>}
        </section>
      </div>
      {sectionErrors.dashboard && <p className="affiliate-error" role="alert">{sectionErrors.dashboard}</p>}
    </>
  }

  const renderLinks = () => <div className="affiliate-content-grid affiliate-links-layout">
    <section className="affiliate-card"><div className="affiliate-card-heading"><span className="affiliate-icon"><Link2 size={20} /></span><div><h2>Create a referral link</h2><p>Only active, server-configured link types are available.</p></div></div>
      <form className="affiliate-form" onSubmit={createLink}><label>Link type<select value={linkKind} onChange={(event) => setLinkKind(event.target.value)}><option value="GENERAL">General</option><option value="PACKAGE">Package</option></select></label>
        {linkKind === 'PACKAGE' && <label>Active package<select required value={linkPackageId} onChange={(event) => setLinkPackageId(event.target.value)}><option value="">Select a package</option>{packages.map((item) => <option value={item._id} key={item._id}>{item.name} · v{item.version} · {item.durationMonths} months · {money(item.offerPrice)}</option>)}</select></label>}
        <button className="affiliate-primary" disabled={busy || !dashboard || (linkKind === 'PACKAGE' && !linkPackageId)}>{busy ? 'Creating…' : 'Create link'} <ArrowRight size={16} /></button>
      </form>
    </section>
    <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Your referral links</h2><p>Share links are connected to the public referral tracking page.</p></div><Link2 size={18} /></div>
      {dashboard?.referralLinks?.map((link) => {
        const url = STOREFRONT_URL ? `${STOREFRONT_URL}/refer-and-earn?affiliate_ref=${encodeURIComponent(link.token)}` : ''
        return <div className="affiliate-link-row" key={link._id}>
          <div><strong>{link.kind}{link.package?.name ? ` · ${link.package.name}` : ''}{link.campaign?.name ? ` · ${link.campaign.name}` : ''}</strong><small>{dateLabel(link.createdAt)}</small>
            {url ? <code>{url}</code> : <code>Token: {link.token}</code>}
          </div>
          {url ? <div className="affiliate-link-actions"><button className="affiliate-icon-button" aria-label="Copy referral link" onClick={async () => {
            try {
              if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable.')
              await navigator.clipboard.writeText(url)
              showToast('Referral link copied.')
            } catch {
              showToast('Could not access the clipboard. Copy the link manually.', 'error')
            }
          }}><Clipboard size={17} /></button><button className="affiliate-secondary affiliate-qr-button" onClick={() => downloadReferralQr(url, link)}><ArrowDownToLine size={15} /> Download QR</button></div> : <span className="affiliate-unavailable">Set VITE_STOREFRONT_URL to create shareable URLs.</span>}
        </div>
      })}
      {!dashboard?.referralLinks?.length && <p className="affiliate-empty">No referral links created yet.</p>}
      {sectionErrors.dashboard && <p className="affiliate-error" role="alert">{sectionErrors.dashboard}</p>}
    </section>
  </div>

  const renderActivity = () => <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Referral activity</h2><p>Paginated event records returned by the affiliate API</p></div><RefreshCw size={18} /></div>
    {sectionErrors.activity && <p className="affiliate-error" role="alert">{sectionErrors.activity}</p>}
    {activity?.events?.length ? <div className="affiliate-table-wrap"><table className="affiliate-table"><thead><tr><th>EVENT</th><th>STATUS</th><th>REASON</th><th>DATE</th></tr></thead><tbody>{activity.events.map((event) => <tr key={event._id}><td>{event.eventType?.replaceAll('_', ' ') || '—'}</td><td><span className={statusClass(event.status)}>{event.status || '—'}</span></td><td>{event.reasonCode?.replaceAll('_', ' ') || '—'}</td><td>{dateLabel(event.eventAt || event.createdAt)}</td></tr>)}</tbody></table></div> : <p className="affiliate-empty">No activity events have been recorded.</p>}
    <div className="affiliate-pagination"><span>Page {activity?.page || activityPage} of {Math.max(1, Math.ceil((activity?.total || 0) / (activity?.limit || 25)))} · {activity?.total || 0} total events</span><div><button className="affiliate-secondary" disabled={busy || (activity?.page || activityPage) <= 1} onClick={() => loadActivityPage((activity?.page || activityPage) - 1)}>Previous</button><button className="affiliate-secondary" disabled={busy || (activity?.page || activityPage) >= Math.ceil((activity?.total || 0) / (activity?.limit || 25))} onClick={() => loadActivityPage((activity?.page || activityPage) + 1)}>Next</button></div></div>
  </section>

  const renderEarnings = () => <div className="affiliate-content-grid">
    <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Earnings wallet</h2><p>All balances are returned in integer minor units by the ledger.</p></div><Wallet size={18} /></div>
      <div className="affiliate-wallet-grid">{[['Pending', 'pending'], ['Approved', 'approved'], ['Available', 'available'], ['On hold', 'onHold'], ['Reserved', 'reserved'], ['Paid lifetime', 'paidLifetime']].map(([label, key]) => <div key={key}><span>{label}</span><strong>{minorMoney(dashboard?.earnings?.[key], dashboard?.earnings?.currency)}</strong></div>)}</div>
      <h3 className="affiliate-subheading">Payout method</h3>
      {payoutMethod ? <div className="affiliate-method-status"><strong>{payoutMethod.method} · ending {payoutMethod.destinationLastFour || '—'}</strong><span className={statusClass(payoutMethod.status)}>{payoutMethod.status}</span><small>{payoutMethod.holderName} · Never display or share your complete account details.</small></div>
        : <p className="affiliate-empty">No payout method is on file.</p>}
      {sectionErrors.payoutMethod && <p className="affiliate-error" role="alert">{sectionErrors.payoutMethod}</p>}
      <form className="affiliate-form affiliate-form-grid" onSubmit={savePayoutMethod}>
        <h3 className="affiliate-subheading affiliate-form-wide">Add or update payout method</h3>
        <label>Method<select value={payoutForm.method} onChange={(event) => setPayoutForm({ ...payoutForm, method: event.target.value })}><option value="UPI">UPI</option><option value="BANK">Bank account</option></select></label>
        <label>Account holder name<input required value={payoutForm.holderName} onChange={(event) => setPayoutForm({ ...payoutForm, holderName: event.target.value })} /></label>
        {payoutForm.method === 'UPI' ? <label className="affiliate-form-wide">UPI ID<input required value={payoutForm.upiId} onChange={(event) => setPayoutForm({ ...payoutForm, upiId: event.target.value })} autoComplete="off" /></label>
          : <><label>Account number<input required inputMode="numeric" value={payoutForm.accountNumber} onChange={(event) => setPayoutForm({ ...payoutForm, accountNumber: event.target.value })} autoComplete="off" /></label><label>IFSC code<input required value={payoutForm.ifsc} onChange={(event) => setPayoutForm({ ...payoutForm, ifsc: event.target.value.toUpperCase() })} autoComplete="off" /></label></>}
        <p className="affiliate-inline-hint affiliate-form-wide">Details are encrypted by the backend and displayed in masked form after submission. Method changes are blocked while a payout is in progress.</p>
        <button className="affiliate-secondary affiliate-form-wide" disabled={busy}>{busy ? 'Submitting…' : 'Submit payout method'} <ArrowRight size={15} /></button>
      </form>
    </section>
    <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Request a payout</h2><p>{settings?.payout ? `Minimum ${money(settings.payout.minimum, settings.payout.currency)} · ${settings.payout.requiresKyc ? 'KYC approval required' : 'KYC not required by current configuration'}` : 'Payout requirements are not currently available.'}</p></div><ArrowDownToLine size={18} /></div>
      <div className="affiliate-available"><span>Available to request</span><strong>{minorMoney(available, dashboard?.earnings?.currency)}</strong></div>
      <form className="affiliate-form" onSubmit={requestPayout}><label>Amount<input required type="number" step="0.01" min={settings?.payout?.minimum || '0.01'} value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} /></label>
        <button className="affiliate-primary" disabled={busy || !settings?.enabled || !payoutMethod || payoutMethod.status !== 'VERIFIED'}>{busy ? 'Submitting…' : 'Request payout'} <ArrowRight size={16} /></button>
        {(!payoutMethod || payoutMethod.status !== 'VERIFIED') && <p className="affiliate-inline-hint">A verified bank or UPI method is required before payouts can be requested.</p>}
      </form>
      <h3 className="affiliate-subheading">Payout history</h3>
      {sectionErrors.payouts && <p className="affiliate-error" role="alert">{sectionErrors.payouts}</p>}
      {payouts?.map((item) => <div className="affiliate-list-row" key={item._id}><div><strong>{dateLabel(item.requestedAt || item.createdAt)}</strong><small>{item.method?.method || item.methodSnapshot?.method} · ending {item.method?.destinationLastFour || item.methodSnapshot?.destinationLastFour || '—'}</small></div><span className={statusClass(item.status)}>{item.status}</span><b>{money(item.amount, item.currency || 'INR')}</b></div>)}
      {!payouts?.length && <p className="affiliate-empty">No payout requests yet.</p>}
    </section>
  </div>

  const renderKyc = () => <div className="affiliate-content-grid">
    <section className="affiliate-card"><div className="affiliate-card-heading"><span className="affiliate-icon"><ShieldCheck size={20} /></span><div><h2>KYC verification</h2><p>Documents are encrypted and reviewed by authorized programme staff.</p></div></div>
      {sectionErrors.kyc && <p className="affiliate-error" role="alert">{sectionErrors.kyc}</p>}
      {kyc ? <div className="affiliate-kyc-status"><span className={statusClass(kyc.status)}>{kyc.status}</span><p>PAN ending {kyc.panLastFour || '—'} · Version {kyc.version || '—'} · Submitted {dateLabel(kyc.submittedAt)}</p>{kyc.rejectionReason && <p className="affiliate-error">{kyc.rejectionReason}</p>}</div> : <p className="affiliate-empty">No KYC application found.</p>}
      {settings?.payout?.requiresKyc && <p className="affiliate-inline-hint">The current payout configuration requires approved KYC before a payout request.</p>}
    </section>
    <section className="affiliate-card"><h2>Submit KYC documents</h2><p className="affiliate-muted">Upload a PAN document and identity document as PDF, JPEG, or PNG (maximum 3 MB each).</p>
      <form className="affiliate-form affiliate-form-grid" onSubmit={submitKyc}>
        <label>Legal name<input required value={kycForm.legalName} onChange={(event) => setKycForm({ ...kycForm, legalName: event.target.value })} /></label>
        <label>Date of birth<input type="date" required value={kycForm.dateOfBirth} onChange={(event) => setKycForm({ ...kycForm, dateOfBirth: event.target.value })} /></label>
        <label>PAN<input required maxLength={10} value={kycForm.pan} onChange={(event) => setKycForm({ ...kycForm, pan: event.target.value.toUpperCase() })} /></label>
        <label className="affiliate-form-wide">Address line 1<input required value={kycForm.line1} onChange={(event) => setKycForm({ ...kycForm, line1: event.target.value })} /></label>
        <label className="affiliate-form-wide">Address line 2<input value={kycForm.line2} onChange={(event) => setKycForm({ ...kycForm, line2: event.target.value })} /></label>
        <label>City<input required value={kycForm.city} onChange={(event) => setKycForm({ ...kycForm, city: event.target.value })} /></label>
        <label>State<input required value={kycForm.state} onChange={(event) => setKycForm({ ...kycForm, state: event.target.value })} /></label>
        <label>Postal code<input required value={kycForm.postalCode} onChange={(event) => setKycForm({ ...kycForm, postalCode: event.target.value })} /></label>
        <label>PAN document<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setKycDocuments({ ...kycDocuments, panDocument: event.target.files?.[0] || null })} /></label>
        <label>Identity document<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setKycDocuments({ ...kycDocuments, identityDocument: event.target.files?.[0] || null })} /></label>
        <label className="affiliate-check affiliate-form-wide"><input type="checkbox" checked={kycConsent} onChange={(event) => setKycConsent(event.target.checked)} /><span>I consent to KYC and payout privacy processing under version <strong>{settings?.policies?.kycConsentVersion || 'unavailable'}</strong>.</span></label>
        <button className="affiliate-primary affiliate-form-wide" disabled={busy || !settings?.enabled || !kycConsent}>{busy ? 'Uploading securely…' : 'Submit for KYC review'} <ArrowRight size={16} /></button>
      </form>
    </section>
  </div>

  const renderSupport = () => <div className="affiliate-content-grid">
    <section className="affiliate-card"><div className="affiliate-card-heading"><span className="affiliate-icon"><CircleHelp size={20} /></span><div><h2>Support entitlements</h2><p>Sessions and availability come from your active package entitlements.</p></div></div>
      {dashboard?.supportEntitlements?.map((entitlement) => <div className="affiliate-list-row" key={entitlement._id}><div><strong>{entitlement.totalSessions - entitlement.usedSessions} of {entitlement.totalSessions} sessions remaining</strong><small>Available through {dateLabel(entitlement.endsAt)}</small></div><span className={statusClass(entitlement.status)}>{entitlement.status}</span></div>)}
      {!dashboard?.supportEntitlements?.length && <p className="affiliate-empty">No active support entitlements are attached to this account.</p>}
      {sectionErrors.supportSessions && <p className="affiliate-error" role="alert">{sectionErrors.supportSessions}</p>}
    </section>
    <section className="affiliate-card"><h2>Schedule a session</h2>
      {dashboard?.supportEntitlements?.length ? <form className="affiliate-form" onSubmit={scheduleSupport}>
        <label>Entitlement<select required value={supportForm.entitlementId} onChange={(event) => setSupportForm({ ...supportForm, entitlementId: event.target.value })}><option value="">Select available entitlement</option>{dashboard.supportEntitlements.filter((item) => item.usedSessions < item.totalSessions).map((item) => <option value={item._id} key={item._id}>{item.totalSessions - item.usedSessions} session(s) · until {dateLabel(item.endsAt)}</option>)}</select></label>
        <label>Appointment time<input type="datetime-local" required value={supportForm.scheduledAt} onChange={(event) => setSupportForm({ ...supportForm, scheduledAt: event.target.value })} /></label>
        <label className="affiliate-check"><input type="checkbox" checked={supportConsent} onChange={(event) => setSupportConsent(event.target.checked)} /><span>I consent to doctor support under version <strong>{settings?.policies?.supportConsentVersion || 'unavailable'}</strong>.</span></label>
        <button className="affiliate-primary" disabled={busy || !settings?.enabled || !supportConsent}>{busy ? 'Scheduling…' : 'Schedule support session'} <ArrowRight size={16} /></button>
      </form> : <p className="affiliate-empty">There are no sessions available to schedule at this time.</p>}
      {supportSessions?.items?.map((item) => <div className="affiliate-list-row" key={item._id}><div><strong>{dateLabel(item.scheduledAt)}</strong><small>{item.status?.replaceAll('_', ' ')}</small></div><span className={statusClass(item.status)}>{item.status}</span></div>)}
    </section>
  </div>

  const renderNotifications = () => <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Notifications</h2><p>{notifications?.unread || 0} unread</p></div><Bell size={18} /></div>
    {sectionErrors.notifications && <p className="affiliate-error" role="alert">{sectionErrors.notifications}</p>}
    {notifications?.items?.map((item) => <article className={`affiliate-notification ${item.status === 'READ' ? 'read' : ''}`} key={item._id}><span className="affiliate-notification-dot" /><div><strong>{item.eventType?.replaceAll('_', ' ') || 'Programme update'}</strong><p>{item.payload?.message || item.payload?.description || 'An update is available in your affiliate account.'}</p><small>{dateLabel(item.createdAt)}</small></div>{item.status !== 'READ' && <button className="affiliate-secondary" onClick={() => markRead(item._id)}>Mark read <Check size={14} /></button>}</article>)}
    {!notifications?.items?.length && <p className="affiliate-empty">No notifications to display.</p>}
  </section>

  const renderProfile = () => <section className="affiliate-card"><div className="affiliate-card-title"><div><h2>Partner profile</h2><p>Profile fields are scoped to your account.</p></div><UserRound size={18} /></div>
    <div className="affiliate-profile-summary"><span><small>Account</small><strong>{user?.name || '—'}</strong></span><span><small>Email</small><strong>{user?.email || '—'}</strong></span><span><small>Phone verification</small><strong>{status?.phoneVerifiedAt ? `Verified ${dateLabel(status.phoneVerifiedAt)}` : 'Not verified'}</strong></span><span><small>Affiliate ID</small><strong>{profile?.affiliateId || 'Not enrolled'}</strong></span></div>
    {profile && <><button className="affiliate-secondary" onClick={() => setProfileEdit(!profileEdit)}>{profileEdit ? 'Cancel editing' : 'Edit profile'} <ArrowRight size={15} /></button>{profileEdit && <form className="affiliate-form affiliate-form-grid" onSubmit={saveProfile}>
      {Object.entries({ legalName: 'Legal name', dateOfBirth: 'Date of birth', address: 'Address', city: 'City', state: 'State', postalCode: 'Postal code' }).map(([key, label]) => <label className={key === 'address' ? 'affiliate-form-wide' : ''} key={key}>{label}<input required value={profileForm[key]} type={key === 'dateOfBirth' ? 'date' : 'text'} onChange={(event) => setProfileForm({ ...profileForm, [key]: event.target.value })} /></label>)}
      <button className="affiliate-primary affiliate-form-wide" disabled={busy}>{busy ? 'Saving…' : 'Save profile'} <Check size={16} /></button>
    </form>}</>}
  </section>

  const content = {
    Overview: renderOverview,
    'Referral links': renderLinks,
    Activity: renderActivity,
    'Earnings & payouts': renderEarnings,
    'KYC verification': renderKyc,
    'Support sessions': renderSupport,
    Notifications: renderNotifications,
    Profile: renderProfile,
  }[page]?.()

  return <div className="affiliate-shell">
    {mobileNav && <button className="affiliate-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside className={`affiliate-sidebar ${mobileNav ? 'open' : ''}`}>
      <a className="affiliate-logo" href="/" aria-label="AyurvaPro member portal"><img src={logo} alt="AyurvaPro" /><span>AFFILIATE PROGRAM</span></a>
      <div className="affiliate-sidebar-profile"><span className="affiliate-avatar">{(user?.name || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{user?.name || 'Affiliate'}</strong><small>{profile?.affiliateId || profile?.status?.replaceAll('_', ' ') || 'Applicant'}</small></div></div>
      <nav className="affiliate-nav" aria-label="Affiliate workspace navigation">
        <p className="affiliate-nav-label">WORKSPACE</p>
        {SECTIONS.map(({ name, icon: Icon }) => <button key={name} className={page === name ? 'active' : ''} onClick={() => { setPage(name); setMobileNav(false) }}><Icon size={17} /><span>{name}</span>{name === 'Notifications' && notifications?.unread > 0 && <i>{notifications.unread}</i>}</button>)}
      </nav>
      <div className="affiliate-sidebar-bottom"><a href="/">← Back to MLM dashboard</a><button onClick={signOut} disabled={busy}><LogOut size={16} /> Sign out</button><small>AyurvaPro Affiliate Partner Platform</small></div>
    </aside>
    <main className="affiliate-main">
      <header className="affiliate-topbar"><button className="affiliate-menu-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="affiliate-breadcrumb">Affiliate workspace <ArrowRight size={14} /> <strong>{page}</strong></div><div className="affiliate-topbar-actions"><button className="affiliate-icon-button" aria-label="Refresh dashboard" onClick={() => refresh()}><RefreshCw size={17} /></button><button className="affiliate-icon-button" aria-label="Open notifications" onClick={() => setPage('Notifications')}><Bell size={17} />{notifications?.unread > 0 && <i />}</button><span className="affiliate-top-user">{user?.name || 'Partner'}</span></div></header>
      <div className="affiliate-page-content">
        <div className="affiliate-page-heading"><div><p className="affiliate-eyebrow">AYURVAPRO AFFILIATE PROGRAM</p><h1>{title}</h1><p>{description}</p></div>{activeSection?.icon && <span className="affiliate-heading-icon"><activeSection.icon size={22} /></span>}</div>
        {loginError && <p className="affiliate-error" role="alert">{loginError}</p>}
        {content || <div className="affiliate-card"><p className="affiliate-empty">This section is unavailable.</p></div>}
      </div>
      <footer className="affiliate-footer"><span>© {new Date().getFullYear()} AyurvaPro</span><span>Amounts and eligibility shown here are server-sourced and subject to current programme rules.</span></footer>
    </main>
  </div>
}

export default AffiliatePortal
