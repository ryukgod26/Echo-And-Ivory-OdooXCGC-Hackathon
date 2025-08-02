require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Agent = require('./models/Agent');
const Ticket = require('./models/Ticket');
const User = require('./models/User');
const Category = require('./models/Category');

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI_KEY);
        console.log('Connected to MongoDB');

        // Create default admin user
        const adminExists = await User.findOne({ email: 'admin@company.com' });
        if (!adminExists) {
            const admin = User.createAdmin({
                firstName: 'System',
                lastName: 'Administrator',
                email: 'admin@company.com',
                password: 'admin123'
            });
            
            await admin.save();
            console.log('✅ Default admin user created');
            console.log('   Email: admin@company.com');
            console.log('   Password: admin123');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Create default categories
        const defaultCategories = [
            {
                name: 'Technical Issue',
                description: 'Problems with software, hardware, or technical functionality',
                color: '#dc3545',
                icon: 'fas fa-cog',
                priority: 5
            },
            {
                name: 'Billing',
                description: 'Questions about invoices, payments, and billing issues',
                color: '#28a745',
                icon: 'fas fa-dollar-sign',
                priority: 4
            },
            {
                name: 'Account',
                description: 'Account management, profile updates, and access issues',
                color: '#007bff',
                icon: 'fas fa-user',
                priority: 3
            },
            {
                name: 'General Inquiry',
                description: 'General questions and information requests',
                color: '#6c757d',
                icon: 'fas fa-question-circle',
                priority: 2
            },
            {
                name: 'Feature Request',
                description: 'Suggestions for new features or improvements',
                color: '#17a2b8',
                icon: 'fas fa-lightbulb',
                priority: 1
            },
            {
                name: 'Bug Report',
                description: 'Reports of software bugs or unexpected behavior',
                color: '#fd7e14',
                icon: 'fas fa-bug',
                priority: 4
            }
        ];

        // Get admin user for creating categories
        const admin = await User.findOne({ email: 'admin@company.com' });
        
        for (const categoryData of defaultCategories) {
            const exists = await Category.findOne({ name: categoryData.name });
            if (!exists) {
                const category = new Category({
                    ...categoryData,
                    createdBy: admin._id
                });
                await category.save();
                console.log(`✅ Created category: ${categoryData.name}`);
            }
        }

        console.log('\n🎉 Database seeding completed successfully!');
        
        console.log('\n📋 Access Information:');
        console.log('- Admin Portal: http://localhost:3000/admin');
        console.log('- Agent Portal: http://localhost:3000/support_agent');
        console.log('- Customer Portal: http://localhost:3000/customer');
        console.log('- Unified Login: http://localhost:3000/auth/login');
        
        console.log('\n🔑 Default Admin Credentials:');
        console.log('- Email: admin@company.com');
        console.log('- Password: admin123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        process.exit(0);
    }
}

// Sample data
const sampleCustomers = [
    {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        password: 'password123',
        phone: '+1-555-0101',
        company: 'Tech Solutions Inc',
        customerType: 'business'
    },
    {
        firstName: 'Sarah',
        lastName: 'Smith',
        email: 'sarah.smith@email.com',
        password: 'password123',
        phone: '+1-555-0102',
        company: 'Marketing Pro',
        customerType: 'business'
    },
    {
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike.wilson@email.com',
        password: 'password123',
        phone: '+1-555-0103',
        customerType: 'individual'
    },
    {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@email.com',
        phone: '+1-555-0104',
        company: 'Johnson Enterprises',
        customerType: 'enterprise'
    },
    {
        firstName: 'Bob',
        lastName: 'Brown',
        email: 'bob.brown@email.com',
        phone: '+1-555-0105',
        customerType: 'individual'
    }
];

const sampleAgents = [
    {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@company.com',
        password: 'password123',
        employeeId: 'AGT001',
        department: 'technical',
        rating: 3,
        specialties: ['password_reset', 'technical_support', 'account_management'],
        status: 'online',
        shift: { startTime: '09:00', endTime: '17:00' }
    },
    {
        firstName: 'David',
        lastName: 'Chen',
        email: 'david.chen@company.com',
        password: 'password123',
        employeeId: 'AGT002',
        department: 'billing',
        rating: 2,
        specialties: ['billing_issues', 'account_management'],
        status: 'online',
        shift: { startTime: '10:00', endTime: '18:00' }
    },
    {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@company.com',
        password: 'password123',
        employeeId: 'AGT003',
        department: 'general',
        rating: 1,
        specialties: ['feature_requests', 'account_management'],
        status: 'away',
        shift: { startTime: '08:00', endTime: '16:00' }
    }
];

