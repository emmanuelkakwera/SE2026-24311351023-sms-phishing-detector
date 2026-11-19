/**
 * Local awareness content adapted from the MoneyGuard web awareness module.
 * Keeping it in the bundle means the whole learning section works offline.
 */

export type ScamBadge = 'fraud' | 'normal';

export interface ScamType {
  id: string;
  title: string;
  badge: ScamBadge;
  summary: string;
  overview: string;
  redFlags: string[];
  staySafe: string[];
  example: string;
}

export interface ExampleMessage {
  id: string;
  badge: ScamBadge;
  message: string;
  why: string;
}

export interface VideoResource {
  id: string;
  title: string;
  description: string;
  searchQuery: string;
}

export interface Tip {
  id: string;
  title: string;
  body: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export const SCAM_TYPES: ScamType[] = [
  {
    id: 'fake-reversal',
    title: 'Fake Reversal',
    badge: 'fraud',
    summary:
      'A message claims a transaction was reversed and asks you to "confirm" or "return" money that was never yours.',
    overview:
      'Reversals are handled automatically by your mobile money provider. A scammer may pretend that money was sent to you by mistake and ask you to send it back, often by airtime or to a different number. Once you send it, the original "reversal" never happens.',
    redFlags: [
      'You are asked to return money that does not appear in your balance.',
      'The sender wants the money sent to a different number or as airtime.',
      'The message creates panic: "reverse immediately or you will be blocked".',
      'A link or phone number is supplied to "confirm" the reversal.',
    ],
    staySafe: [
      'Open your provider menu yourself and check the real transaction history.',
      'Never return money based on an SMS alone — speak to an agent at an official shop.',
      'Remember that genuine reversals do not need your PIN or a fee.',
    ],
    example:
      'Transaction reversed in error. Send MK45,000 back to 0888 111 222 now or your account will be frozen. Call 0999 000 111 to confirm.',
  },
  {
    id: 'miracle-money',
    title: 'Miracle / Quick Money',
    badge: 'fraud',
    summary:
      'You are told you have won a prize, grant, or "miracle" payout and must call a number or pay a small fee to release it.',
    overview:
      'These messages promise large sums for doing very little. They often mix religious language, urgency, and a phone number. The goal is to make you call or pay a "release fee", "tax", or "registration fee" before receiving money that does not exist.',
    redFlags: [
      'A large prize or payout you never entered for.',
      'A request to pay a fee before receiving the money.',
      'A phone number to call, usually a personal mobile number.',
      'Pressure to act "today" or "before midnight".',
    ],
    staySafe: [
      'Treat unexpected winnings as fake until proven otherwise.',
      'Never pay money to receive money.',
      'Search for the organisation independently instead of using the number in the SMS.',
    ],
    example:
      'MIRACLE MONEY: lowani mpingo wathu wa satanic kuti mulemele. imbani phone ku nambala iyi 0999994330 kuti mujoine',
  },
  {
    id: 'pin-harvesting',
    title: 'PIN Harvesting',
    badge: 'fraud',
    summary:
      'Someone posing as an agent, bank, or support agent asks for your PIN, OTP, or full ID to "verify" or "unlock" your account.',
    overview:
      'Your PIN and one-time password are the keys to your wallet. No genuine agent, bank, or support line will ever ask you to read them out or type them into a link. Once a scammer has them, they can empty your balance in seconds.',
    redFlags: [
      'Any request for your PIN, OTP, or password.',
      'A claim that your account is blocked and only they can unlock it.',
      'A link that looks like your provider but has a strange address.',
      'Caller ID or a message that pressures you to "verify" immediately.',
    ],
    staySafe: [
      'Never share your PIN or OTP with anyone — not even someone who knows your name.',
      'Type your PIN only into your own phone’s official USSD or app screen.',
      'Hang up and dial the official customer care number from your SIM pack.',
    ],
    example:
      'Dear customer, your Airtel Money account is blocked. Send your PIN to 0999 433 000 or reply with your ID number to reactivate it.',
  },
  {
    id: 'fake-agent-job',
    title: 'Fake Agent / Job Offer',
    badge: 'fraud',
    summary:
      'Offers of employment, loans, or funding that require an up-front payment or your registration details before you can "receive" the money.',
    overview:
      'A "recruiter" or "agent" offers a job, loan, or business capital. Before you can start or receive the money, you must pay a registration fee or send copies of your ID. The job or loan never materialises, and your personal details may be used for identity fraud.',
    redFlags: [
      'A job offer you never applied for.',
      'A fee for training, uniform, registration, or "processing".',
      'Requests for your national ID, bank details, or PIN before an interview.',
      'Only a mobile number and no physical office or official email.',
    ],
    staySafe: [
      'Legitimate employers do not ask candidates to pay to be hired.',
      'Verify the company through its official website or a physical office.',
      'Do not send ID copies or pay fees until you have independently confirmed the offer.',
    ],
    example:
      'JB FOUNDATION MTUKULA PAKHOMO PROJECT: mwachita mwayi olandila ndalama zokwana MK75000.00 kuti muthandize imbani 0981682601.',
  },
  {
    id: 'urgent-family',
    title: 'Urgent Family Request',
    badge: 'fraud',
    summary:
      'A message pretends to be a relative in trouble who urgently needs airtime or money transferred before you can verify.',
    overview:
      'The scammer pretends to be a child, sibling, or friend using a new number. They describe an emergency — hospital, transport, arrest — and beg for airtime or a transfer. Calling the number back often reaches the scammer, not your relative.',
    redFlags: [
      'An unfamiliar number claiming to be family.',
      'A story that requires secrecy or immediate action.',
      'A request for airtime rather than a normal transfer.',
      'Refusal to answer a video call or speak to another family member.',
    ],
    staySafe: [
      'Call your relative on the number you already have saved.',
      'Ask a question only the real person could answer.',
      'Never send airtime or money until you have spoken to them directly.',
    ],
    example:
      'Mum, it is me. I lost my phone and I am stranded in Lilongwe. Please send me K20,000 airtime on this new number 0888 444 555. Do not call, my battery is low.',
  },
  {
    id: 'genuine-provider',
    title: 'Genuine Provider Message',
    badge: 'normal',
    summary:
      'Real balance alerts, promotional notices, and transaction notifications never ask for your PIN and never ask you to call an unknown number to "claim" money.',
    overview:
      'Not every SMS is a scam. Genuine provider messages report a balance, confirm a transaction, or give a service update. They do not ask you to reply with a PIN, pay a release fee, or move money to a personal number.',
    redFlags: [
      'No request for a PIN, OTP, or password.',
      'No fee is required to receive money.',
      'The message only reports information you can verify in your own menu.',
    ],
    staySafe: [
      'Still verify large or unexpected transactions in your provider menu.',
      'Use the official app or USSD code, never a link in an SMS.',
      'Keep your PIN private even when a message looks genuine.',
    ],
    example:
      'Balansi K-1499.92; PaNet MoFaya Weekly 2.60GB itha pa 07-11-2023; Timasuke SMS K35:98 itha pa 02-11-2023',
  },
];

export const EXAMPLE_MESSAGES: ExampleMessage[] = [
  {
    id: 'example-miracle',
    badge: 'fraud',
    message:
      'MIRACLE MONEY: lowani mpingo wathu wa satanic kuti mulemele. imbani phone ku nambala iyi 0999994330 kuti mujoine',
    why: 'Promises free money, uses pressure language, and directs you to call an unknown number.',
  },
  {
    id: 'example-foundation',
    badge: 'fraud',
    message:
      'JB FOUNDATION MTUKULA PAKHOMO PROJECT: mwachita mwayi olandila ndalama zokwana MK75000.00 kuti muthandize imbani 0981682601.',
    why: 'An unsolicited "award" that requires you to phone a number before you can receive it.',
  },
  {
    id: 'example-pin',
    badge: 'fraud',
    message:
      'URGENT!! Your Airtel Money account is blocked. Reply with your PIN and ID number to 0999 433 000 to unlock it immediately.',
    why: 'No provider will ever ask for your PIN by SMS. This is a direct attempt to take over your wallet.',
  },
  {
    id: 'example-balance',
    badge: 'normal',
    message:
      'Balansi K-1499.92; PaNet MoFaya Weekly 2.60GB itha pa 07-11-2023; Timasuke SMS K35:98 itha pa 02-11-2023',
    why: 'It only reports your own balance and data expiry. It asks for nothing and demands no action.',
  },
  {
    id: 'example-health',
    badge: 'normal',
    message:
      "Unduna wa umoyo ukupempha makolo kuti akabayitse ana awo katemela wa polio m'madela awo kuti akhale otetezeka ku nthendayi.",
    why: 'A public health announcement from the Ministry of Health. It requests no payment and no PIN.',
  },
];

export const VIDEOS: VideoResource[] = [
  {
    id: 'reversal',
    title: 'How Reversal Scams Work',
    description:
      'A short walkthrough of the fake reversal text and why the provider never asks you to "return" money by airtime.',
    searchQuery: 'mobile money fake reversal scam Malawi',
  },
  {
    id: 'pin',
    title: 'Protecting Your Mobile Money PIN',
    description:
      'Practical steps to keep your PIN and OTP private, and what real agents will never ask you for.',
    searchQuery: 'protect mobile money PIN OTP scam awareness',
  },
  {
    id: 'verify',
    title: 'Verifying Before You Act',
    description:
      'How to pause, check the sender, and confirm with official channels before responding to an urgent message.',
    searchQuery: 'verify SMS before sending money mobile money scam',
  },
];

export const SAFETY_TIPS: Tip[] = [
  {
    id: 'tip-pin',
    title: 'Guard your PIN and OTP',
    body: 'Never share your mobile money PIN, OTP, or ID details with anyone, even if the caller claims to be an agent or support staff.',
  },
  {
    id: 'tip-prize',
    title: 'Question every prize',
    body: 'Treat any unexpected prize, award, or "reversal" message with suspicion. Genuine money never requires an up-front payment.',
  },
  {
    id: 'tip-check',
    title: 'Scan before you act',
    body: 'Check the message with the SMS Detector before you tap any link or call any number included in it.',
  },
  {
    id: 'tip-links',
    title: 'Avoid SMS links',
    body: 'Do not use links received by SMS to log in. Open the official app or dial the official USSD menu yourself instead.',
  },
  {
    id: 'tip-family',
    title: 'Verify family emergencies',
    body: 'Verify urgent requests from "family" or "friends" by calling them on a number you already know.',
  },
  {
    id: 'tip-report',
    title: 'Report and warn others',
    body: 'Report scam messages to your provider and to the MoneyGuard support line so the community stays protected.',
  },
];

export const RECOVERY_STEPS: Tip[] = [
  {
    id: 'recover-1',
    title: 'Do not reply or call',
    body: 'Do not reply to the message and do not call any number it contains. Replying confirms that your number is active.',
  },
  {
    id: 'recover-2',
    title: 'Do not tap links',
    body: 'Links in scam SMS can lead to fake login pages that steal your PIN. Close the message instead.',
  },
  {
    id: 'recover-3',
    title: 'Scan and keep the message',
    body: 'Run the message through the SMS Detector and keep it in your history. It is useful evidence if you report the scam.',
  },
  {
    id: 'recover-4',
    title: 'Report it',
    body: 'Report the message to your mobile money provider. If you already lost money, contact the police and your provider immediately.',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'quiz-1',
    question: 'A genuine mobile money agent asks for your PIN to "verify" your account. What should you do?',
    options: [
      'Share it — they are an official agent.',
      'Refuse. No genuine agent needs your PIN.',
      'Send only the first two digits.',
      'Reply with your PIN but delete the message afterwards.',
    ],
    answerIndex: 1,
    explanation:
      'Your PIN is for you alone. Genuine agents and support staff never ask you to reveal it.',
  },
  {
    id: 'quiz-2',
    question: 'You receive an SMS saying you won MK75,000 but must pay a MK2,000 release fee. This is most likely…',
    options: ['A genuine promotion', 'A bank error', 'A scam', 'A government grant'],
    answerIndex: 2,
    explanation:
      'Genuine prizes never require an up-front payment. A fee to release winnings is a classic scam.',
  },
  {
    id: 'quiz-3',
    question: 'What is the safest way to check whether a transaction alert is real?',
    options: [
      'Tap the link in the message',
      'Call the number in the message',
      'Open your provider menu or official app yourself',
      'Reply "YES" to confirm',
    ],
    answerIndex: 2,
    explanation:
      'Always verify through a channel you opened yourself — the official app or USSD menu — never through links or numbers in the SMS.',
  },
  {
    id: 'quiz-4',
    question: 'A message from a "new number" claims to be your child stranded and asks for airtime. What is the best first step?',
    options: [
      'Send a small amount quickly',
      'Call your child on their saved number',
      'Reply asking for their ID',
      'Share the message with friends only',
    ],
    answerIndex: 1,
    explanation:
      'Scammers rely on urgency. Call the person on the number you already know before sending anything.',
  },
  {
    id: 'quiz-5',
    question: 'Which of these is a red flag in an SMS?',
    options: [
      'It reports your balance',
      'It asks you to keep your PIN private',
      'It asks you to send money to a personal number urgently',
      'It comes from your provider’s official short code',
    ],
    answerIndex: 2,
    explanation:
      'Urgency plus a request to move money to a personal number is one of the strongest scam signals.',
  },
  {
    id: 'quiz-6',
    question: 'Can MoneyGuard scan a message without sending it to a server?',
    options: [
      'No, it always uploads the SMS',
      'Yes, the model runs entirely on your phone',
      'Only when you are online',
      'Only for English messages',
    ],
    answerIndex: 1,
    explanation:
      'The TF-IDF and Logistic Regression model is bundled with the app and runs offline on your device.',
  },
];

export function getScamType(id: string): ScamType | undefined {
  return SCAM_TYPES.find((item) => item.id === id);
}

export function getExample(id: string): ExampleMessage | undefined {
  return EXAMPLE_MESSAGES.find((item) => item.id === id);
}
