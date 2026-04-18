const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Имя пользователя обязательно'],
    unique: true,
    trim: true,
    minlength: [3, 'Минимальная длина имени - 3 символа'],
    maxlength: [30, 'Максимальная длина имени - 30 символов']
  },
  email: {
    type: String,
    required: [true, 'Email обязателен'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Некорректный формат email']
  },
  password: {
    type: String,
    required: [true, 'Пароль обязателен'],
    minlength: [6, 'Минимальная длина пароля - 6 символов'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Публичные данные профиля.
  profile: {
    age: {
      type: Number,
      min: [13, 'Минимальный возраст - 13 лет'],
      max: [100, 'Максимальный возраст - 100 лет']
    },
    bio: {
      type: String,
      maxlength: [500, 'Максимальная длина биографии - 500 символов']
    },
    avatar: {
      type: String,
      default: ''
    }
  },

  // Игровые данные пользователя.
  games: [{
    gameName: {
      type: String,
      trim: true
    },
    rank: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      trim: true
    }
  }],

  // Признак подтверждения аккаунта.
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Хеширование пароля.
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Сравнение паролей.
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
