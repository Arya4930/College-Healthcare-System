import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    database: process.env.DATABASE_PROVIDER || "dynamodb",
  });
});

export default router;
