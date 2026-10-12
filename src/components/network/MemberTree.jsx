import { GitBranch, UserPlus } from 'lucide-react'

function TreeNode({ member, members, depth, onAdd }) {
  const children = {
    left: members.find((candidate) => candidate.sponsorId === member.id && candidate.leg === 'left'),
    right: members.find((candidate) => candidate.sponsorId === member.id && candidate.leg === 'right'),
  }

  return (
    <div className="tree-node-wrap">
      <article className={`tree-member ${depth === 0 ? 'tree-root' : ''}`}>
        <span className={`tree-avatar avatar-${member.color}`}>{member.initials}</span>
        <span className="tree-member-info"><strong>{member.name}</strong><small>{member.id} · {member.tier}</small></span>
        <span className="tree-volume">{member.volume}</span>
      </article>
      <div className="tree-children">
        {['left', 'right'].map((leg) => (
          <div className={`tree-branch branch-${leg}`} key={`${member.id}-${leg}`}>
            {children[leg]
              ? <TreeNode member={children[leg]} members={members} depth={depth + 1} onAdd={onAdd} />
              : <button className="tree-empty-slot" onClick={() => onAdd(member.id, leg)}><UserPlus size={15} /><span>Add {leg} leg</span></button>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MemberTree({ members, onAdd, rootMember }) {
  const root = { ...rootMember, volume: rootMember.volume || `₹${(rootMember.teamPoints || 0).toLocaleString('en-IN')}` }
  return (
    <section className="panel binary-panel">
      <div className="panel-header binary-header"><div><h2><GitBranch size={16} /> Binary placement tree</h2><p>Direct and spillover members arranged by left and right leg</p></div><div className="tree-legend"><span><i className="leg-dot leg-dot-left" /> Left leg</span><span><i className="leg-dot leg-dot-right" /> Right leg</span></div></div>
      <div className="tree-scroll"><div className="binary-tree"><TreeNode member={root} members={members} depth={0} onAdd={onAdd} /></div></div>
    </section>
  )
}