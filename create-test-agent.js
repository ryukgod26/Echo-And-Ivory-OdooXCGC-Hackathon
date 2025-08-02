const mongoose = require('mongoose');
require('dotenv').config();
const Agent = require('./models/Agent');

async function createTestAgent() {
    try {
        await mongoose.connect(process.env.MONGO_URI_KEY);
        console.log('Connected to MongoDB');
        
        // Clear existing agents
        await Agent.deleteMany({});
        console.log('Cleared existing agents');
        
        // Create a test agent
        const testAgent = new Agent({
            firstName: 'Test',
            lastName: 'Agent',
            email: 'test.agent@company.com',
            password: 'password123',
            employeeId: 'TEST001',
            department: 'technical'
        });
        
        await testAgent.save();
        console.log('Created test agent:', testAgent.email);
        
        // Test login
        const foundAgent = await Agent.findOne({ email: 'test.agent@company.com' });
        if (foundAgent) {
            const isMatch = await foundAgent.comparePassword('password123');
            console.log('Password test:', isMatch ? 'PASS' : 'FAIL');
        }
        
        await mongoose.disconnect();
        console.log('Test completed successfully');
    } catch (error) {
        console.error('Error:', error);
    }
}

createTestAgent();
