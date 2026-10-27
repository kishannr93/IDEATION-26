import pptxgen from 'pptxgenjs';
import {
  CIRCUIT_BG_BASE64,
  BEA_LOGO_BASE64,
  ANVESHAN_LOGO_BASE64,
  IDEATION_BULB_BASE64,
} from './pptAssets';

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
    subtitle: 'Official Header, Team, Leader, Problem Statement & Track',
    guidelines: 'Display official Bapuji Educational Association & BIET header, IDEATION title, Team Name, Team Leader, Problem Statement, and Track Category.',
    tips: [
      'Keep official BIET Davangere and Anveshan Club branding intact',
      'Fill in your designated Team Name and Team Leader name',
      'State your chosen Problem Statement and Track Category clearly',
    ],
    mandatoryItems: ['BIET Header', 'IDEATION Branding', 'Team Name', 'Team Leader', 'Problem Statement', 'Category'],
  },
  {
    slideNumber: 2,
    title: 'PROBLEM STATEMENT',
    subtitle: 'What is the problem? Objectives & Real-World Impact',
    guidelines: 'Explain the core pain point or challenge, the explicit objectives/goals of your project, and the real-world impact.',
    tips: [
      'What is the problem? Challenge of problem statement',
      'Objectives - specific goal of your project',
      'Real world impact - quantified social, economic, or technological benefit',
    ],
    mandatoryItems: ['Challenge Description', 'Project Objectives', 'Real-World Impact'],
  },
  {
    slideNumber: 3,
    title: 'PROPOSED SOLUTION',
    subtitle: 'How It Works, Innovation & "Idea in One Picture"',
    guidelines: 'Demonstrate how your solution works, what is new or different, key innovation features, and an "Idea in one picture" concept diagram.',
    tips: [
      'Explain how your system functions end-to-end',
      'Highlight what makes your solution novel compared to existing methods',
      'Embed a clear concept image or block diagram illustrating the core idea',
    ],
    mandatoryItems: ['How it works', 'What is new / different', 'Key Features', 'Concept Diagram / Picture'],
  },
  {
    slideNumber: 4,
    title: 'TECHNICAL APPROACH AND PROTOTYPE',
    subtitle: 'Methodology, Live 5-Minute Demo Plan & Tech Stack',
    guidelines: 'Detail the development methodology, the 5-minute live demo plan for the jury, and hardware/software tech stack components.',
    tips: [
      'Methodology and technical architecture pipeline',
      'Demo plan: exactly what the judges will see working live during the 5-minute demo',
      'Tech stack / components (Hardware, IoT, Embedded Systems, AI models, APIs)',
    ],
    mandatoryItems: ['Methodology', '5-Minute Live Demo Plan', 'Hardware & Software Tech Stack'],
  },
  {
    slideNumber: 5,
    title: 'FEASIBILITY & RISKS',
    subtitle: 'Why Feasible, Beneficiaries, Scalability & Future Scope',
    guidelines: 'Justify technical and economic feasibility, identify target beneficiaries, outline horizontal/vertical scalability, and future scope.',
    tips: [
      'Why it is feasible technically and economically',
      'Who benefits and how (citizens, industry, farmers, healthcare)',
      'Scalability and future enhancement scope',
    ],
    mandatoryItems: ['Feasibility Justification', 'Beneficiary Impact', 'Scalability', 'Future Scope'],
  },
  {
    slideNumber: 6,
    title: 'DEMO PLAN & WHAT YOU ARE BUILDING',
    subtitle: '24-Hour Event Sprint Plan & Judge Deliverables',
    guidelines: 'Clarify what your team will build during the 24-hour sprint, what the judges will see running, and the milestone progression.',
    tips: [
      '24-hour demo plan built step-by-step during the hackathon',
      'What the judges will see at the final evaluation table',
      'Distinguish what is built within the event vs prior open-source modules',
    ],
    mandatoryItems: ['24-Hour Build Plan', 'Judge Deliverables', 'Sprint Execution Scope'],
  },
  {
    slideNumber: 7,
    title: 'CONCEPT ARCHITECTURE & WORKFLOW CANVAS',
    subtitle: 'System Block Diagram, Hardware Pinout or UI Mockup Canvas',
    guidelines: 'Dedicated high-resolution canvas for system flowcharts, circuit schematics, database schemas, or working screenshots.',
    tips: [
      'Use this canvas for extra block diagrams, schematics, or UI screenshots',
      'Keep your deck strictly within Slides 1 to 7',
    ],
    mandatoryItems: ['Architecture Diagram / Circuit Schematic / UI Flow'],
  },
  {
    slideNumber: 8,
    title: 'BEFORE YOU SUBMIT (delete this slide)',
    subtitle: 'Mandatory Submission Checklist & Naming Rules',
    guidelines: 'Adhere to official rules: Slides 1 to 7 only, no brackets left, diagrams on slides 3 and 4, declared AI tools, and correct file naming.',
    tips: [
      'Slides 1 to 7 only, no extra slides (delete slide 8 before exporting)',
      'Remove all bracketed guidance [ ] and guide lines',
      'Ensure a diagram or picture is on slides 3 and 4',
      'Declare all AI tools, libraries, and third-party sources',
      'Name file as: Teamleadername_TeamName.pdf or pptx',
      'Upload on the IDEATION portal before deadline',
    ],
    mandatoryItems: ['Delete Slide 8 Rule', '7 Slides Max Rule', 'Naming: Teamleadername_TeamName.pptx'],
  },
];

