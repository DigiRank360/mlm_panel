const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const TOKEN_KEY = 'ayurvapro-member-token'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
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
  register: (details) => request('/mlm/register', { method: 'POST', body: jsonBody(details) }),
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