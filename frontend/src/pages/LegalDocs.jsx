import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, Eye, ShieldCheck, Compass, AlertTriangle, Check, BookOpen, HelpCircle, HardDrive, PhoneCall, Bug, Terminal } from 'lucide-react';

const docsContent = {
  // --- Group 1: Legal Policies ---
  privacy: {
    group: 'Legal Policies',
    title: 'Privacy Policy',
    icon: Lock,
    lastUpdated: 'July 15, 2026',
    intro: 'How we collect, manage, and safeguard student developer data under MSC regulations.',
    body: `At Microsoft Student Club (MSC) PRPCEM, we prioritize the privacy and security of our student developers. 

1. Data Collection: We collect only minimal essential data, such as participant names, roll numbers, email IDs, and college affiliations, when checking into event lobbies.
2. Active Quiz Sessions: Live quiz data, including question attempts, completion durations, and tab switch focus events, is stored to compile real-time leaderboard statistics.
3. Third-Party Sharing: We do not sell or lease student details to any third-party databases. All verification records are held securely on Azure-hosted databases.
4. Data Correction: Students can reach out to campus managers at mlsc@prpotepatilengg.ac.in to update their registration details or request deletion of lobby check-in logs.`
  },
  terms: {
    group: 'Legal Policies',
    title: 'Terms & Conditions',
    icon: FileText,
    lastUpdated: 'July 15, 2026',
    intro: 'Rules and conditions governing the usage of the MSC quiz portal and socket lobbies.',
    body: `By participating in live quiz lobbies or workshops hosted on the MSC-PRPCEM platform, you agree to these Terms of Use.

1. Session Code Security: Room join keys are to be used only by authorized event participants. Sharing lobby keys off-campus is restricted.
2. Fair Play: You agree to complete quiz questions without using external search utilities, scripts, or auto-submit bots. Focus-tracking features monitor tab shifts to ensure fairness.
3. Admin Authority: Campus managers retain the authority to disqualify submissions containing profane registration handles or flagged session histories.
4. Certificate Usage: Certificates of completion are issued purely for academic validation and should not be modified or counterfeited.`
  },
  cookies: {
    group: 'Legal Policies',
    title: 'Cookie Policy',
    icon: Eye,
    lastUpdated: 'July 15, 2026',
    intro: 'Information regarding local session storage, state retention, and anti-cheat tracking.',
    body: `Our platform uses essential browser state trackers to ensure seamless participation.

1. Session Persistence: Browser cookies and local storage tokens keep you logged in to the live quiz lobby if a network drop or page reload occurs.
2. Cheating Prevention: Focus tracking records tab shifts using local focus event APIs to maintain test integrity. No external tabs or browser history is inspected.
3. Admin Panel Analytics: Standard cookies are used to validate active administrator authentication states.
4. Preference Trackers: No tracking cookies or advertising pixels are integrated. We use purely functional developer tokens.`
  },
  'code-of-conduct': {
    group: 'Legal Policies',
    title: 'Code of Conduct',
    icon: ShieldCheck,
    lastUpdated: 'July 15, 2026',
    intro: 'Expected developer behavior guidelines, academic integrity, and community ethics.',
    body: `Microsoft Student Club PRPCEM is dedicated to providing an inclusive, respectful, and safe learning environment.

1. Mutual Respect: Harassment, hate speech, or derogatory handles in lobby lists are subject to immediate administrative block and session deletion.
2. Collaborative Spirit: While live quizzes are competitive, collaboration during review workshops and bootcamps is highly encouraged.
3. Integrity: Do not exploit platform bugs or latency windows. If you discover a security vulnerability, please disclose it responsibly to mlsc@prpotepatilengg.ac.in.
4. Disciplinary Actions: Severe violations will be escalated to the campus department block.`
  },
  disclaimer: {
    group: 'Legal Policies',
    title: 'Disclaimer',
    icon: AlertTriangle,
    lastUpdated: 'July 15, 2026',
    intro: 'General limitations of liabilities, grading accuracy, and connection logs validity.',
    body: `This live event portal is designed for student education and workshops at PRPCEM.

1. Content Accuracy: Quiz questions, developer guides, and workshop slides are compiled by student leads. The club is not liable for errors in grading.
2. Service Availability: The portal is provided on an 'as-is' basis. While we strive to maintain uninterrupted server logs, we are not liable for session drops due to internet lags.
3. External Resources: External references or workshop links provided during events are managed by third parties.`
  },
  accessibility: {
    group: 'Legal Policies',
    title: 'Accessibility Statement',
    icon: Compass,
    lastUpdated: 'July 15, 2026',
    intro: 'Our commitment to inclusive student portal design, keyboard bindings, and contrast metrics.',
    body: `We are committed to making our workshop tools accessible to all student engineers.

1. Visual Access: Colors and button outlines are built with sufficient contrast to help read text clearly.
2. Keyboard Navigation: We ensure core actions (joining lobbies, submitting answers) can be triggered via keyboard controls.
3. Continuous Improvements: We regularly update focus borders and card indicators. For custom requests, mail us at mlsc@prpotepatilengg.ac.in.`
  },

  // --- Group 2: Resources & Guides ---
  rules: {
    group: 'Resources & Guides',
    title: 'Quiz Rules',
    icon: BookOpen,
    lastUpdated: 'July 15, 2026',
    intro: 'Official game play rules, speed multipliers, and anti-cheat validation metrics.',
    body: `Please review these instructions carefully before joining a live quiz session:

1. Time Limits: Each question has a fixed timer (usually 15 to 45 seconds). Answers must be submitted before the countdown ends.
2. Score Calculations: Points are awarded dynamically based on accuracy and speed. Faster correct answers receive speed bonuses.
3. Anti-Cheat Monitoring: Window focus shifts are monitored. Leaving the active quiz window or opening dev tools flags a focus violation. Accumulating violations locks your input.
4. Re-entry Policy: If you disconnect, rejoin immediately using the same room code and credentials to resume from the current active question.`
  },
  faq: {
    group: 'Resources & Guides',
    title: 'Frequently Asked Questions',
    icon: HelpCircle,
    lastUpdated: 'July 15, 2026',
    intro: 'Troubleshooting guide for login, focus locking, and certificate downloads.',
    body: `Answers to common participant concerns:

Q: Why is my session locked?
A: A lock triggers if focus switches away from the quiz tab multiple times. Contact the venue managers to request a session status reset.

Q: How do I claim my certificate?
A: Once scores are verified, use the Certificate Verification search bar on the home page with your issued credential code (e.g. MSC-12345) to download your pdf.

Q: Can I join late?
A: You can join active lobbies at any point, but you will miss points for questions that have already expired.`
  },
  guide: {
    group: 'Resources & Guides',
    title: 'User Guide',
    icon: HardDrive,
    lastUpdated: 'July 15, 2026',
    intro: 'Step-by-step instructions for room checks, answer selection, and dashboard navigation.',
    body: `Follow these steps to participate in events:

1. Room Join: Enter the shared 6-digit lobby code on the homepage or click the direct join invite. Add your roll number.
2. Waiting Lobby: Wait in the lobby room until event administrators start the question rounds.
3. Question Phase: The system pushes questions in sync. Select your choice and tap submit.
4. Verification: After the session, download your certificate of completion via the Verification panel.`
  },
  support: {
    group: 'Resources & Guides',
    title: 'Technical Support',
    icon: PhoneCall,
    lastUpdated: 'July 15, 2026',
    intro: 'Event support channels, issue resolution timelines, and venue assistance.',
    body: `Need assistance? Here is how to contact support:

1. Live Event Support: If you experience session drops during a live campus workshop, visit the technical help booth at the venue for immediate help.
2. Ticket SLA: Standard email queries (name corrections on credentials, registration issues) sent to mlsc@prpotepatilengg.ac.in are answered within 24 to 48 hours.
3. Escalations: Academic issues regarding quiz grading are routed to the department representative.`
  },
  report: {
    group: 'Resources & Guides',
    title: 'Report Issue',
    icon: Bug,
    lastUpdated: 'July 15, 2026',
    intro: 'Guidelines for reporting bugs, platform latency, and score validation failures.',
    body: `To report technical bugs or glitches:

1. Submission Details: Email mlsc@prpotepatilengg.ac.in with a clear title describing the issue.
2. Required Info: Provide your room code, roll number, device model/browser type, and screenshots of the bug.
3. Exploit Reporting: If you discover a security vulnerability or exploit, please report it privately to avoid student disqualifications.`
  },
  docs: {
    group: 'Resources & Guides',
    title: 'Documentation',
    icon: Terminal,
    lastUpdated: 'July 15, 2026',
    intro: 'Platform architecture details, socket configurations, and system assets references.',
    body: `System specifications for developer leads:

1. Core Tech Stack: React frontend communicating with Node.js/Express backend services, built on Vite compile modules.
2. State Sync: WebSocket (Socket.io) handles real-time timer sync, count monitoring, and live question pushes.
3. Asset Hosting: Media settings and student certificates are hosted on secure Azure Blob Storage containers.
4. Security: Admin routes are protected via JWT cookie authorizations.`
  }
};

