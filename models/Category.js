const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        default: '#007bff',
        match: /^#[0-9A-F]{6}$/i
    },
    icon: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
categorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get active categories
categorySchema.statics.getActive = function() {
    return this.find({ isActive: true }).sort({ priority: -1, name: 1 });
};

module.exports = mongoose.model('Category', categorySchema);
