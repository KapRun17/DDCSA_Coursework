const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название команды обязательно'],
    trim: true,
    maxlength: [50, 'Максимальная длина названия - 50 символов']
  },
  description: {
    type: String,
    maxlength: [500, 'Максимальная длина описания - 500 символов']
  },
  game: {
    type: String,
    required: [true, 'Игра обязательна']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'co-owner'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxMembers: {
    type: Number,
    default: 10,
    min: [2, 'Минимальное количество участников - 2'],
    max: [50, 'Максимальное количество участников - 50']
  },
  isRecruiting: {
    type: Boolean,
    default: true
  },
  requirements: {
    minAge: Number,
    minRank: String,
    language: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);