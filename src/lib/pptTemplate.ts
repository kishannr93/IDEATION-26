import pptxgen from 'pptxgenjs';

export interface SlideGuideline {
  slideNumber: number;
  title: string;
  subtitle: string;
  guidelines: string;
  tips: string[];
  mandatoryItems: string[];
}

export const PPT_TEMPLATE_GUIDELINES: SlideGuideline[] = [
  {
    slideNumber: 1,
    title: 'Cover Slide & Team Identity',
    subtitle: 'Project Title, Track, and Team Details',
    guidelines: 'Include official IDEATION 2026 header, team ID, project title, domain track, and all members with college USNs and branch.',
    tips: [
      'Include official IDEATION 2026 header & branding',
      'Mention your designated Team ID (e.g. IDN-0024)',
      'List all 3 to 4 team members with college USNs and branch',
    ],
    mandatoryItems: ['Project Title', 'Team Name & Team ID', 'Domain Track', 'College & University', 'Member Names & USNs'],
  },
  {
    slideNumber: 2,
    title: 'Problem Statement & Context',
    subtitle: 'The Real-World Pain Point You Are Solving',
    guidelines: 'Be specific about target beneficiaries, highlight statistics or pain points, and explain why existing legacy approaches fail.',
    tips: [
      'Be specific about who experiences this problem (industry, citizens, farmers, students, patients)',
      'Highlight statistics, quantified pain points, or real-life inefficiencies',
      'Explain why existing legacy solutions fail',
    ],
    mandatoryItems: ['Target Beneficiary', 'Quantified Problem Description', 'Current Inefficiencies'],
  },
  {
    slideNumber: 3,
    title: 'Proposed Solution & Novelty',
    subtitle: 'Your Core Innovation & Value Proposition',
    guidelines: 'Clearly explain how your system solves the problem, emphasize the unique intellectual contribution, and highlight speed/accuracy advantages.',
    tips: [
      'Clearly explain how your system solves the stated problem',
      'Emphasize the unique intellectual contribution or novel mechanism',
      'Focus on usability, automation, speed, or accuracy advantages',
    ],
    mandatoryItems: ['Core Value Proposition', 'Novelty / Competitive Differentiator', 'Expected Outcome'],
  },
  {
    slideNumber: 4,
    title: 'System Architecture & Data Flow',
    subtitle: 'End-to-End Diagram of Modules and Pipelines',
    guidelines: 'Display clean connections between UI, backend server, database, models, and hardware sensors showing request lifecycle.',
    tips: [
      'Show connections between user interface, backend server, database, and hardware/AI APIs',
      'Include simple arrows showing the lifecycle of a request from input to output',
      'Keep text concise; let visual boxes tell the story',
    ],
    mandatoryItems: ['High-Level Architecture Block Diagram', 'Data Ingestion & Processing Flow', 'Key Integrations'],
  },
  {
    slideNumber: 5,
    title: 'Tech Stack & Engineering Specs',
    subtitle: 'Languages, Frameworks, Hardware & Cloud Services',
    guidelines: 'Categorize tools into Frontend, Backend, AI/ML, Cloud/Database, and Hardware sensors with exact models and libraries.',
    tips: [
      'Categorize tools into Frontend, Backend, AI/Data, Hardware/Sensors, and Cloud',
      'Specify exact libraries and pre-trained models or custom datasets utilized',
      'Highlight any Google APIs, Gemini, or open-source libraries integrated',
    ],
    mandatoryItems: ['Languages & Frameworks', 'Database / Storage', 'AI Models / Hardware Pins', 'APIs & Cloud'],
  },
  {
    slideNumber: 6,
    title: 'Core Features & Working Prototype',
    subtitle: 'Breakdown of Working Capabilities',
    guidelines: 'Highlight core capabilities built during the hackathon, demonstrating responsive UX, real-time pipelines, and live data.',
    tips: [
      'Highlight features built during the 24-hour hackathon duration',
      'Demonstrate responsive user experience and real-time processing',
      'Differentiate between completed features and planned stretch goals',
    ],
    mandatoryItems: ['Feature 1: User / Sensor Input', 'Feature 2: Core Processing / AI Engine', 'Feature 3: Analytics / Output'],
  },
  {
    slideNumber: 7,
    title: 'Live Demo & Verification Results',
    subtitle: 'Screenshots, Execution Video, and Benchmark Metrics',
    guidelines: 'Provide live hosted URL, public GitHub repo link, and actual benchmark metrics (latency, model accuracy, or hardware response).',
    tips: [
      'Include clear high-res screenshots of your working UI or terminal output',
      'Provide a clickable link to your live hosted web app or GitHub repo',
      'Share key performance metrics: latency, model accuracy, or hardware response time',
    ],
    mandatoryItems: ['Working Screenshot 1 & 2', 'Public GitHub Repo Link', 'Live Hosted Demo or Video Link'],
  },
  {
    slideNumber: 8,
    title: 'Feasibility, Cost & Market Impact',
    subtitle: 'Viability, Implementation Budget, and Sustainability',
    guidelines: 'Break down deployment budget per unit or monthly cloud cost, analyze scalability, and demonstrate economic/social impact.',
    tips: [
      'Calculate an estimated deployment cost per unit or monthly hosting expense',
      'Identify potential adoption hurdles and how your team mitigates them',
      'Demonstrate social, economic, or environmental benefit',
    ],
    mandatoryItems: ['Estimated Bill of Materials / Cloud Cost', 'Target Market & Scalability', 'Key Impact Metric'],
  },
  {
    slideNumber: 9,
    title: 'Future Roadmap & Next Milestones',
    subtitle: 'What Lies Ahead Beyond the Hackathon',
    guidelines: 'Detail immediate post-hackathon refinements, beta pilot deployment with real users, and production incubation roadmap.',
    tips: [
      'Outline 30-day, 90-day, and 1-year product milestones',
      'Discuss potential patenting, campus startup incubation, or field pilot tests',
      'Address edge cases or advanced enhancements',
    ],
    mandatoryItems: ['Phase 1: Post-Hackathon Refinements', 'Phase 2: Pilot Testing with Real Users', 'Phase 3: Production Rollout'],
  },
  {
    slideNumber: 10,
    title: 'Conclusion & Team Credits',
    subtitle: 'Summary and Ready for Jury Q&A',
    guidelines: 'Summarize key project takeaways in 2 crisp bullet points, share contact details, and thank BIET and Anveshan organizers.',
    tips: [
      'Summarize key takeaways in 2 crisp bullet points',
      'Display team contact details, LinkedIn handles, and faculty guide credits',
      'Include a clear "Thank You - Ready for Questions" footer',
    ],
    mandatoryItems: ['Final Summary Takeaway', 'Team Contacts & GitHub', 'Acknowledgments to BIET & Anveshan'],
  },
];

