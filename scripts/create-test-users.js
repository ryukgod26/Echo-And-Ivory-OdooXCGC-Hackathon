const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/User');
const Customer = require('../models/Customer');
const Agent = require('../models/Agent');

async function createTestUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI_KEY);
        console.log('Connected to MongoDB');

        // Test Admin Users
        const adminUsers = [
            {
                email: 'admin@echoivory.com',
                password: 'Admin123!',
                firstName: 'Super',
                lastName: 'Admin',
                role: 'admin',
                permissions: ['user_management', 'category_management', 'system_settings', 'view_reports']
            },
            {
                email: 'manager@echoivory.com',
                password: 'Manager123!',
                firstName: 'System',
                lastName: 'Manager',
                role: 'admin',
                permissions: ['user_management', 'category_management', 'view_reports']
            },
            {
                email: 'owner@echoivory.com',
                password: 'Owner123!',
                firstName: 'Business',
                lastName: 'Owner',
                role: 'admin',
                permissions: ['user_management', 'category_management', 'system_settings', 'view_reports', 'full_access']
            }
        ];

        // Test Agent Users
        const agentUsers = [
            {
                email: 'agent1@echoivory.com',
                password: 'Agent123!',
                firstName: 'John',
                lastName: 'Support',
                role: 'agent'
            },
            {
                email: 'agent2@echoivory.com',
                password: 'Agent456!',
                firstName: 'Sarah',
                lastName: 'Helper',
                role: 'agent'
            }
        ];

        // Test Customer Users
        const customerUsers = [
            {
                email: 'customer1@test.com',
                password: 'Customer123!',
                firstName: 'Alice',
                lastName: 'Johnson',
                role: 'customer'
            },
            {
                email: 'customer2@test.com',
                password: 'Customer456!',
                firstName: 'Bob',
                lastName: 'Smith',
                role: 'customer'
            }
        ];

        console.log('\n=== CREATING TEST USERS ===\n');

        // Create Admin Users
        console.log('📱 ADMIN USERS:');
        console.log('===============');
        for (const userData of adminUsers) {
            try {
                // Check if user already exists
                const existingUser = await User.findOne({ email: userData.email });
                if (existingUser) {
                    console.log(`❌ Admin user ${userData.email} already exists`);
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                
                // Create user
                const user = new User({
                    email: userData.email,
                    password: hashedPassword,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role,
                    permissions: userData.permissions || []
                });

                await user.save();
                console.log(`✅ Created admin: ${userData.email}`);
                console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
                console.log(`   Password: ${userData.password}`);
                console.log(`   ID: ${user._id}`);
                console.log('');
            } catch (error) {
                console.log(`❌ Error creating admin ${userData.email}:`, error.message);
            }
        }

        // Create Agent Users
        console.log('👥 AGENT USERS:');
        console.log('===============');
        for (const userData of agentUsers) {
            try {
                // Check if user already exists in User model
                const existingUser = await User.findOne({ email: userData.email });
                if (existingUser) {
                    console.log(`❌ Agent user ${userData.email} already exists in User model`);
                    continue;
                }

                // Check if agent already exists in Agent model
                const existingAgent = await Agent.findOne({ email: userData.email });
                if (existingAgent) {
                    console.log(`❌ Agent ${userData.email} already exists in Agent model`);
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                
                // Create in User model
                const user = new User({
                    email: userData.email,
                    password: hashedPassword,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role
                });
                await user.save();

                // Create in Agent model for backward compatibility
                const agent = new Agent({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    password: hashedPassword,
                    department: 'Support',
                    rating: 4.5
                });
                await agent.save();

                console.log(`✅ Created agent: ${userData.email}`);
                console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
                console.log(`   Password: ${userData.password}`);
                console.log(`   User ID: ${user._id}`);
                console.log(`   Agent ID: ${agent._id}`);
                console.log('');
            } catch (error) {
                console.log(`❌ Error creating agent ${userData.email}:`, error.message);
            }
        }

        // Create Customer Users
        console.log('👤 CUSTOMER USERS:');
        console.log('==================');
        for (const userData of customerUsers) {
            try {
                // Check if user already exists in User model
                const existingUser = await User.findOne({ email: userData.email });
                if (existingUser) {
                    console.log(`❌ Customer user ${userData.email} already exists in User model`);
                    continue;
                }

                // Check if customer already exists in Customer model
                const existingCustomer = await Customer.findOne({ email: userData.email });
                if (existingCustomer) {
                    console.log(`❌ Customer ${userData.email} already exists in Customer model`);
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                
                // Create in User model
                const user = new User({
                    email: userData.email,
                    password: hashedPassword,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role
                });
                await user.save();

                // Create in Customer model for backward compatibility
                const customer = new Customer({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    password: hashedPassword
                });
                await customer.save();

                console.log(`✅ Created customer: ${userData.email}`);
                console.log(`   Name: ${userData.firstName} ${userData.lastName}`);
                console.log(`   Password: ${userData.password}`);
                console.log(`   User ID: ${user._id}`);
                console.log(`   Customer ID: ${customer._id}`);
                console.log('');
            } catch (error) {
                console.log(`❌ Error creating customer ${userData.email}:`, error.message);
            }
        }

        console.log('\n=== SUMMARY ===');
        console.log('🔧 Admin Login URL: http://localhost:3000/admin');
        console.log('👥 Agent Login URL: http://localhost:3000/auth/agent/login');
        console.log('👤 Customer Login URL: http://localhost:3000/auth/customer/login');
        console.log('🌐 Unified Login URL: http://localhost:3000/auth/login');
        
        console.log('\n📋 QUICK REFERENCE:');
        console.log('===================');
        console.log('ADMIN CREDENTIALS:');
        adminUsers.forEach(user => {
            console.log(`• ${user.email} / ${user.password}`);
        });
        
        console.log('\nAGENT CREDENTIALS:');
        agentUsers.forEach(user => {
            console.log(`• ${user.email} / ${user.password}`);
        });
        
        console.log('\nCUSTOMER CREDENTIALS:');
        customerUsers.forEach(user => {
            console.log(`• ${user.email} / ${user.password}`);
        });

        console.log('\n✨ Test users created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating test users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the script
createTestUsers();
