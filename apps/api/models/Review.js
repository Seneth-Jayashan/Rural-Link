const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  type: {
    type: String,
    enum: ['product', 'merchant', 'delivery'],
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  aiGeneratedComment: {
    type: String,
    maxlength: [500, 'AI generated comment cannot exceed 500 characters']
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    enum: ['en', 'si', 'ta'],
    default: 'en'
  },
  helpful: {
    count: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative']
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  images: [{
    url: String,
    alt: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  merchantResponse: {
    comment: String,
    respondedAt: Date
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  tags: [String]
}, {
  timestamps: true
});

// Index for better query performance
reviewSchema.index({ merchant: 1, type: 1, createdAt: -1 });
reviewSchema.index({ product: 1, type: 1, createdAt: -1 });
reviewSchema.index({ deliveryPerson: 1, type: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, isPublic: 1 });

// Pre-save middleware to set sentiment
reviewSchema.pre('save', function(next) {
  if (this.rating >= 4) {
    this.sentiment = 'positive';
  } else if (this.rating <= 2) {
    this.sentiment = 'negative';
  } else {
    this.sentiment = 'neutral';
  }
  next();
});

// Method to generate AI comment
reviewSchema.methods.generateAIComment = async function() {
  try {
    // This would integrate with an AI service like OpenAI
    // For now, we'll create a simple template-based generation
    const templatesByLang = {
      en: {
        positive: [
          "Excellent service! Highly recommended.",
          "Great experience, will order again.",
          "Outstanding quality and fast delivery.",
          "Perfect! Everything was as expected."
        ],
        negative: [
          "Disappointed with the service quality.",
          "Not satisfied with the delivery experience.",
          "Could be improved in several areas.",
          "Below expectations this time."
        ],
        neutral: [
          "Decent service overall.",
          "Average experience, room for improvement.",
          "Satisfactory but could be better.",
          "Good service with minor issues."
        ]
      },
      si: {
        positive: [
          "අත්දැකීම උසස්යි! ඉතා සැලකිලිමත් සේවය.",
          "හොඳ අත්දැකීමක්, නැවත ලබා ගන්නම්.",
          "ඉතා වේගයෙන් බෙදාහැරීම සහ ගුණාත්මකත්වය.",
          "පරිපූර්ණයි! අපේක්ෂාවට සමගයි."
        ],
        negative: [
          "සේවාවෙන් බැහැර විය.",
          "බෙදාහැරීමෙන් සතුටු වෙතේ නැහැ.",
          "බහුවිධ තුල වැඩි දියුණුව අවශ්‍යයි.",
          "මෙවර අපේක්ෂාවට අඩුයි."
        ],
        neutral: [
          "සාමාන්‍ය සේවාවකි.",
          "මධ්‍යස්ථ අත්දැකීමක්, වැඩිදියුණුවට ඉඩ ඇත.",
          "පැමිනීම හොඳයි, කුඩා ගැටළු කිහිපයක් ඇත.",
          "ආරෝග්‍යක සේවාවක්, සුළු ගැටළු."
        ]
      },
      ta: {
        positive: [
          "மிக சிறந்த சேவை! பரிந்துரைக்கிறேன்.",
          "நல்ல அனுபவம், மறுபடியும் ஆர்டர் செய்வேன்.",
          "விரைவான விநியோகம் மற்றும் தரம்.",
          "அற்புதம்! எதிர்பார்த்தபடி."
        ],
        negative: [
          "சேவை தரம் ஏமாற்றமளித்தது.",
          "டெலிவரி அனுபவம் திருப்திகரமில்லை.",
          "பல பகுதிகளில் மேம்பாடு தேவை.",
          "இந்த முறை எதிர்பார்ப்புக்கு குறைவு."
        ],
        neutral: [
          "மோசமில்லை, சராசரி சேவை.",
          "சராசரி அனுபவம், மேம்படுத்தலாம்.",
          "நல்ல சேவை, சில சிறிய சிக்கல்கள்.",
          "சராசரியாக உள்ளது."
        ]
      }
    };

    const langPack = templatesByLang[this.language] || templatesByLang.en;
    const templateArray = langPack[this.sentiment] || langPack.neutral;
    const randomTemplate = templateArray[Math.floor(Math.random() * templateArray.length)];
    
    this.aiGeneratedComment = randomTemplate;
    this.isAIGenerated = true;
    
    return this.aiGeneratedComment;
  } catch (error) {
    console.error('Error generating AI comment:', error);
    return null;
  }
};

// Method to mark as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    await this.save();
    return true;
  }
  return false;
};

// Method to remove helpful
reviewSchema.methods.removeHelpful = async function(userId) {
  const index = this.helpful.users.indexOf(userId);
  if (index > -1) {
    this.helpful.users.splice(index, 1);
    this.helpful.count -= 1;
    await this.save();
    return true;
  }
  return false;
};

// Static method to get average rating
reviewSchema.statics.getAverageRating = async function(targetId, type) {
  const matchField = type === 'product' ? 'product' : 
                    type === 'merchant' ? 'merchant' : 'deliveryPerson';
  
  const result = await this.aggregate([
    { $match: { [matchField]: mongoose.Types.ObjectId(targetId), isPublic: true } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  return result.length > 0 ? {
    average: Math.round(result[0].averageRating * 10) / 10,
    count: result[0].count
  } : { average: 0, count: 0 };
};

// Static method to get reviews by rating
reviewSchema.statics.getReviewsByRating = function(targetId, type, rating, limit = 20) {
  const matchField = type === 'product' ? 'product' : 
                    type === 'merchant' ? 'merchant' : 'deliveryPerson';
  
  return this.find({ 
    [matchField]: targetId, 
    rating, 
    isPublic: true 
  })
  .populate('customer', 'firstName lastName profileImage')
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Review', reviewSchema);
