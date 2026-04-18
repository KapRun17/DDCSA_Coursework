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
    required: [true, 'Игра обязательна'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Состав команды.
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

  // Ограничения набора.
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

  // Требования к кандидатам.
  requirements: {
    minAge: {
      type: Number,
      min: [13, 'Минимальный возраст кандидата - 13 лет']
    },
    minRank: {
      type: String,
      trim: true
    },
    language: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
