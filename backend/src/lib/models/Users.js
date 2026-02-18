import mongoose, { Schema, Document, Model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    ID: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    type: {
      type: String,
      enum: ["student", "doctor", "parent", "admin"],
      required: true,
    },
    parent: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (
  password
) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!secret) {
    throw new Error("Access token secret env var missing");
  }

  return jwt.sign(
    {
      _id: this._id.toString(),
      ID: this.ID,
      name: this.name,
      role: this.role,
      type: this.type,
    },
    secret,
    { expiresIn: "7d" }
  );
};

userSchema.methods.generateRefreshToken = function () {
  const secret = process.env.REFRESH_TOKEN_SECRET;

  if (!secret) {
    throw new Error("Refresh token secret env var missing");
  }

  return jwt.sign(
    { _id: this._id.toString() },
    secret,
    { expiresIn: "7d" }
  );
};

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

export default UserModel;
