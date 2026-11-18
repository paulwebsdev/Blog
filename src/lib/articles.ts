export type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type Article = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  readTime: string;
  imageUrl?: string;
  imageAlt?: string;
  seoTitle: string;
  seoDescription: string;
  sections: ArticleSection[];
};

export const articles: Article[] = [
  {
    slug: "practical-ai-toolkit",
    category: "Artificial Intelligence",
    title: "A practical guide to choosing AI tools for everyday work",
    excerpt: "A useful starting point for understanding what AI assistants can do, where they help, and how to choose tools responsibly.",
    author: "PaulNova Editorial",
    publishedAt: "2026-11-18",
    readTime: "6 min read",
    seoTitle: "How to Choose AI Tools for Everyday Work | PaulNova",
    seoDescription: "Learn how to evaluate AI tools for research, writing, planning and everyday work, including privacy and accuracy considerations.",
    sections: [
      { heading: "Start with the task, not the trend", paragraphs: ["AI tools are most useful when they solve a clearly defined problem. Before signing up for a new service, write down the task you want to make easier: summarising long documents, brainstorming ideas, organising research or preparing a first draft.", "A tool that is popular is not automatically the right tool for your workflow. Begin with the result you need, then compare products against that need."] },
      { heading: "Check the quality of the output", paragraphs: ["Try the same realistic task in more than one tool. Check whether the result is accurate, clear and easy to verify. For factual work, follow important claims back to trustworthy original sources rather than relying on an AI-generated answer alone.", "Treat AI output as a starting point that needs human judgement. This is especially important for financial, legal, medical or other high-impact decisions."] },
      { heading: "Understand privacy and pricing", paragraphs: ["Before sharing information, review the service's privacy settings and terms. Avoid entering passwords, private customer details or confidential business information unless you have confirmed that the tool is approved for that use.", "Check the free plan's limits, export options and renewal price. A simple tool that fits your needs may be more useful than a feature-heavy subscription you rarely use."] },
      { heading: "Build a small toolkit", paragraphs: ["You do not need dozens of AI subscriptions. Start with one general assistant and, if necessary, one specialist tool for a recurring task. Keep notes on what works, what needs checking and where a human review is essential.", "The best AI toolkit is the one that helps you do meaningful work more effectively while keeping you in control of the final result."] }
    ]
  },
  {
    slug: "digital-skills-changing-work",
    category: "Education & Careers",
    title: "Digital skills that can help you adapt to a changing world of work",
    excerpt: "A practical framework for building transferable digital skills, learning consistently and showing what you can do.",
    author: "PaulNova Editorial",
    publishedAt: "2026-11-18",
    readTime: "5 min read",
    seoTitle: "Digital Skills for a Changing World of Work | PaulNova",
    seoDescription: "Explore practical digital skills to develop, ways to practise them and how to demonstrate your abilities to employers and clients.",
    sections: [
      { heading: "Focus on transferable skills", paragraphs: ["Digital tools change quickly, but several underlying skills remain valuable: clear communication, research, problem-solving, data literacy, collaboration and the ability to learn new software.", "Choose a skill that connects to the kind of work you want to do. For example, someone interested in marketing might practise analytics and content tools, while an aspiring developer might focus on programming fundamentals and version control."] },
      { heading: "Learn by making something", paragraphs: ["Watching tutorials can help you understand a concept, but a small project gives you a way to practise it. Build a simple website, analyse a public dataset, create a sample campaign or document a process you have improved.", "Keep the project focused. A finished, clearly explained example is often more useful than a collection of unfinished courses."] },
      { heading: "Show evidence of your ability", paragraphs: ["Collect your best work in a portfolio and explain the problem, your approach and the result. Be honest about what you did yourself and which tools you used.", "Review job descriptions and client briefs to see which skills are repeatedly requested. Use that evidence to decide what to learn next, rather than chasing every new trend."] }
    ]
  },
  {
    slug: "start-a-digital-business-with-a-clear-plan",
    category: "Business & Money",
    title: "Starting a digital business begins with solving one real problem",
    excerpt: "A grounded way to test a business idea, understand who it serves and take a first step without overspending.",
    author: "PaulNova Editorial",
    publishedAt: "2026-11-18",
    readTime: "5 min read",
    seoTitle: "How to Start a Digital Business with a Clear Plan | PaulNova",
    seoDescription: "Learn how to identify a customer problem, validate a digital business idea, plan a simple offer and control early costs.",
    sections: [
      { heading: "Begin with a problem people recognise", paragraphs: ["A digital business does not have to begin with an app, a large website or a complicated business plan. It can begin with a recurring problem that a specific group of people wants solved.", "Describe the person you want to help, the difficulty they face and the outcome they would value. If you cannot explain those three things simply, keep researching before spending money."] },
      { heading: "Validate before you invest", paragraphs: ["Talk to potential customers and listen for evidence that the problem matters. Ask how they currently handle it, what frustrates them and whether they already pay for a solution.", "A small test can be more informative than building a full product. Offer a clearly defined service, publish a simple landing page or create a basic prototype and observe how people respond."] },
      { heading: "Keep the first offer focused", paragraphs: ["Make it easy for a customer to understand what they receive, how it helps and what it costs. Avoid adding features or services simply because competitors offer them.", "Track the time and money required to deliver the offer. Include payment fees, software, taxes and customer support when reviewing whether the price makes sense."] },
      { heading: "Build trust as you grow", paragraphs: ["Explain your terms clearly, protect customer information and deliver what you promise. Trust is an important business asset, especially when customers and providers may be working across borders.", "Use what you learn from early customers to improve the offer. Sustainable progress usually comes from solving a real problem consistently, not chasing every new online trend."] }
    ]
  },
  {
    slug: "smarter-everyday-digital-tools",
    category: "Technology",
    title: "How to choose everyday technology that genuinely saves time",
    excerpt: "A straightforward way to evaluate apps and software before adding another tool to your digital life.",
    author: "PaulNova Editorial",
    publishedAt: "2026-11-18",
    readTime: "4 min read",
    seoTitle: "How to Choose Useful Everyday Technology | PaulNova",
    seoDescription: "A simple checklist for choosing apps and software based on usefulness, ease of use, privacy, accessibility and total cost.",
    sections: [
      { heading: "Identify the friction", paragraphs: ["Notice the repeated tasks that interrupt your day: searching for files, tracking deadlines, switching between messages or repeating the same manual steps. A useful tool should reduce a real source of friction.", "If a task happens only once in a while, a new app may create more work than it saves. Start with the tools already available on your device."] },
      { heading: "Compare the whole experience", paragraphs: ["Look beyond a feature list. Consider whether the app works well on your phone, whether it is accessible, how it handles your data and whether you can export your information if you leave.", "Check the total price after any trial period. Free tools can be excellent, but understand their limits and whether essential features require a subscription."] },
      { heading: "Keep what earns its place", paragraphs: ["Try one tool at a time and decide after a week or two whether it has made the task easier. Remove tools that duplicate what you already use or add unnecessary notifications.", "A smaller, well-organised set of tools is often more useful than a crowded phone full of apps you rarely open."] }
    ]
  }
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
