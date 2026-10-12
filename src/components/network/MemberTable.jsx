import { Download } from 'lucide-react'

function Avatar({ initials, color }) {
  return <span className={`avatar avatar-${color}`}>{initials}</span>
}

function Status({ children }) {
  return <span className={`status status-${children.toLowerCase().replaceAll(' ', '-')}`}>{children}</span>
}

export default function MemberTable({ members, query, activeOnly, onExport }) {
  const visibleMembers = members.filter((member) =>
    (!activeOnly || member.status === 'Active') &&
    `${member.name} ${member.id} ${member.tier}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <section className="panel members-panel network-members-panel">
      <div className="panel-header members-header">
        <div><h2>All team members</h2><p>{visibleMembers.length} members in your binary network</p></div>
        <button className="outline-button" onClick={onExport}><Download size={15} /> Export</button>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr>{['MEMBER', 'SPONSOR', 'LEG', 'PACKAGE / PV', 'RANK', 'TEAM VOLUME', 'STATUS'].map((header) => <th key={header}>{header}</th>)}</tr></thead>
          <tbody>
            {visibleMembers.map((member) => (
              <tr key={member.id}>
                <td><div className="member-cell"><Avatar initials={member.initials} color={member.color} /><span><strong>{member.name}</strong><small>{member.id}</small></span></div></td>
                <td>{member.sponsorId}</td><td><span className={`leg-label leg-${member.leg}`}>{member.leg}</span></td><td><strong>{member.packageName}</strong><small className="member-points">{member.personalPoints.toLocaleString('en-IN')} PV</small></td>
                <td>{member.tier}</td><td className="table-amount">{member.volume}</td><td><Status>{member.status}</Status></td>
              </tr>
            ))}
            {visibleMembers.length === 0 && <tr><td colSpan="7" className="empty-state">No team members match “{query}”.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}