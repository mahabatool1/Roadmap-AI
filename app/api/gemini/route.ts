import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Gemini AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Dynamic fallback generators ("Copilot") when Gemini is unavailable or errors
function generateFallbackRoadmap(topic: string) {
  const normalized = topic.toLowerCase();
  let title = `${topic} Developer Pathway`;
  let description = `A comprehensive, step-by-step curriculum to master ${topic}, starting from the absolute fundamentals up to professional production deployment.`;
  let durationHrs = 15;
  let milestones = [];

  if (normalized.includes('react') || normalized.includes('next') || normalized.includes('vue') || normalized.includes('angular') || normalized.includes('front')) {
    title = `${topic} Masterclass Pathway`;
    description = `An in-depth, hands-on learning roadmap to master frontend development using ${topic}. Build responsive, dynamic user interfaces from scratch.`;
    durationHrs = 18;
    milestones = [
      {
        id: 'm1',
        title: 'Foundations & Environment Setup',
        description: 'Set up your developer workspace, install package managers, and run your first starter template.',
        estimatedMin: 90,
        keyConcepts: ['Workspace Setup', 'CLI Commands', 'File Structure'],
        resources: ['https://developer.mozilla.org', 'https://react.dev']
      },
      {
        id: 'm2',
        title: 'Core Concepts & Component Architecture',
        description: 'Understand how UI pieces fit together, master state management, and pass properties (props) effectively.',
        estimatedMin: 120,
        keyConcepts: ['Functional Components', 'State & Props', 'Event Handling'],
        resources: ['https://react.dev/learn', 'https://web.dev']
      },
      {
        id: 'm3',
        title: 'Data Fetching & Side Effects',
        description: 'Learn to synchronize your app with external REST/GraphQL APIs and handle user inputs cleanly.',
        estimatedMin: 150,
        keyConcepts: ['API Fetching', 'Lifecycle Hooks', 'Form Validation'],
        resources: ['https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API', 'https://react.dev/reference/react/useEffect']
      },
      {
        id: 'm4',
        title: 'Routing & Advanced State Management',
        description: 'Navigate between multiple pages seamlessly and manage complex global application state.',
        estimatedMin: 180,
        keyConcepts: ['Client-side Routing', 'Global Store / Context', 'Middleware'],
        resources: ['https://reactrouter.com', 'https://redux.js.org']
      },
      {
        id: 'm5',
        title: 'Performance Tuning & Deployment',
        description: 'Optimize load times, bundle size, and deploy your production build to modern hosting platforms.',
        estimatedMin: 120,
        keyConcepts: ['Code Splitting', 'Production Builds', 'Cloud Hosting'],
        resources: ['https://vercel.com', 'https://netlify.com']
      }
    ];
  } else if (normalized.includes('python') || normalized.includes('javascript') || normalized.includes('typescript') || normalized.includes('ruby') || normalized.includes('java') || normalized.includes('c++') || normalized.includes('rust') || normalized.includes('go') || normalized.includes('programming') || normalized.includes('coding') || normalized.includes('software')) {
    title = `${topic} Programming Fundamentals`;
    description = `A core-focused learning route to build software engineering mastery in ${topic}. Learn logic, syntax, data structures, and algorithmic implementation.`;
    durationHrs = 20;
    milestones = [
      {
        id: 'm1',
        title: 'Syntax & Primitive Types',
        description: 'Install compilers/runtimes and write programs demonstrating loops, conditional logic, and variables.',
        estimatedMin: 120,
        keyConcepts: ['Primitive Data Types', 'Loops & Conditionals', 'Functions & Scope'],
        resources: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript', 'https://docs.python.org']
      },
      {
        id: 'm2',
        title: 'Complex Data Structures',
        description: 'Organize data using arrays, lists, maps, sets, and dictionaries for efficient retrieval.',
        estimatedMin: 150,
        keyConcepts: ['Array Manipulation', 'Key-Value Dictionaries', 'Memory Storage'],
        resources: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections', 'https://docs.python.org/3/tutorial/datastructures.html']
      },
      {
        id: 'm3',
        title: 'Object-Oriented Programming (OOP) & Modules',
        description: 'Learn abstraction, inheritance, polymorphism, and modularizing code into reusable library packages.',
        estimatedMin: 180,
        keyConcepts: ['Classes & Inheritance', 'Encapsulation', 'Module Imports'],
        resources: ['https://wikipedia.org/wiki/Object-oriented_programming', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction_to_Object-Oriented_JavaScript']
      },
      {
        id: 'm4',
        title: 'Asynchronous Programming & IO',
        description: 'Handle non-blocking operations, read/write files locally, and connect with network resources.',
        estimatedMin: 150,
        keyConcepts: ['Promises & Async/Await', 'File System Operations', 'Exception Handling'],
        resources: ['https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function', 'https://nodejs.org/api/fs.html']
      },
      {
        id: 'm5',
        title: 'Testing & Capstone Project',
        description: 'Write unit tests to verify program validity, optimize performance bottlenecks, and build a self-contained CLI tool.',
        estimatedMin: 180,
        keyConcepts: ['Unit Testing', 'Algorithmic Efficiency', 'Deployment / Distribution'],
        resources: ['https://jestjs.io', 'https://pytest.org']
      }
    ];
  } else if (normalized.includes('database') || normalized.includes('sql') || normalized.includes('postgresql') || normalized.includes('mysql') || normalized.includes('mongodb') || normalized.includes('prisma') || normalized.includes('drizzle') || normalized.includes('backend')) {
    title = `${topic} Database Engineering`;
    description = `Master database management, query languages, schema optimization, and secure persistent integrations with ${topic}.`;
    durationHrs = 16;
    milestones = [
      {
        id: 'm1',
        title: 'Intro to Storage & Schema Design',
        description: 'Explore relation vs non-relational structures. Set up your local database server and client GUI.',
        estimatedMin: 90,
        keyConcepts: ['Relational vs Document Model', 'Table Structures & Schemas', 'Foreign/Primary Keys'],
        resources: ['https://wikipedia.org/wiki/Database', 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Website_security']
      },
      {
        id: 'm2',
        title: 'SQL & Query Fundamentals (CRUD)',
        description: 'Master writing queries to select, insert, update, and delete database records.',
        estimatedMin: 120,
        keyConcepts: ['SELECT Statements', 'WHERE Filtering', 'INSERT / UPDATE / DELETE'],
        resources: ['https://www.w3schools.com/sql/', 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose']
      },
      {
        id: 'm3',
        title: 'Relationships, Joins & Aggregations',
        description: 'Connect multiple tables using Joins and compute summary statistics like counts, averages, and group groupings.',
        estimatedMin: 150,
        keyConcepts: ['INNER/LEFT Joins', 'GROUP BY & Aggregates', 'Subqueries'],
        resources: ['https://www.w3schools.com/sql/sql_join.asp', 'https://developer.mozilla.org/en-US/docs/Glossary/SQL']
      },
      {
        id: 'm4',
        title: 'Performance & Indexing',
        description: 'Speed up slow query times with indexes, analyze execution pathways, and implement transactions.',
        estimatedMin: 120,
        keyConcepts: ['Database Indexing', 'EXPLAIN ANALYZE', 'ACID Transactions'],
        resources: ['https://use-the-index-luke.com/', 'https://wikipedia.org/wiki/ACID']
      },
      {
        id: 'm5',
        title: 'ORM Integration & Deployment',
        description: 'Connect your database safely to backends via Prisma or Drizzle and deploy a fully managed cloud database.',
        estimatedMin: 150,
        keyConcepts: ['ORMs & Migrations', 'Connection Pooling', 'Cloud SQL / Supabase Setup'],
        resources: ['https://prisma.io', 'https://drizzle.team']
      }
    ];
  } else {
    // General technical skill template
    title = `${topic} Pathway Guide`;
    description = `An advanced curriculum covering the essential technical stack and real-world mastery of ${topic}.`;
    durationHrs = 15;
    milestones = [
      {
        id: 'm1',
        title: `${topic} Basics & Core Terminology`,
        description: 'Get started with key concepts, local environmental setups, and baseline architectural theory.',
        estimatedMin: 90,
        keyConcepts: ['Core Terminology', 'Local Workspaces', 'Hello World Projects'],
        resources: ['https://wikipedia.org', 'https://developer.mozilla.org']
      },
      {
        id: 'm2',
        title: 'Primary Syntax & Basic Operations',
        description: 'Understand core logic patterns, manipulation tools, and foundational patterns of this technology.',
        estimatedMin: 120,
        keyConcepts: ['Operations & Syntax', 'State Management', 'Basic Methods'],
        resources: ['https://developer.mozilla.org', 'https://google.com']
      },
      {
        id: 'm3',
        title: 'Intermediate Workflows & Tooling',
        description: 'Coordinate data layers, learn system workflows, and write helper services to organize logic.',
        estimatedMin: 150,
        keyConcepts: ['Data Manipulation', 'Module Patterns', 'Error Handlers'],
        resources: ['https://developer.mozilla.org', 'https://github.com']
      },
      {
        id: 'm4',
        title: 'Best Practices & Optimization',
        description: 'Refactor code, optimize resource allocations, and follow expert architectural layouts.',
        estimatedMin: 120,
        keyConcepts: ['Performance Limits', 'Efficiency Analysis', 'Code Testing'],
        resources: ['https://developer.mozilla.org', 'https://stackoverflow.com']
      },
      {
        id: 'm5',
        title: 'Deployment & Capstone Implementation',
        description: 'Synthesize your skills into an end-to-end project, configure build pipelines, and deploy publicly.',
        estimatedMin: 180,
        keyConcepts: ['Project Integration', 'Build Pipelines', 'Cloud Deployment'],
        resources: ['https://github.com', 'https://render.com']
      }
    ];
  }

  return { title, description, durationHrs, milestones };
}

function generateFallbackQuiz(moduleTitle: string, roadmapTitle: string) {
  const questions = [];

  // MCQ Part (10 questions)
  for (let i = 1; i <= 10; i++) {
    questions.push({
      id: `fallback-mcq-${i}`,
      type: 'mcq',
      questionText: `Conceptual MCQ ${i}: What is a core principle concerning "${moduleTitle}" in the context of ${roadmapTitle}?`,
      options: [
        `Option A: Focus on modular structure, optimization, and scalable design patterns.`,
        `Option B: Implement single-file monolithic layouts with redundant calculations.`,
        `Option C: Exclude testing, debugging, and continuous integration workflows.`,
        `Option D: Hardcode credentials and configuration values inside the script.`
      ],
      correctOptionIndex: 0,
      correctTextAnswer: '',
      explanation: `Option A is correct because proper engineering around "${moduleTitle}" demands attention to modularity, performance metrics, and clean code separation.`
    });
  }

  // Question Part (5 questions)
  for (let i = 1; i <= 5; i++) {
    questions.push({
      id: `fallback-q-${i}`,
      type: 'question',
      questionText: `Conceptual Short Question ${i}: Explain how you would optimize your approach to "${moduleTitle}" to ensure maximum execution efficiency?`,
      options: [],
      correctOptionIndex: -1,
      correctTextAnswer: 'modularity, caching, and clean resource management',
      explanation: `To optimize, developers should separate concerns, use caching patterns where applicable, and release idle database connections or memory resources cleanly.`
    });
  }

  // True / False Part (5 questions)
  for (let i = 1; i <= 5; i++) {
    const isTrue = i % 2 === 1;
    questions.push({
      id: `fallback-tf-${i}`,
      type: 'true-false',
      questionText: `Conceptual True/False ${i}: ${
        isTrue 
          ? `Modulating components and separating business logic makes "${moduleTitle}" significantly easier to maintain and test.`
          : `When working with "${moduleTitle}", it is recommended to write all logic inside a single monolithic block without auxiliary helper functions.`
      }`,
      options: ['True', 'False'],
      correctOptionIndex: isTrue ? 0 : 1,
      correctTextAnswer: '',
      explanation: isTrue 
        ? 'Correct. Separation of concerns increases testability and readability.' 
        : 'Correct. Monolithic blocks make code incredibly fragile, hard to debug, and difficult to test.'
    });
  }

  // Fill in the Blank Part (5 questions)
  const blanksData = [
    { text: 'To ensure structured and clean development of code, we divide functions into _____ elements.', answer: 'reusable' },
    { text: 'In technical engineering, writing comprehensive _____ helps safeguard against unexpected bugs and logic breakages.', answer: 'tests' },
    { text: 'When processing large data structures, we use _____ to speed up lookups and operations.', answer: 'indexes' },
    { text: 'The practice of keeping sensitive configurations out of direct source code is handled via _____ variables.', answer: 'environment' },
    { text: 'To handle asynchronous operations cleanly, we utilize modern _____ or async/await syntax.', answer: 'promises' }
  ];

  for (let i = 1; i <= 5; i++) {
    const blankObj = blanksData[i - 1];
    questions.push({
      id: `fallback-fb-${i}`,
      type: 'fill-blank',
      questionText: `Fill-in-the-Blank ${i}: For "${moduleTitle}", fill in the missing word: ${blankObj.text}`,
      options: [],
      correctOptionIndex: -1,
      correctTextAnswer: blankObj.answer,
      explanation: `The missing term is "${blankObj.answer}". Applying this best practice ensures that your codebase remains structured, safe, and highly performant.`
    });
  }

  return { moduleTitle, questions };
}

// JSON schemas for structured Gemini outputs
const roadmapSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'The title of the roadmap' },
    description: { type: Type.STRING, description: 'A summary of what this roadmap covers' },
    durationHrs: { type: Type.INTEGER, description: 'Total estimated duration in hours for the entire roadmap' },
    milestones: {
      type: Type.ARRAY,
      description: 'List of 5 sequential milestones to complete the roadmap',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique short ID, e.g., 'm1', 'm2'" },
          title: { type: Type.STRING, description: "Title of the milestone, e.g., 'Variables & Data Types'" },
          description: { type: Type.STRING, description: 'Description of what will be learned' },
          estimatedMin: { type: Type.INTEGER, description: 'Estimated time to complete in minutes, e.g., 45' },
          keyConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 core concepts of this milestone'
          },
          resources: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '1-2 high-quality online learning references'
          }
        },
        required: ['id', 'title', 'description', 'estimatedMin', 'keyConcepts', 'resources']
      }
    }
  },
  required: ['title', 'description', 'durationHrs', 'milestones']
};

