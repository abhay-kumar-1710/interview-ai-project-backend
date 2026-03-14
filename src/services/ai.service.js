const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job describe",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
          ),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
    ),
  title: z
    .string()
    .describe(
      "Return ONLY the job role title. Do NOT include candidate name, company name, interview report, preparation report, analysis, or any extra words. Example outputs: 'Frontend Developer', 'DevOps Engineer', 'Marketing Specialist', 'Sales Executive'. The title must contain ONLY the role name.",
    ),
});

async function generateInterviewReport({
  resume,
  jobDescription,
  selfDescription,
}) {
  const prompt = `
You are an AI interview preparation assistant.

Analyze the candidate profile and generate a structured interview report.

Resume:
${resume}

Job Description:
${jobDescription}

Self Description:
${selfDescription}

Return ONLY valid JSON in the following structure:

{
  "title": "string",
  "matchScore": number,

  "technicalQuestions": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],

  "behavioralQuestions": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],

  "skillGaps": [
    {
      "skill": "string",
      "severity": "low | medium | high"
    }
  ],

  "preparationPlan": [
    {
      "day": number,
      "focus": "string",
      "tasks": ["string"]
    }
  ]
}

Rules:
- technicalQuestions must contain EXACTLY 3 items
- behavioralQuestions must contain EXACTLY 3 items
- skillGaps must contain EXACTLY 3 to 4 items
- preparationPlan must contain EXACTLY 7 days
- matchScore must be between 0 and 100
- title must contain ONLY the job role (example: Frontend Developer) , Do NOT include candidate name ,  Do NOT include words like Interview, Report, Preparation, Analysis
- DO NOT return explanations
- DO NOT return additional fields
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,

    config: {
      responseMimeType: "application/json",
      //   responseSchema: zodToJsonSchema(interviewReportSchema),

      schema: zodToJsonSchema(interviewReportSchema),
    },
  });

  return JSON.parse(response.text);
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    headless: true,
    timeout: 0,
    
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle2" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: { top: "10mm", right: "10mm", left: "10mm", bottom: "10mm" },
  });

  await browser.close();
  return pdfBuffer;
}

async function generateResumePdf({ resume, jobDescription, selfDescription }) {
  const resumepdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using any libary like Puppeteer",
      ),
  });

  const prompt = `Generate resume for a candidate with the following details:
  Resume:${resume}
  Self Description: ${selfDescription}
  Job Description: ${jobDescription}
  
  the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any libary like Puppeteer.
  In the generated resume make sure that the projects, personal projects , Work Experience, Education ,name,  Personal deatils like Phone number, linkedin link, Portfolio, Email, Github link etc these all details should be taken from ${resume} and ${selfDescription}.
  The resume should be tailored for the given job description and should highlight the candiate  strength and work experience. The HTML content should be well-formatted and structured , making it easy to read, visible and understand.
  The content of resume should be not sound like its generated by AI and should be as close as possible to a real human-written resume.
  You can highlight the content using diffrent font styles but the overall design should be simple and professional.
  and also make sure that the generated resume should be ATS friendly resume.
  The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing any important imformation.
  Make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
  The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
           

  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,

    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(resumepdfSchema),
    },
  });

  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };
