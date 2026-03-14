const pdfParse = require("pdf-parse");
const {generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @description Generate an interview report based on the candidate's resume, job description and self description
 */
// async function generateInterviewReportController(req, res) {
//   const resumeContent = await new pdfParse.PDFParse(
//     Uint8Array.from(req.file.buffer),
//   ).getText();
//   const { selfDescription, jobDescription } = req.body;

//   const interviewReportByAi = await generateInterviewReport({
//     resume: resumeContent.text,
//     jobDescription,
//     selfDescription,
//   });

//   const interviewReport = await interviewReportModel.create({
//     user: req.user.id,
//     resume: resumeContent.text,
//     jobDescription,
//     selfDescription,
//     ...interviewReportByAi,
//   });

//   res.status(201).json({
//     message: "Interview report generated successfully",
//     interviewReport,
//   });
// }

/**
 * @description Generate an interview report based on the candidate's resume, job description and self description
 */
async function generateInterviewReportController(req, res) {
  try {
    const resumeContent = await new pdfParse.PDFParse(
      Uint8Array.from(req.file.buffer),
    ).getText();

    const { selfDescription, jobDescription } = req.body;

    const interviewReportByAi = await generateInterviewReport({
      resume: resumeContent.text,
      jobDescription,
      selfDescription,
    });

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeContent.text,
      jobDescription,
      selfDescription,
      ...interviewReportByAi,
    });

    res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    // 🔥 Gemini high demand
    if (error.status === 503) {
      return res.status(503).json({
        message: "AI model is currently overloaded. Please try again shortly.",
      });
    }

    // 🔥 Gemini quota exceeded
    if (error.status === 429) {
      return res.status(429).json({
        message: "Daily AI request limit reached. Please try again tomorrow.",
      });
    }

    return res.status(500).json({
      message: "Failed to generate interview report",
    });
  }
}

/**
 * @description Get all interview reports for the authenticated user
 */
async function getAllInterviewReportsController(req, res) {
  const interviewReports = await interviewReportModel
    .find({
      user: req.user.id,
    })
    .sort({ createdAt: -1 })
    .select(
      "-resume -jobDescription -selfDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
    );
  res.status(200).json({
    message: "Interview reports retrieved successfully",
    interviewReports,
  });
}

/**
 * @description Get a specific interview report by ID for the authenticated user
 */
async function getInterviewReportByIdController(req, res) {


  const { id } = req.params;

  const interviewReport = await interviewReportModel.findOne({
    _id: id,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(404).json({
      message: "Interview report not found",
    });
  }
  res.status(200).json({    message: "Interview report retrieved successfully",
    interviewReport,
  });
}


/**
 * @description Controller to generate resume PDF based on user self description , resume and job description.
 */
async function generateResumePdfController(req, res) {
 

   try {
     const { interviewReportId } = req.params;

     const interviewReport =
       await interviewReportModel.findById(interviewReportId);

     if (!interviewReport) {
       return res.status(404).json({ message: "Interview report not found" });
     }

     const { resume, selfDescription, jobDescription } = interviewReport;

     const pdfBuffer = await generateResumePdf({
       resume,
       selfDescription,
       jobDescription,
     });

     res.set({
       "Content-Type": "application/pdf",
       "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
     });

     res.send(pdfBuffer);
   } catch (error) {
      console.error("Resume PDF error:", error);

      if (error.status === 503) {
        return res.status(503).json({
          message: "AI service is currently busy. Try again in a moment.",
        });
      }

      if (error.status === 429) {
        return res.status(429).json({
          message: "Daily AI quota exhausted. Please try again later.",
        });
      }

      res.status(500).json({
        message: "PDF generation failed",
      });
   }
}

module.exports = {
  generateInterviewReportController,
  getAllInterviewReportsController,
  getInterviewReportByIdController,
  generateResumePdfController,
};
