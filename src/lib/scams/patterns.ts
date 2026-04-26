export type ScamPatternCategory = 'banking' | 'delivery' | 'tech_support' | 'family_emergency' | 'government' | 'investment' | 'debt';

export type ScamPatternRiskTier = 'low' | 'medium' | 'high' | 'critical';

export type ScamPatternRecommendedAction = 'block' | 'send_to_voicemail' | 'verify_first' | 'answer_cautiously';

export type ScamPattern = {
  slug: string;
  title: string;
  shortTitle: string;
  category: ScamPatternCategory;
  riskTier: ScamPatternRiskTier;
  recommendedAction: ScamPatternRecommendedAction;
  summary: string;
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
  }
];

export const getScamPattern = (slug: string) => scamPatterns.find((pattern) => pattern.slug === slug);
