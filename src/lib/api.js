const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const MEMBER_TOKEN_KEY = 'ayurvapro-member-token'
const AFFILIATE_TOKEN_KEY = 'ayurvapro-affiliate-token'

function tokenStorageKey() {
  return window.location.pathname.startsWith('/affiliate') ? AFFILIATE_TOKEN_KEY : MEMBER_TOKEN_KEY
}

export function getAccessToken() {
  return localStorage.getItem(tokenStorageKey())
}

export function setAccessToken(token) {
  localStorage.setItem(tokenStorageKey(), token)
}

export function clearAccessToken() {
  localStorage.removeItem(tokenStorageKey())
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || 'Request failed. Please try again.')
  return data
}

function jsonBody(value) {
  return JSON.stringify(value)
}

export const api = {
  login: (email, password) => request('/users/login', { method: 'POST', body: jsonBody({ email, password }) }),
  sendPhoneOtp: (phone) => request('/users/send-otp', { method: 'POST', body: jsonBody({ phone }) }),
  verifyPhoneOtp: (phone, otp) => request('/users/verify-otp', { method: 'POST', body: jsonBody({ phone, otp }) }),
  getAffiliateProfileStatus: () => request('/affiliate/profile/status'),
  getAffiliatePortalSettings: () => request('/affiliate/portal-settings'),
  getAffiliatePackages: () => request('/affiliate/packages'),
  enrollAffiliate: (details) => request('/affiliate/enroll', { method: 'POST', body: jsonBody(details) }),
  createAffiliatePackageOrder: (packageId, shippingAddress, idempotencyKey) => request('/affiliate/packages/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: jsonBody({ packageId, shippingAddress }),
  }),
  createPaymentOrder: (orderId) => request('/payment/create-order', { method: 'POST', body: jsonBody({ orderId }) }),
  verifyPayment: (payment) => request('/payment/verify', { method: 'POST', body: jsonBody(payment) }),
  getAffiliateDashboard: () => request('/affiliate/dashboard'),
  getAffiliateActivity: (page = 1) => request(`/affiliate/activity?page=${page}&limit=25`),
  createAffiliateLink: (details) => request('/affiliate/links', { method: 'POST', body: jsonBody(details) }),
  getAffiliateKycStatus: () => request('/affiliate/kyc/status'),
  submitAffiliateKyc: (formData) => request('/affiliate/kyc', { method: 'POST', body: formData }),
  getAffiliatePayoutMethod: () => request('/affiliate/payout-method'),
  setAffiliatePayoutMethod: (details) => request('/affiliate/payout-method', { method: 'PUT', body: jsonBody(details) }),
  requestAffiliatePayout: (amount, idempotencyKey) => request('/affiliate/payouts', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: jsonBody({ amount }),
  }),
  getAffiliatePayouts: () => request('/affiliate/payouts'),
  getAffiliateNotifications: () => request('/affiliate/notifications'),
  markAffiliateNotificationRead: (notificationId) => request(`/affiliate/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PATCH' }),
  getAffiliateSupportSessions: () => request('/affiliate/support/sessions'),
  recordAffiliateConsent: (purpose, version, granted = true) => request('/affiliate/consents', {
    method: 'POST',
    body: jsonBody({ purpose, version, granted }),
  }),
  scheduleAffiliateSupport: (entitlementId, scheduledAt) => request('/affiliate/support/sessions', {
    method: 'POST',
    body: jsonBody({ entitlementId, scheduledAt }),
  }),
  register: (details) => request('/mlm/register', { method: 'POST', body: jsonBody(details) }),
  getRegistrationConfig: () => request('/mlm/register/config'),
  sendRegistrationOtp: (phone) => request('/mlm/register/otp/send', { method: 'POST', body: jsonBody({ phone }) }),
  verifyRegistrationOtp: (phone, code) => request('/mlm/register/otp/verify', { method: 'POST', body: jsonBody({ phone, code }) }),
  getPackages: () => request('/mlm/packages'),
  getReferralPlacements: (memberCode) => request(`/mlm/referrals/${encodeURIComponent(memberCode)}/placements`),
  getProfile: () => request('/users/profile'),
  getMember: () => request('/mlm/me'),
  getNetwork: () => request('/mlm/me/network'),
  getVolumeHistory: (days) => request(`/mlm/me/volume?days=${days}`),
  getPackagePaymentConfig: () => request('/mlm/me/payment/config'),
  createPackagePaymentOrder: () => request('/mlm/me/payment/order', { method: 'POST', body: jsonBody({}) }),
  getPackagePaymentStatus: () => request('/mlm/me/payment/status'),
  verifyPackagePayment: (payment) => request('/mlm/me/payment/verify', { method: 'POST', body: jsonBody(payment) }),
  getKycConfig: () => request('/mlm/me/kyc/config'),
  getKyc: () => request('/mlm/me/kyc'),
  submitKyc: (formData) => request('/mlm/me/kyc', { method: 'POST', body: formData }),
  getCommissions: () => request('/mlm/me/commissions'),
  getWithdrawals: () => request('/mlm/me/withdrawals'),
  createWithdrawal: (details) => request('/mlm/me/withdrawals', { method: 'POST', body: jsonBody(details) }),
  updateProfile: (changes) => request('/users/profile', { method: 'PUT', body: jsonBody(changes) }),
  changePassword: (currentPassword, newPassword) => request('/users/profile/password', {
    method: 'PUT',
    body: jsonBody({ currentPassword, newPassword }),
  }),
  getOrders: () => request('/orders/myorders'),
  logout: () => request('/users/logout', { method: 'POST' }),
}