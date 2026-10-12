import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, BadgeIndianRupee, CalendarDays, ChevronDown, Copy, Leaf, MoreHorizontal, Target, Users, Wallet } from 'lucide-react'
import { Avatar, MembersTable, RevenueChart } from '../components/common/PortalUI'
import { api } from '../lib/api'

function formatRupees(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

export default function OverviewPage({ member, members, query, period, setPeriod, onNavigate, onToast }) {
  const [volumeHistory, setVolumeHistory] = useState({ series: [], totalBusinessVolume: 0 })
  const days = Number.parseInt(period, 10) || 30
  useEffect(() => {
    let cancelled = false
    api.getVolumeHistory(days).then((result) => {
      if (!cancelled) setVolumeHistory(result)
    }).catch(() => {
      if (!cancelled) setVolumeHistory({ series: [], totalBusinessVolume: 0 })
    })
    return () => { cancelled = true }
  }, [days])

  const earnings = member.totalEarnings || 0
  const directMembers = members.filter((teamMember) => teamMember.sponsorId === member.id)
  const indirectMembers = members.length - directMembers.length
  const recentTransactions = [
    ...member.commissions.map((item) => ({ id: item.id, title: item.title, meta: `${item.source} · ${item.date}`, amount: `+${formatRupees(item.amount)}`, type: 'income', initials: 'CM', color: 'sage' })),
    ...member.withdrawals.map((item) => ({ id: item.id, title: 'Withdrawal request', meta: `${item.destination} · ${item.date}`, amount: `−${formatRupees(item.amount)}`, type: 'expense', initials: 'WD', color: 'blue' })),
  ].slice(0, 4)
  const referralLink = `${window.location.origin}/?ref=${encodeURIComponent(member.id)}`
  const volumeScale = Math.max(1000, ...volumeHistory.series.map((item) => item.businessVolume))
  const stats = [
    { label: 'Total earnings', value: formatRupees(earnings), change: `${member.commissions.length} entries`, note: 'commission history', icon: BadgeIndianRupee, iconClass: 'stat-green' },
    { label: 'My team', value: String(members.length), change: `${directMembers.length} direct`, note: 'referrals', icon: Users, iconClass: 'stat-gold' },
    { label: 'Team volume', value: formatRupees(member.teamVolume), change: `${member.teamPoints.toLocaleString('en-IN')} PV`, note: 'team points', icon: Target, iconClass: 'stat-blue' },
    { label: 'Available balance', value: formatRupees(member.walletBalance), change: 'Ready to withdraw', note: '', icon: Wallet, iconClass: 'stat-peach', wallet: true },
  ]
  return <>
    <section className="stats-grid" aria-label="Business summary">{stats.map(({ label, value, change, note, icon: Icon, iconClass, wallet: isWallet }) => <article className="stat-card" key={label}><div className="stat-card-top"><span>{label}</span><span className={`stat-icon ${iconClass}`}><Icon size={18} strokeWidth={1.8} /></span></div><strong className="stat-value">{value}</strong><div className="stat-change">{isWallet ? <Wallet size={14} /> : <ArrowUpRight size={14} />} <b>{change}</b>{note && <span>{note}</span>}</div></article>)}</section>
    <section className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-header chart-header"><div><h2>Team performance</h2><p>Business volume from new placements</p></div><label className="period-select"><CalendarDays size={15} /><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Chart period"><option>7 days</option><option>30 days</option><option>90 days</option></select><ChevronDown size={14} /></label></div><div className="chart-summary"><strong>{formatRupees(volumeHistory.totalBusinessVolume)}</strong><span className="positive-pill"><ArrowUpRight size={13} />{members.length} members</span><small>{volumeHistory.totalBusinessVolume.toLocaleString('en-IN')} BV in {days} days</small></div><div className="chart-wrap"><div className="chart-axis"><span>{formatRupees(volumeScale)}</span><span>{formatRupees(volumeScale * 0.66)}</span><span>{formatRupees(volumeScale * 0.33)}</span><span>₹0</span></div><RevenueChart series={volumeHistory.series} /></div></article>
      <article className="panel network-panel"><div className="panel-header"><div><h2>Network overview</h2><p>Your team at a glance</p></div><button className="icon-button quiet" aria-label="More network options"><MoreHorizontal size={19} /></button></div><div className="network-total"><span className="network-total-icon"><Users size={19} /></span><span><strong>{members.length}</strong><small>Total members</small></span><span className="network-growth"><ArrowUpRight size={14} />{directMembers.length} direct</span></div><div className="network-bar" aria-label="Active member breakdown"><span /><span /><span /></div><div className="network-legend"><span><i className="legend-dot dot-first" />Direct <b>{directMembers.length}</b></span><span><i className="legend-dot dot-second" />Downline <b>{indirectMembers}</b></span><span><i className="legend-dot dot-third" />Personal PV <b>{member.personalPoints}</b></span></div><button className="text-link network-link" onClick={() => onNavigate('My network')}>Explore your network <ArrowRight size={15} /></button></article>
    </section>
    <section className="panel members-panel"><div className="panel-header members-header"><div><h2>Recently joined</h2><p>Meet the newest members in your network</p></div><button className="text-link" onClick={() => onNavigate('My network')}>View all <ArrowRight size={15} /></button></div><MembersTable members={members} query={query} /></section>
    <section className="panel transactions-panel"><div className="panel-header"><div><h2>Recent transactions</h2><p>Your latest earnings and payouts</p></div><button className="text-link" onClick={() => onNavigate('Commissions')}>All transactions <ArrowRight size={15} /></button></div>{recentTransactions.length ? <div className="transactions-list">{recentTransactions.map((transaction) => <div className="transaction-row" key={transaction.id}><Avatar initials={transaction.initials} color={transaction.color} /><div className="transaction-name"><strong>{transaction.title}</strong><small>{transaction.meta}</small></div><strong className={`transaction-amount ${transaction.type}`}>{transaction.amount}</strong></div>)}</div> : <p className="empty-state">No transactions have been recorded for this member yet.</p>}</section>
    <section className="invite-banner"><span className="invite-illustration"><Leaf size={25} /></span><div><strong>Good things grow when shared.</strong><p>Invite someone who’d love a more natural way to feel well.</p></div><button onClick={() => { navigator.clipboard?.writeText(referralLink); onToast('Your personal referral link has been copied.') }}><Copy size={16} /> Copy invite link</button></section>
  </>
}