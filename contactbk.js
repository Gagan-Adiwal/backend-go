// contactbk.js
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const app = express();

// Railway provides PORT via env, fallback for local dev
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Multer (for file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Nodemailer transporter (use Gmail App Password or another SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ---------------- CONTACT ROUTE ---------------- */
app.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `📩 ${subject} - Contact from ${name}`,
      html: `
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Subject:</b> ${subject}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    return res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("❌ Error sending contact message:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send message" });
  }
});

/* ---------------- CONTRIBUTE ROUTE ---------------- */
app.post(
  "/contribute",
  upload.fields([{ name: "picture" }, { name: "file" }]),
  async (req, res) => {
    try {
      const { name, stream, subject, email } = req.body;

      if (!name || !subject || !email || !req.files?.file) {
        return res.status(400).json({
          success: false,
          message: "Name, Subject, Email and File are required",
        });
      }

      let attachments = [];
      if (req.files.picture) {
        attachments.push({
          filename: req.files.picture[0].originalname,
          content: req.files.picture[0].buffer,
        });
      }
      if (req.files.file) {
        attachments.push({
          filename: req.files.file[0].originalname,
          content: req.files.file[0].buffer,
        });
      }

      await transporter.sendMail({
        from: `"Student StudyStone" <${process.env.EMAIL_USER}>`,
        to: "sstudystone@gmail.com",
        subject: `📘 New Contribution from ${name}`,
        html: `
          <p><b>Name:</b> ${name}</p>
          <p><b>Stream:</b> ${stream || "Not provided"}</p>
          <p><b>Subject:</b> ${subject}</p>
          <p><b>Email:</b> ${email}</p>
        `,
        attachments,
      });
      console.log("✅ Admin email sent");

      return res.json({ success: true, message: "Contribution submitted!" });
    } catch (err) {
      console.error("❌ Error handling contribution:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to submit contribution" });
    }
  }
);

/* ---------------- 404 ROUTE ---------------- */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