export interface CustomTeamData {
  teamName?: string;
  teamId?: string;
  id?: string;
  track?: string;
  college?: string;
  ideaTitle?: string;
  problemTitle?: string;
  problemSummary?: string;
  members?: { name: string; usn: string; isLeader?: boolean }[];
}

/**
 * Generates and downloads the official IDEATION 2026 PPT Presentation Template (.pptx)
 */
export async function generatePptTemplate(customData?: CustomTeamData): Promise<void> {
  const pptx = new pptxgen();

  // Configure Presentation Settings
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'IDEATION 2026 - Anveshan Club, BIET';
  pptx.company = 'Bapuji Institute of Engineering and Technology, Davangere';
  pptx.title = 'IDEATION 2026 Project Presentation Template';
  pptx.subject = 'Official Hackathon Pitch Deck Template';

  // Theme Colors
  const BG_NAVY = '050B1A';
  const CARD_NAVY = '0C1630';
  const CYAN_ACCENT = '35E0FF';
  const ORANGE_ACCENT = 'FF8A2A';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '9DB0D0';

  const teamName = customData?.teamName || '[Enter Team Name]';
  const teamId = customData?.teamId || customData?.id || 'IDN-XXXX';
  const trackName = customData?.track || '[Selected Domain Track]';
  const projectTitle = customData?.problemTitle || customData?.ideaTitle || '[Your Project Title Here]';
  const collegeName = customData?.college || 'Bapuji Institute of Engineering and Technology (BIET)';

  const membersList = customData?.members && customData.members.length > 0
    ? customData.members.map((m, idx) => `${idx + 1}. ${m.name} (${m.usn || 'USN'})${m.isLeader ? ' - Lead' : ''}`).join('\n')
    : '1. [Leader Name] (USN: 4BD2XCSXXX)\n2. [Member 2 Name] (USN: 4BD2XCSXXX)\n3. [Member 3 Name] (USN: 4BD2XCSXXX)\n4. [Member 4 Name] (USN: 4BD2XCSXXX)';

  // Helper for Slide Background and Header
  const setupStandardSlide = (slide: pptxgen.Slide, slideNumStr: string, titleStr: string, subtitleStr: string) => {
    slide.background = { color: BG_NAVY };

    // Header Tag
    slide.addText('IDEATION 2026 · OFFICIAL SUBMISSION DECK', {
      x: 0.8,
      y: 0.4,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      color: CYAN_ACCENT,
      bold: true,
    });

    // Slide Number & Title
    slide.addText(`${slideNumStr}. ${titleStr}`, {
      x: 0.8,
      y: 0.7,
      w: 10.0,
      h: 0.6,
      fontSize: 22,
      fontFace: 'Arial',
      color: TEXT_WHITE,
      bold: true,
    });

    // Subtitle
    slide.addText(subtitleStr, {
      x: 0.8,
      y: 1.25,
      w: 11.5,
      h: 0.4,
      fontSize: 12,
      fontFace: 'Arial',
      color: TEXT_MUTED,
      italic: true,
    });

    // Footer Bar
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8,
      y: 6.8,
      w: 11.7,
      h: 0,
      line: { color: '1A2D5A', width: 1 },
    });

    slide.addText(`Team: ${teamName} (${teamId}) · Track: ${trackName} · BIET Davangere`, {
      x: 0.8,
      y: 6.85,
      w: 10.0,
      h: 0.3,
      fontSize: 9,
      fontFace: 'Arial',
      color: TEXT_MUTED,
    });
  };

  // ---------------------------------------------------------------------------
  // SLIDE 1: COVER SLIDE
  // ---------------------------------------------------------------------------
  const slide1 = pptx.addSlide();
  slide1.background = { color: BG_NAVY };

  // Glowing Banner Card
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 0.8,
    w: 11.7,
    h: 5.7,
    fill: { color: CARD_NAVY },
    line: { color: '1A2D5A', width: 2 },
  });

  slide1.addText('IDEATION 2026 · 24-HOUR HACKATHON', {
    x: 1.2,
    y: 1.2,
    w: 10.0,
    h: 0.4,
    fontSize: 12,
    fontFace: 'Arial',
    color: ORANGE_ACCENT,
    bold: true,
  });

  slide1.addText(projectTitle, {
    x: 1.2,
    y: 1.7,
    w: 10.5,
    h: 1.0,
    fontSize: 32,
    fontFace: 'Arial',
    color: TEXT_WHITE,
    bold: true,
  });

  slide1.addText(`Domain Track: ${trackName}`, {
    x: 1.2,
    y: 2.7,
    w: 8.0,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    color: CYAN_ACCENT,
    bold: true,
  });

  // Team Details Left Box
  slide1.addShape(pptx.ShapeType.rect, {
    x: 1.2,
    y: 3.3,
    w: 5.2,
    h: 2.8,
    fill: { color: '071126' },
    line: { color: '203A70', width: 1 },
  });

  slide1.addText('TEAM COMPOSITION', {
    x: 1.4,
    y: 3.45,
    w: 4.8,
    h: 0.3,
    fontSize: 11,
    fontFace: 'Arial',
    color: CYAN_ACCENT,
    bold: true,
  });

  slide1.addText(`Team Name: ${teamName}\nTeam ID: ${teamId}\nCollege: ${collegeName}`, {
    x: 1.4,
    y: 3.8,
    w: 4.8,
    h: 1.0,
    fontSize: 11,
    fontFace: 'Arial',
    color: TEXT_WHITE,
    bold: true,
  });

  slide1.addText(membersList, {
    x: 1.4,
    y: 4.85,
    w: 4.8,
    h: 1.1,
    fontSize: 10,
    fontFace: 'Arial',
    color: TEXT_MUTED,
  });

  // Right Box: Hackathon & Venue info
  slide1.addShape(pptx.ShapeType.rect, {
    x: 6.7,
    y: 3.3,
    w: 5.4,
    h: 2.8,
    fill: { color: '071126' },
    line: { color: '203A70', width: 1 },
  });

  slide1.addText('EVENT DETAILS & SUBMISSION', {
    x: 6.9,
    y: 3.45,
    w: 5.0,
    h: 0.3,
    fontSize: 11,
    fontFace: 'Arial',
    color: ORANGE_ACCENT,
    bold: true,
  });

  slide1.addText(
    '• Organized by: Anveshan Club & Dept. of CSE / ISE\n• Venue: BIET Campus, Davangere, Karnataka\n• Format: 36-Hour Hackathon & Live Jury Evaluation\n• Official Evaluation Deck: Round 1 & Grand Finale\n• Presentation Duration: 7 Mins Pitch + 3 Mins Q&A',
    {
      x: 6.9,
      y: 3.9,
      w: 5.0,
      h: 2.0,
      fontSize: 11,
      fontFace: 'Arial',
      color: TEXT_WHITE,
      lineSpacing: 18,
    }
  );

  // ---------------------------------------------------------------------------
  // SLIDE 2: PROBLEM STATEMENT
  // ---------------------------------------------------------------------------
  const slide2 = pptx.addSlide();
  setupStandardSlide(slide2, '01', 'PROBLEM STATEMENT', 'Define the core real-world pain point and who suffers from it.');

  // Box 1: The Core Problem
  slide2.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.8, w: 3.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide2.addText('THE UNADDRESSED PAIN POINT', { x: 1.0, y: 2.0, w: 3.3, h: 0.4, fontSize: 12, fontFace: 'Arial', color: CYAN_ACCENT, bold: true });
  slide2.addText(
    '• State the fundamental bottleneck or breakdown in existing systems.\n\n• Why is this problem critical right now?\n\n• Example: "Over 68% of small-scale farmers in Karnataka face post-harvest crop losses due to lack of localized cold-chain routing."',
    { x: 1.0, y: 2.5, w: 3.3, h: 3.6, fontSize: 11, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 16 }
  );

  // Box 2: Target Beneficiary
  slide2.addShape(pptx.ShapeType.rect, { x: 4.8, y: 1.8, w: 3.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide2.addText('TARGET BENEFICIARY', { x: 5.0, y: 2.0, w: 3.3, h: 0.4, fontSize: 12, fontFace: 'Arial', color: ORANGE_ACCENT, bold: true });
  slide2.addText(
    '• Who will use this solution?\n\n• Primary users (e.g. municipal engineers, doctors, logistics managers, retail customers).\n\n• What is their existing workflow and frustration point?',
    { x: 5.0, y: 2.5, w: 3.3, h: 3.6, fontSize: 11, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 16 }
  );

  // Box 3: Market Size & Negative Impact
  slide2.addShape(pptx.ShapeType.rect, { x: 8.8, y: 1.8, w: 3.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide2.addText('QUANTIFIED ADVERSE IMPACT', { x: 9.0, y: 2.0, w: 3.3, h: 0.4, fontSize: 12, fontFace: 'Arial', color: CYAN_ACCENT, bold: true });
  slide2.addText(
    '• Economic losses per year\n\n• Time spent on manual workarounds\n\n• Environmental or health risks if left unaddressed\n\n• Back your claims with authentic citations or survey insights.',
    { x: 9.0, y: 2.5, w: 3.3, h: 3.6, fontSize: 11, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 16 }
  );

  // ---------------------------------------------------------------------------
  // SLIDE 3: PROPOSED SOLUTION & NOVELTY
  // ---------------------------------------------------------------------------
  const slide3 = pptx.addSlide();
  setupStandardSlide(slide3, '02', 'PROPOSED SOLUTION & INNOVATION', 'Explain your breakthrough approach and what makes it superior to current alternatives.');

  slide3.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.8, w: 5.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide3.addText('CORE PRODUCT CONCEPT', { x: 1.1, y: 2.0, w: 5.1, h: 0.4, fontSize: 13, fontFace: 'Arial', color: CYAN_ACCENT, bold: true });
  slide3.addText(
    '• Concise 2-sentence elevator pitch of your platform or prototype.\n\n• How does the technology intervene at the point of failure?\n\n• Key automated steps: Detection -> Intelligent Analysis -> Automated Action.\n\n• User experience: How simple is it for non-technical users?',
    { x: 1.1, y: 2.5, w: 5.1, h: 3.6, fontSize: 11, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 18 }
  );

  slide3.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.8, w: 5.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide3.addText('WHY IS IT NOVEL? (DIFFERENTIATORS)', { x: 7.1, y: 2.0, w: 5.1, h: 0.4, fontSize: 13, fontFace: 'Arial', color: ORANGE_ACCENT, bold: true });
  slide3.addText(
    '• What makes this solution uniquely innovative?\n\n• 10x faster execution / 70% cheaper hardware / edge AI capability.\n\n• Comparison with existing commercial or open-source software.\n\n• Defensible advantages: proprietary heuristics, hardware fusion, or localized workflow integration.',
    { x: 7.1, y: 2.5, w: 5.1, h: 3.6, fontSize: 11, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 18 }
  );

  // ---------------------------------------------------------------------------
  // SLIDE 4: SYSTEM ARCHITECTURE
  // ---------------------------------------------------------------------------
  const slide4 = pptx.addSlide();
  setupStandardSlide(slide4, '03', 'SYSTEM ARCHITECTURE & DATA FLOW', 'Technical architecture showing components, pipelines, and data flow.');

  slide4.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.8, w: 11.7, h: 3.5, fill: { color: '071126' }, line: { color: CYAN_ACCENT, width: 2, dashType: 'dash' } });
  slide4.addText('[ PASTE SYSTEM ARCHITECTURE DIAGRAM HERE ]\n\n(Diagram showing: Client Devices / Sensors -> API Gateway -> Backend Microservices -> AI / ML Models -> Database -> Output Dashboard / Actuators)', {
    x: 1.0,
    y: 2.8,
    w: 11.3,
    h: 1.5,
    fontSize: 14,
    fontFace: 'Arial',
    color: CYAN_ACCENT,
    align: 'center',
    bold: true,
  });

  // Bottom 3 architecture highlights
  slide4.addShape(pptx.ShapeType.rect, { x: 0.8, y: 5.5, w: 3.7, h: 1.0, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide4.addText('1. INGESTION LAYER\nREST APIs / WebSockets / IoT MQTT', { x: 0.9, y: 5.6, w: 3.5, h: 0.8, fontSize: 10, fontFace: 'Arial', color: TEXT_WHITE, bold: true });

  slide4.addShape(pptx.ShapeType.rect, { x: 4.8, y: 5.5, w: 3.7, h: 1.0, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide4.addText('2. PROCESSING ENGINE\nFastAPI / Node / PyTorch / Gemini SDK', { x: 4.9, y: 5.6, w: 3.5, h: 0.8, fontSize: 10, fontFace: 'Arial', color: CYAN_ACCENT, bold: true });

  slide4.addShape(pptx.ShapeType.rect, { x: 8.8, y: 5.5, w: 3.7, h: 1.0, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide4.addText('3. CLIENT & STORAGE\nReact / Tailwind / PostgreSQL / Firebase', { x: 8.9, y: 5.6, w: 3.5, h: 0.8, fontSize: 10, fontFace: 'Arial', color: ORANGE_ACCENT, bold: true });

  // ---------------------------------------------------------------------------
  // SLIDE 5: TECH STACK
  // ---------------------------------------------------------------------------
  const slide5 = pptx.addSlide();
  setupStandardSlide(slide5, '04', 'TECHNOLOGY STACK & INTEGRATIONS', 'Specific languages, libraries, models, and cloud infrastructure.');

  const stackBoxes = [
    { label: 'FRONTEND & UI', desc: '• React 19 + TypeScript\n• Tailwind CSS / shadcn\n• Responsive Mobile & Web\n• QR & Chart visualizers', color: CYAN_ACCENT, x: 0.8 },
    { label: 'BACKEND & APIS', desc: '• Node.js / Express or Python\n• RESTful Endpoints\n• WebSockets for live sync\n• Role-based Access Control', color: 'A855F7', x: 3.8 },
    { label: 'AI / ML / HARDWARE', desc: '• Google Gemini API / OpenCV\n• Pre-trained Embeddings\n• ESP32 / Arduino (if hardware)\n• Edge inference pipeline', color: ORANGE_ACCENT, x: 6.8 },
    { label: 'DATABASE & HOSTING', desc: '• Cloud Firestore / PostgreSQL\n• Secure Firebase Rules\n• Docker / Cloud Run\n• Resend / SMTP Email service', color: '10B981', x: 9.8 },
  ];

  stackBoxes.forEach((box) => {
    slide5.addShape(pptx.ShapeType.rect, { x: box.x, y: 1.8, w: 2.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
    slide5.addText(box.label, { x: box.x + 0.15, y: 2.0, w: 2.4, h: 0.4, fontSize: 11, fontFace: 'Arial', color: box.color, bold: true });
    slide5.addText(box.desc, { x: box.x + 0.15, y: 2.5, w: 2.4, h: 3.6, fontSize: 10, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 16 });
  });

  // ---------------------------------------------------------------------------
  // SLIDE 6: CORE FEATURES & DEMO WALKTHROUGH
  // ---------------------------------------------------------------------------
  const slide6 = pptx.addSlide();
  setupStandardSlide(slide6, '05', 'KEY FEATURES & FUNCTIONALITY', 'Walk the jury through your core user journey and standout capabilities.');

  const features = [
    { title: 'FEATURE 1: SMART INPUT', desc: 'Fast, validated onboarding with multi-modal inputs (cameras, sensors, text prompts, or file uploads).' },
    { title: 'FEATURE 2: REAL-TIME PIPELINE', desc: 'Instant algorithmic processing with minimal latency and high fault-tolerant error boundaries.' },
    { title: 'FEATURE 3: ACTIONABLE INSIGHTS', desc: 'Interactive dashboards, visual alerts, predictive trends, and automated export mechanisms.' },
    { title: 'FEATURE 4: COLLABORATION & AUDIT', desc: 'Multi-role authentication, downloadable reports, and verified traceability badges.' },
  ];

  features.forEach((f, idx) => {
    const x = idx % 2 === 0 ? 0.8 : 6.8;
    const y = idx < 2 ? 1.8 : 4.2;
    slide6.addShape(pptx.ShapeType.rect, { x, y, w: 5.7, h: 2.1, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
    slide6.addText(f.title, { x: x + 0.2, y: y + 0.2, w: 5.3, h: 0.35, fontSize: 12, fontFace: 'Arial', color: CYAN_ACCENT, bold: true });
    slide6.addText(f.desc, { x: x + 0.2, y: y + 0.6, w: 5.3, h: 1.3, fontSize: 11, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 16 });
  });

  // ---------------------------------------------------------------------------
  // SLIDE 7: LIVE PROTOTYPE & EXPERIMENTAL RESULTS
  // ---------------------------------------------------------------------------
  const slide7 = pptx.addSlide();
  setupStandardSlide(slide7, '06', 'LIVE PROTOTYPE DEMO & RESULTS', 'Proof of concept, working screenshots, and empirical results.');

  slide7.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.8, w: 5.7, h: 4.6, fill: { color: '071126' }, line: { color: '203A70', width: 1 } });
  slide7.addText('[ PASTE SCREENSHOT 1: DASHBOARD / UI ]', { x: 1.0, y: 3.5, w: 5.3, h: 0.8, fontSize: 12, fontFace: 'Arial', color: TEXT_MUTED, align: 'center' });

  slide7.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.8, w: 5.7, h: 2.8, fill: { color: '071126' }, line: { color: '203A70', width: 1 } });
  slide7.addText('[ PASTE SCREENSHOT 2: OUTPUT / ACTUATOR ]', { x: 7.0, y: 2.8, w: 5.3, h: 0.8, fontSize: 12, fontFace: 'Arial', color: TEXT_MUTED, align: 'center' });

  slide7.addShape(pptx.ShapeType.rect, { x: 6.8, y: 4.8, w: 5.7, h: 1.6, fill: { color: CARD_NAVY }, line: { color: CYAN_ACCENT, width: 1 } });
  slide7.addText('PROJECT DEMO ACCESS & REPOSITORY LINKS', { x: 7.0, y: 4.95, w: 5.3, h: 0.3, fontSize: 10, fontFace: 'Arial', color: CYAN_ACCENT, bold: true });
  slide7.addText(
    '• Live Hosted Application: [https://your-app-url.com]\n• GitHub Repository: [https://github.com/your-team/ideation2026]\n• Demo Video (YouTube / Loom): [https://youtu.be/...]',
    { x: 7.0, y: 5.3, w: 5.3, h: 0.9, fontSize: 10, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 14 }
  );

  // ---------------------------------------------------------------------------
  // SLIDE 8: FEASIBILITY & IMPACT
  // ---------------------------------------------------------------------------
  const slide8 = pptx.addSlide();
  setupStandardSlide(slide8, '07', 'FEASIBILITY, VIABILITY & IMPACT', 'Cost feasibility, market viability, and measurable impact.');

  slide8.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.8, w: 3.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide8.addText('TECHNICAL FEASIBILITY', { x: 1.0, y: 2.0, w: 3.3, h: 0.4, fontSize: 12, fontFace: 'Arial', color: CYAN_ACCENT, bold: true });
  slide8.addText(
    '• Can this run reliably in production?\n\n• Hardware readiness and edge compute constraints.\n\n• Scalability to handle 10,000+ concurrent requests.\n\n• Security, privacy, and compliance safeguards.',
    { x: 1.0, y: 2.5, w: 3.3, h: 3.6, fontSize: 11, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 16 }
  );

  slide8.addShape(pptx.ShapeType.rect, { x: 4.8, y: 1.8, w: 3.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide8.addText('COST & BUSINESS MODEL', { x: 5.0, y: 2.0, w: 3.3, h: 0.4, fontSize: 12, fontFace: 'Arial', color: ORANGE_ACCENT, bold: true });
  slide8.addText(
    '• Unit economic breakdown.\n\n• Hardware cost per device (e.g. ₹1,200/unit).\n\n• Cloud hosting costs at scale (e.g. ₹0.02 per user session).\n\n• Revenue model (B2B SaaS / Hardware sales / Freemium).',
    { x: 5.0, y: 2.5, w: 3.3, h: 3.6, fontSize: 11, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 16 }
  );

  slide8.addShape(pptx.ShapeType.rect, { x: 8.8, y: 1.8, w: 3.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
  slide8.addText('SOCIAL / ECONOMIC IMPACT', { x: 9.0, y: 2.0, w: 3.3, h: 0.4, fontSize: 12, fontFace: 'Arial', color: '10B981', bold: true });
  slide8.addText(
    '• Quantified impact on beneficiaries.\n\n• Time savings or carbon offset.\n\n• Alignment with UN Sustainable Development Goals (SDGs).\n\n• Value created for Karnataka and nation.',
    { x: 9.0, y: 2.5, w: 3.3, h: 3.6, fontSize: 11, fontFace: 'Arial', color: TEXT_WHITE, lineSpacing: 16 }
  );

  // ---------------------------------------------------------------------------
  // SLIDE 9: FUTURE ROADMAP
  // ---------------------------------------------------------------------------
  const slide9 = pptx.addSlide();
  setupStandardSlide(slide9, '08', 'FUTURE ROADMAP & NEXT MILESTONES', 'Strategic development plan post-hackathon.');

  const milestones = [
    { phase: 'PHASE 1 (WEEKS 1-4)', title: 'Hardening & Edge Cases', items: '• Fix feedback received from hackathon jury\n• Comprehensive unit & load testing\n• Mobile responsive performance tuning' },
    { phase: 'PHASE 2 (MONTHS 2-3)', title: 'Beta Pilot Deployment', items: '• Pilot with 50 real-world users / organizations\n• User experience surveys and metric analysis\n• Patent application filing or paper submission' },
    { phase: 'PHASE 3 (MONTHS 4-6)', title: 'Production & Incubation', items: '• Startup incubation with college E-Cell\n• Apply for government / university innovation grants\n• Official public release and API ecosystem' },
  ];

  milestones.forEach((m, idx) => {
    const x = 0.8 + idx * 4.0;
    slide9.addShape(pptx.ShapeType.rect, { x, y: 1.8, w: 3.7, h: 4.6, fill: { color: CARD_NAVY }, line: { color: '1A2D5A', width: 1 } });
    slide9.addText(m.phase, { x: x + 0.2, y: 2.0, w: 3.3, h: 0.35, fontSize: 10, fontFace: 'Arial', color: CYAN_ACCENT, bold: true });
    slide9.addText(m.title, { x: x + 0.2, y: 2.4, w: 3.3, h: 0.4, fontSize: 13, fontFace: 'Arial', color: TEXT_WHITE, bold: true });
    slide9.addText(m.items, { x: x + 0.2, y: 2.9, w: 3.3, h: 3.2, fontSize: 11, fontFace: 'Arial', color: TEXT_MUTED, lineSpacing: 18 });
  });

  // ---------------------------------------------------------------------------
  // SLIDE 10: CONCLUSION & Q&A
  // ---------------------------------------------------------------------------
  const slide10 = pptx.addSlide();
  slide10.background = { color: BG_NAVY };

  slide10.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 0.8,
    w: 11.7,
    h: 5.7,
    fill: { color: CARD_NAVY },
    line: { color: '1A2D5A', width: 2 },
  });

  slide10.addText('THANK YOU', {
    x: 1.0,
    y: 1.4,
    w: 11.3,
    h: 0.8,
    fontSize: 40,
    fontFace: 'Arial',
    color: TEXT_WHITE,
    bold: true,
    align: 'center',
  });

  slide10.addText('Ready for Jury Questions & Live Interaction', {
    x: 1.0,
    y: 2.3,
    w: 11.3,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: CYAN_ACCENT,
    align: 'center',
    bold: true,
  });

  slide10.addText(
    `Team: ${teamName} (${teamId})\nDomain Track: ${trackName}\nInstitution: ${collegeName}\n\nProject Repository: [GitHub Repo Link]\nContact: [Leader Email] · [Leader Phone]`,
    {
      x: 2.0,
      y: 3.0,
      w: 9.3,
      h: 2.0,
      fontSize: 13,
      fontFace: 'Arial',
      color: TEXT_MUTED,
      align: 'center',
      lineSpacing: 20,
    }
  );

  slide10.addText('IDEATION 2026 · Anveshan Club · Dept. of CSE & ISE, BIET Davangere', {
    x: 1.0,
    y: 5.6,
    w: 11.3,
    h: 0.4,
    fontSize: 10,
    fontFace: 'Arial',
    color: '6A82A8',
    align: 'center',
  });

  // Trigger browser file download
  const safeFileName = `IDEATION_2026_Pitch_Deck_${teamName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Template.pptx`;
  await pptx.writeFile({ fileName: safeFileName });
}
