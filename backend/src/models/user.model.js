import mongoose from "mongoose";
import { Schema } from "mongoose";


const userSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  password: { type: String, required: true },
  token: { type: String },
});

const User = mongoose.model("User", userSchema);

export { User };
