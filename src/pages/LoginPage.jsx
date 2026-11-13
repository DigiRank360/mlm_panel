import { useState } from 'react'
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles } from 'lucide-react'
import PasswordField from '../components/common/PasswordField'
import logo from '../assets/ayurvapro-logo.png'
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
    <section className="login-story" aria-label="About AyurvaPro">
      <a className="auth-brand" href="/" aria-label="AyurvaPro member portal home">
        <img src={logo} alt="AyurvaPro" />
        <span>MEMBER PORTAL</span>
      </a>
      <div className="login-story-copy">
        <p className="login-story-kicker"><Sparkles size={15} /> WELLNESS, WITH PURPOSE</p>
        <h1>Grow a healthier future, together.</h1>
        <p>Welcome to your AyurvaPro partner space. Stay connected to your community, track your progress, and manage your membership in one place.</p>
        <ul className="login-benefits">
          <li><span><BadgeCheck size={17} /></span><div><strong>Your business at a glance</strong><small>Follow your network and account activity.</small></div></li>
          <li><span><ShieldCheck size={17} /></span><div><strong>A space made for you</strong><small>Your member information stays behind your sign-in.</small></div></li>
        </ul>
      </div>
      <p className="login-story-footer">Ancient wisdom. Modern wellness.</p>
    </section>

    <section className="login-main">
      <div className="login-main-top"><span>MEMBER ACCESS</span><span>Secure sign-in</span></div>
      <div className="login-content">
        <div className="login-heading">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your account</h2>
          <p className="login-intro">Enter the email and password associated with your member account.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label htmlFor="member-email">Email address
            <input id="member-email" autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>
          <label htmlFor="member-password">Password
            <PasswordField id="member-password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
          </label>
          {error && <p className="join-form-error" role="alert">{error}</p>}
          <button className="primary-button join-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in to your account'} <ArrowRight size={17} />
          </button>
        </form>
        <p className="login-register">New to AyurvaPro? <a href="/?register=true">Create a member account <ArrowRight size={14} /></a></p>
      </div>
      <p className="login-privacy"><ShieldCheck size={14} /> Your account is protected by secure authentication.</p>
    </section>
  </main>
}