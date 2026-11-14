import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BadgeIndianRupee,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Filter,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  PackageOpen,
  Search,
  ShieldCheck,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { MLMProvider } from './context/MLMContext'
import { useMLM } from './context/useMLM'
import { ToastProvider } from './components/common/ToastProvider'
import { useToast } from './context/useToast'
import { Avatar, PageHeading } from './components/common/PortalUI'
import CommissionsPage from './pages/CommissionsPage'
import MarketingPage from './pages/MarketingPage'
import OrdersPage from './pages/OrdersPage'
import OverviewPage from './pages/OverviewPage'
import NetworkPage from './pages/NetworkPage'
import PackagePage from './pages/PackagePage'
import ReferralRegistrationPage from './pages/ReferralRegistrationPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import WithdrawalsPage from './pages/WithdrawalsPage'
import KycPage from './pages/KycPage'
import AffiliatePortal from './pages/AffiliatePortal'
import './App.css'
import './components/network/network.css'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard, section: 'WORKSPACE' },
  { label: 'My network', icon: Users },
  { label: 'Commissions', icon: BadgeIndianRupee },
  { label: 'Orders', icon: ShoppingBag },
  { label: 'My package', icon: PackageOpen },
  { label: 'Withdrawals', icon: Wallet },
  { label: 'KYC verification', icon: ShieldCheck },
  { label: 'Marketing tools', icon: Sparkles, section: 'GROW YOUR BUSINESS' },
  { label: 'Settings', icon: Settings, section: 'PREFERENCES' },
]

const titles = {
  Overview: ['Good morning, Riya', 'Here’s what’s happening with your business today.'],
  'My network': ['Your network', 'Build meaningful connections and grow your team.'],
  Commissions: ['Commissions', 'Track your earnings across every level.'],
  Orders: ['Your orders', 'Keep an eye on purchases and delivery updates.'],
  'My package': ['My package', 'Review your active membership package and points.'],
  Withdrawals: ['Withdrawals', 'Manage your available balance and payout history.'],
  'KYC verification': ['KYC verification', 'Submit identity documents for secure manual review.'],
  'Marketing tools': ['Grow your business', 'Everything you need to share AyurvaPro with your community.'],
  Settings: ['Account settings', 'Keep your personal details and preferences up to date.'],
}

