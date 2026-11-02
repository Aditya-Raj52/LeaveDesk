# LeaveDesk Global Corporation
## Official Leave Policy & Employee Attendance Guidelines (2026-2027)
**Document ID:** POL-HR-2026-V4  
**Effective Date:** January 1, 2026  
**Applicability:** All Full-Time and Permanent Employees  

---

### Section 1: General Provisions and Working Hours
#### Clause 1.1: Core Hours and Work Week
The standard working week comprises Monday through Friday, 9:00 AM to 5:00 PM (40 hours per week). Official public holidays gazetted by corporate headquarters are non-working days and are not deducted from paid leave balances.

#### Clause 1.2: Leave Year and Accrual Cycle
The corporate leave year runs from January 1 through December 31. Leave entitlement is credited on January 1 of each calendar year or pro-rated from the employee's date of hire for new joiners.

---

### Section 2: Annual Paid Time Off (PTO / Vacation)
#### Clause 2.1: Annual Leave Entitlement
Full-time regular employees are entitled to twenty-one (21) days of paid annual leave per calendar year, accruing at the rate of 1.75 days per completed calendar month.

#### Clause 2.2: Advance Notice and Scheduling
Requests for annual leave of three (3) or fewer consecutive business days require at least forty-eight (48) hours advance notice. Requests exceeding three (3) consecutive business days require at least fourteen (14) calendar days advance written submission via LeaveDesk to ensure appropriate coverage.

#### Clause 2.3: Rollover and Carry-Forward Limits
Employees may carry forward a maximum of five (5) unused annual leave days into the subsequent calendar year. All carried-over days must be fully utilized by March 31 of the new calendar year, after which unused carry-forward days will lapse without financial encashment, unless an exception is granted in writing by the Chief People Officer.

#### Clause 2.4: Encashment and Separation
Leave encashment during active employment is not permitted. Upon voluntary or involuntary separation, unused accrued annual leave will be paid out in the final settlement at the employee's base daily wage.

---

### Section 3: Sick and Medical Leave
#### Clause 3.1: Sick Leave Entitlement
All full-time employees are entitled to ten (10) paid sick leave days per calendar year. Sick leave is meant solely for personal illness, medical appointments, surgery, mental health recovery, or quarantine.

#### Clause 3.2: Medical Certification Requirements
For sick leave absences exceeding two (2) consecutive business days, the employee is mandatory required to submit a valid medical certificate or doctor's note signed by a licensed medical practitioner. Furthermore, any sick leave taken immediately preceding or succeeding a weekend (Friday or Monday) or a public holiday requires a medical certificate regardless of duration to prevent absenteeism abuses.

#### Clause 3.3: Emergency Notification
In the event of sudden illness, the employee or their representative must notify their reporting manager via LeaveDesk or email no later than two (2) hours prior to the scheduled shift start, unless hospitalized or incapacitated.

---

### Section 4: Casual and Personal Discretionary Leave
#### Clause 4.1: Casual Leave Entitlement
Employees are granted seven (7) days of paid casual leave per calendar year to attend to unexpected personal matters, urgent family obligations, or domestic emergencies.

#### Clause 4.2: Maximum Consecutive Duration
Casual leave cannot be taken for more than three (3) consecutive business days in a single instance. Casual leave cannot be combined with or prefixed/suffixed to Annual Leave without prior authorization from the Department Manager.

#### Clause 4.3: Expiration
Casual leave balances do not carry over into subsequent years and are not eligible for cash payout under any circumstances.

---

### Section 5: Parental, Family, and Compassionate Leave
#### Clause 5.1: Maternity Leave
Female employees welcoming a newborn child or adopting an infant under one year of age are entitled to twenty-six (26) consecutive weeks of fully paid maternity leave. Maternity leave can commence up to eight (8) weeks prior to the anticipated delivery date.

#### Clause 5.2: Paternity / Secondary Caregiver Leave
Eligible fathers and secondary caregivers are entitled to fifteen (15) working days of fully paid paternity leave. Paternity leave can be taken continuously or in two separate blocks within the first six (6) months of the child's birth or adoption.

#### Clause 5.3: Bereavement / Compassionate Leave
Employees are entitled to five (5) consecutive paid days for the loss of an immediate family member (spouse, child, parent, sibling, or parent-in-law). For extended family relatives (grandparent, aunt, uncle), two (2) paid days are permitted.

---

### Section 6: Leave Without Pay (Unpaid Leave) & Sabbaticals
#### Clause 6.1: Eligibility for Unpaid Leave
Unpaid leave may only be requested when all applicable paid leave balances (Annual, Casual, or Sick) have been completely exhausted. Approval is subject to operational impact and requires joint authorization from the Department Head and HR Director.

#### Clause 6.2: Sabbatical Leave
Employees with at least three (3) years of continuous tenure may apply for an unpaid career sabbatical ranging between three (3) and twelve (12) months for educational enrichment or public service.

---

### Section 7: Overlapping Bookings & Database Integrity Rules
#### Clause 7.1: Strict Prohibition of Intersecting Dates
The LeaveDesk system programmatically prohibits submitting or approving overlapping leave requests for the same employee. If a new request intersects with any existing pending or approved leave by even one calendar day, the request is rejected with an Overlapping Request Conflict Error.

#### Clause 7.2: Amendment Procedure
To change leave dates that conflict with a previously submitted request, the employee must first cancel the existing pending request or request the manager to recall the approved request before submitting revised dates.

---

### Section 8: Approval Workflows, Manager SLA, and Atomic Balances
#### Clause 8.1: Manager Review Service Level Agreement (SLA)
Line managers must review and act upon pending leave applications within forty-eight (48) hours of submission. Requests pending beyond seventy-two (72) hours are automatically flagged to HR Operations.

#### Clause 8.2: Atomic Balance Transactions
When an employee files a leave request, the required days are moved from 'Available' to 'Pending'. Upon manager approval, the pending days are atomically converted to 'Used' days. If a request is rejected or cancelled, the pending balance is immediately refunded. All balance modifications are executed inside ACID database transactions with row-level locking.
