import mongoose from 'mongoose'

//schemaDB
const taskSchema = new mongoose.Schema(
  {
    title: {type: String, required: true, trim: true, minlength: 1, maxlength: 120},
    status: {type: String, required: true, enum: ['todo', 'doing', 'done']},
    description: {type: String, default: '', maxlength: 1000},
    dueDate: {type: String, default: null},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},
  },{ timestamps: true }
)
taskSchema.index({ user: 1, createdAt: -1 })

export const Task = mongoose.model('Task', taskSchema)