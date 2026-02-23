const db = require('./setup')
const { v4: uuidv4 } = require('uuid')

const CUSTOMERS = [
    {
        id: 'CUST-001',
        name: 'Rajesh Kumar',
        phone: '+91-9876543210',
        loanId: 'LN-2025-00142',
        loanAmount: 500000,
        outstandingAmount: 187500,
        riskLevel: 'high',
        daysPastDue: 67,
        totalCalls: 4,
    },
    {
        id: 'CUST-002',
        name: 'Priya Sharma',
        phone: '+91-9123456789',
        loanId: 'LN-2025-00298',
        loanAmount: 300000,
        outstandingAmount: 45000,
        riskLevel: 'low',
        daysPastDue: 12,
        totalCalls: 2,
    },
    {
        id: 'CUST-003',
        name: 'Amit Patel',
        phone: '+91-9988776655',
        loanId: 'LN-2024-01055',
        loanAmount: 750000,
        outstandingAmount: 412000,
        riskLevel: 'critical',
        daysPastDue: 124,
        totalCalls: 5,
    },
    {
        id: 'CUST-004',
        name: 'Sunita Devi',
        phone: '+91-9456781234',
        loanId: 'LN-2025-00511',
        loanAmount: 200000,
        outstandingAmount: 98000,
        riskLevel: 'medium',
        daysPastDue: 34,
        totalCalls: 3,
    },
    {
        id: 'CUST-005',
        name: 'Mohammed Irfan',
        phone: '+91-9345678901',
        loanId: 'LN-2025-00673',
        loanAmount: 450000,
        outstandingAmount: 225000,
        riskLevel: 'high',
        daysPastDue: 89,
        totalCalls: 3,
    },
]

const AGENTS = ['Vikram Singh', 'Anita Desai', 'Rahul Mehta', 'Neha Gupta']

// ─── Transcript data for each call ──────────────────────────────────────────