const quizSchema = {
  type: Type.OBJECT,
  properties: {
    moduleTitle: { type: Type.STRING, description: 'The title of the module' },
    questions: {
      type: Type.ARRAY,
      description: 'Exactly 25 distinct questions: 10 MCQs, 5 questions (short response), 5 true-false, and 5 fill-blank',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique short ID, e.g. 'q1' up to 'q25'" },
          type: { type: Type.STRING, description: "Type: must be 'mcq', 'question', 'true-false', or 'fill-blank'" },
          questionText: { type: Type.STRING, description: 'The question prompt text' },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'For mcq: exactly 4 options. For true-false: exactly ["True", "False"]. For others: empty array.'
          },
          correctOptionIndex: { type: Type.INTEGER, description: 'Index of correct option (0 to 3) for MCQ and (0 or 1) for true-false. Others: -1' },
          correctTextAnswer: { type: Type.STRING, description: 'For fill-blank and question: short answer key term or phrase. Others: empty string' },
          explanation: { type: Type.STRING, description: 'Clear explanation of why this option is correct' }
        },
        required: ['id', 'type', 'questionText', 'options', 'correctOptionIndex', 'correctTextAnswer', 'explanation']
      }
    }
  },
  required: ['moduleTitle', 'questions']
};

// Helper function to race a promise with a timeout limit (e.g. 4 seconds)
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'generate-roadmap') {
      const { topic } = payload;
      if (!topic) {
        return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
      }

      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY is not set on the server');
        }

        const prompt = `Create a highly structured, comprehensive, 5-milestone learning roadmap for the technical skill: "${topic}". Make sure the description is encouraging and the milestones follow a logical progression from basic to intermediate/advanced. Make estimated times realistic.`;

        // Race the Gemini API call with a 4000ms timeout
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              systemInstruction: 'You are an expert technical curriculum designer. Generate structured learning paths in valid JSON format only.',
              responseMimeType: 'application/json',
              responseSchema: roadmapSchema,
              temperature: 0.2,
            },
          }),
          4000,
          'Gemini API response timed out after 4 seconds'
        );

        if (!response.text) {
          throw new Error('Empty response from Gemini');
        }

        const data = JSON.parse(response.text.trim());
        return NextResponse.json(data);
      } catch (geminiError: any) {
        console.warn('Gemini API failed, timed out, or unavailable, using high-quality Copilot fallback engine:', geminiError);
        const fallbackData = generateFallbackRoadmap(topic);
        return NextResponse.json(fallbackData);
      }
    }

    if (action === 'generate-quiz') {
      const { moduleTitle, roadmapTitle } = payload;
      if (!moduleTitle) {
        return NextResponse.json({ error: 'Module title is required' }, { status: 400 });
      }

      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY is not set on the server');
        }

        const prompt = `Create a comprehensive, highly high-quality assessment quiz of exactly 25 questions for the module "${moduleTitle}" in the course "${roadmapTitle || 'Technical Skill'}".
The questions must be structured exactly as follows:
- 10 MCQs (type: "mcq"): options must contain exactly 4 answers, correctOptionIndex must be 0 to 3, correctTextAnswer must be an empty string "".
- 5 conceptual questions (type: "question"): options must be empty [], correctOptionIndex must be -1, correctTextAnswer must contain a concise correct key phrase or answer.
- 5 True/False questions (type: "true-false"): options must be exactly ["True", "False"], correctOptionIndex must be 0 (for True) or 1 (for False), correctTextAnswer must be an empty string "".
- 5 Fill-in-the-Blank questions (type: "fill-blank"): questionText must contain exactly one blank represented as "_____", options must be empty [], correctOptionIndex must be -1, correctTextAnswer must contain the correct single-word or short-phrase answer to fill the blank.

Ensure the questions are distinct and progressively test the student's mastery. Include clear, educational explanations for all 25 questions.`;

        // Race the Gemini API call with a 15000ms timeout
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              systemInstruction: 'You are an expert technical curriculum designer and computer science educator. Generate 25 distinct quiz questions spanning multiple formats in valid JSON format matching the schema precisely.',
              responseMimeType: 'application/json',
              responseSchema: quizSchema,
              temperature: 0.3,
            },
          }),
          15000,
          'Gemini API response timed out after 15 seconds'
        );

        if (!response.text) {
          throw new Error('Empty response from Gemini');
        }

        const data = JSON.parse(response.text.trim());
        return NextResponse.json(data);
      } catch (geminiError: any) {
        console.warn('Gemini API failed, timed out, or unavailable, using high-quality Copilot fallback engine:', geminiError);
        const fallbackData = generateFallbackQuiz(moduleTitle, roadmapTitle || 'Technical Skill');
        return NextResponse.json(fallbackData);
      }
    }

    if (action === 'ask-teacher') {
      const { messages } = payload;
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: 'Messages are required and must be an array' }, { status: 400 });
      }

      try {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY is not set on the server');
        }

        // System Instruction for Professor Sterling
        const systemInstruction = `You are 'Professor Sterling', a highly supportive, encouraging, and knowledgeable AI Technical Teacher on the RoadmapAI platform.
Your objective is to help students learn technical topics, clarify queries, and guide them step-by-step through programming, computer science, and technical concepts.

CRITICAL EDUCATIONAL MANDATES:
1. Respond ONLY to educational queries, technical topics, coding concepts, or student learning/career guidance.
2. If a student asks any query that is completely unrelated to learning, education, career, or technology (for example, general jokes, gossip, entertainment, unrelated sports, or casual non-educational chit-chat), politely decline to answer. For example: "I am programmed to assist only with educational and technical learning queries. Let's get back to your study roadmap!"
3. Be encouraging, clear, and structured. Use rich Markdown elements such as bullet points, code snippets, and short paragraphs to make the content highly readable.
4. Maintain a warm, mentoring, and professional tone. Keep responses reasonably concise yet comprehensive.`;

        // Format the messages for @google/genai format
        const formattedContents = messages.map((msg: any) => {
          const role = (msg.role === 'assistant' || msg.role === 'bot' || msg.role === 'model') ? 'model' : 'user';
          return {
            role,
            parts: [{ text: msg.content || msg.text || '' }]
          };
        });

        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.5,
            },
          }),
          10000,
          'Gemini API response timed out after 10 seconds'
        );

        if (!response.text) {
          throw new Error('Empty response from Gemini');
        }

        return NextResponse.json({ text: response.text });
      } catch (geminiError: any) {
        console.warn('Gemini API teacher chat failed, using fallback:', geminiError);
        return NextResponse.json({
          text: `Hello! I'm currently experiencing some heavy server traffic. 

As your AI Teacher, I can suggest that we review the core concepts of your roadmaps. Feel free to re-submit your message, or let me know if you want to explore standard topics like Python, JavaScript, or Databases!`
        });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
