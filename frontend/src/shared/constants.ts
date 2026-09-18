export interface TemplateItem {
  id: string;
  title: string;
  category: 'Story' | 'Framework' | 'Opinion' | 'Launch' | 'Custom' | 'Marketing' | 'HR' | 'Finance' | 'Startup' | 'Personal';
  content: string;
}

export interface HashtagSet {
  id: string;
  name: string;
  tags: string[];    // e.g. ["#AI", "#Tech", "#Innovation"]
}

export const maxTemplates = 20;

export const DEFAULT_HASHTAG_SETS: HashtagSet[] = [
  {
    id: 'hs-tech-ai',
    name: 'Tech & AI',
    tags: ['#AI', '#Tech', '#Innovation', '#MachineLearning', '#FutureOfWork'],
  },
  {
    id: 'hs-career',
    name: 'Career Growth',
    tags: ['#CareerAdvice', '#PersonalBranding', '#Leadership', '#ProfessionalGrowth', '#LinkedIn'],
  },
  {
    id: 'hs-startup',
    name: 'Startup & Entrepreneurship',
    tags: ['#Startup', '#Entrepreneurship', '#Founder', '#BuildingInPublic', '#ProductLaunch'],
  },
];

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
  },
  // === NEW TEMPLATES ===
  {
    id: 'failed-startup-lessons',
    title: 'Lessons from a Failed Startup',
    category: 'Startup',
    content: `I shut down my startup after 18 months.

Here's what nobody tells you about failure:

❌ The product wasn't the problem. I was.
❌ I optimized for vanity metrics, not retention.
❌ I hired for skills when I needed culture.

What I'd do differently:

✅ Talk to 50 customers before writing a single line of code
✅ Obsess over churn, not signups
✅ Find a co-founder who challenges you, not agrees with you

Failure is tuition. I paid mine early.

What's the most expensive lesson you've learned as a founder?`
  },
  {
    id: 'hiring-dream-team',
    title: 'How I Hired My Dream Team',
    category: 'HR',
    content: `I've hired 40+ people. Here's the only 3 questions that actually matter:

1️⃣ "Tell me about a time you disagreed with your manager."
   → Tells me if they're a yes-person or a thinker.

2️⃣ "What's the most embarrassing mistake you've made at work?"
   → Shows self-awareness and growth mindset.

3️⃣ "What would you do in your first 30 days?"
   → Reveals initiative vs. waiting for instructions.

Skills can be taught. Judgment cannot.

What interview question has surprised you the most?`
  },
  {
    id: '3-numbers-changed-career',
    title: '3 Numbers That Changed My Career',
    category: 'Personal',
    content: `3 numbers that completely changed how I think about my career:

📊 $0 — The salary I accepted to get my first big break
📊 18 — Months I spent learning before I earned anything
📊 1 — The mentor who believed in me when I didn't

Most people optimize for salary too early.

The real ROI is learning fast, building trust, and being in the room when decisions get made.

What's a number that shaped your career path?`
  },
  {
    id: 'content-marketing-framework',
    title: 'Content That Actually Converts',
    category: 'Marketing',
    content: `Most marketing content fails for one reason:

It talks at people instead of with them.

The framework that changed our conversion rate by 40%:

🔹 HOOK — Start with the painful truth they recognize
🔹 INSIGHT — Give them a new lens to see the problem
🔹 PROOF — Show real results, not stock photos
🔹 CTA — Ask one specific question, not "buy now"

Your audience doesn't need more information.
They need to feel understood.

Save this for your next content calendar. 📌`
  },
  {
    id: 'revenue-milestone',
    title: 'First Revenue Milestone',
    category: 'Finance',
    content: `We just hit our first $100K in revenue.

But the number I'm proudest of?

Zero dollars in VC funding.

Here's how we bootstrapped it:

💡 Started with a single consulting client (not a product)
💡 Used revenue to hire, not investor money
💡 Said no to features that didn't generate profit
💡 Stayed laser-focused on one customer segment

Profitability > Growth at all costs.

Every dollar we earned, we earned the hard way.

To every bootstrapped founder grinding right now — keep going. 🙌`
  },
  {
    id: 'layoff-comeback',
    title: 'Laid Off → Comeback Story',
    category: 'Story',
    content: `8 months ago I was laid off.

Today I accepted an offer for 40% more than my previous salary.

Here's what I did differently:

Month 1: Processed the rejection (important step everyone skips)
Month 2: Rebuilt my portfolio with 3 high-impact projects
Month 3: Started sharing my work publicly on LinkedIn
Month 4-7: Networked with intention, not desperation
Month 8: Chose the right offer, not the fastest one

The job market is brutal. But it's not hopeless.

Your best next chapter might start with the worst ending.

What's your comeback story?`
  },
  {
    id: 'product-launch-announcement',
    title: 'Product Launch Announcement',
    category: 'Launch',
    content: `Excited to share what my team has been building for the last 6 months. 🚀

[Product Name] is now live.

The problem we're solving:
[Describe the painful problem in 1-2 sentences]

What makes us different:
✨ [Differentiator 1]
✨ [Differentiator 2]
✨ [Differentiator 3]

We're currently in early access — and I'd love your honest feedback.

Link in comments 👇

(Tag someone who needs this!)`
  },
  {
    id: 'ai-productivity-tips',
    title: 'AI Tools That Save Hours',
    category: 'Marketing',
    content: `I saved 15 hours last week using AI tools.

Here are the 5 that actually moved the needle:

🤖 ChatGPT — First draft of every document
🤖 Perplexity — Research without tab hoarding
🤖 Notion AI — Meeting notes → action items in 10 seconds
🤖 Midjourney — Presentation visuals in minutes
🤖 Otter.ai — Transcription that actually understands context

The trick? Stop trying to replace your thinking.
Use AI to eliminate the parts you hate doing anyway.

What AI tool has changed your workflow the most?`
  },
  {
    id: 'leadership-mistake',
    title: 'Leadership Mistake I Learned From',
    category: 'HR',
    content: `The biggest leadership mistake I made:

I promoted my best individual contributor to manager.

6 months later, I lost both the manager AND the contributor.

Here's what I should have done:

✅ Created a senior IC track with equal pay and prestige
✅ Asked them directly what THEY wanted (I assumed)
✅ Invested in management training before promoting
✅ Set a 90-day trial with defined success metrics

Great individual contributors are rare.
Great managers are rarer.

Don't confuse one skill for the other.

Have you ever been promoted into a role you didn't ask for?`
  }
];

// Fallback plain string templates for backwards compatibility
export const createSampleTemplates = DEFAULT_TEMPLATES.map((t) => t.content);
