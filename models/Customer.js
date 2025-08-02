const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    customerType: {
        type: String,
        enum: ['individual', 'business', 'enterprise'],
        default: 'individual'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        },
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'UTC' }
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Index for efficient searching
customerSchema.index({ email: 1 });
customerSchema.index({ firstName: 1, lastName: 1 });

module.exports = mongoose.model('Customer', customerSchema);
