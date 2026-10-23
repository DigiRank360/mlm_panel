import { useEffect, useState } from 'react'
import { MLMContext } from './mlmContextStore'
import { api, clearAccessToken, getAccessToken, setAccessToken } from '../lib/api'

const packageNames = {
  starter: 'Sugar Wellness Combo',
  growth: 'Sexual Wellness Combo',
  elite: 'Sugar Wellness Jumbo Pack',
}

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function normalizeCommission(item) {
  const binary = item.type === 'binary'
  return {
    id: item._id,
    title: binary ? 'Binary matching bonus' : 'Direct referral bonus',
    source: item.sourceMember?.memberCode || (binary ? `${item.matchedPairs} matched pair${item.matchedPairs === 1 ? '' : 's'}` : 'Team referral'),
    date: formatDate(item.createdAt),
    amount: item.paidAmount,
    grossAmount: item.grossAmount,
    flushedAmount: item.flushedAmount,
    status: item.status === 'paid' ? 'Paid' : 'Flushed',
  }
}

function normalizeWithdrawal(item) {
  const details = item.payoutDetails || {}
  const destination = details.method === 'upi'
    ? `UPI · ${details.upiId}`
    : `Bank ···· ${(details.accountNumber || '').slice(-4)}`
  return {
    id: item._id,
    date: formatDate(item.createdAt),
    destination,
    amount: item.amount,
    status: item.status === 'pending' ? 'Processing' : item.status === 'paid' ? 'Paid' : 'Rejected',
  }
}

function normalizeOrder(order) {
  return {
    id: order._id,
    product: order.orderItems.map((item) => item.name).join(', '),
    date: formatDate(order.createdAt),
    total: `₹${Number(order.totalPrice || 0).toLocaleString('en-IN')}`,
    points: 0,
    status: order.paymentStatus,
  }
}

function normalizeNetworkMember(item) {
  const initials = item.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return {
    id: item.memberCode,
    name: item.name,
    initials,
    color: 'sage',
    tier: packageNames[item.packageId] || 'Member',
    packageId: item.packageId,
    packageName: packageNames[item.packageId] || 'Member package',
    packageAmount: 0,
    personalPoints: item.businessVolume || 0,
    teamPoints: item.businessVolume || 0,
    teamVolume: item.businessVolume || 0,
    volume: `₹${Number(item.businessVolume || 0).toLocaleString('en-IN')}`,
    sponsorId: item.placementParent,
    leg: item.leg,
    status: 'Active',
    date: formatDate(item.activatedAt),
    activatedAt: item.activatedAt,
    depth: item.depth,
  }
}

function normalizeNetworkMembers(items) {
  const members = items.map(normalizeNetworkMember)
  const childrenByParent = new Map()
  const memberById = new Map(members.map((member) => [member.id, member]))
  for (const member of members) {
    const children = childrenByParent.get(member.sponsorId) || []
    children.push(member)
    childrenByParent.set(member.sponsorId, children)
  }

  const calculateSubtreeVolume = (member, visited = new Set()) => {
    if (visited.has(member.id)) return member.personalPoints
    visited.add(member.id)
    const volume = member.personalPoints + (childrenByParent.get(member.id) || [])
      .reduce((total, child) => total + calculateSubtreeVolume(child, visited), 0)
    member.teamVolume = volume
    member.teamPoints = volume
    member.volume = `₹${volume.toLocaleString('en-IN')}`
    return volume
  }

  for (const member of members) calculateSubtreeVolume(member)
  return { members, childrenByParent, memberById }
}

function normalizeMember(member, network, commissionPage, withdrawals, orders, kyc, packagePayment) {
  const memberName = member.user?.name || 'Member'
  const downline = normalizeNetworkMembers(network.members).members
  const personalPoints = member.packageSnapshot?.businessVolume || 0
  const teamVolume = personalPoints + downline
    .filter((item) => item.sponsorId === member.memberCode)
    .reduce((sum, item) => sum + item.teamVolume, 0)
  const initials = memberName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return {
    id: member.memberCode,
    databaseId: member._id,
    name: memberName,
    email: member.user?.email || '',
    phone: member.user?.phone || '',
    isAdmin: Boolean(member.user?.isAdmin),
    kycStatus: kyc.status || member.kycStatus || 'not_submitted',
    kycDetails: kyc,
    packagePayment,
    paymentReviewPending: ['verified', 'approving', 'refund_pending', 'refunding'].includes(packagePayment.status),
    initials,
    color: 'sage',
    tier: packageNames[member.packageId] || 'Member',
    status: member.status === 'active' ? 'Active' : member.status === 'pending' ? 'Pending activation' : 'Suspended',
    packageId: member.packageId,
    packageName: packageNames[member.packageId] || 'Member package',
    packageAmount: member.packageSnapshot?.discountedPrice || 0,
    personalPoints,
    teamPoints: teamVolume,
    teamVolume,
    volume: `₹${teamVolume.toLocaleString('en-IN')}`,
    walletBalance: member.walletBalance || 0,
    totalEarnings: member.totalEarnings || 0,
    firstMatchCompleted: member.firstMatchCompleted,
    sponsorId: member.sponsorMember?.memberCode || member.requestedSponsorCode || '',
    leg: member.placementLeg || member.requestedPlacementLeg || '',
    date: formatDate(member.activatedAt || member.createdAt),
    commissions: (commissionPage.commissions || []).map(normalizeCommission),
    withdrawals: withdrawals.map(normalizeWithdrawal),
    orders: orders.map(normalizeOrder),
  }
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Razorpay checkout could not be loaded. Check your internet connection.'))
    document.body.appendChild(script)
  })
}

