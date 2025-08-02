const mongoose = require('mongoose');
require('dotenv').config();
const Agent = require('./models/Agent');

async function testAgentAuth() {
    try {
        await mongoose.connect(process.env.MONGO_URI_KEY);
        console.log('Connected to MongoDB');
        
        // Check if agents exist
        const agents = await Agent.find({});
        console.log(`Found ${agents.length} agents in database:`);
        
        agents.forEach(agent => {
            console.log(`- ${agent.firstName} ${agent.lastName} (${agent.email}) - Employee ID: ${agent.employeeId}`);
        });
        
        // Test password for the first agent
        if (agents.length > 0) {
            const testAgent = agents[0];
            console.log(`\nTesting password for ${testAgent.email}:`);
            
            const isMatch = await testAgent.comparePassword('password123');
            console.log(`Password 'password123' matches: ${isMatch}`);
            
            if (!isMatch) {
                console.log('Password hash:', testAgent.password);
            }
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

testAgentAuth();
