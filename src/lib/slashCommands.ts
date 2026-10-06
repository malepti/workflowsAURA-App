export interface SlashCommand {
  command: string;
  name: string;
  description: string;
  icon: string;
  category: 'persona' | 'utility' | 'coding' | 'writing' | 'optimization';
  instruction: string;
}
export const ALL_SLASH_COMMANDS: SlashCommand[] = [

  {
    command: '/brief',
    name: 'Brief Mode',
    description: 'Shortest possible answer (Saves maximum tokens)',
    icon: 'Zap',
    category: 'optimization',
    instruction: 'System Instruction: Give the shortest, most concise and direct answer possible. Avoid intro/outro fluff to conserve output tokens.'
  },
  {
    command: '/eli5',
    name: 'Explain Like I\'m 5',
    description: 'Explain complex concepts simply',
    icon: 'Baby',
    category: 'utility',
    instruction: 'System Instruction: Explain this topic in extremely simple terms as if explaining to a 5-year-old using simple analogies.'
  },
  {
    command: '/expert',
    name: 'Expert Persona',
    description: 'Specialist-level rigorous answers',
    icon: 'GraduationCap',
    category: 'persona',
    instruction: 'System Instruction: Act as a world-class domain expert. Provide authoritative, technically accurate, and deep specialist insights.'
  },
  {
    command: '/code',
    name: 'Code Generator',
    description: 'Write production-ready code',
    icon: 'Code2',
    category: 'coding',
    instruction: 'System Instruction: Focus purely on clean, production-ready code with minimal explanation. Include code blocks with proper syntax highlighting.'
  },
  {
    command: '/debug',
    name: 'Code Debugger',
    description: 'Find and fix errors in code',
    icon: 'Bug',
    category: 'coding',
    instruction: 'System Instruction: Analyze the code for bugs, logic flaws, memory leaks, and performance bottlenecks. Provide fixed code and exact root cause.'
  },
  {
    command: '/explaincode',
    name: 'Explain Code',
    description: 'Line by line code breakdown',
    icon: 'FileCode',
    category: 'coding',
    instruction: 'System Instruction: Explain the provided code step by step, line by line, breaking down key functions and algorithms.'
  },
  {
    command: '/human',
    name: 'Human Writer',
    description: 'Natural human-like writing style',
    icon: 'User',
    category: 'writing',
    instruction: 'System Instruction: Write in a natural, warm, conversational human tone avoiding robotic AI clichés.'
  },
  {
    command: '/ceo',
    name: 'Founder / CEO Mindset',
    description: 'Strategic business & founder perspective',
    icon: 'TrendingUp',
    category: 'persona',
    instruction: 'System Instruction: Analyze this from a CEO/Founder perspective focusing on ROI, scalability, risk mitigation, and market advantage.'
  },
  {
    command: '/critic',
    name: 'Skeptical Critic',
    description: 'Find weaknesses and hidden flaws',
    icon: 'SearchCheck',
    category: 'utility',
    instruction: 'System Instruction: Act as a critical reviewer. Play devil\'s advocate and highlight potential risks, weaknesses, and edge-case failures.'
  },
  {
    command: '/teacher',
    name: 'Patient Teacher',
    description: 'Clear educational breakdown',
    icon: 'BookOpen',
    category: 'persona',
    instruction: 'System Instruction: Teach this step-by-step with clear examples, key takeaways, and practice comprehension questions.'
  },
  {
    command: '/summarize',
    name: 'Summarize Content',
    description: 'Compact summary of long text',
    icon: 'FileText',
    category: 'utility',
    instruction: 'System Instruction: Summarize the core message into a concise executive summary with top 3 key bullet points.'
  },
  {
    command: '/promptengineer',
    name: 'Prompt Optimizer',
    description: 'Improve & expand any prompt',
    icon: 'Wrench',
    category: 'optimization',
    instruction: 'System Instruction: Reframe and optimize the user\'s prompt to elicit the highest quality response from an LLM.'
  },
  {
    command: '/seo',
    name: 'SEO Content Generator',
    description: 'Search engine optimized content',
    icon: 'Search',
    category: 'writing',
    instruction: 'System Instruction: Create SEO-optimized content with strategic keyword density, catchy subheadings, and meta title/description.'
  },
  {
    command: '/viral',
    name: 'Viral Hooks & Ideas',
    description: 'High-engagement social content',
    icon: 'Flame',
    category: 'writing',
    instruction: 'System Instruction: Generate high-converting, attention-grabbing viral hooks and content structures tailored for high engagement.'
  },
  {
    command: '/strategy',
    name: 'Strategic Roadmap',
    description: 'Long-term planning & execution',
    icon: 'Target',
    category: 'utility',
    instruction: 'System Instruction: Formulate a structured step-by-step strategic execution plan with milestones, timeline, and KPIs.'
  },
  {
    command: '/copywriter',
    name: 'Persuasive Copywriter',
    description: 'High-converting sales copy',
    icon: 'PenTool',
    category: 'writing',
    instruction: 'System Instruction: Use persuasive copywriting frameworks (AIDA/PAS) to write compelling marketing copy that drives action.'
  },
  {
    command: '/research',
    name: 'Deep Research Mode',
    description: 'In-depth analytical investigation',
    icon: 'Compass',
    category: 'utility',
    instruction: 'System Instruction: Provide a comprehensive research breakdown with background context, evidence, pros/cons, and references.'
  },
  {
    command: '/brainstorm',
    name: 'Creative Brainstorm',
    description: 'Out-of-the-box creative ideas',
    icon: 'Lightbulb',
    category: 'utility',
    instruction: 'System Instruction: Generate 10 innovative, creative, and out-of-the-box ideas grouped by feasibility.'
  },
  {
    command: '/translate',
    name: 'Universal Translator',
    description: 'Translate to any language',
    icon: 'Languages',
    category: 'utility',
    instruction: 'System Instruction: Translate the text accurately into the target language preserving context, tone, and cultural nuances.'
  },
  {
    command: '/improve',
    name: 'Refine & Improve',
    description: 'Enhance grammar, flow & tone',
    icon: 'Sparkles',
    category: 'writing',
    instruction: 'System Instruction: Rewrite the text to improve grammatical correctness, flow, punchiness, and professional polish.'
  },
  {
    command: '/simplify',
    name: 'Simplify Text',
    description: 'Make complex jargon easy to read',
    icon: 'Minimize2',
    category: 'utility',
    instruction: 'System Instruction: Remove complex jargon and rewrite the text using clear, accessible everyday language.'
  },
  {
    command: '/expand',
    name: 'Elaborate & Expand',
    description: 'Add depth, examples & details',
    icon: 'Maximize2',
    category: 'writing',
    instruction: 'System Instruction: Elaborate on the core concepts by adding practical examples, detailed explanations, and supporting arguments.'
  },
  {
    command: '/compare',
    name: 'Compare Pros & Cons',
    description: 'Side-by-side trade-off analysis',
    icon: 'Columns',
    category: 'utility',
    instruction: 'System Instruction: Conduct a structured comparison highlighting key differences, advantages, disadvantages, and recommendation.'
  },
  {
    command: '/list',
    name: 'Bullet Point List',
    description: 'Convert thoughts into structured list',
    icon: 'List',
    category: 'utility',
    instruction: 'System Instruction: Format the information into a clean, well-organized bulleted list.'
  },
  {
    command: '/table',
    name: 'Markdown Table',
    description: 'Convert data into a structured table',
    icon: 'Table',
    category: 'utility',
    instruction: 'System Instruction: Present the data as a clean Markdown table with clear column headers.'
  },
  {
    command: '/outline',
    name: 'Structured Outline',
    description: 'Create document/article outline',
    icon: 'ListOrdered',
    category: 'utility',
    instruction: 'System Instruction: Create a comprehensive hierarchical outline with sections, H2/H3 headings, and key sub-points.'
  },
  {
    command: '/email',
    name: 'Professional Email',
    description: 'Write effective workplace emails',
    icon: 'Mail',
    category: 'writing',
    instruction: 'System Instruction: Write a professional workplace email including clear subject line, polite opening, concise body, and call-to-action.'
  },
  {
    command: '/coverletter',
    name: 'Job Cover Letter',
    description: 'Tailored career cover letter',
    icon: 'FileCheck',
    category: 'writing',
    instruction: 'System Instruction: Write a compelling cover letter highlighting relevant achievements, skills, and enthusiasm for the position.'
  },
  {
    command: '/interview',
    name: 'Interview Prep',
    description: 'Mock interview Q&A preparation',
    icon: 'HelpCircle',
    category: 'utility',
    instruction: 'System Instruction: Act as an interviewer. Ask relevant questions one by one and provide feedback on model answers.'
  },
  {
    command: '/motivate',
    name: 'Inspiration & Drive',
    description: 'Motivational boost & mindset',
    icon: 'HeartHandshake',
    category: 'persona',
    instruction: 'System Instruction: Deliver an inspiring, high-energy motivational message that builds momentum and clarity.'
  }
];
