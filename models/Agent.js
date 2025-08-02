const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
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
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    department: {
        type: String,
        enum: ['technical', 'billing', 'general', 'escalation'],
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
    },
    specialties: [{
        type: String,
        enum: ['password_reset', 'billing_issues', 'technical_support', 'account_management', 'feature_requests', 'bug_reports']
    }],
    status: {
        type: String,
        enum: ['online', 'offline', 'away', 'busy'],
        default: 'offline'
    },
    shift: {
        startTime: String, // e.g., "09:00"
        endTime: String,   // e.g., "17:00"
        timezone: { type: String, default: 'UTC' }
    },
    performance: {
        totalTicketsResolved: { type: Number, default: 0 },
        averageResponseTime: { type: Number, default: 0 }, // in minutes
        customerSatisfactionRating: { type: Number, default: 0, min: 0, max: 5 },
        totalRatings: { type: Number, default: 0 }
    },
    currentWorkload: {
        assignedTickets: { type: Number, default: 0 },
        maxTickets: { type: Number, default: 10 }
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual for full name
agentSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for availability
agentSchema.virtual('isAvailable').get(function() {
    return this.status === 'online' && this.currentWorkload.assignedTickets < this.currentWorkload.maxTickets;
});

// Method to update performance metrics
agentSchema.methods.updatePerformance = function(responseTime, rating = null) {
    this.performance.totalTicketsResolved += 1;
    
    // Update average response time
    const totalTickets = this.performance.totalTicketsResolved;
    const currentAvg = this.performance.averageResponseTime;
    this.performance.averageResponseTime = ((currentAvg * (totalTickets - 1)) + responseTime) / totalTickets;
    
    // Update customer satisfaction rating if provided
    if (rating !== null) {
        const totalRatings = this.performance.totalRatings + 1;
        const currentRating = this.performance.customerSatisfactionRating;
        this.performance.customerSatisfactionRating = ((currentRating * this.performance.totalRatings) + rating) / totalRatings;
        this.performance.totalRatings = totalRatings;
    }
    
    return this.save();
};

// Index for efficient searching
agentSchema.index({ email: 1 });
agentSchema.index({ employeeId: 1 });
agentSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Agent', agentSchema);
