import { CalendarDays, ChevronDown } from 'lucide-react'

export function Avatar({ initials, color = 'sage', size = 'normal' }) {
  return <span className={`avatar avatar-${color} ${size === 'small' ? 'avatar-small' : ''}`}>{initials}</span>
}

export function Status({ children }) {
  return <span className={`status status-${children.toLowerCase().replaceAll(' ', '-')}`}>{children}</span>
}

export function PageHeading({ title, description, action }) {
  const today = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  return <div className="page-heading"><div><p className="eyebrow">{today}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>
}

export function DataTable({ children, headers }) {
  return <div className="table-scroll"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}

export function MembersTable({ members, query }) {
  const filteredMembers = members.filter((member) => `${member.name} ${member.id} ${member.tier}`.toLowerCase().includes(query.toLowerCase()))
  return <DataTable headers={['MEMBER', 'RANK', 'TEAM VOLUME', 'JOINED', 'STATUS']}>
    {filteredMembers.map((member) => <tr key={member.id}><td><div className="member-cell"><Avatar initials={member.initials} color={member.color} /><span><strong>{member.name}</strong><small>{member.id}</small></span></div></td><td>{member.tier}</td><td className="table-amount">{member.volume}</td><td>{member.date}</td><td><Status>{member.status}</Status></td></tr>)}
    {filteredMembers.length === 0 && <tr><td colSpan="5" className="empty-state">{query ? `No team members match “${query}”.` : 'No team members in this downline yet.'}</td></tr>}
  </DataTable>
}

export function RevenueChart({ series }) {
  const maxValue = Math.max(1, ...series.map((item) => item.businessVolume))
  const points = series.map((item, index) => {
    const x = series.length === 1 ? 371 : 30 + (index * 682) / (series.length - 1)
    const y = 175 - (item.businessVolume / maxValue) * 140
    return { x, y, label: item.label }
  })
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(' ')
  const labelIndexes = new Set(Array.from({ length: 7 }, (_, index) => Math.round((index * (points.length - 1)) / 6)))
  return <svg className="revenue-chart" viewBox="0 0 712 220" role="img" aria-label={`Team business volume for ${series.length} days`} preserveAspectRatio="none">
    <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4d8171" stopOpacity=".18" /><stop offset="100%" stopColor="#4d8171" stopOpacity="0" /></linearGradient></defs>
    {[34, 78, 122, 166].map((y) => <line key={y} x1="28" x2="710" y1={y} y2={y} className="chart-gridline" />)}
    {points.length > 0 && <><polygon points={`30,205 ${linePoints} 712,205`} fill="url(#chart-fill)" /><polyline points={linePoints} className="chart-line" /><circle cx={points.at(-1).x} cy={points.at(-1).y} r="5" className="chart-dot" /></>}
    {points.filter((_, index) => labelIndexes.has(index)).map(({ x, label }, index, visible) => <text key={`${x}-${label}`} x={x} y="216" className="chart-label" textAnchor={index === 0 ? 'start' : index === visible.length - 1 ? 'end' : 'middle'}>{label}</text>)}
  </svg>
}

export function PeriodSelect({ value, onChange }) {
  return <label className="period-select"><CalendarDays size={15} /><select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Chart period"><option>7 days</option><option>30 days</option><option>90 days</option></select><ChevronDown size={14} /></label>
}
