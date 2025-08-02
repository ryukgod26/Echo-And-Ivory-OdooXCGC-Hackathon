const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        required: true,
        enum: ['customer', 'agent', 'admin'],
        default: 'customer'
    },
    // Admin-specific fields
    permissions: {
        type: [String],
        default: function() {
            if (this.role === 'admin') {
                return ['user_management', 'category_management', 'system_settings', 'reports', 'all_tickets'];
            } else if (this.role === 'agent') {
                return ['ticket_management', 'customer_support'];
            } else {
                return ['create_tickets', 'view_own_tickets'];
            }
        }
    },
    // Agent-specific fields (for backward compatibility)
    employeeId: {
        type: String,
        sparse: true,
        unique: true
    },
    department: {
        type: String,
        trim: true
    },
    // Customer-specific fields (for backward compatibility)
    phone: {
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
    // Common fields
    profilePicture: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
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

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Set name field if not provided
    if (!this.name) {
        this.name = this.fullName;
    }
    
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission) || this.permissions.includes('all');
};

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

// Method to check if user is agent
userSchema.methods.isAgent = function() {
    return this.role === 'agent';
};

// Method to check if user is customer
userSchema.methods.isCustomer = function() {
    return this.role === 'customer';
};

// Static method to create admin user
userSchema.statics.createAdmin = function(userData) {
    return new this({
        ...userData,
        role: 'admin',
        permissions: ['user_management', 'category_management', 'system_settings', 'reports', 'all_tickets']
    });
};

// Static method to create agent user
userSchema.statics.createAgent = function(userData) {
    return new this({
        ...userData,
        role: 'agent',
        permissions: ['ticket_management', 'customer_support']
    });
};

// Static method to create customer user
userSchema.statics.createCustomer = function(userData) {
    return new this({
        ...userData,
        role: 'customer',
        permissions: ['create_tickets', 'view_own_tickets']
    });
};

module.exports = mongoose.model('User', userSchema);