export interface CustomTeamData {
  teamName?: string;
  teamId?: string;
  id?: string;
  leaderName?: string;
  track?: string;
  college?: string;
  ideaTitle?: string;
  problemTitle?: string;
  problemSummary?: string;
  members?: { name: string; usn: string; isLeader?: boolean }[];
}

/**
 * Generates and downloads the official IDEATION 2026 PPT Presentation Template (.pptx)
 * matching the official 8-slide PDF template provided by BIET and Anveshan Club.
 */
export async function generatePptTemplate(customData?: CustomTeamData): Promise<void> {
  const pptx = new pptxgen();

  // Configure Presentation Settings
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Anveshan Club, BIET Davangere';
  pptx.company = 'Bapuji Institute of Engineering and Technology, Davangere';
  pptx.title = 'IDEATION 2026 Official PPT Template';
  pptx.subject = 'Official Hackathon Presentation Deck';

  // Master Palette from official template
  const CYAN_ACCENT = '35E0FF';
  const TEXT_WHITE = 'FFFFFF';
  const TEXT_MUTED = '9DB0D0';
  const CRIMSON_ACCENT = 'FF4FD8';

  const teamName = customData?.teamName || '[Enter Team Name]';
  const leaderName = customData?.leaderName || 
    customData?.members?.find((m) => m.isLeader)?.name || 
    customData?.members?.[0]?.name || 
    '[Enter Team Leader Name]';
  const trackName = customData?.track || '[Enter Category: Agri Tech / Smart City / Robotics / Health Tech / IoT / Open Innovation]';
  const problemTitle = customData?.problemTitle || customData?.ideaTitle || '[Enter Problem Statement / Project Title]';

  // ---------------------------------------------------------------------------
  // SLIDE 1: COVER SLIDE
  // ---------------------------------------------------------------------------
  const slide1 = pptx.addSlide();
  slide1.background = { data: CIRCUIT_BG_BASE64 };

  // Logos: BEA (top left), Anveshan (top right), Bulb Emblem (right side)
  try {
    slide1.addImage({ data: BEA_LOGO_BASE64, x: 0.6, y: 0.35, w: 1.3, h: 1.3 });
    slide1.addImage({ data: ANVESHAN_LOGO_BASE64, x: 11.4, y: 0.35, w: 1.3, h: 1.3 });
    slide1.addImage({ data: IDEATION_BULB_BASE64, x: 8.7, y: 2.1, w: 3.9, h: 4.5 });
  } catch (err) {
    console.warn('Could not embed slide 1 logos:', err);
  }

  // Header Title
  slide1.addText([
    { text: 'Bapuji Educational Association (Regd.)\n', options: { fontSize: 16, bold: true, color: TEXT_WHITE } },
    { text: 'Bapuji Institute of Engineering and Technology\n', options: { fontSize: 22, bold: true, color: TEXT_WHITE } },
    { text: '(An autonomous institute affiliated to VTU, Belagavi, Karnataka)', options: { fontSize: 12, italic: true, color: TEXT_MUTED } },
  ], {
    x: 2.1,
    y: 0.35,
    w: 9.1,
    h: 1.3,
    align: 'center',
    fontFace: 'Calibri',
  });

  // Main Event Name: IDEATION
  slide1.addText('IDEATION', {
    x: 1.0,
    y: 2.05,
    w: 7.5,
    h: 1.15,
    fontSize: 54,
    bold: true,
    color: CYAN_ACCENT,
    fontFace: 'Arial',
  });

  // Editable Metadata Fields
  slide1.addText([
    { text: 'Team Name:  ', options: { fontSize: 18, bold: true, color: TEXT_WHITE } },
    { text: `${teamName}\n\n`, options: { fontSize: 18, bold: false, color: CYAN_ACCENT } },
    { text: 'Team Leader:  ', options: { fontSize: 18, bold: true, color: TEXT_WHITE } },
    { text: `${leaderName}\n\n`, options: { fontSize: 18, bold: false, color: CYAN_ACCENT } },
    { text: 'Problem Statement:  ', options: { fontSize: 18, bold: true, color: TEXT_WHITE } },
    { text: `${problemTitle}\n\n`, options: { fontSize: 17, bold: false, color: CYAN_ACCENT } },
    { text: 'Problem Statement category:  ', options: { fontSize: 18, bold: true, color: TEXT_WHITE } },
    { text: `${trackName}`, options: { fontSize: 17, bold: false, color: CYAN_ACCENT } },
  ], {
    x: 1.0,
    y: 3.35,
    w: 7.6,
    h: 3.6,
    fontFace: 'Calibri',
  });

  // ---------------------------------------------------------------------------
  // Helper for Slides 2 through 6
  // ---------------------------------------------------------------------------
  const createStandardContentSlide = (
    title: string,
    bullets: string[],
    placeholderText?: string
  ) => {
    const slide = pptx.addSlide();
    slide.background = { data: CIRCUIT_BG_BASE64 };

    // Slide Title
    slide.addText(title, {
      x: 0.8,
      y: 0.75,
      w: 11.73,
      h: 0.9,
      fontSize: 32,
      bold: true,
      color: TEXT_WHITE,
      align: 'center',
      fontFace: 'Calibri',
    });

    // Content Prompts / Bullets matching official PDF
    const bulletItems = bullets.map((item) => ({
      text: item + '\n\n',
      options: {
        fontSize: 21,
        color: 'E2E8F0',
        bullet: true,
        lineSpacingMultiple: 1.25,
      },
    }));

    slide.addText(bulletItems, {
      x: 1.5,
      y: 1.9,
      w: 10.33,
      h: 3.2,
      fontFace: 'Calibri',
    });

    // Editable response container
    if (placeholderText) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.5,
        y: 4.8,
        w: 10.33,
        h: 1.9,
        line: { color: '35E0FF', width: 1, dashType: 'dash' },
        fill: { color: '071126', transparency: 30 },
      });

      slide.addText(placeholderText, {
        x: 1.7,
        y: 4.95,
        w: 9.93,
        h: 1.6,
        fontSize: 14,
        color: '9DB0D0',
        italic: true,
        fontFace: 'Calibri',
      });
    }

    return slide;
  };

  // ---------------------------------------------------------------------------
  // SLIDE 2: PROBLEM STATEMENT
  // ---------------------------------------------------------------------------
  createStandardContentSlide(
    'PROBLEM STATEMENT',
    [
      'What is the problem? challenge of problem statement',
      'Objectives - goal of your project.',
      'Real world impact of your project',
    ],
    '[Type here: Detail the specific customer or industry problem, measurable project goals, and expected real-world impact]'
  );

  // ---------------------------------------------------------------------------
  // SLIDE 3: PROPOSED SOLUTION
  // ---------------------------------------------------------------------------
  createStandardContentSlide(
    'PROPOSED SOLUTION',
    [
      'How it works :',
      'What is new or different?',
      'Innovation and key features',
      'Concept image or block diagram: "Idea in one picture"',
    ],
    '[Insert / Paste concept block diagram or architecture illustration here: "Idea in one picture"]'
  );

  // ---------------------------------------------------------------------------
  // SLIDE 4: TECHNICAL APPROACH AND PROTOTYPE
  // ---------------------------------------------------------------------------
  createStandardContentSlide(
    'TECHNICAL APPROACH AND PROTOTYPE',
    [
      'Methodology',
      'Demo plan: [What the judges will see working live in your 5-minute demo]',
      'Tech stack/Components (Hardware / Embedded System)',
    ],
    '[Describe development methodology, tech stack components, sensors/APIs, and 5-minute live demo rundown]'
  );

  // ---------------------------------------------------------------------------
  // SLIDE 5: FEASIBILITY & RISKS
  // ---------------------------------------------------------------------------
  createStandardContentSlide(
    'FEASIBILITY & RISKS',
    [
      'Why it is feasible',
      'Who benefits and how',
      'Scalability',
      'Future scope',
    ],
    '[Explain why the solution is technically & financially feasible, target users, market scalability, and future roadmap]'
  );

  // ---------------------------------------------------------------------------
  // SLIDE 6: DEMO PLAN & WHAT YOU ARE BUILDING
  // ---------------------------------------------------------------------------
  createStandardContentSlide(
    'DEMO PLAN & WHAT YOU ARE BUILDING',
    [
      '24-hour demo plan you build',
      'What the judges will see',
      'What you will build within the event',
    ],
    '[List the exact deliverables and working prototype features built during the 24-hour sprint]'
  );

  // ---------------------------------------------------------------------------
  // SLIDE 7: CONCEPT ARCHITECTURE & WORKFLOW CANVAS
  // ---------------------------------------------------------------------------
  const slide7 = pptx.addSlide();
  slide7.background = { data: CIRCUIT_BG_BASE64 };

  slide7.addShape(pptx.ShapeType.roundRect, {
    x: 1.2,
    y: 0.8,
    w: 10.93,
    h: 5.8,
    line: { color: CYAN_ACCENT, width: 1.5, dashType: 'dash' },
    fill: { color: '050B1A', transparency: 40 },
  });

  slide7.addText('SYSTEM ARCHITECTURE & WORKFLOW CANVAS', {
    x: 1.5,
    y: 1.2,
    w: 10.33,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: TEXT_WHITE,
    align: 'center',
    fontFace: 'Calibri',
  });

  slide7.addText(
    '[Paste high-resolution system flowcharts, circuit pinout diagrams, database ER diagrams, or UI mockups here]\n(Slide 7 is the final slide of your project submission deck)',
    {
      x: 1.5,
      y: 3.2,
      w: 10.33,
      h: 1.2,
      fontSize: 16,
      color: '78AAFF',
      align: 'center',
      italic: true,
      fontFace: 'Calibri',
    }
  );

  // ---------------------------------------------------------------------------
  // SLIDE 8: BEFORE YOU SUBMIT (delete this slide)
  // ---------------------------------------------------------------------------
  const slide8 = pptx.addSlide();
  slide8.background = { data: CIRCUIT_BG_BASE64 };

  slide8.addText('BEFORE YOU SUBMIT (delete this slide)', {
    x: 1.0,
    y: 0.9,
    w: 11.33,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: CRIMSON_ACCENT,
    align: 'center',
    fontFace: 'Calibri',
  });

  slide8.addText([
    { text: '• Slides 1 to 7 only, no extra slides\n\n', options: { fontSize: 21, color: 'FF8080' } },
    { text: '• No [brackets] or guide lines left\n\n', options: { fontSize: 21, color: 'FF8080' } },
    { text: '• A diagram or picture on slides 3 and 4\n\n', options: { fontSize: 21, color: 'FF8080' } },
    { text: '• AI tools, libraries and sources declared\n\n', options: { fontSize: 21, color: 'FF8080' } },
    { text: '• name the ppt or pdf as Teamleadername_TeamName.pdf or pptx\n\n', options: { fontSize: 21, color: 'FF8080' } },
    { text: '• Uploaded on the IDEATION website before the deadline\n', options: { fontSize: 21, color: 'FF8080' } },
  ], {
    x: 1.5,
    y: 2.0,
    w: 10.33,
    h: 4.5,
    fontFace: 'Calibri',
  });

  // ---------------------------------------------------------------------------
  // File Naming: Follow official rule on Slide 8: Teamleadername_TeamName.pptx
  // ---------------------------------------------------------------------------
  const cleanLeader = (leaderName !== '[Enter Team Leader Name]' ? leaderName : 'TeamLeader')
    .replace(/[^a-zA-Z0-9]/g, '');
  const cleanTeam = (teamName !== '[Enter Team Name]' ? teamName : 'IDEATION_Team')
    .replace(/[^a-zA-Z0-9]/g, '');

  const fileName = `${cleanLeader}_${cleanTeam}.pptx`;

  await pptx.writeFile({ fileName });
}
