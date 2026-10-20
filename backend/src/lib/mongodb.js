/* global process */

import mongoose from "mongoose";
import "dotenv/config";
import { logger } from "./logger.js";

export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGODB_URI);
    if (connection.readyState === 1) {
      return Promise.resolve(true);
    }
  } catch (error) {
    logger.error("mongodb_connection_failed");
    return Promise.reject(error);
  }
};
