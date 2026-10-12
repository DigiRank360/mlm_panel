import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordField({ id, value, onChange, placeholder, autoComplete, required = false, minLength }) {
  const [visible, setVisible] = useState(false)

  return <span className="password-field">
    <input
      id={id}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
      minLength={minLength}
    />
    <button
      className="password-visibility-toggle"
      type="button"
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      onClick={() => setVisible((current) => !current)}
    >
      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </span>
}