async function seedDatabase() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI_KEY, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            Customer.deleteMany({}),
            Agent.deleteMany({}),
            Ticket.deleteMany({})
        ]);
        
        console.log('Cleared existing data');

        // Create customers (one by one to trigger password hashing)
        const customers = [];
        for (const customerData of sampleCustomers) {
            const customer = new Customer(customerData);
            await customer.save();
            customers.push(customer);
        }
        console.log(`Created ${customers.length} customers`);

        // Create agents (one by one to trigger password hashing)
        const agents = [];
        for (const agentData of sampleAgents) {
            const agent = new Agent(agentData);
            await agent.save();
            agents.push(agent);
        }
        console.log(`Created ${agents.length} agents`);

        // Create sample tickets
        const sampleTickets = [
            {
                subject: 'Cannot access account after password reset',
                description: 'Customer is unable to log in after requesting a password reset. They have tried multiple times but the reset email is not working properly. This is affecting their ability to access important account information.',
                customer: customers[0]._id,
                assignedAgent: agents[0]._id,
                status: 'in-progress',
                priority: 'urgent',
                category: 'technical',
                interactions: [{
                    type: 'email',
                    content: 'Customer reported issue via email support',
                    author: customers[0]._id,
                    authorType: 'Customer',
                    timestamp: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
                }]
            },
            {
                subject: 'Billing discrepancy on monthly invoice',
                description: 'Customer noticed an unexpected charge on their monthly billing statement and would like clarification on what this charge represents.',
                customer: customers[1]._id,
                assignedAgent: agents[1]._id,
                status: 'in-progress',
                priority: 'high',
                category: 'billing',
                interactions: [{
                    type: 'phone',
                    content: 'Initial phone call to understand the billing issue',
                    author: agents[1]._id,
                    authorType: 'Agent',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
                }]
            },
            {
                subject: 'Feature request: Dark mode support',
                description: 'Customer is requesting the addition of a dark mode theme for better user experience, especially for extended usage periods.',
                customer: customers[2]._id,
                status: 'open',
                priority: 'medium',
                category: 'feature_request',
                interactions: [{
                    type: 'chat',
                    content: 'Customer submitted feature request via live chat',
                    author: customers[2]._id,
                    authorType: 'Customer',
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
                }]
            },
            {
                subject: 'Website performance issues',
                description: 'The main website is loading slowly since yesterday, affecting user experience and productivity. Multiple pages are taking more than 10 seconds to load.',
                customer: customers[3]._id,
                status: 'open',
                priority: 'high',
                category: 'technical',
                interactions: [{
                    type: 'email',
                    content: 'Customer reported slow loading times across multiple pages',
                    author: customers[3]._id,
                    authorType: 'Customer',
                    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
                }]
            },
            {
                subject: 'Account upgrade assistance needed',
                description: 'Customer wants to upgrade their account to premium tier but is having trouble with the upgrade process and payment options.',
                customer: customers[4]._id,
                assignedAgent: agents[2]._id,
                status: 'pending-customer',
                priority: 'medium',
                category: 'account',
                interactions: [{
                    type: 'email',
                    content: 'Agent provided upgrade instructions via email',
                    author: agents[2]._id,
                    authorType: 'Agent',
                    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
                }]
            },
            {
                subject: 'Login issues with two-factor authentication',
                description: 'Customer cannot complete login process due to two-factor authentication not working correctly on their mobile device.',
                customer: customers[0]._id,
                status: 'open',
                priority: 'urgent',
                category: 'technical',
                interactions: []
            },
            {
                subject: 'Request for invoice copy',
                description: 'Customer needs a copy of last month\'s invoice for their accounting records.',
                customer: customers[1]._id,
                status: 'resolved',
                priority: 'low',
                category: 'billing',
                resolution: 'Invoice copy sent via email as requested',
                resolutionTime: 15, // 15 minutes
                interactions: [{
                    type: 'email',
                    content: 'Invoice copy sent to customer email address',
                    author: agents[1]._id,
                    authorType: 'Agent',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
                }]
            }
        ];

        const tickets = [];
        for (const ticketData of sampleTickets) {
            const ticket = new Ticket(ticketData);
            await ticket.save();
            tickets.push(ticket);
        }
        console.log(`Created ${tickets.length} tickets`);

        console.log('\n✅ Database seeded successfully!');
        console.log(`\nCreated:
- ${customers.length} customers
- ${agents.length} agents  
- ${tickets.length} tickets`);

        process.exit(0);

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();
