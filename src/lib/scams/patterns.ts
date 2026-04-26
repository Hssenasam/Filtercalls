export type ScamPatternCategory = 'banking' | 'delivery' | 'tech_support' | 'family_emergency' | 'government' | 'investment' | 'debt';

export type ScamPatternRiskTier = 'low' | 'medium' | 'high' | 'critical';

export type ScamPatternRecommendedAction = 'block' | 'send_to_voicemail' | 'verify_first' | 'answer_cautiously';

export type ScamPressureLevel = 'low' | 'medium' | 'high' | 'critical';

export type ScamPattern = {
  slug: string;
  title: string;
  shortTitle: string;
  category: ScamPatternCategory;
  riskTier: ScamPatternRiskTier;
  recommendedAction: ScamPatternRecommendedAction;
  summary: string;
  scamGoal?: string;
  pressureMeter?: {
    urgency: ScamPressureLevel;
    authority: ScamPressureLevel;
    moneyRisk: ScamPressureLevel;
    identityRisk: ScamPressureLevel;
  };
  scamLifecycle?: Array<{
    stage: string;
    description: string;
    tone: 'neutral' | 'warning' | 'danger';
  }>;
  callerProfile?: {
    role: string;
    exploits: string;
    weakness: string;
    emotionalLever: string;
  };
  howItWorks: string[];
  commonCallerClaims: string[];
  scriptDecoder: Array<{
    says: string;
    means: string;
  }>;
  pressureTactics: string[];
  redFlags: string[];
  doNotShare: string[];
  safeResponses: string[];
  verificationSteps: string[];
  bestNextStep: string;
  relatedScams: string[];
  relatedDecisionScenarios: string[];
  seoTitle: string;
  seoDescription: string;
};