function AppContent() {
  const { showToast: notify } = useToast()
  const { activeMember, authenticate, register, signOut, getDownline, requestWithdrawal, updateProfile, changePassword, isInitializing, packages, refreshDashboard, payForPackage, packagePaymentEnabled, kycEnabled, submitKyc } = useMLM()
  const [activePage, setActivePage] = useState('Overview')
  const [period, setPeriod] = useState('30 days')
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [networkFilter, setNetworkFilter] = useState('All members')
  const [checkingActivation, setCheckingActivation] = useState(false)
  const [payingForPackage, setPayingForPackage] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const clock = window.setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => window.clearInterval(clock)
  }, [])

  const changePage = (page) => {
    setActivePage(page)
    setMobileOpen(false)
    setQuery('')
  }

  const handleSearch = (value) => {
    setQuery(value)
    if (value && !['Overview', 'My network'].includes(activePage)) setActivePage('My network')
  }

  const checkActivation = async () => {
    setCheckingActivation(true)
    try {
      const updatedMember = await refreshDashboard()
      notify(updatedMember.status === 'Active' ? 'Your membership is active.' : 'Activation is still pending. Contact support with your member code.')
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setCheckingActivation(false)
    }
  }

  const startPackagePayment = async () => {
    setPayingForPackage(true)
    try {
      await payForPackage()
      notify('Payment captured. Your account will activate after admin approval.')
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setPayingForPackage(false)
    }
  }

  const referralId = new URLSearchParams(window.location.search).get('ref')
  const registrationRequested = new URLSearchParams(window.location.search).get('register') === 'true'

  const registerFromInvite = async (details) => {
    await register(details)
    window.history.replaceState({}, '', window.location.pathname)
    setActivePage('Overview')
    notify('Member profile saved. Complete payment and admin verification to activate it.')
  }

  if (isInitializing) return <main className="auth-loading" role="status">Restoring your member session…</main>
  if (referralId || registrationRequested) return <ReferralRegistrationPage referralId={referralId || ''} onRegister={registerFromInvite} onToast={notify} />
  if (!activeMember) return <LoginPage onLogin={authenticate} onToast={notify} />

  const teamMembers = getDownline(activeMember.id)
  const recentActivity = [
    ...activeMember.commissions.map((item) => ({ id: item.id, title: item.title, detail: `${item.source} · ${item.date}`, date: item.date })),
    ...activeMember.withdrawals.map((item) => ({ id: item.id, title: 'Withdrawal request', detail: `${item.destination} · ₹${item.amount.toLocaleString('en-IN')}`, date: item.date })),
  ].slice(0, 3)

  const renderPage = () => {
    if (activePage === 'My network') return <NetworkPage query={query} onToast={notify} activeOnly={networkFilter === 'Active members'} />
    if (activePage === 'Commissions') return <CommissionsPage member={activeMember} />
    if (activePage === 'Orders') return <OrdersPage member={activeMember} />
    if (activePage === 'My package') return <PackagePage member={activeMember} packages={packages} />
    if (activePage === 'Withdrawals') return <WithdrawalsPage member={activeMember} onRequest={requestWithdrawal} />
    if (activePage === 'KYC verification') return <KycPage member={activeMember} enabled={kycEnabled} onSubmit={submitKyc} />
    if (activePage === 'Marketing tools') return <MarketingPage member={activeMember} onToast={notify} />
    if (activePage === 'Settings') return <SettingsPage key={activeMember.id} member={activeMember} onSave={updateProfile} onChangePassword={changePassword} onToast={notify} />
    return <OverviewPage member={activeMember} members={teamMembers} query={query} period={period} setPeriod={setPeriod} onNavigate={changePage} onToast={notify} />
  }

  const hour = Number(new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(currentTime))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const pageInfo = activePage === 'Overview' ? [`${greeting}, ${activeMember.name.split(' ')[0]}`, 'Here’s your personal member dashboard and team activity.'] : titles[activePage]

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); changePage('Overview') }}><span className="brand-mark"><Leaf size={19} strokeWidth={1.8} /></span><span className="brand-name">ayurva<span>pro</span><small>MEMBER PORTAL</small></span></a>
        <div className="member-card"><Avatar initials={activeMember.initials} color={activeMember.color} /><span><strong>{activeMember.name}</strong><small>{activeMember.tier}</small></span><ChevronDown size={15} className="member-chevron" /></div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon, section }) => <div key={label}>{section && <p className="nav-section-label">{section}</p>}<button className={`nav-item ${activePage === label ? 'nav-item-active' : ''}`} onClick={() => changePage(label)}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'My network' && <span className="nav-count">{teamMembers.length}</span>}</button></div>)}
        </nav>
        <div className="sidebar-bottom"><a className="affiliate-workspace-link" href="/affiliate">Open affiliate workspace <ArrowRight size={15} /></a><div className="support-card"><span className="support-icon"><CircleHelp size={18} /></span><div><strong>Need a hand?</strong><small>We’re happy to help.</small></div><ChevronRight size={15} /></div><button className="signout-button" onClick={signOut}><LogOut size={17} /> Sign out</button><div className="sidebar-footnote">AYURVAPRO MEMBER PORTAL <span>v1.0.0</span></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activePage === 'Overview' ? 'Overview' : activePage}</strong></div></div>
          <div className="topbar-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => handleSearch(event.target.value)} placeholder="Search your team..." aria-label="Search your team" /><kbd>⌘ K</kbd></label><div className="popover-anchor"><button className={`icon-button notification-button ${notificationsOpen ? 'button-selected' : ''}`} aria-label="Notifications" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false) }}><Bell size={19} /><i /></button>{notificationsOpen && <div className="popover notification-popover"><div className="popover-heading"><strong>Recent activity</strong><span>{recentActivity.length}</span></div>{recentActivity.map((item) => <div className="notification-item" key={item.id}><span className="notification-dot notification-gold" /><div><strong>{item.title}</strong><small>{item.detail}</small><time>{item.date}</time></div></div>)}{recentActivity.length === 0 && <p className="empty-state">No account activity yet.</p>}<button className="popover-footer" onClick={() => { changePage('Commissions'); setNotificationsOpen(false) }}>View commissions</button></div>}</div><span className="topbar-divider" /><div className="popover-anchor"><button className="top-profile" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false) }}><Avatar initials={activeMember.initials} color={activeMember.color} size="small" /><span><strong>{activeMember.name}</strong><small>{activeMember.tier}</small></span><ChevronDown size={15} /></button>{profileOpen && <div className="popover profile-popover"><button onClick={() => { changePage('Settings'); setProfileOpen(false) }}><Settings size={16} /> Account settings</button><button onClick={signOut}><LogOut size={16} /> Sign out</button></div>}</div></div>
        </header>

        <div className="content-area">
          {!bannerDismissed && activePage === 'Overview' && <div className="announcement"><span className="announcement-mark"><Sparkles size={15} /></span><p><strong>Invite your next team member.</strong> Your live team and matching volume appear here as placements activate.</p><button onClick={() => changePage('Marketing tools')}>Open invite tools <ArrowRight size={14} /></button><button className="announcement-close" aria-label="Dismiss announcement" onClick={() => setBannerDismissed(true)}><X size={16} /></button></div>}
          <PageHeading title={pageInfo[0]} description={pageInfo[1]} />
          {activeMember.status !== 'Active' && <div className="activation-notice" role="status"><strong>Activation pending</strong><span>Your member profile is saved. Package benefits and withdrawals will be enabled after administrator approval.</span><small>Member code: {activeMember.id}</small>{activeMember.paymentReviewPending ? <small>Your Razorpay payment is captured and waiting for an administrator decision. {activeMember.packagePayment?.status === 'refund_pending' || activeMember.packagePayment?.status === 'refunding' ? 'Refund is being processed.' : ''}</small> : packagePaymentEnabled ? <button className="primary-button" disabled={payingForPackage} onClick={startPackagePayment}>{payingForPackage ? 'Opening secure checkout…' : `Pay ₹${activeMember.packageAmount.toLocaleString('en-IN')}`}</button> : <small>Online payment is not configured. Contact support with your member code for manual payment verification.</small>}<button className="outline-button" disabled={checkingActivation} onClick={checkActivation}>{checkingActivation ? 'Checking…' : 'Check activation status'}</button></div>}
          {activePage === 'My network' && <div className="inline-filter"><button className="outline-button" onClick={() => setNetworkFilter(networkFilter === 'All members' ? 'Active members' : 'All members')}><Filter size={15} /> {networkFilter} <ChevronDown size={14} /></button><span>Showing {networkFilter === 'All members' ? 'all levels' : 'active members'} in your network</span></div>}
          {activePage === 'Overview' && <div className="section-label"><span>YOUR BUSINESS</span><span>Updated just now <i /></span></div>}
          {renderPage()}
          <footer className="page-footer"><span>© 2026 AyurvaPro</span><span><button onClick={() => setHelpOpen(!helpOpen)}>Help center</button><i /><button onClick={() => notify('Privacy information opened.')}>Privacy</button><i /><span>Made with care in India</span></span></footer>
        </div>
      </main>

      <button className="help-fab" aria-label="Open help center" onClick={() => setHelpOpen(!helpOpen)}><CircleHelp size={19} /></button>
      {helpOpen && <div className="help-popover"><button className="help-close" aria-label="Close help panel" onClick={() => setHelpOpen(false)}><X size={16} /></button><span className="help-icon"><CircleHelp size={20} /></span><strong>How can we help?</strong><p>Our member support team is here for you, Monday to Saturday.</p><button className="text-link" onClick={() => notify('Support team contact: care@ayurvapro.com')}>Contact support <ArrowRight size={14} /></button></div>}
    </div>
  )
}

export default function App() {
  const affiliateWorkspace = window.location.pathname.startsWith('/affiliate')
  return <ToastProvider>{affiliateWorkspace ? <AffiliatePortal /> : <MLMProvider><AppContent /></MLMProvider>}</ToastProvider>
}