const CALL_DATA = [
    // CUST-001 — Rajesh Kumar — 4 calls showing escalating tension
    {
        callId: 'CALL-001',
        customerId: 'CUST-001',
        agentName: 'Vikram Singh',
        duration: 342,
        callDate: '2026-01-10T10:30:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 15, text: 'Good morning, am I speaking with Mr. Rajesh Kumar? This is Vikram Singh calling from ABC Bank regarding your personal loan account LN-2025-00142.' },
            { speaker: 'customer', start: 16, end: 25, text: 'Yes, this is Rajesh. I know why you are calling. Look, I have been facing some financial difficulties lately.' },
            { speaker: 'agent', start: 26, end: 45, text: 'I understand, Mr. Kumar. Your account shows an outstanding of one lakh eighty-seven thousand five hundred rupees with sixty-seven days past due. Can you tell me about your current situation?' },
            { speaker: 'customer', start: 46, end: 70, text: 'I lost my job about two months ago. I was working at TechServ Solutions as a senior developer. The company had layoffs. I am actively looking for work and have a couple of interviews lined up.' },
            { speaker: 'agent', start: 71, end: 90, text: 'I am sorry to hear about the job loss. We do have hardship programs available. Would you be able to make even a partial payment in the meantime?' },
            { speaker: 'customer', start: 91, end: 115, text: 'I can try to arrange maybe twenty thousand by the end of this month. My wife is working and we have some savings, but I cannot commit to the full EMI right now.' },
            { speaker: 'agent', start: 116, end: 140, text: 'Twenty thousand by January thirty-first would be a good start. I will note that as a commitment. Shall we also look at restructuring your EMI once you find employment?' },
            { speaker: 'customer', start: 141, end: 155, text: 'Yes, that would be helpful. I expect to have a new job within a month or so. Then I can resume regular payments.' },
            { speaker: 'agent', start: 156, end: 175, text: 'Alright, Mr. Kumar. I have recorded your promise to pay twenty thousand rupees by January thirty-first. I will also flag your account for our hardship review team. Is there anything else?' },
            { speaker: 'customer', start: 176, end: 185, text: 'No, that is all. Thank you for being understanding about this.' },
        ],
        analysis: {
            repaymentIntent: { score: 62, level: 'medium', evidence: ['Can try to arrange twenty thousand', 'Expects new job within a month'], signals: ['partial_willingness', 'hardship_claim', 'future_commitment'] },
            promiseToPay: { detected: true, amount: 20000, date: '2026-01-31', installment: false, confidence: 70, details: 'Promised ₹20,000 by Jan 31, conditional on savings availability' },
            complianceFlags: [],
            crossCallFlags: [],
            outcome: 'partial_commitment',
            summary: 'Borrower claims job loss from TechServ Solutions, expresses willingness to pay ₹20,000 by month-end. Requests EMI restructuring upon re-employment. Cooperative tone throughout.',
            keyPoints: ['Job loss claimed — 2 months ago', 'Partial payment of ₹20,000 promised by Jan 31', 'EMI restructuring requested', 'Wife is employed — some savings available'],
            nextActions: ['Follow up on Jan 31 for payment confirmation', 'Flag for hardship review', 'Check employment status in next call'],
            riskFlags: ['Income disruption', 'Conditional commitment'],
            riskScore: 65,
        },
    },
    {
        callId: 'CALL-002',
        customerId: 'CUST-001',
        agentName: 'Anita Desai',
        duration: 280,
        callDate: '2026-02-03T14:15:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 18, text: 'Hello Mr. Kumar, this is Anita Desai from ABC Bank. I am following up on your payment commitment from our last conversation. Our records show the twenty thousand rupee payment was not received by January thirty-first.' },
            { speaker: 'customer', start: 19, end: 38, text: 'Yes, I know. I am sorry about that. Things got worse. My wife also had to take some time off work due to a medical issue. We had unexpected hospital bills.' },
            { speaker: 'agent', start: 39, end: 55, text: 'I am sorry to hear about your wife. However, Mr. Kumar, you did make a commitment. Can you give me a revised timeline for when you can make a payment?' },
            { speaker: 'customer', start: 56, end: 78, text: 'I understand your frustration. I have actually received a job offer now. The joining date is February fifteenth. Once I get my first salary by March fifth, I can pay the full outstanding amount in three installments.' },
            { speaker: 'agent', start: 79, end: 95, text: 'That sounds promising. Can you break down the installment plan you are proposing?' },
            { speaker: 'customer', start: 96, end: 120, text: 'I am thinking sixty thousand in March, sixty thousand in April, and the remaining in May. That should clear the entire outstanding amount.' },
            { speaker: 'agent', start: 121, end: 145, text: 'Alright, I will record this new plan. But Mr. Kumar, please understand that continued non-payment may result in further action. We have been patient so far.' },
            { speaker: 'customer', start: 146, end: 160, text: 'I completely understand. This time it will be different. I have the offer letter in hand. I can even email you a copy if needed.' },
        ],
        analysis: {
            repaymentIntent: { score: 72, level: 'high', evidence: ['Received job offer', 'Proposed detailed 3-month installment plan', 'Offered to share offer letter'], signals: ['concrete_plan', 'documentation_offered', 'broken_promise_acknowledged'] },
            promiseToPay: { detected: true, amount: 60000, date: '2026-03-05', installment: true, confidence: 65, details: '₹60K/month for 3 months starting March. Previous promise broken.' },
            complianceFlags: [],
            crossCallFlags: [
                { field: 'employment_status', previousClaim: 'Unemployed, looking for work', currentClaim: 'Received job offer, joining Feb 15', callDate: '2026-01-10' },
                { field: 'hardship_reason', previousClaim: 'Job loss only', currentClaim: 'Job loss + wife medical emergency', callDate: '2026-01-10' },
            ],
            outcome: 'payment_committed',
            summary: 'Previous ₹20K promise was broken. Borrower adds new hardship claim (wife medical issue). Now claims job offer received with Feb 15 joining. Proposes 3-month installment plan of ₹60K each. Offered to share employment documentation.',
            keyPoints: ['Broken promise from Jan 31', 'New hardship: wife medical issue', 'Job offer received — joining Feb 15', '3-installment plan proposed: ₹60K × 3 months'],
            nextActions: ['Request copy of offer letter', 'Follow up March 5 for first installment', 'Monitor for second broken promise'],
            riskFlags: ['Broken previous promise', 'Escalating hardship claims', 'Pattern of postponement'],
            riskScore: 72,
        },
    },
    {
        callId: 'CALL-003',
        customerId: 'CUST-001',
        agentName: 'Vikram Singh',
        duration: 195,
        callDate: '2026-02-18T09:45:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 20, text: 'Mr. Kumar, this is Vikram Singh again from ABC Bank. I am calling to check on the job offer you mentioned. You said you would be joining on February fifteenth. Is that confirmed?' },
            { speaker: 'customer', start: 21, end: 45, text: 'Actually, the joining got delayed by a week. They said some background verification is pending. But I have started freelancing in the meantime. I earned about thirty-five thousand last week.' },
            { speaker: 'agent', start: 46, end: 65, text: 'I see. Mr. Kumar, this is the second time a commitment timeline has shifted. Can you make any payment from the freelance income you just mentioned?' },
            { speaker: 'customer', start: 66, end: 85, text: 'Yes, I can pay fifteen thousand this week. I need to keep some for household expenses. The full plan will start once I join the company.' },
            { speaker: 'agent', start: 86, end: 100, text: 'I will record fifteen thousand this week. Mr. Kumar, I must inform you that if we do not see consistent payments, the account may be referred for further recovery action.' },
            { speaker: 'customer', start: 101, end: 115, text: 'I understand. Please do not take any harsh steps. I am genuinely trying. I will make the payment by Friday.' },
        ],
        analysis: {
            repaymentIntent: { score: 55, level: 'medium', evidence: ['Freelance income claimed', 'Offered ₹15K this week'], signals: ['reduced_commitment', 'timeline_shift', 'partial_willingness'] },
            promiseToPay: { detected: true, amount: 15000, date: '2026-02-21', installment: false, confidence: 50, details: '₹15K by Friday from freelance income. Reduced from earlier ₹60K plan.' },
            complianceFlags: [],
            crossCallFlags: [
                { field: 'employment_status', previousClaim: 'Job offer, joining Feb 15', currentClaim: 'Joining delayed, doing freelance', callDate: '2026-02-03' },
                { field: 'income_claim', previousClaim: 'No income (unemployed)', currentClaim: 'Freelance income ₹35K/week', callDate: '2026-02-03' },
            ],
            outcome: 'partial_commitment',
            summary: 'Job joining delayed again. Borrower now claims freelance income of ₹35K. Promises ₹15K this week — significantly less than previous ₹60K installment plan. Showing a pattern of shifting timelines and reducing commitments.',
            keyPoints: ['Job joining delayed — background verification pending', 'Freelancing claimed — ₹35K last week', 'Reduced promise to ₹15K this week', 'Previous ₹60K/month plan effectively abandoned'],
            nextActions: ['Verify ₹15K by Friday Feb 21', 'Escalate if payment missed — third broken promise', 'Consider referring to senior recovery team'],
            riskFlags: ['Repeated timeline shifts', 'Decreasing commitment amounts', 'Inconsistent employment claims'],
            riskScore: 78,
        },
    },
    {
        callId: 'CALL-004',
        customerId: 'CUST-001',
        agentName: 'Rahul Mehta',
        duration: 260,
        callDate: '2026-02-20T11:00:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 15, text: 'Good morning, Mr. Kumar. This is Rahul Mehta from ABC Bank recovery team. Your account has been escalated to our senior team. The Friday payment of fifteen thousand was not received.' },
            { speaker: 'customer', start: 16, end: 35, text: 'I transferred it! Check your bank records. I sent it on Friday evening through UPI.' },
            { speaker: 'agent', start: 36, end: 50, text: 'Let me check. I do see a UPI transaction of ten thousand rupees on Friday. However, the commitment was for fifteen thousand.' },
            { speaker: 'customer', start: 51, end: 72, text: 'Yes, I could only manage ten thousand. Some urgent expense came up. But listen, I have now officially joined the company this Monday. My employee ID is TCS-28745. The salary credit will happen on March fifth.' },
            { speaker: 'agent', start: 73, end: 95, text: 'Good to hear about the employment. However, Mr. Kumar, your account has multiple broken promises. The management is considering referring this to our legal team. We need a concrete payment by March fifth.' },
            { speaker: 'customer', start: 96, end: 120, text: 'Please do not involve legal. I promise on my family, I will pay one lakh by March fifth from my first salary. I can set up an auto-debit mandate if you want. Just give me this last chance.' },
            { speaker: 'agent', start: 121, end: 145, text: 'I will present your case to the management. A payment of one lakh by March fifth via auto-debit mandate would demonstrate good faith. Can you visit our branch to set that up this week?' },
            { speaker: 'customer', start: 146, end: 160, text: 'Yes, I will come to the branch on Wednesday. Thank you for understanding. I will not let you down this time.' },
        ],
        analysis: {
            repaymentIntent: { score: 68, level: 'medium', evidence: ['Partial payment made (₹10K)', 'Offered auto-debit mandate', 'Provided employee ID'], signals: ['partial_payment_made', 'auto_debit_offered', 'employment_verified'] },
            promiseToPay: { detected: true, amount: 100000, date: '2026-03-05', installment: false, confidence: 55, details: '₹1 lakh by March 5 via auto-debit. Has history of broken promises but now employed.' },
            complianceFlags: [
                { type: 'legal_threat_mention', severity: 'low', evidence: 'Agent mentioned legal team referral as factual escalation possibility, within acceptable bounds', timestamp: '1:13' },
            ],
            crossCallFlags: [
                { field: 'payment_promise', previousClaim: '₹15,000 by Friday', currentClaim: '₹10,000 paid (partial)', callDate: '2026-02-18' },
                { field: 'employment_status', previousClaim: 'Joining delayed, freelancing', currentClaim: 'Joined this Monday, Employee ID TCS-28745', callDate: '2026-02-18' },
            ],
            outcome: 'payment_committed',
            summary: 'Partial payment of ₹10K received (vs ₹15K promised). Borrower states he joined employer this Monday with verifiable employee ID. Promises ₹1L by March 5 with auto-debit mandate setup. Account escalated to senior team. Agent mentioned legal referral — within compliance bounds.',
            keyPoints: ['₹10K payment received (was ₹15K promised)', 'Now employed at TCS — ID: TCS-28745', 'Promises ₹1L by March 5', 'Auto-debit mandate to be set up at branch Wednesday', 'Account escalated to senior recovery team'],
            nextActions: ['Verify branch visit for auto-debit mandate setup Wednesday', 'Verify employment with TCS using employee ID', 'Confirm ₹1L payment on March 5', 'Prepare legal referral if March 5 payment missed'],
            riskFlags: ['Serial broken promises (4th commitment)', 'Partial payments pattern', 'Escalation in progress'],
            riskScore: 75,
        },
    },

    // CUST-002 — Priya Sharma — 2 calls, cooperative borrower
    {
        callId: 'CALL-005',
        customerId: 'CUST-002',
        agentName: 'Neha Gupta',
        duration: 180,
        callDate: '2026-02-10T11:00:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 12, text: 'Hello, may I speak with Ms. Priya Sharma? This is Neha Gupta from ABC Bank regarding your education loan.' },
            { speaker: 'customer', start: 13, end: 25, text: 'Yes, this is Priya. I know I have a small overdue. Actually, I was planning to call you. I have already initiated the payment through net banking.' },
            { speaker: 'agent', start: 26, end: 40, text: 'That is great to hear. The outstanding is forty-five thousand rupees. Can you confirm the amount and when it will clear?' },
            { speaker: 'customer', start: 41, end: 55, text: 'I transferred the full forty-five thousand yesterday. The reference number is UTR9876543210. It should reflect by today or tomorrow.' },
            { speaker: 'agent', start: 56, end: 70, text: 'Wonderful, Ms. Sharma. I will verify the UTR and update your account. Going forward, would you like to set up auto-debit to avoid any future delays?' },
            { speaker: 'customer', start: 71, end: 85, text: 'Yes, that would be a good idea. Can you help me set that up over the phone?' },
            { speaker: 'agent', start: 86, end: 100, text: 'Of course. I will send you the e-mandate link via SMS right after this call. Thank you for being so prompt, Ms. Sharma.' },
        ],
        analysis: {
            repaymentIntent: { score: 95, level: 'high', evidence: ['Already initiated payment', 'Provided UTR number', 'Agreed to auto-debit'], signals: ['proactive_payment', 'full_amount', 'prevention_measures'] },
            promiseToPay: { detected: true, amount: 45000, date: '2026-02-10', installment: false, confidence: 95, details: 'Full ₹45K already transferred. UTR: UTR9876543210' },
            complianceFlags: [],
            crossCallFlags: [],
            outcome: 'payment_committed',
            summary: 'Highly cooperative borrower. Full payment of ₹45K already initiated before the call. UTR provided for verification. Agreed to set up auto-debit for future payments.',
            keyPoints: ['Full ₹45K already transferred', 'UTR: UTR9876543210', 'Auto-debit setup agreed', 'Proactive borrower — was planning to call bank'],
            nextActions: ['Verify UTR within 24 hours', 'Send e-mandate link via SMS', 'Mark account as regularized upon clearance'],
            riskFlags: [],
            riskScore: 10,
        },
    },
    {
        callId: 'CALL-006',
        customerId: 'CUST-002',
        agentName: 'Neha Gupta',
        duration: 120,
        callDate: '2026-02-15T09:30:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 15, text: 'Hi Ms. Sharma, this is Neha again from ABC Bank. I am happy to confirm that your payment of forty-five thousand has been received and your account is now current.' },
            { speaker: 'customer', start: 16, end: 30, text: 'Oh great, thank you for letting me know. And yes, I completed the e-mandate registration as well.' },
            { speaker: 'agent', start: 31, end: 45, text: 'Perfect. Your auto-debit is set up for the fifth of every month. Is there anything else I can help you with?' },
            { speaker: 'customer', start: 46, end: 55, text: 'No, that is all. Thank you for being so helpful, Neha.' },
        ],
        analysis: {
            repaymentIntent: { score: 98, level: 'high', evidence: ['Payment confirmed', 'Auto-debit set up'], signals: ['account_regularized', 'proactive_prevention'] },
            promiseToPay: { detected: false, amount: null, date: null, installment: false, confidence: 0, details: 'No PTP needed — account current' },
            complianceFlags: [],
            crossCallFlags: [],
            outcome: 'payment_committed',
            summary: 'Follow-up confirmation call. Payment of ₹45K confirmed received. Auto-debit mandate registered. Account fully regularized.',
            keyPoints: ['₹45K payment confirmed', 'Auto-debit active — 5th of every month', 'Account current — no outstanding'],
            nextActions: ['No further action needed', 'Account marked regularized'],
            riskFlags: [],
            riskScore: 5,
        },
    },

    // CUST-003 — Amit Patel — 5 calls, hostile / compliance issues
    {
        callId: 'CALL-007',
        customerId: 'CUST-003',
        agentName: 'Vikram Singh',
        duration: 420,
        callDate: '2025-12-15T10:00:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 15, text: 'Mr. Patel, this is Vikram Singh from ABC Bank. Your business loan account shows an outstanding of four lakh twelve thousand with over one hundred twenty days past due. This is extremely overdue.' },
            { speaker: 'customer', start: 16, end: 35, text: 'I have told your people many times, my business is in losses. The market is bad. I cannot pay what I do not have.' },
            { speaker: 'agent', start: 36, end: 55, text: 'Mr. Patel, we understand business can be tough, but this loan has been overdue for four months. We need to see some effort towards repayment. Even a token amount would help.' },
            { speaker: 'customer', start: 56, end: 75, text: 'Token amount? I owe four lakhs and you want token? My shop barely makes enough to feed my family. Stop calling me every week.' },
            { speaker: 'agent', start: 76, end: 100, text: 'Sir, I must inform you that if there is no payment or arrangement, the bank may have to initiate recovery proceedings. This is not a threat, it is the process. Let us try to find a solution together.' },
            { speaker: 'customer', start: 101, end: 125, text: 'Do whatever you want. I do not have money. My partner cheated me and took half the inventory. I am fighting a court case against him. Once I get justice, I will pay everything.' },
            { speaker: 'agent', start: 126, end: 145, text: 'I understand the situation with your business partner. Can you provide any documentation of the court case? We may be able to put a temporary hold on recovery actions.' },
            { speaker: 'customer', start: 146, end: 160, text: 'I will get my lawyer to send the court filing papers. But stop harassing me with these calls.' },
        ],
        analysis: {
            repaymentIntent: { score: 15, level: 'low', evidence: ['Cannot pay what I do not have', 'Do whatever you want', 'Contingent on court case outcome'], signals: ['refusal', 'hostile_tone', 'external_dependency'] },
            promiseToPay: { detected: false, amount: null, date: null, installment: false, confidence: 0, details: 'No payment promise — repayment contingent on unresolved court case' },
            complianceFlags: [],
            crossCallFlags: [],
            outcome: 'dispute_raised',
            summary: 'Hostile borrower claiming business losses and partner fraud. Refuses to pay, cites ongoing court case. Offered to share court filing documents. No payment commitment made.',
            keyPoints: ['Business losses claimed', 'Partner fraud — court case ongoing', 'Refuses any payment currently', 'Offered to share court docs', 'Hostile/frustrated tone'],
            nextActions: ['Request court filing documentation', 'Review for possible recovery hold', 'Escalate to legal/recovery team', 'Schedule follow-up in 30 days'],
            riskFlags: ['Complete refusal', 'Hostile borrower', 'Legal dispute', '120+ days past due'],
            riskScore: 90,
        },
    },
    {
        callId: 'CALL-008',
        customerId: 'CUST-003',
        agentName: 'Rahul Mehta',
        duration: 310,
        callDate: '2026-01-20T15:30:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 15, text: 'Mr. Patel, Rahul Mehta from ABC Bank. We have not received the court documents you promised last month. Your account is now flagged for recovery.' },
            { speaker: 'customer', start: 16, end: 30, text: 'My lawyer has been busy. He will send it this week. And I told you, I have no money to pay right now.' },
            { speaker: 'agent', start: 31, end: 55, text: 'Mr. Patel, every time we call you say the same thing. Meanwhile your overdue keeps growing. It has been over four months. If you do not cooperate, we will have no choice but to send a field recovery agent to your premises.' },
            { speaker: 'customer', start: 56, end: 75, text: 'Are you threatening me? You cannot send people to my shop! I will complain to the banking ombudsman. I know my rights.' },
            { speaker: 'agent', start: 76, end: 100, text: 'Sir it is not a threat. If you do not pay we have the right to come to your house and your shop. Your family will come to know about this also. Think about your reputation.' },
            { speaker: 'customer', start: 101, end: 120, text: 'How dare you bring my family into this! This is harassment! I am recording this call. I will report you.' },
            { speaker: 'agent', start: 121, end: 140, text: 'Mr. Patel, I apologize if I was unclear. I am simply explaining the process. Please, let us find a resolution.' },
            { speaker: 'customer', start: 141, end: 155, text: 'There is no resolution until my court case is settled. Stop calling me.' },
        ],
        analysis: {
            repaymentIntent: { score: 8, level: 'none', evidence: ['No money to pay', 'No resolution until court case'], signals: ['complete_refusal', 'hostile', 'legal_threat_by_borrower'] },
            promiseToPay: { detected: false, amount: null, date: null, installment: false, confidence: 0, details: 'No payment promise' },
            complianceFlags: [
                { type: 'intimidation', severity: 'high', evidence: 'Agent mentioned visiting home/shop and family reputation — "Your family will come to know about this also. Think about your reputation."', timestamp: '1:16' },
                { type: 'harassment_claim', severity: 'medium', evidence: 'Borrower explicitly claimed harassment and stated recording the call', timestamp: '1:41' },
            ],
            crossCallFlags: [
                { field: 'court_documents', previousClaim: 'Will get lawyer to send court papers', currentClaim: 'Lawyer has been busy, will send this week', callDate: '2025-12-15' },
            ],
            outcome: 'escalation_required',
            summary: 'Agent crossed compliance boundaries by mentioning family reputation and home visits as pressure tactics. Borrower threatened ombudsman complaint and stated recording the call. No payment progress. Court documents still not provided.',
            keyPoints: ['COMPLIANCE VIOLATION: Agent used family/reputation pressure', 'Borrower threatening ombudsman complaint', 'Court documents still pending', 'Zero willingness to pay', 'Hostile interaction'],
            nextActions: ['Compliance review of agent Rahul Mehta', 'Do not assign same agent to this borrower', 'Wait for court documentation', 'Legal team review required'],
            riskFlags: ['Compliance violation by agent', 'Ombudsman complaint risk', 'Complete non-cooperation', 'Reputational risk for bank'],
            riskScore: 95,
        },
    },
    {
        callId: 'CALL-009',
        customerId: 'CUST-003',
        agentName: 'Anita Desai',
        duration: 240,
        callDate: '2026-02-12T10:00:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 18, text: 'Good morning Mr. Patel. This is Anita Desai from ABC Bank. I have been assigned to your account. I want to start fresh and work with you to find a practical solution.' },
            { speaker: 'customer', start: 19, end: 38, text: 'Finally someone sensible. The last person from your bank was very rude. Threatened my family. I hope you will be more professional.' },
            { speaker: 'agent', start: 39, end: 58, text: 'I apologize for any previous negative experience. That is not how we operate. Now, I understand there is a court case. Has there been any progress?' },
            { speaker: 'customer', start: 59, end: 82, text: 'Actually yes. We reached an out-of-court settlement last week. My partner will pay me eight lakhs over the next three months. Once I receive the first tranche, I can start paying the bank.' },
            { speaker: 'agent', start: 83, end: 100, text: 'That is encouraging news. When do you expect the first payment from the settlement?' },
            { speaker: 'customer', start: 101, end: 115, text: 'It should come by March first. I can commit to paying one lakh to the bank by March tenth.' },
            { speaker: 'agent', start: 116, end: 135, text: 'One lakh by March tenth sounds like a strong commitment. I will note this. And Mr. Patel, please do share the settlement agreement if possible — it will strengthen your case with our management.' },
            { speaker: 'customer', start: 136, end: 150, text: 'Yes, I can share that. Thank you for being reasonable. I do want to clear this loan.' },
        ],
        analysis: {
            repaymentIntent: { score: 58, level: 'medium', evidence: ['Court settlement reached', 'Committed ₹1L by March 10', 'Expressed desire to clear loan'], signals: ['improved_willingness', 'external_income_expected', 'tone_improvement'] },
            promiseToPay: { detected: true, amount: 100000, date: '2026-03-10', installment: false, confidence: 50, details: '₹1L by March 10, dependent on court settlement payment' },
            complianceFlags: [],
            crossCallFlags: [
                { field: 'court_case_status', previousClaim: 'Ongoing court case, no resolution', currentClaim: 'Out-of-court settlement reached — ₹8L over 3 months', callDate: '2026-01-20' },
                { field: 'repayment_ability', previousClaim: 'No money, cannot pay anything', currentClaim: 'Can pay ₹1L by March 10', callDate: '2026-01-20' },
            ],
            outcome: 'payment_committed',
            summary: 'Significant positive shift. Court case resolved via settlement — expects ₹8L over 3 months. Promises ₹1L to bank by March 10. New agent assignment improved rapport. Borrower cooperative and willing to share settlement documentation.',
            keyPoints: ['Court case settled — ₹8L settlement over 3 months', 'Promises ₹1L by March 10', 'Agent change improved relationship', 'Borrower cooperative today vs hostile previously', 'Settlement docs to be shared'],
            nextActions: ['Collect settlement agreement copy', 'Follow up March 10 for ₹1L payment', 'Plan remaining balance recovery from settlement proceeds', 'Keep Anita Desai assigned to this account'],
            riskFlags: ['Settlement payment dependency', 'History of non-cooperation', 'Previous compliance violation on file'],
            riskScore: 70,
        },
    },

    // CUST-004 — Sunita Devi — 3 calls, hardship case
    {
        callId: 'CALL-010',
        customerId: 'CUST-004',
        agentName: 'Neha Gupta',
        duration: 290,
        callDate: '2026-01-25T14:00:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 15, text: 'Hello, is this Mrs. Sunita Devi? This is Neha Gupta from ABC Bank regarding your personal loan.' },
            { speaker: 'customer', start: 16, end: 35, text: 'Yes, I am Sunita. Madam, please have some patience with me. My husband had a heart surgery last month. All our savings went into the treatment.' },
            { speaker: 'agent', start: 36, end: 52, text: 'I am very sorry to hear about your husband. How is he doing now? And please take your time explaining your situation.' },
            { speaker: 'customer', start: 53, end: 78, text: 'He is recovering but cannot work for at least three more months. I work as a school teacher. My salary is only twenty-two thousand a month. After household expenses, I can barely save five thousand.' },
            { speaker: 'agent', start: 79, end: 100, text: 'I understand, Mrs. Devi. Your outstanding is ninety-eight thousand rupees. Would you be able to make small monthly payments of five thousand while we explore our hardship program for you?' },
            { speaker: 'customer', start: 101, end: 118, text: 'Five thousand a month I can try. But please do not add the late fees. It just keeps growing and I feel so helpless.' },
            { speaker: 'agent', start: 119, end: 140, text: 'I will recommend a late fee waiver as part of the hardship review. Let me also check if we can restructure your EMI to a lower amount for the next six months. Would that help?' },
            { speaker: 'customer', start: 141, end: 155, text: 'That would be a blessing. I promise I will pay five thousand every month. I have never missed a payment before this situation.' },
        ],
        analysis: {
            repaymentIntent: { score: 70, level: 'medium', evidence: ['Willing to pay ₹5K monthly', 'Claims good payment history prior', 'Emotional but cooperative'], signals: ['genuine_hardship', 'limited_but_willing', 'good_prior_record'] },
            promiseToPay: { detected: true, amount: 5000, date: '2026-02-25', installment: true, confidence: 75, details: '₹5K/month ongoing. Limited but genuine commitment.' },
            complianceFlags: [],
            crossCallFlags: [],
            outcome: 'partial_commitment',
            summary: 'Genuine hardship case — husband heart surgery, sole earner as school teacher (₹22K salary). Commits to ₹5K/month. Agent handled empathetically. Recommended for hardship program and late fee waiver.',
            keyPoints: ['Husband heart surgery — 3+ months recovery', 'Sole income: ₹22K/month as teacher', 'Commits ₹5K/month', 'Requesting late fee waiver', 'Clean payment history prior to hardship'],
            nextActions: ['Process hardship program application', 'Recommend late fee waiver', 'Initiate EMI restructuring for 6 months', 'Follow up for first ₹5K payment'],
            riskFlags: ['Single income household', 'Medical emergency ongoing'],
            riskScore: 45,
        },
    },
    {
        callId: 'CALL-011',
        customerId: 'CUST-004',
        agentName: 'Neha Gupta',
        duration: 150,
        callDate: '2026-02-10T10:30:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 15, text: 'Hello Mrs. Devi, this is Neha from ABC Bank. Good news — your hardship application has been approved. Your EMI has been reduced to five thousand for six months and late fees have been waived.' },
            { speaker: 'customer', start: 16, end: 28, text: 'Oh thank God! Thank you so much. I already paid five thousand on the seventh of this month. Did you receive it?' },
            { speaker: 'agent', start: 29, end: 42, text: 'Yes, I can see the payment of five thousand received on February seventh. Your account is now under the restructured plan. Next payment due March seventh.' },
            { speaker: 'customer', start: 43, end: 55, text: 'I will make sure it is paid on time. My husband is also improving. Doctor says he might be able to do light work from April.' },
            { speaker: 'agent', start: 56, end: 70, text: 'That is wonderful to hear. Take care, Mrs. Devi. We are here to support you through this.' },
        ],
        analysis: {
            repaymentIntent: { score: 88, level: 'high', evidence: ['Payment already made this month', 'On-time under new plan', 'Husband recovery positive'], signals: ['commitment_honored', 'improving_situation', 'grateful_cooperative'] },
            promiseToPay: { detected: true, amount: 5000, date: '2026-03-07', installment: true, confidence: 90, details: '₹5K/month under restructured plan. Feb payment already made.' },
            complianceFlags: [],
            crossCallFlags: [],
            outcome: 'payment_committed',
            summary: 'Hardship program approved. First payment of ₹5K received on time. EMI restructured for 6 months. Husband recovery progressing. Highly cooperative borrower.',
            keyPoints: ['Hardship program approved', 'Late fees waived', 'Feb ₹5K payment received on time', 'Next due: March 7', 'Husband recovery improving'],
            nextActions: ['Monitor March payment', 'Review at 6-month mark for EMI restoration', 'No further escalation needed'],
            riskFlags: [],
            riskScore: 25,
        },
    },

    // CUST-005 — Mohammed Irfan — 3 calls, evasive borrower
    {
        callId: 'CALL-012',
        customerId: 'CUST-005',
        agentName: 'Vikram Singh',
        duration: 200,
        callDate: '2026-01-05T16:00:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 12, text: 'Mr. Irfan, this is Vikram Singh from ABC Bank. I am calling about your auto loan with two lakh twenty-five thousand outstanding.' },
            { speaker: 'customer', start: 13, end: 25, text: 'I am in a meeting right now. Can you call back tomorrow?' },
            { speaker: 'agent', start: 26, end: 40, text: 'Mr. Irfan, you have said the same thing the last three times we called. We need to discuss your payment plan today.' },
            { speaker: 'customer', start: 41, end: 55, text: 'Fine, but quickly. I had some business expenses. I will try to pay next month.' },
            { speaker: 'agent', start: 56, end: 72, text: 'Can you be more specific? How much and by what date?' },
            { speaker: 'customer', start: 73, end: 85, text: 'Maybe thirty or forty thousand. By end of February. I need to check my cash flow first.' },
            { speaker: 'agent', start: 86, end: 100, text: 'Let us fix it at thirty thousand by February twenty-eighth. Can I record that as your commitment?' },
            { speaker: 'customer', start: 101, end: 110, text: 'Sure, sure. I have to go now. I will try.' },
        ],
        analysis: {
            repaymentIntent: { score: 25, level: 'low', evidence: ['I will try', 'Maybe thirty or forty', 'Non-committal language'], signals: ['evasive', 'vague_commitment', 'avoidance_pattern'] },
            promiseToPay: { detected: true, amount: 30000, date: '2026-02-28', installment: false, confidence: 25, details: 'Vague commitment of ₹30K by Feb end. Very low confidence — evasive behavior.' },
            complianceFlags: [],
            crossCallFlags: [],
            outcome: 'no_commitment',
            summary: 'Evasive borrower, consistently avoids calls. Gave vague commitment of ₹30-40K by end February. Non-committal language throughout. Pattern of avoidance over multiple contacts.',
            keyPoints: ['Repeatedly avoids calls', 'Vague ₹30-40K commitment', '"I will try" — non-committal', 'Business expenses cited'],
            nextActions: ['Do not expect February payment', 'Escalate to field visit if payment missed', 'Try different contact times'],
            riskFlags: ['Chronic avoidance', 'Vague commitments', 'Low engagement'],
            riskScore: 80,
        },
    },
    {
        callId: 'CALL-013',
        customerId: 'CUST-005',
        agentName: 'Anita Desai',
        duration: 175,
        callDate: '2026-02-05T11:00:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 15, text: 'Mr. Irfan, this is Anita Desai from ABC Bank. I am following up on your account. No payment was received in January. Can we discuss a plan?' },
            { speaker: 'customer', start: 16, end: 30, text: 'Look, I had to invest in new equipment for my business. The auto loan is not my priority right now. Business comes first.' },
            { speaker: 'agent', start: 31, end: 50, text: 'I understand business needs, Mr. Irfan. But your loan is now eighty-nine days past due. Non-payment affects your credit score and could lead to vehicle repossession under the loan terms.' },
            { speaker: 'customer', start: 51, end: 68, text: 'You cannot take my vehicle. I need it for business. Fine, I will pay twenty-five thousand by mid-February. But that is all I can do right now.' },
            { speaker: 'agent', start: 69, end: 85, text: 'Twenty-five thousand by February fifteenth. I will note that. Mr. Irfan, can I also ask — what is your current monthly income from the business?' },
            { speaker: 'customer', start: 86, end: 100, text: 'It varies. Around one lakh fifty thousand on good months. But expenses are high. I told you, I had to buy equipment.' },
        ],
        analysis: {
            repaymentIntent: { score: 30, level: 'low', evidence: ['Loan is not priority', 'Minimal commitment amount'], signals: ['deprioritizing_loan', 'reactive_payment', 'income_available_but_unwilling'] },
            promiseToPay: { detected: true, amount: 25000, date: '2026-02-15', installment: false, confidence: 30, details: '₹25K by Feb 15. Borrower clearly has income but deprioritizes loan.' },
            complianceFlags: [],
            crossCallFlags: [
                { field: 'income_claim', previousClaim: 'Had business expenses, no specific income mentioned', currentClaim: '₹1.5L/month on good months', callDate: '2026-01-05' },
                { field: 'payment_promise', previousClaim: '₹30K by Feb 28', currentClaim: '₹25K by Feb 15 (reduced amount)', callDate: '2026-01-05' },
            ],
            outcome: 'partial_commitment',
            summary: 'Borrower admits to ₹1.5L monthly income but deprioritizes loan repayment for business investments. Reduced commitment from ₹30K to ₹25K. Shows willful rather than hardship-based non-payment.',
            keyPoints: ['Income: ₹1.5L/month admitted', 'Prioritizing business over loan', '₹25K promised by Feb 15 (reduced from ₹30K)', 'Equipment purchase cited as reason', 'Vehicle needed for business — repossession concern'],
            nextActions: ['Flag as willful defaulter — has capacity to pay', 'Verify ₹25K by Feb 15', 'Prepare repossession notice if payment missed', 'Consider higher-frequency follow-ups'],
            riskFlags: ['Willful non-payment', 'Deprioritizing loan despite income', 'Decreasing commitments'],
            riskScore: 82,
        },
    },
    {
        callId: 'CALL-014',
        customerId: 'CUST-005',
        agentName: 'Rahul Mehta',
        duration: 220,
        callDate: '2026-02-18T14:30:00Z',
        status: 'analyzed',
        segments: [
            { speaker: 'agent', start: 0, end: 18, text: 'Mr. Irfan, Rahul Mehta from ABC Bank recovery team. Your account has been escalated. The twenty-five thousand promised by February fifteenth was not received.' },
            { speaker: 'customer', start: 19, end: 35, text: 'I transferred ten thousand on the sixteenth. Check your records. The rest I will pay this month end.' },
            { speaker: 'agent', start: 36, end: 55, text: 'I see a payment of ten thousand on the sixteenth. Mr. Irfan, you promised twenty-five thousand. Your account shows a pattern of partial payments and broken commitments.' },
            { speaker: 'customer', start: 56, end: 75, text: 'I paid what I could. My business had a slow week. I am not running away. I live in the same place, I have the same number. I will clear the full amount by March.' },
            { speaker: 'agent', start: 76, end: 95, text: 'Full amount meaning the entire two lakh fifteen thousand outstanding? By March end?' },
            { speaker: 'customer', start: 96, end: 112, text: 'No, not full-full. Maybe one lakh. I have a big order coming in for my catering business. Once that payment comes, I will pay the bank.' },
            { speaker: 'agent', start: 113, end: 130, text: 'One lakh by March thirty-first. I am recording that. Mr. Irfan, this is a final escalation. If this commitment is not met, the bank will initiate vehicle recovery proceedings.' },
            { speaker: 'customer', start: 131, end: 145, text: 'I told you, I will pay. Just give me time. I am a businessman, my income is variable. I am not a salaried person who gets money every month.' },
        ],
        analysis: {
            repaymentIntent: { score: 35, level: 'low', evidence: ['Partial payment (₹10K vs ₹25K)', 'Vague ₹1L promise', 'Consistent excuse pattern'], signals: ['partial_follow_through', 'inflated_promise', 'excuse_pattern'] },
            promiseToPay: { detected: true, amount: 100000, date: '2026-03-31', installment: false, confidence: 20, details: '₹1L by March 31. Very low confidence given track record of broken promises and partial payments.' },
            complianceFlags: [],
            crossCallFlags: [
                { field: 'payment_promise', previousClaim: '₹25K by Feb 15', currentClaim: '₹10K paid on Feb 16 (partial)', callDate: '2026-02-05' },
                { field: 'business_type', previousClaim: 'Business expenses, equipment purchase', currentClaim: 'Catering business, big order expected', callDate: '2026-02-05' },
            ],
            outcome: 'partial_commitment',
            summary: 'Partial payment of ₹10K received (vs ₹25K promised). Now promises ₹1L by March end contingent on business order. Business type appears inconsistent (equipment purchase vs catering). Pattern of inflated promises and partial delivery.',
            keyPoints: ['₹10K paid vs ₹25K promised', 'New promise: ₹1L by March 31', 'Business type inconsistency: equipment → catering', 'Final escalation warning issued', 'Partial payments pattern confirmed'],
            nextActions: ['Final deadline: March 31 for ₹1L', 'Prepare vehicle repossession paperwork', 'Flag as willful defaulter', 'Consider field visit to verify business claims'],
            riskFlags: ['Serial broken promises', 'Inconsistent business claims', 'Willful non-payment with means', 'Final escalation stage'],
            riskScore: 88,
        },
    },
]

