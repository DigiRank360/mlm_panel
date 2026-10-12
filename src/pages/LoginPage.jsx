import { useState } from 'react'
import { ArrowRight, Leaf, LockKeyhole } from 'lucide-react'
import PasswordField from '../components/common/PasswordField'
import './registration.css'

export default function LoginPage({ onLogin, onToast }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onLogin(email.trim(), password)
      onToast('Signed in successfully.')
    } catch (loginError) {
      setError(loginError.message)
      onToast(loginError.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="join-page login-page">
    <header className="join-header"><span className="brand-mark"><Leaf size={19} /></span><strong>ayurva<span>pro</span></strong><small>MEMBER PORTAL</small></header>
    <section className="login-content"><p className="eyebrow">YOUR MEMBER ACCOUNT</p><h1>Sign in to your panel.</h1><p className="login-intro">Use the email and password created for your member account. Your panel is private to your sign-in.</p>
      <form className="login-form" onSubmit={submit}><span className="join-form-icon"><LockKeyhole size={19} /></span><label>Email address<input autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<PasswordField autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /></label>{error && <p className="join-form-error" role="alert">{error}</p>}<button className="primary-button join-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></button></form>
      <p className="login-register">New to AyurvaPro? <a href="/?register=true">Create a member account</a></p>
    </section>
  </main>
}