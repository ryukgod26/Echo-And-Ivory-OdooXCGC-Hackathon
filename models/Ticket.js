const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Updated to use unified User model
        required: true
    },
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Updated to use unified User model
        default: null
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'pending-customer', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Updated to reference Category model
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    resolution: {
        type: String,
        trim: true
    },
    resolutionTime: {
        type: Number // in minutes
    },
    customerSatisfactionRating: {
        type: Number,
        min: 1,
        max: 5
    },
    customerFeedback: {
        type: String,
        trim: true
    },
    interactions: [{
        type: {
            type: String,
            enum: ['note', 'email', 'phone', 'chat', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'interactions.authorType'
        },
        authorType: {
            type: String,
            enum: ['Customer', 'Agent'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        isInternal: {
            type: Boolean,
            default: false
        },
        attachments: [{
            filename: String,
            originalName: String,
            mimeType: String,
            size: Number,
            uploadDate: { type: Date, default: Date.now },
            url: String
        }]
    }],
    attachments: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        uploadDate: { type: Date, default: Date.now },
        url: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'attachments.uploadedByType'
        },
        uploadedByType: {
            type: String,
            enum: ['Customer', 'Agent']
        }
    }],
    escalationLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    escalationReason: {
        type: String,
        trim: true
    },
    dueDate: {
        type: Date
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    metrics: {
        firstResponseTime: Number, // in minutes
        totalResponseTime: Number, // in minutes
        customerWaitTime: Number,  // in minutes
        reopenCount: { type: Number, default: 0 }
    },
    // Voting system
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    votes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        voteType: {
            type: String,
            enum: ['upvote', 'downvote'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Auto-generate ticket ID
ticketSchema.pre('save', async function(next) {
    if (this.isNew && !this.ticketId) {
        try {
            const count = await this.constructor.countDocuments();
            this.ticketId = `T${String(count + 1).padStart(6, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    
    // Update lastUpdated on any change
    this.lastUpdated = new Date();
    
    next();
});

// Method to add interaction
ticketSchema.methods.addInteraction = function(type, content, author, authorType, isInternal = false) {
    this.interactions.push({
        type,
        content,
        author,
        authorType,
        timestamp: new Date(),
        isInternal
    });
    return this.save();
};

// Method to assign agent
ticketSchema.methods.assignToAgent = function(agentId) {
    this.assignedAgent = agentId;
    this.status = 'in-progress';
    return this.save();
};

// Method to resolve ticket
ticketSchema.methods.resolve = function(resolution, agentId) {
    this.status = 'resolved';
    this.resolution = resolution;
    this.resolutionTime = Math.floor((new Date() - this.createdAt) / (1000 * 60)); // in minutes
    
    // Add resolution interaction
    this.addInteraction('note', `Ticket resolved: ${resolution}`, agentId, 'Agent', false);
    
    return this.save();
};

// Method to escalate ticket
ticketSchema.methods.escalate = function(reason, newPriority = null) {
    this.escalationLevel += 1;
    this.escalationReason = reason;
    
    if (newPriority) {
        this.priority = newPriority;
    }
    
    // Auto-assign higher priority if escalated
    if (this.priority === 'low') this.priority = 'medium';
    else if (this.priority === 'medium') this.priority = 'high';
    else if (this.priority === 'high') this.priority = 'urgent';
    
    return this.save();
};

// Virtual for age in hours
ticketSchema.virtual('ageInHours').get(function() {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for is overdue
ticketSchema.virtual('isOverdue').get(function() {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate;
});

// Indexes for efficient querying
ticketSchema.index({ status: 1, priority: -1 });
ticketSchema.index({ assignedAgent: 1, status: 1 });
ticketSchema.index({ customer: 1, createdAt: -1 });
ticketSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
