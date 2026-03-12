const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const interviewController = require('../controllers/interview.controller');
const upload = require('../middlewares/file.middleware');

const interviewRouter = express.Router();


/**
 * @route POST /api/interview/
 * @description Generate an interview report based on the candidate's resume, job description and self description
 * @access private
 */
interviewRouter.post('/', authMiddleware.authUser, upload.single('resume'), interviewController.generateInterviewReportController);


/**
 * @route GET /api/interview/reports
 * @description Get all interview reports for the authenticated user
 * @access private
 */
interviewRouter.get('/reports', authMiddleware.authUser, interviewController.getAllInterviewReportsController);


/**
 * @route GET /api/interview/reports/:id
 * @description Get a specific interview report by ID for the authenticated user
 * @access private
 */
interviewRouter.get('/report/:id', authMiddleware.authUser, interviewController.getInterviewReportByIdController);


/**
 * @route POST /api/interview/reports/:id
 * @description generate resume PDF based on user self description , resume and job description.
 * @access private
 */
interviewRouter.post('/resume/pdf/:interviewReportId', authMiddleware.authUser, interviewController.generateResumePdfController);

module.exports = interviewRouter;