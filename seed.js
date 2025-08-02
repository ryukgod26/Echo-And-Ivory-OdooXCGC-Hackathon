const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('./models/Customer');
const Agent = require('./models/Agent');
const Ticket = require('./models/Ticket');

// Sample data
const sampleCustomers = [
    {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+1-555-0101',
        company: 'Tech Solutions Inc',
        customerType: 'business'
    },
    {
        firstName: 'Sarah',
        lastName: 'Smith',
        email: 'sarah.smith@email.com',
        phone: '+1-555-0102',
        company: 'Marketing Pro',
        customerType: 'business'
    },
    {
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike.wilson@email.com',
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

        // Create customers
        const customers = await Customer.insertMany(sampleCustomers);
        console.log(`Created ${customers.length} customers`);

        // Create agents
        const agents = await Agent.insertMany(sampleAgents);
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
