import { useState } from 'react'
import { Check } from 'lucide-react'
import { Avatar, Status } from '../components/common/PortalUI'
import PasswordField from '../components/common/PasswordField'

export default function SettingsPage({ member, onSave, onChangePassword, onToast }) {
  const [form, setForm] = useState({ name: member.name, email: member.email, phone: member.phone })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    try {
      await onSave(form)
      onToast('Your profile details have been saved.')
    } catch (error) {
      onToast(error.message, 'error')
    }
  }
  const submitPassword = async (event) => {
    event.preventDefault()
    setPasswordMessage('')
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage('New passwords do not match.')
      onToast('New passwords do not match.', 'error')
      return
    }
    try {
      await onChangePassword(passwordForm.current, passwordForm.next)
      setPasswordForm({ current: '', next: '', confirm: '' })
      setPasswordMessage('Password updated for this member account.')
      onToast('Password updated successfully.')
    } catch (error) {
      setPasswordMessage(error.message)
      onToast(error.message, 'error')
    }
  }

  return <><form className="panel settings-panel" onSubmit={submit}><div className="profile-summary"><Avatar initials={member.initials} color={member.color} /><div><strong>{member.name}</strong><span>{member.tier} · {member.id}</span></div><Status>{member.status}</Status></div><div className="settings-fields"><label>Full name<input required value={form.name} onChange={update('name')} placeholder="Your full legal name" /></label><label>Email address<input required type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" /></label><label>Phone number<input required type="tel" value={form.phone} onChange={update('phone')} placeholder="+91 98765 43210" /></label><label>Member ID<input value={member.id} readOnly placeholder="Member code" /></label></div><button className="primary-button" type="submit"><Check size={16} /> Save changes</button></form><form className="panel settings-panel password-settings" onSubmit={submitPassword}><div className="panel-header"><div><h2>Change password</h2><p>Password applies only to {member.name}’s member account.</p></div></div><div className="settings-fields"><label>Current password<PasswordField required autoComplete="current-password" value={passwordForm.current} onChange={(event) => setPasswordForm((state) => ({ ...state, current: event.target.value }))} placeholder="Enter current password" /></label><label>New password<PasswordField required minLength={8} autoComplete="new-password" value={passwordForm.next} onChange={(event) => setPasswordForm((state) => ({ ...state, next: event.target.value }))} placeholder="At least 8 characters" /></label><label>Confirm new password<PasswordField required minLength={8} autoComplete="new-password" value={passwordForm.confirm} onChange={(event) => setPasswordForm((state) => ({ ...state, confirm: event.target.value }))} placeholder="Repeat new password" /></label></div>{passwordMessage && <p className="withdrawal-notice">{passwordMessage}</p>}<button className="primary-button" type="submit">Update password</button></form></>
}