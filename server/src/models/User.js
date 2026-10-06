import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  return { id: this._id.toString(), name: this.name, email: this.email };
};

export const hashPassword = (plain) => bcrypt.hash(plain, 12);

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
