import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Check, GitBranch, List, UserPlus, Users } from 'lucide-react'
import { useMLM } from '../context/useMLM'
import AddMemberForm from '../components/network/AddMemberForm'
import MemberTable from '../components/network/MemberTable'
import MemberTree from '../components/network/MemberTree'

const views = [
  { id: 'tree', label: 'Binary tree', icon: GitBranch },
  { id: 'members', label: 'Members', icon: List },
  { id: 'add', label: 'Add member', icon: UserPlus },
]

function findFirstOpenPlacement(members, rootId) {
  const sponsors = [{ id: rootId }, ...members]
  for (const sponsor of sponsors) {
    for (const leg of ['left', 'right']) {
      if (!members.some((member) => member.sponsorId === sponsor.id && member.leg === leg)) {
        return { sponsorId: sponsor.id, leg }
      }
    }
  }
  return { sponsorId: rootId, leg: 'left' }
}

export default function NetworkPage({ query, onToast, activeOnly }) {
  const { activeMember, getDownline, addMember, packages } = useMLM()
  const members = getDownline(activeMember.id)
  const [view, setView] = useState('tree')
  const [placement, setPlacement] = useState({ sponsorId: '', leg: '' })
  const activeCount = members.filter((member) => member.status === 'Active').length
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const joinedThisMonth = members.filter((member) => member.activatedAt && new Date(member.activatedAt) >= monthStart).length

  const beginAdd = (sponsorId, leg) => {
    setPlacement(sponsorId && leg ? { sponsorId, leg } : findFirstOpenPlacement(members, activeMember.id))
    setView('add')
  }

  const registerMember = async (details) => {
    try {
      const added = await addMember(details)
      onToast(`${added.name} was saved and is awaiting payment verification.`)
      setView('tree')
    } catch (error) {
      onToast(error.message, 'error')
    }
  }

  return (
    <>
      <section className="stats-grid compact-stats network-stats">
        <article className="stat-card"><div className="stat-card-top"><span>Total members</span><span className="stat-icon stat-green"><Users size={18} /></span></div><strong className="stat-value">{members.length}</strong><div className="stat-change"><ArrowUpRight size={14} /><b>{joinedThisMonth} new</b><span>this month</span></div></article>
        <article className="stat-card"><div className="stat-card-top"><span>Active members</span><span className="stat-icon stat-blue"><Check size={18} /></span></div><strong className="stat-value">{activeCount}</strong><div className="stat-change"><b>{members.length ? ((activeCount / members.length) * 100).toFixed(1) : 0}%</b><span>of your network</span></div></article>
        <article className="stat-card"><div className="stat-card-top"><span>Left leg</span><span className="stat-icon stat-green"><GitBranch size={18} /></span></div><strong className="stat-value">{members.filter((member) => member.leg === 'left').length}</strong><div className="stat-change"><span>placed members</span></div></article>
        <article className="stat-card"><div className="stat-card-top"><span>Right leg</span><span className="stat-icon stat-gold"><ArrowDownRight size={18} /></span></div><strong className="stat-value">{members.filter((member) => member.leg === 'right').length}</strong><div className="stat-change"><span>placed members</span></div></article>
      </section>
      <div className="network-toolbar">
        <div className="network-tabs" role="tablist" aria-label="Network views">{views.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'network-tab active' : 'network-tab'} onClick={() => id === 'add' ? beginAdd() : (setPlacement({ sponsorId: '', leg: '' }), setView(id))}><Icon size={15} />{label}</button>)}</div>
        <button className="primary-button network-add-cta" onClick={() => beginAdd()}><UserPlus size={15} /> Add member</button>
      </div>
      {view === 'tree' && <MemberTree members={members} rootMember={activeMember} onAdd={beginAdd} />}
      {view === 'members' && <MemberTable members={members} query={query} activeOnly={activeOnly} onExport={() => onToast('Member report is being prepared.')} />}
      {view === 'add' && <AddMemberForm key={`${placement.sponsorId}-${placement.leg}`} members={members} rootMember={activeMember} packages={packages} onAdd={registerMember} initialSponsor={placement.sponsorId} initialLeg={placement.leg} />}
    </>
  )
}