async function loadDashboardData() {
  const [member, network, commissions, withdrawals, orderPage, paymentConfig, paymentStatus, kyc, kycConfig] = await Promise.all([
    api.getMember(),
    api.getNetwork(),
    api.getCommissions(),
    api.getWithdrawals(),
    api.getOrders(),
    api.getPackagePaymentConfig(),
    api.getPackagePaymentStatus(),
    api.getKyc(),
    api.getKycConfig(),
  ])
  const orders = Array.isArray(orderPage) ? orderPage : orderPage.orders || []
  const normalizedMembers = normalizeNetworkMembers(network.members).members
  return {
    activeMember: normalizeMember(member, { ...network, members: normalizedMembers }, commissions, withdrawals, orders, kyc, paymentStatus),
    members: normalizedMembers,
    packagePaymentEnabled: paymentConfig.enabled,
    kycEnabled: kycConfig.enabled,
  }
}

export function MLMProvider({ children }) {
  const [activeMember, setActiveMember] = useState(null)
  const [members, setMembers] = useState([])
  const [packages, setPackages] = useState([])
  const [packagePaymentEnabled, setPackagePaymentEnabled] = useState(false)
  const [kycEnabled, setKycEnabled] = useState(false)
  const [isInitializing, setIsInitializing] = useState(Boolean(getAccessToken()))

  const refreshDashboard = async () => {
    const data = await loadDashboardData()
    setActiveMember(data.activeMember)
    setMembers(data.members)
    setPackagePaymentEnabled(data.packagePaymentEnabled)
    setKycEnabled(data.kycEnabled)
    return data.activeMember
  }

  useEffect(() => {
    let cancelled = false
    api.getPackages().then((items) => {
      if (!cancelled) setPackages(items)
    }).catch(() => {})
    if (!getAccessToken()) {
      return () => { cancelled = true }
    }

    loadDashboardData().then((data) => {
      if (cancelled) return
      setActiveMember(data.activeMember)
      setMembers(data.members)
      setPackagePaymentEnabled(data.packagePaymentEnabled)
      setKycEnabled(data.kycEnabled)
    }).catch(() => {
      if (cancelled) return
      clearAccessToken()
      setActiveMember(null)
      setMembers([])
    }).finally(() => {
      if (!cancelled) setIsInitializing(false)
    })

    return () => { cancelled = true }
  }, [])

  const authenticate = async (email, password) => {
    const result = await api.login(email, password)
    setAccessToken(result.token)
    try {
      return await refreshDashboard()
    } catch (error) {
      clearAccessToken()
      throw error
    }
  }

  const register = async (details) => {
    const result = await api.register(details)
    setAccessToken(result.token)
    try {
      return await refreshDashboard()
    } catch (error) {
      clearAccessToken()
      throw error
    }
  }

  const addMember = async (details) => {
    await api.register({
      name: details.name,
      email: details.email,
      phone: details.phone,
      password: details.password,
      packageId: details.packageId,
      sponsorCode: activeMember.id,
      placementCode: details.sponsorId,
      placementLeg: details.leg,
    })
    await refreshDashboard()
    return { name: details.name, leg: details.leg, status: 'Pending activation' }
  }

  const signOut = () => {
    api.logout().catch(() => {})
    clearAccessToken()
    setActiveMember(null)
    setMembers([])
  }

  const getDownline = () => members

  const requestWithdrawal = async (amount, payoutDetails) => {
    const result = await api.createWithdrawal({ amount, payoutDetails })
    await refreshDashboard()
    return result
  }

  const submitKyc = async (formData) => {
    await api.submitKyc(formData)
    await refreshDashboard()
  }

  const payForPackage = async () => {
    const config = await api.getPackagePaymentConfig()
    if (!config.enabled || !config.keyId) throw new Error('Package payments are not configured. Contact support to activate this account.')
    await loadRazorpayCheckout()
    const order = await api.createPackagePaymentOrder()

    await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: config.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'AyuvaPro',
        description: `${order.packageName} membership`,
        order_id: order.orderId,
        prefill: { name: activeMember.name, email: activeMember.email, contact: activeMember.phone },
        theme: { color: '#145d56' },
        handler: async (response) => {
          try {
            await api.verifyPackagePayment(response)
            await refreshDashboard()
            resolve({ status: 'verified' })
          } catch (error) {
            reject(error)
          }
        },
        modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
      })
      checkout.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'Package payment failed.'))
      })
      checkout.open()
    })
  }

  const updateProfile = async (changes) => {
    await api.updateProfile(changes)
    await refreshDashboard()
  }

  const changePassword = async (currentPassword, newPassword) => {
    await api.changePassword(currentPassword, newPassword)
  }

  const accounts = activeMember ? [activeMember] : []
  const activeMemberId = activeMember?.id || ''

  return <MLMContext.Provider value={{
    members,
    accounts,
    packages,
    activeMember,
    activeMemberId,
    isInitializing,
    authenticate,
    register,
    addMember,
    signOut,
    getDownline,
    requestWithdrawal,
    payForPackage,
    packagePaymentEnabled,
    kycEnabled,
    submitKyc,
    updateProfile,
    changePassword,
    refreshDashboard,
  }}>{children}</MLMContext.Provider>
}