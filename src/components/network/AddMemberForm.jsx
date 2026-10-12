import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import PasswordField from '../common/PasswordField'

export default function AddMemberForm({ members, rootMember, packages, onAdd, initialSponsor = '', initialLeg = '' }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [packageId, setPackageId] = useState('starter')
  const [sponsorId, setSponsorId] = useState(initialSponsor || rootMember.id)
  const [leg, setLeg] = useState(initialLeg || 'left')
  const sponsorOptions = [{ id: rootMember.id, name: `${rootMember.name} · My account` }, ...members.map((member) => ({ id: member.id, name: `${member.name} · ${member.id}` }))]
  const occupied = members.some((member) => member.sponsorId === sponsorId && member.leg === leg)

  const submit = async (event) => {
    event.preventDefault()
    if (occupied) return
    await onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim(), password, packageId, sponsorId, leg })
    setName('')
    setEmail('')
    setPhone('')
  }

  return (
    <section className="panel add-member-panel">
      <div className="panel-header"><div><h2><UserPlus size={16} /> Register a team member</h2><p>Assign a sponsor and an open position in the binary structure.</p></div></div>
      <form className="add-member-form" onSubmit={submit}>
        <label>Full name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Member full name" /></label>
        <label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></label>
        <label>Phone number<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" /></label>
        <label>Temporary password<PasswordField required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
        <label>Member package<select required value={packageId} onChange={(event) => setPackageId(event.target.value)}>{packages.map((item) => <option key={item.id} value={item.id}>{item.name} · ₹{item.discountedPrice.toLocaleString('en-IN')}</option>)}</select></label>
        <label>Sponsor<select value={sponsorId} onChange={(event) => setSponsorId(event.target.value)}>{sponsorOptions.map((sponsor) => <option key={sponsor.id} value={sponsor.id}>{sponsor.name}</option>)}</select></label>
        <label>Placement leg<select value={leg} onChange={(event) => setLeg(event.target.value)}><option value="left">Left leg</option><option value="right">Right leg</option></select></label>
        <div className={`placement-preview ${occupied ? 'placement-error' : ''}`}><span className={`leg-dot leg-dot-${leg}`} /><span><strong>{leg === 'left' ? 'Left' : 'Right'} leg placement</strong><small>{occupied ? 'This position is already occupied. Choose another sponsor or leg.' : `Open position under ${sponsorOptions.find((item) => item.id === sponsorId)?.name ?? sponsorId}`}</small></span></div>
        <button className="primary-button add-member-submit" type="submit" disabled={occupied || packages.length === 0}><UserPlus size={16} /> Add member</button>
      </form>
    </section>
  )
}