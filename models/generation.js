import mongoose, { Schema } from "mongoose";

const generationSchema = new Schema({
  inputText: {
    type: String,
  },

  outputText: {
    type: String,
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

const Generation =
  mongoose.models.Generation || mongoose.model("Generation", generationSchema);

export default Generation;
