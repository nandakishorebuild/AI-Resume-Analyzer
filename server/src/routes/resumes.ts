
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";

import pool from "../config/db";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { analyzeResumeWithAI } from "../ai/analyzeResume";

const router = Router();

// Upload directory
const uploadDirectory = path.resolve(process.cwd(), "uploads");

// Resume upload settings
const upload = multer({
  dest: uploadDirectory,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
    fields: 1,
    fieldSize: 20 * 1024,
    parts: 2,
  },

  fileFilter: (_req, file, callback) => {
    const fileName = file.originalname.toLowerCase();

    const isPDF = fileName.endsWith(".pdf");
    const isDOCX = fileName.endsWith(".docx");

    if (isPDF || isDOCX) {
      callback(null, true);
    } else {
      callback(new Error("Only PDF and DOCX files are allowed."));
    }
  },
});

// Handle file upload errors
function handleResumeUpload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  upload.single("resume")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          message: "Resume file must be smaller than 5 MB.",
        });
        return;
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        res.status(400).json({
          message: "Only one resume can be uploaded at a time.",
        });
        return;
      }

      res.status(400).json({
        message: "Resume upload failed. Please check your file and try again.",
      });
      return;
    }

    if (error) {
      res.status(400).json({
        message: error.message === "Only PDF and DOCX files are allowed."
          ? error.message
          : "Resume upload failed.",
      });
      return;
    }

    next();
  });
}

// Validate actual file contents
async function isValidResumeFile(
  filePath: string,
  fileName: string
): Promise<boolean> {
  const fileData = await fs.readFile(filePath);
  const lowerFileName = fileName.toLowerCase();

  if (lowerFileName.endsWith(".pdf")) {
    // PDF files should contain the PDF header.
    const header = fileData.subarray(0, 1024);

    return header.includes(Buffer.from("%PDF-"));
  }

  if (lowerFileName.endsWith(".docx")) {
    // DOCX files are ZIP-based documents.
    return (
      fileData.length >= 4 &&
      fileData[0] === 0x50 &&
      fileData[1] === 0x4b &&
      fileData[2] === 0x03 &&
      fileData[3] === 0x04
    );
  }

  return false;
}

// Extract text from PDF or DOCX
async function extractResumeText(
  filePath: string,
  fileName: string
): Promise<string> {
  const lowerFileName = fileName.toLowerCase();

  if (lowerFileName.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");

    const fileData = await fs.readFile(filePath);

    const parser = new PDFParse({
      data: fileData,
    });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (lowerFileName.endsWith(".docx")) {
    const mammoth = await import("mammoth");

    const result = await mammoth.extractRawText({
      path: filePath,
    });

    return result.value;
  }

  throw new Error("Unsupported resume format.");
}

// Upload resume
router.post(
  "/upload",
  authMiddleware,
  handleResumeUpload,
  async (req: AuthRequest, res: Response) => {
    let uploadedFilePath: string | undefined;

    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({
          message: "Please upload your resume.",
        });
        return;
      }

      uploadedFilePath = file.path;

      if (!req.userId) {
        res.status(401).json({
          message: "Please login again.",
        });
        return;
      }

      const jobDescription = req.body.jobDescription || "";

      if (typeof jobDescription !== "string") {
        res.status(400).json({
          message: "Invalid job description.",
        });
        return;
      }

      if (jobDescription.length > 15000) {
        res.status(400).json({
          message: "Job description must be shorter than 15,000 characters.",
        });
        return;
      }

      // Validate actual file contents
      const validFile = await isValidResumeFile(
        file.path,
        file.originalname
      );

      if (!validFile) {
        res.status(400).json({
          message: "Invalid file content. Please upload a valid PDF or DOCX resume.",
        });
        return;
      }

      // Extract resume text
      const resumeText = await extractResumeText(
        file.path,
        file.originalname
      );

      if (!resumeText.trim()) {
        res.status(400).json({
          message: "Could not extract text from this resume. Please try another file.",
        });
        return;
      }

      // Save resume details in PostgreSQL
      const result = await pool.query(
        `INSERT INTO resumes (user_id, content, job_description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [req.userId, resumeText, jobDescription]
      );

      res.status(201).json({
        message: "Resume uploaded successfully.",
        resumeId: result.rows[0].id,
        textLength: resumeText.length,
        preview: resumeText.slice(0, 300),
      });
    } catch (error) {
      console.error("Resume upload error:", error);

      res.status(500).json({
        message: "Failed to process resume. Please try again.",
      });
    } finally {
      // Always delete the temporary uploaded file
      if (uploadedFilePath) {
        try {
          await fs.unlink(uploadedFilePath);
        } catch (error) {
          console.error("Failed to delete temporary resume:", error);
        }
      }
    }
  }
);

// Analyze resume
router.get(
  "/analyze/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const resumeId = Number(req.params.id);

      if (!Number.isInteger(resumeId) || resumeId <= 0) {
        res.status(400).json({
          message: "Invalid resume ID.",
        });
        return;
      }

      if (!req.userId) {
        res.status(401).json({
          message: "Please login again.",
        });
        return;
      }

      // Find the resume belonging to the logged-in user
      const result = await pool.query(
        `SELECT content, job_description
         FROM resumes
         WHERE id = $1 AND user_id = $2`,
        [resumeId, req.userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          message: "Resume not found.",
        });
        return;
      }

      const resumeText = result.rows[0].content;
      const jobDescription = result.rows[0].job_description || "";

      // Get AI analysis from Groq
      const analysis = await analyzeResumeWithAI(
        resumeText,
        jobDescription
      );

      // Save analysis in PostgreSQL
      await pool.query(
        `UPDATE resumes
         SET analysis = $1
         WHERE id = $2 AND user_id = $3`,
        [JSON.stringify(analysis), resumeId, req.userId]
      );

      res.json({
        message: "Resume analyzed successfully.",
        resumeId,
        analysis,
      });
    } catch (error) {
      console.error("Resume analysis error:", error);

      res.status(500).json({
        message: "Failed to analyze resume. Please try again.",
      });
    }
  }
);

// Get analysis history
router.get(
  "/history",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({
          message: "Please login again.",
        });
        return;
      }

      const result = await pool.query(
        `SELECT id, analysis, job_description, created_at
         FROM resumes
         WHERE user_id = $1 AND analysis IS NOT NULL
         ORDER BY created_at DESC`,
        [req.userId]
      );

      res.json({
        count: result.rows.length,
        history: result.rows,
      });
    } catch (error) {
      console.error("Resume history error:", error);

      res.status(500).json({
        message: "Failed to fetch resume history.",
      });
    }
  }
);

export default router;
