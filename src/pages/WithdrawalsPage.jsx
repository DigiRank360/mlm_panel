import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { DataTable, Status } from '../components/common/PortalUI'
import { useToast } from '../context/useToast'

export default function WithdrawalsPage({ member, onRequest }) {
  const { showToast } = useToast()
  const [requestOpen, setRequestOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [upiId, setUpiId] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [notice, setNotice] = useState('')
  const canWithdraw = member.status === 'Active' && member.kycStatus === 'approved'

  const submit = async (event) => {
    event.preventDefault()
    try {
      const payoutDetails = method === 'upi'
        ? { method, upiId: upiId.trim() }
        : { method, accountName: accountName.trim(), accountNumber: accountNumber.trim(), ifsc: ifsc.trim() }
      await onRequest(Number(amount), payoutDetails)
      setAmount('')
      setUpiId('')
      setAccountName('')
      setAccountNumber('')
      setIfsc('')
      setNotice('Withdrawal request submitted for review.')
      showToast('Withdrawal request submitted for review.')
      setRequestOpen(false)
    } catch (error) {
      setNotice(error.message)
      showToast(error.message, 'error')
    }
  }

  return <><section className="balance-panel"><div><span>Available to withdraw</span><strong>₹{member.walletBalance.toLocaleString('en-IN')}.00</strong><small>Minimum withdrawal amount: ₹500</small></div><button className="primary-button" disabled={!canWithdraw} onClick={() => { setRequestOpen(!requestOpen); setNotice('') }}><ArrowUpRight size={16} /> Request withdrawal</button></section>
    {member.status !== 'Active' && <p className="withdrawal-notice">Withdrawals are available after your package payment is verified and the account is activated.</p>}
    {member.status === 'Active' && member.kycStatus !== 'approved' && <p className="withdrawal-notice">KYC approval is required before you can withdraw. Submit your documents on the KYC verification page.</p>}
    {notice && <p className="withdrawal-notice">{notice}</p>}
    {requestOpen && <form className="panel withdrawal-form" onSubmit={submit}><label>Amount (₹)<input required type="number" min="500" max={member.walletBalance} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Minimum ₹500" /></label><label>Destination<select required value={method} onChange={(event) => setMethod(event.target.value)}><option value="" disabled>Select payout destination</option><option value="upi">UPI</option><option value="bank">Bank account</option></select></label>{method === 'upi' ? <label>UPI ID<input required value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="name@bank" /></label> : method === 'bank' ? <><label>Account holder<input required value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Name as per bank account" /></label><label>Account number<input required inputMode="numeric" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder="Bank account number" /></label><label>IFSC code<input required value={ifsc} onChange={(event) => setIfsc(event.target.value.toUpperCase())} placeholder="e.g. HDFC0001234" /></label></> : null}<button className="primary-button" type="submit" disabled={member.walletBalance < 500}>Submit request</button></form>}
    <section className="panel members-panel"><div className="panel-header members-header"><div><h2>Payout history</h2><p>Transfers and requests for {member.name}</p></div></div><DataTable headers={['PAYOUT', 'DATE', 'DESTINATION', 'AMOUNT', 'STATUS']}>{member.withdrawals.map((payout) => <tr key={payout.id}><td className="table-amount">{payout.id}</td><td>{payout.date}</td><td>{payout.destination}</td><td className="table-amount">₹{payout.amount.toLocaleString('en-IN')}</td><td><Status>{payout.status}</Status></td></tr>)}</DataTable>{member.withdrawals.length === 0 && <p className="empty-state">No withdrawals have been requested for this account.</p>}</section></>
}