export const scamPatterns: ScamPattern[] = [
  {
    slug: 'bank-otp',
    title: 'Bank OTP Verification Scam Call',
    shortTitle: 'Bank OTP Scam',
    category: 'banking',
    riskTier: 'critical',
    recommendedAction: 'block',
    summary: 'A caller pretends to be from your bank and pressures you to share a one-time password, PIN, card detail, or account verification code.',
    howItWorks: [
      'The caller creates urgency by claiming your account, card, or transfer is at risk.',
      'They ask you to confirm a code that was sent to your phone or email.',
      'The code may actually authorize a login, password reset, money transfer, or new device registration.',
      'They may sound professional and may already know partial details about you.'
    ],
    commonCallerClaims: [
      'Your bank account will be blocked today unless you verify this code.',
      'We stopped a suspicious transaction and need the OTP to cancel it.',
      'Read the code we just sent so we can secure your account.',
      'Do not hang up. This is the fraud department.'
    ],
    scriptDecoder: [
      {
        says: 'Your account will be blocked today.',
        means: 'Urgency tactic designed to stop you from thinking or checking independently.'
      },
      {
        says: 'Read us the verification code to cancel the transfer.',
        means: 'The code may approve access, reset security, or complete a transaction.'
      },
      {
        says: 'Stay on the line while we secure your account.',
        means: 'They want to prevent you from contacting the real bank.'
      }
    ],
    pressureTactics: ['Urgency', 'Authority impersonation', 'Fear of account loss', 'Stay-on-the-line pressure'],
    redFlags: [
      'Caller asks for OTP, PIN, password, card number, or banking login details.',
      'Caller says you must act immediately to avoid account closure.',
      'Caller tells you not to call your bank separately.',
      'Caller asks you to install an app or approve a device.'
    ],
    doNotShare: ['One-time passwords', 'PINs', 'Card numbers', 'Online banking passwords', 'Security answers'],
    safeResponses: [
      'I do not share verification codes over incoming calls. I will contact my bank through the official app or website.',
      'I am ending this call and will verify directly with the bank using the official number.',
      'Send the request through official banking channels. I will not confirm codes by phone.'
    ],
    verificationSteps: [
      'End the call immediately.',
      'Do not call back the number that contacted you.',
      'Open your bank app or official website directly.',
      'Use the support number printed on your card or listed in the official app.',
      'Report the call if they requested a code, password, payment, or remote access.'
    ],
    bestNextStep: 'Block the call and verify through your bank’s official app, website, or published support number.',
    relatedScams: ['tech-support', 'family-emergency'],
    relatedDecisionScenarios: ['possible_impersonation', 'possible_financial_scam'],
    seoTitle: 'Bank OTP Scam Call Playbook — What to Say and What Not to Share',
    seoDescription: 'Learn how bank OTP scam calls work, what callers may say, what not to share, and how to verify safely before responding.'
  },
  {
    slug: 'delivery-otp',
    title: 'Fake Delivery OTP or Package Fee Scam',
    shortTitle: 'Delivery OTP Scam',
    category: 'delivery',
    riskTier: 'high',
    recommendedAction: 'verify_first',
    summary: 'A caller claims a package is delayed, blocked, or needs a small fee, then asks for a code, payment, address confirmation, or link click.',
    howItWorks: [
      'The caller pretends to be from a delivery company or courier service.',
      'They claim a package cannot be delivered until you verify a code or pay a small fee.',
      'The code may allow account access, and the payment link may collect card details.',
      'They may use real delivery timing or broad package language to sound believable.'
    ],
    commonCallerClaims: [
      'Your package is on hold and needs address confirmation.',
      'You must pay a small customs or delivery fee now.',
      'Read the code we sent to confirm this delivery.',
      'Click the link while I stay on the phone.'
    ],
    scriptDecoder: [
      {
        says: 'Your package will be returned today.',
        means: 'Urgency tactic to make a small fee or code request feel reasonable.'
      },
      {
        says: 'We need the code to confirm delivery.',
        means: 'The code may be unrelated to delivery and may authorize account access.'
      },
      {
        says: 'Pay this small fee to release the package.',
        means: 'A small payment request can be used to capture card details.'
      }
    ],
    pressureTactics: ['Package urgency', 'Small-fee framing', 'Delivery failure fear', 'Link-click pressure'],
    redFlags: [
      'Caller asks for OTP or verification codes.',
      'Caller asks for card details over the phone.',
      'Caller sends a payment link from an unfamiliar domain.',
      'Caller cannot provide a credible tracking number.'
    ],
    doNotShare: ['OTP codes', 'Card details', 'Full address if unnecessary', 'Account login details', 'Identity documents'],
    safeResponses: [
      'Please give me the tracking number. I will check it in the official delivery app or website.',
      'I do not share verification codes or card details over incoming calls.',
      'I will contact the courier through its official support channel.'
    ],
    verificationSteps: [
      'Ask for the tracking number only.',
      'Do not click links sent during the call.',
      'Open the courier’s official app or website yourself.',
      'Verify whether any fee or address update is actually required.',
      'Report the call if it requested OTP, payment, or documents.'
    ],
    bestNextStep: 'Verify first through the official courier app or website before sharing anything or paying any fee.',
    relatedScams: ['bank-otp', 'tech-support'],
    relatedDecisionScenarios: ['possible_delivery_or_service', 'possible_impersonation'],
    seoTitle: 'Fake Delivery OTP Scam Call Playbook — Verify Packages Safely',
    seoDescription: 'Understand delivery OTP and package fee scam calls, common scripts, red flags, safe responses, and verification steps.'
  },
  {
    slug: 'tech-support',
    title: 'Fake Tech Support Remote Access Scam',
    shortTitle: 'Tech Support Scam',
    category: 'tech_support',
    riskTier: 'critical',
    recommendedAction: 'block',
    summary: 'A caller claims your computer, phone, router, or account is infected or compromised, then tries to get remote access, payment, or credentials.',
    howItWorks: [
      'The caller pretends to represent a known technology company, security team, or internet provider.',
      'They claim your device is infected, hacked, or sending errors.',
      'They ask you to install remote access software or visit a support link.',
      'Once connected, they may request payment, steal data, or pressure you to reveal passwords.'
    ],
    commonCallerClaims: [
      'Your computer is sending dangerous error messages.',
      'We detected hackers on your network.',
      'Install this support tool so we can fix it.',
      'You must pay now to protect your device.'
    ],
    scriptDecoder: [
      {
        says: 'We detected a virus from your device.',
        means: 'Fear tactic used to justify remote access or payment.'
      },
      {
        says: 'Download this support app while I guide you.',
        means: 'They may be trying to control your device.'
      },
      {
        says: 'Do not close the window or your files may be lost.',
        means: 'Pressure tactic to keep you from stopping the session.'
      }
    ],
    pressureTactics: ['Fear of hacking', 'Technical authority', 'Remote access pressure', 'Payment urgency'],
    redFlags: [
      'Unexpected support call from a company you did not contact.',
      'Caller asks you to install remote access software.',
      'Caller asks for passwords, codes, or payment to fix an issue.',
      'Caller refuses to let you verify independently.'
    ],
    doNotShare: ['Passwords', 'Remote access permissions', 'Payment details', 'Verification codes', 'Personal files or screenshots'],
    safeResponses: [
      'I do not accept remote support from unsolicited calls. I will contact support through official channels.',
      'I am ending this call and will check my device independently.',
      'Send an official support case number. I will verify it myself.'
    ],
    verificationSteps: [
      'End the call before installing anything.',
      'Do not give remote access to your device.',
      'Open the official website or app of the company yourself.',
      'Run your own trusted security tools if needed.',
      'Change passwords if you already shared credentials or installed software.'
    ],
    bestNextStep: 'Block the caller and never grant remote access from an unsolicited phone call.',
    relatedScams: ['bank-otp', 'delivery-otp'],
    relatedDecisionScenarios: ['possible_impersonation', 'possible_robocall'],
    seoTitle: 'Fake Tech Support Scam Call Playbook — Avoid Remote Access Fraud',
    seoDescription: 'Learn how fake tech support scam calls work, what they ask for, what not to share, and how to verify safely.'
  },
  {
    slug: 'family-emergency',
    title: 'Family Emergency Impersonation Scam Call',
    shortTitle: 'Family Emergency Scam',
    category: 'family_emergency',
    riskTier: 'critical',
    recommendedAction: 'verify_first',
    summary: 'A caller pretends a family member is in danger, arrested, stranded, or urgently needs money, then pressures you to act before verifying.',
    howItWorks: [
      'The caller claims a loved one is in immediate trouble and needs urgent help.',
      'They may impersonate a relative, police officer, lawyer, hospital worker, or friend.',
      'They ask for money, gift cards, bank transfer, or private information.',
      'They rely on panic and secrecy to stop you from contacting the family member directly.'
    ],
    commonCallerClaims: [
      'Your son/daughter is in trouble and needs money now.',
      'Do not call anyone else or the situation will get worse.',
      'I am calling from the police station or hospital.',
      'Send money immediately and keep this confidential.'
    ],
    scriptDecoder: [
      {
        says: 'Do not tell anyone else.',
        means: 'Isolation tactic to stop family verification.'
      },
      {
        says: 'There is no time to call them.',
        means: 'Urgency tactic designed to bypass normal caution.'
      },
      {
        says: 'Send money now and we will explain later.',
        means: 'Payment pressure without verifiable details.'
      }
    ],
    pressureTactics: ['Panic', 'Secrecy', 'Family fear', 'Payment urgency', 'Authority impersonation'],
    redFlags: [
      'Caller asks you not to contact the family member directly.',
      'Caller demands immediate money, gift cards, or bank transfer.',
      'Caller avoids specific verifiable details.',
      'Caller creates fear or guilt to force quick action.'
    ],
    doNotShare: ['Money transfer details', 'Bank details', 'Family personal information', 'Identity documents', 'Verification codes'],
    safeResponses: [
      'I will verify this directly with my family before taking any action.',
      'Give me your full name, organization, and reference number. I will call back through an official channel.',
      'I do not send money based on unsolicited calls.'
    ],
    verificationSteps: [
      'Pause and do not send money immediately.',
      'Call the family member directly using a known number.',
      'Contact another trusted family member to verify.',
      'If an institution is mentioned, call it through an official published number.',
      'Report the call if it used threats, secrecy, or urgent payment demands.'
    ],
    bestNextStep: 'Verify first through a known family contact or official channel before sending money or sharing information.',
    relatedScams: ['bank-otp', 'tech-support'],
    relatedDecisionScenarios: ['possible_impersonation', 'possible_financial_scam'],
    seoTitle: 'Family Emergency Scam Call Playbook — Verify Before Sending Money',
    seoDescription: 'Learn how family emergency scam calls work, what callers may say, what not to share, and how to verify safely.'
  },
  {
    slug: 'ai-voice-deepfake',
    title: 'AI Voice Deepfake Scam Call',
    shortTitle: 'AI Voice Deepfake',
    category: 'family_emergency',
    riskTier: 'critical',
    recommendedAction: 'verify_first',
    summary: 'A caller uses a cloned or imitated voice to sound like a family member, executive, or trusted contact, then asks for urgent money, approval, or sensitive information.',
    scamGoal: 'Trigger an urgent transfer or approval before you can verify the caller through a trusted channel.',
    pressureMeter: { urgency: 'critical', authority: 'medium', moneyRisk: 'critical', identityRisk: 'high' },
    scamLifecycle: [
      { stage: 'Harvest', description: 'Voice samples are collected from public videos, voicemails, or social posts.', tone: 'neutral' },
      { stage: 'Imitate', description: 'The caller uses a cloned or rehearsed voice to sound familiar enough to create trust.', tone: 'warning' },
      { stage: 'Crisis', description: 'A short emergency story is introduced before you can ask detailed questions.', tone: 'warning' },
      { stage: 'Isolate', description: 'You are told not to call anyone else or not to use another number.', tone: 'danger' },
      { stage: 'Extract', description: 'Money, codes, or approval is requested while panic is still high.', tone: 'danger' }
    ],
    callerProfile: {
      role: 'Trusted family member or senior colleague',
      exploits: 'Concern for someone you know and the instinct to act quickly',
      weakness: 'They cannot pass a calm callback, video check, or personal verification question',
      emotionalLever: 'Love, duty, and panic'
    },
    howItWorks: [
      'The caller sounds like someone you know, or claims to be calling on their behalf.',
      'They describe an urgent event such as an accident, arrest, lost phone, or emergency transfer.',
      'They discourage callbacks, video calls, or contacting other people.',
      'They push for fast action before you can verify the story.'
    ],
    commonCallerClaims: [
      'It is me. I have been in an accident and I need help now.',
      'Do not call my phone. It is broken. Use this number.',
      'Please do not tell anyone yet. I just need you to send the money.',
      'My manager needs this approved right away and I cannot explain over email.'
    ],
    scriptDecoder: [
      { says: 'Do not call my other number. Use this one.', means: 'They are blocking the most reliable verification path.' },
      { says: 'There is no time. You need to do this now.', means: 'Urgency is being used to stop careful checking.' },
      { says: 'Please do not tell anyone yet.', means: 'Isolation prevents a second opinion from breaking the scam.' }
    ],
    pressureTactics: ['Voice familiarity', 'Emotional urgency', 'Secrecy request', 'Callback avoidance'],
    redFlags: [
      'Caller refuses a video call or callback to a saved number.',
      'Voice sounds familiar but speech feels flat, rushed, or unnatural.',
      'Caller asks for secrecy or says not to contact anyone else.',
      'Payment method is unusual, urgent, or difficult to reverse.'
    ],
    doNotShare: ['Bank details', 'Transfer approval', 'OTP codes', 'Passwords', 'Work approval codes'],
    safeResponses: [
      'I need to call you back on the number I already have saved.',
      'Let us do a quick video call before I take any action.',
      'I am going to verify this with another trusted contact first.'
    ],
    verificationSteps: [
      'End the call calmly and do not approve anything during the call.',
      'Call the person back using a number already saved in your contacts.',
      'Ask a personal question only the real person would know.',
      'Contact another trusted family member, manager, or colleague to confirm the story.',
      'Treat refusal to verify as a strong warning sign.'
    ],
    bestNextStep: 'Hang up and verify through a saved contact, video call, or trusted third party before sending money or approving anything.',
    relatedScams: ['family-emergency', 'bank-otp'],
    relatedDecisionScenarios: ['possible_impersonation', 'possible_financial_scam'],
    seoTitle: 'AI Voice Deepfake Scam Call Playbook — Verify Before Sending Money',
    seoDescription: 'Learn how AI voice deepfake scam calls work, what callers may say, warning signs, safe responses, and how to verify identity safely.'
  },
  {
    slug: 'crypto-investment',
    title: 'Crypto Investment Scam Call',
    shortTitle: 'Crypto Investment',
    category: 'investment',
    riskTier: 'high',
    recommendedAction: 'block',
    summary: 'A caller promotes a crypto opportunity with guaranteed returns, fake trading success, or a private platform, then pushes you to deposit before researching.',
    scamGoal: 'Move your money into a wallet, exchange, or fake platform controlled by the scammer.',
    pressureMeter: { urgency: 'high', authority: 'medium', moneyRisk: 'critical', identityRisk: 'high' },
    scamLifecycle: [
      { stage: 'Approach', description: 'The caller presents an exclusive investment opportunity or expert contact.', tone: 'neutral' },
      { stage: 'Proof', description: 'Fake screenshots, testimonials, or account dashboards are used to build confidence.', tone: 'warning' },
      { stage: 'Deposit', description: 'You are directed to a specific platform, wallet, or transfer method.', tone: 'danger' },
      { stage: 'Upgrade', description: 'More money is requested to unlock returns, taxes, or withdrawals.', tone: 'danger' },
      { stage: 'Disappear', description: 'Access is limited, support stops responding, or withdrawals are blocked.', tone: 'danger' }
    ],
    callerProfile: {
      role: 'Successful investor or financial insider',
      exploits: 'Fear of missing out and the desire for quick financial growth',
      weakness: 'They cannot provide independent registration, audited results, or regulated custody',
      emotionalLever: 'Greed, urgency, and social proof'
    },
    howItWorks: [
      'The caller introduces a high-return crypto opportunity or trading system.',
      'They build credibility with screenshots, testimonials, or a polished dashboard.',
      'You are asked to use a specific exchange, wallet, or investment portal.',
      'After depositing, you may face additional fees or blocked withdrawals.'
    ],
    commonCallerClaims: [
      'I can show you how to double your money in 30 days.',
      'Our algorithm has a very high success rate.',
      'You can withdraw anytime. I will show you proof.',
      'This opportunity closes soon, so you need to start today.'
    ],
    scriptDecoder: [
      { says: 'This opportunity closes in 24 hours.', means: 'Artificial scarcity is used to prevent research.' },
      { says: 'You can withdraw anytime.', means: 'Withdrawal blocks often appear only after you deposit.' },
      { says: 'I already made this amount this month.', means: 'Fabricated proof is used to manufacture credibility.' }
    ],
    pressureTactics: ['FOMO', 'Fake proof', 'Exclusive access', 'Fast-deposit pressure'],
    redFlags: [
      'Guaranteed returns or risk-free profit claims.',
      'Pressure to invest before you can research.',
      'Request to use a specific unfamiliar crypto platform.',
      'Requests for seed phrases, exchange login, identity documents, or remote help.'
    ],
    doNotShare: ['Wallet seed phrases', 'Exchange login credentials', 'Credit card details', 'National ID', 'Remote access'],
    safeResponses: [
      'I do not discuss investments over the phone. Send written information for independent review.',
      'I will verify the platform with a financial regulator before considering anything.',
      'I do not transfer crypto based on unsolicited calls.'
    ],
    verificationSteps: [
      'Search the platform name with terms like scam, complaints, and withdrawal issues.',
      'Check whether the company is registered with a relevant financial authority.',
      'Never send crypto to someone you met through an unsolicited call or message.',
      'Ask an independent financial professional before taking any action.',
      'Do not install remote access tools or share wallet recovery phrases.'
    ],
    bestNextStep: 'Do not invest from an unsolicited call. Block the caller and verify the platform independently before taking any action.',
    relatedScams: ['fake-debt-collector', 'government-impersonation'],
    relatedDecisionScenarios: ['possible_financial_scam'],
    seoTitle: 'Crypto Investment Scam Call Playbook — Warning Signs and Safe Responses',
    seoDescription: 'Learn how crypto investment scam calls work, common scripts, red flags, safe responses, and how to verify before sending money.'
  },
  {
    slug: 'government-impersonation',
    title: 'Government Impersonation Scam Call',
    shortTitle: 'Government Impersonation',
    category: 'government',
    riskTier: 'critical',
    recommendedAction: 'block',
    summary: 'A caller claims to be from a government office, tax authority, court, or police unit, then threatens fines or arrest unless you pay immediately.',
    scamGoal: 'Use fear of official consequences to force payment or personal data disclosure before verification.',
    pressureMeter: { urgency: 'critical', authority: 'critical', moneyRisk: 'high', identityRisk: 'critical' },
    scamLifecycle: [
      { stage: 'Authority', description: 'The caller opens with an official-sounding title, badge number, or department name.', tone: 'neutral' },
      { stage: 'Threat', description: 'A fine, warrant, investigation, or tax issue is introduced.', tone: 'warning' },
      { stage: 'Deadline', description: 'You are told the consequence will happen within hours unless you act.', tone: 'danger' },
      { stage: 'Payment', description: 'A nonstandard payment method or personal identifier is requested.', tone: 'danger' },
      { stage: 'Control', description: 'You are told to stay on the line and not verify elsewhere.', tone: 'danger' }
    ],
    callerProfile: {
      role: 'Government officer, tax agent, or police representative',
      exploits: 'Fear of legal trouble and respect for authority',
      weakness: 'They cannot support the claim through an official website, written notice, or verified agency line',
      emotionalLever: 'Fear and obedience'
    },
    howItWorks: [
      'The caller uses official language and may provide a fake case number.',
      'They claim you owe taxes, face a warrant, or are under investigation.',
      'They create fear by describing immediate arrest, penalties, or account seizure.',
      'They demand payment or identity details before you can verify independently.'
    ],
    commonCallerClaims: [
      'This is the tax authority. You must pay now to avoid arrest.',
      'A warrant has been issued in your name.',
      'This is your final notice before legal action.',
      'Do not hang up or the case will be escalated.'
    ],
    scriptDecoder: [
      { says: 'Police are on the way to your address.', means: 'Fear is being used to create immediate compliance.' },
      { says: 'Pay with gift cards or wire transfer to close the case.', means: 'Real agencies do not resolve official debts through unusual payment methods.' },
      { says: 'Do not hang up.', means: 'Keeping you on the line prevents independent verification.' }
    ],
    pressureTactics: ['Authority impersonation', 'Fear of arrest', 'Immediate deadline', 'Stay-on-the-line control'],
    redFlags: [
      'Threatens arrest or legal action unless you pay immediately.',
      'Requests gift cards, crypto, wire transfer, or unusual payment methods.',
      'Asks for national ID, tax ID, or banking information by phone.',
      'Refuses to let you call the official office separately.'
    ],
    doNotShare: ['National ID', 'Tax ID', 'Bank account number', 'Gift card codes', 'Social security number'],
    safeResponses: [
      'I will contact the agency directly using the number on its official website.',
      'Please provide a case reference. I will verify it independently.',
      'I do not make payments or share identity details over unsolicited calls.'
    ],
    verificationSteps: [
      'Hang up and do not continue the conversation.',
      'Go directly to the official government or tax authority website.',
      'Use only the phone number published on that official website.',
      'Ask whether the case reference is real before sharing any details.',
      'Remember that official agencies usually provide written notice and standard payment channels.'
    ],
    bestNextStep: 'Hang up, use the official agency website to find a verified phone number, and check the claim independently.',
    relatedScams: ['bank-otp', 'fake-debt-collector'],
    relatedDecisionScenarios: ['possible_impersonation', 'possible_financial_scam'],
    seoTitle: 'Government Impersonation Scam Call Playbook — What to Check Before Paying',
    seoDescription: 'Learn how fake government, tax, and police scam calls work, warning signs, safe responses, and how to verify through official channels.'
  },
  {
    slug: 'fake-debt-collector',
    title: 'Fake Debt Collector Scam Call',
    shortTitle: 'Fake Debt Collector',
    category: 'debt',
    riskTier: 'high',
    recommendedAction: 'verify_first',
    summary: 'A caller claims you owe a debt and threatens legal action or immediate consequences unless you pay during the call.',
    scamGoal: 'Pressure you into paying an unverified debt or revealing sensitive financial information.',
    pressureMeter: { urgency: 'high', authority: 'high', moneyRisk: 'high', identityRisk: 'high' },
    scamLifecycle: [
      { stage: 'Claim', description: 'The caller says you owe money and may mention partial personal details.', tone: 'neutral' },
      { stage: 'Threat', description: 'Court, arrest, wage action, or credit damage is used as pressure.', tone: 'warning' },
      { stage: 'Shortcut', description: 'Immediate phone payment is offered as the fastest way to stop action.', tone: 'danger' },
      { stage: 'Avoid paper', description: 'The caller resists written validation or original creditor details.', tone: 'danger' },
      { stage: 'Collect', description: 'Bank details, card payment, or unusual payment methods are requested.', tone: 'danger' }
    ],
    callerProfile: {
      role: 'Debt collector or legal department representative',
      exploits: 'Fear of legal action, embarrassment, and credit damage',
      weakness: 'They avoid written validation, original creditor details, and traceable payment channels',
      emotionalLever: 'Pressure, shame, and urgency'
    },
    howItWorks: [
      'The caller claims a debt is overdue, often without clear written documentation.',
      'They may use partial personal details to sound legitimate.',
      'They threaten court action, arrest, or credit damage to create pressure.',
      'They push for immediate payment instead of written verification.'
    ],
    commonCallerClaims: [
      'You owe an outstanding debt. Pay now to avoid court proceedings.',
      'This is your final notice before we take legal action.',
      'We can stop the proceedings if you pay right now.',
      'You already received written notice, so there is nothing more to send.'
    ],
    scriptDecoder: [
      { says: 'This is your last chance before court.', means: 'A manufactured deadline is being used to stop verification.' },
      { says: 'You already received written notice.', means: 'You can still ask for written validation before paying.' },
      { says: 'Pay now and the case will be closed.', means: 'Immediate payment pressure is replacing proof of the debt.' }
    ],
    pressureTactics: ['Legal threats', 'Urgency', 'Partial personal details', 'Authority tone'],
    redFlags: [
      'Caller refuses to provide the original creditor name.',
      'Caller refuses written debt validation.',
      'Payment is requested by gift card, crypto, wire, or pressure-based card payment.',
      'Caller threatens immediate arrest for a civil debt.'
    ],
    doNotShare: ['Bank account', 'Social security number', 'Date of birth', 'Payment card number', 'Online banking access'],
    safeResponses: [
      'Please send a written debt validation notice. I will not pay over the phone.',
      'Provide the original creditor name and account reference so I can verify directly.',
      'I will review this in writing and respond through a documented channel.'
    ],
    verificationSteps: [
      'Ask for written validation before discussing payment.',
      'Request the original creditor name, amount, and reference number.',
      'Contact the original creditor using a number from its official website.',
      'Check your records or credit report for the debt.',
      'Seek consumer protection advice if the caller uses threats or harassment.'
    ],
    bestNextStep: 'Do not pay during the call. Request written validation and verify with the original creditor through an official channel.',
    relatedScams: ['government-impersonation', 'crypto-investment'],
    relatedDecisionScenarios: ['possible_financial_scam', 'possible_impersonation'],
    seoTitle: 'Fake Debt Collector Scam Call Playbook — Verify Before You Pay',
    seoDescription: 'Learn how fake debt collector scam calls work, what to ask for, what not to share, and how to verify a debt safely.'
  }
];

export const getScamPattern = (slug: string) => scamPatterns.find((pattern) => pattern.slug === slug);
