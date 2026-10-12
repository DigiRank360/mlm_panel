import { ChevronDown, Filter } from 'lucide-react'
import { DataTable, Status } from '../components/common/PortalUI'

export default function OrdersPage({ member }) {
  return <section className="panel members-panel"><div className="panel-header members-header"><div><h2>Order history</h2><p>Packages and products purchased by {member.name}</p></div><button className="outline-button"><Filter size={15} /> All orders <ChevronDown size={14} /></button></div><DataTable headers={['ORDER', 'PRODUCT / PACKAGE', 'DATE', 'TOTAL', 'POINTS', 'STATUS']}>{member.orders.map((order) => <tr key={order.id}><td className="table-amount">{order.id}</td><td>{order.product}</td><td>{order.date}</td><td className="table-amount">{order.total}</td><td>{order.points.toLocaleString('en-IN')} PV</td><td><Status>{order.status}</Status></td></tr>)}</DataTable>{member.orders.length === 0 && <p className="empty-state">No orders are recorded for this account yet.</p>}</section>
}