async function seed() {
    const db_instance = require('./setup')
    await db_instance.initialize()

    // Check if data already exists
    const count = await db_instance.Customer.count()
    if (count > 0) {
        console.log('⏭️  Database already seeded, skipping...')
        return
    }

    console.log('🌱 Seeding database with demo data...')

    // Create customers
    for (const cust of CUSTOMERS) {
        await db_instance.Customer.create(cust)
    }
    console.log(`   ✅ Created ${CUSTOMERS.length} customers`)

    // Create calls, segments, and analysis results
    for (const cd of CALL_DATA) {
        await db_instance.Call.create({
            id: cd.callId,
            customerId: cd.customerId,
            agentName: cd.agentName,
            duration: cd.duration,
            callDate: cd.callDate,
            status: cd.status,
            audioUrl: null,
        })

        for (let i = 0; i < cd.segments.length; i++) {
            const seg = cd.segments[i]
            await db_instance.TranscriptSegment.create({
                id: `${cd.callId}-SEG-${String(i + 1).padStart(3, '0')}`,
                callId: cd.callId,
                speaker: seg.speaker,
                startTime: seg.start,
                endTime: seg.end,
                text: seg.text,
            })
        }

        await db_instance.AnalysisResult.create({
            id: `ANALYSIS-${cd.callId}`,
            callId: cd.callId,
            ...cd.analysis,
        })
    }
    console.log(`   ✅ Created ${CALL_DATA.length} calls with transcripts and analysis`)
    console.log('🎉 Seeding complete!')
}

// Run if called directly
if (require.main === module) {
    seed().catch(console.error)
}

module.exports = { seed }
