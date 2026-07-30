import { Card, PageHeader } from '../components/ui'

const STEPS = [
  { n: 1, title: 'Add a client in seconds', body: 'On the Clients page, use Quick add — just a name and phone. That is all you need to start. Use "Add with details" any time to fill in company, rep, birthday, and notes.' },
  { n: 2, title: 'Log when you reach out', body: 'Tap Log contact on any client to record a touch today, or use Log outreach for the full detail (check-in, pitch, or follow-up with a note and outcome).' },
  { n: 3, title: 'Let the flags tell you who to call', body: 'The goal is at least one touch a month. A client turns yellow at 3 weeks since last contact and red at 4+. The Dashboard lists everyone who needs a touch, worst first.' },
  { n: 4, title: 'Never miss a birthday', body: 'Add a birthday on a client and it shows up under Upcoming birthdays on the Dashboard when it is within 30 days.' },
  { n: 5, title: 'Track their spend', body: 'When a client buys a table, record the event, table, party size, and amount. That builds their spend history and lifetime totals, and ranks your top clients.' },
]

export default function Guide() {
  return (
    <div>
      <PageHeader title="How it works" subtitle="Track outreach to your table clients and their spend over time." />

      <div className="max-w-2xl space-y-3">
        {STEPS.map(s => (
          <Card key={s.n} className="flex items-start gap-4 p-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0c2340] text-sm font-bold text-white">{s.n}</div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{s.title}</h3>
              <p className="mt-0.5 text-sm text-slate-500">{s.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">Questions or a tweak you want? Reach out to your Kona AI contact.</p>
      </div>
    </div>
  )
}
