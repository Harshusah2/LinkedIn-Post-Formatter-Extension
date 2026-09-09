export interface TemplateItem {
  id: string;
  title: string;
  category: 'Story' | 'Framework' | 'Opinion' | 'Launch' | 'Custom';
  content: string;
}

export const maxTemplates = 12;

export const DEFAULT_TEMPLATES: TemplateItem[] = [
  {
    id: 'hook-insights-cta',
    title: 'Viral Hook + 3 Lessons',
    category: 'Framework',
    content: `90% of professionals get this completely wrong:

Here are 3 counterintuitive lessons I learned after 5 years in tech:

1️⃣ Focus on systems over raw motivation
2️⃣ Consistency beats intensity every single day
3️⃣ Your network is your safety net

Which one resonates most with where you are today?

👇 Drop your thoughts below.`
  },
  {
    id: 'before-after-case-study',
    title: 'Before vs After Story',
    category: 'Story',
    content: `12 months ago:
❌ Zero inbound leads
❌ Confused messaging
❌ Burnout and frustration

Today:
✅ Predictable weekly pipeline
✅ Crystal clear positioning
✅ Building with complete peace of mind

What changed?
We stopped guessing and started listening to customers.

Never underestimate the power of radical focus.`
  },
  {
    id: 'contrarian-opinion',
    title: 'Unpopular Industry Take',
    category: 'Opinion',
    content: `Unpopular opinion:

Working 70 hours a week isn't a badge of honor. It's usually a sign of broken priorities.

Real high-performance looks like:
• Ruthless prioritization
• 8 hours of deep, uninterrupted sleep
• Protecting focus over shallow busywork

Agree or disagree?`
  },
  {
    id: 'step-by-step-guide',
    title: 'Step-by-Step How-To',
    category: 'Framework',
    content: `How to build a personal brand in 20 minutes a day:

Step 1: Document your daily learnings
Step 2: Share 1 actionable insight per post
Step 3: Spend 10 minutes engaging on other creators' work

Save this post so you can reference it when planning your week 📌`
  },
  {
    id: 'career-milestone',
    title: 'Milestone & Gratitude',
    category: 'Launch',
    content: `Big personal milestone:

Thrilled to announce that our team just crossed our next major chapter! 🚀

Huge thank you to every mentor, colleague, and client who believed in the vision from day one.

Excited for what's next.`
  }
];

// Fallback plain string templates for backwards compatibility
export const createSampleTemplates = DEFAULT_TEMPLATES.map((t) => t.content);