export default function LegalDocs() {
  const { docType } = useParams();
  const navigate = useNavigate();

  // Validate path parameter
  const activeKey = docsContent[docType] ? docType : 'privacy';
  const doc = docsContent[activeKey];
  const IconComponent = doc.icon;

  // Scroll to top when parameter shifts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [docType]);

  // Group items by category
  const groups = {
    'Legal Policies': [],
    'Resources & Guides': []
  };

  Object.keys(docsContent).forEach((key) => {
    const item = docsContent[key];
    groups[item.group].push({ key, ...item });
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-blue uppercase tracking-wider transition-colors duration-200">
            <ArrowLeft size={14} />
            <span>Back to Portal</span>
          </Link>
          <div className="text-[10px] bg-blue-50 text-blue-700 font-extrabold uppercase px-3 py-1 rounded-full border border-blue-100/60 shadow-sm flex items-center gap-1">
            <Check size={10} className="stroke-[3]" />
            <span>Compliance Verified</span>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Tabs navigation */}
          <div className="md:col-span-4 bg-white border border-brand-border rounded-2xl p-4 space-y-4 shadow-soft">
            {Object.keys(groups).map((groupName) => (
              <div key={groupName} className="space-y-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3 pb-2 border-b border-slate-50 mb-2">
                  {groupName}
                </h4>
                {groups[groupName].map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = item.key === activeKey;
                  return (
                    <button
                      key={item.key}
                      onClick={() => navigate(`/legal/${item.key}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 text-left ${isActive ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <ItemIcon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Rendered Document Block */}
          <div className="md:col-span-8 bg-white border border-brand-border rounded-2xl p-6 sm:p-8 shadow-soft text-left space-y-6 relative overflow-hidden">
            {/* Corner visual accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-lightBlue/10 to-transparent pointer-events-none"></div>

            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-2 text-brand-blue bg-brand-lightBlue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                <IconComponent size={12} className="stroke-[3]" />
                <span>{doc.group}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{doc.title}</h1>
              <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">Last Updated: {doc.lastUpdated}</p>
            </div>

            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
              <p className="text-xs sm:text-sm font-semibold text-slate-700 italic leading-relaxed">{doc.intro}</p>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line space-y-4">
              {doc.body}
            </div>

            <div className="border-t border-slate-100 pt-6 flex justify-between items-center text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              <span>Microsoft Student Club PRPCEM</span>
              <span>Doc Ref: {activeKey.toUpperCase()}-2026</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
