-- ============================================================================
-- Ketchy Shuby · SAMPLE data (optional)
-- Run AFTER you've signed in once (so a workspace/tenant exists).
-- Attaches to the most recently created tenant. Delete these clients from the
-- Clients page before real use, or run the CLEAR block at the bottom.
-- ============================================================================

-- ── Clients ──────────────────────────────────────────────────────────────────
with t as (select id from tenants order by created_at desc limit 1)
insert into clients (tenant_id, name, contact_name, phone, email, company, rep, status, birthday, next_followup_date, notes)
select t.id, v.* from t, (values
  ('Marcus Bell',        'Marcus',   '(609) 555-0142', 'marcus@bellgroup.co', 'Bell Group', 'Viscount', 'vip',      date '1990-08-09', date '2026-07-25', 'Biggest spender. Always wants the corner booth. Birthday 8/9 — wants something big.'),
  ('Delta Chi (Tyler)',  'Tyler R.', '(609) 555-0188', 'tyler.r@email.com',   'Delta Chi',  'Viscount', 'active',   date '1999-08-02', date '2026-07-27', 'Frat formals + game nights. Books for 10-12. Price sensitive but reliable.'),
  ('Priya Shah',         'Priya',    '(201) 555-0110', 'priya@shahco.com',    'Shah & Co',  'Viscount', 'active',   date '1988-09-15', date '2026-08-02', 'Corporate entertaining. Comes in once a quarter, spends big when she does.'),
  ('The Kessler Bros',   'Danny',    '(609) 555-0177', 'danny.k@email.com',   NULL,         'Viscount', 'vip',      date '1992-11-20', date '2026-07-26', 'Two brothers, split the tab. In almost every other weekend in season.'),
  ('Jordan Ruiz',        'Jordan',   '(732) 555-0155', 'jordan@email.com',    NULL,         'Viscount', 'prospect', NULL,              NULL,              'Referred by Marcus. Has not booked yet — keep warm.'),
  ('Sasha Lin',          'Sasha',    '(646) 555-0133', 'sasha.lin@email.com', 'Lin Events', 'Viscount', 'dormant',  date '1991-08-04', date '2026-07-15', 'Big last summer, quiet this year. Worth a re-engagement push.')
) as v(name, contact_name, phone, email, company, rep, status, birthday, next_followup_date, notes)
on conflict do nothing;

-- ── Purchases ────────────────────────────────────────────────────────────────
insert into purchases (tenant_id, client_id, event_name, purchased_on, table_name, party_size, amount, notes)
select c.tenant_id, c.id, v.event_name, v.purchased_on::date, v.table_name, v.party_size, v.amount, v.notes
from clients c
join (values
  ('Marcus Bell',       'Sat 7/12',       '2026-07-12', 'VIP Booth 1', 8,  4200, '3 bottles, comped a round'),
  ('Marcus Bell',       'Sat 6/21',       '2026-06-21', 'VIP Booth 1', 10, 5100, 'Big night, brought clients'),
  ('Marcus Bell',       'NYE 12/31',      '2025-12-31', 'VIP Booth 1', 12, 8000, 'NYE — top spend of the year'),
  ('Delta Chi (Tyler)', 'Formal 5/3',     '2026-05-03', 'Floor A',     12, 2600, 'Spring formal'),
  ('Delta Chi (Tyler)', 'Sat 7/5',        '2026-07-05', 'Floor B',     10, 2200, NULL),
  ('Priya Shah',        'Client dinner',  '2026-06-14', 'Mezz 2',      6,  3400, 'Corporate card'),
  ('The Kessler Bros',  'Sat 7/19',       '2026-07-19', 'Booth 3',     6,  1900, NULL),
  ('The Kessler Bros',  'Sat 7/5',        '2026-07-05', 'Booth 3',     6,  2050, NULL),
  ('The Kessler Bros',  'Sat 6/28',       '2026-06-28', 'Booth 4',     8,  2300, 'Added a bottle late'),
  ('Sasha Lin',         'Launch party',   '2025-08-16', 'Floor A',     14, 4600, 'Product launch, last summer')
) as v(client_name, event_name, purchased_on, table_name, party_size, amount, notes)
  on v.client_name = c.name
where c.tenant_id = (select id from tenants order by created_at desc limit 1);

-- ── Outreach ─────────────────────────────────────────────────────────────────
insert into outreach (tenant_id, client_id, occurred_on, type, channel, outcome, notes)
select c.tenant_id, c.id, v.occurred_on::date, v.type, v.channel, v.outcome, v.notes
from clients c
join (values
  ('Marcus Bell',       '2026-07-20', 'pitch',     'text',  'interested',  'Pitched corner booth for 8/9 birthday. Sending bottle options.'),
  ('Marcus Bell',       '2026-07-08', 'check_in',  'call',  'responded',   'Checked in on summer plans — around most Saturdays.'),
  ('Delta Chi (Tyler)', '2026-07-22', 'follow_up', 'text',  'responded',   'Following up on next game night. Waiting on head count.'),
  ('Delta Chi (Tyler)', '2026-07-01', 'check_in',  'dm',    'responded',   'Touched base after the 7/5 booking.'),
  ('Priya Shah',        '2026-07-10', 'check_in',  'email', 'no_response', 'Emailed about Q3 corporate night. No reply yet.'),
  ('The Kessler Bros',  '2026-07-21', 'pitch',     'text',  'closed_won',  'Asked about this Saturday — booked Booth 3.'),
  ('The Kessler Bros',  '2026-07-06', 'check_in',  'text',  'responded',   'Quick check-in, all good.'),
  ('Jordan Ruiz',       '2026-07-18', 'pitch',     'call',  'not_now',     'First pitch. Interested but nothing on the calendar yet.'),
  ('Sasha Lin',         '2026-07-02', 'follow_up', 'email', 'no_response', 'Re-engagement email. Silent so far — try a call next.')
) as v(client_name, occurred_on, type, channel, outcome, notes)
  on v.client_name = c.name
where c.tenant_id = (select id from tenants order by created_at desc limit 1);

-- ── CLEAR sample data (uncomment + run to wipe the seeded clients) ────────────
-- delete from clients
--  where tenant_id = (select id from tenants order by created_at desc limit 1)
--    and name in ('Marcus Bell','Delta Chi (Tyler)','Priya Shah','The Kessler Bros','Jordan Ruiz','Sasha Lin');
