const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Ticket = require('../../models/Ticket');
const Customer = require('../../models/Customer');
const Agent = require('../../models/Agent');
const User = require('../../models/User');
const { upload } = require('../../middleware/upload');


// GET /api/tickets - Fetch all tickets with filtering options
router.get('/', async (req, res) => {
    try {
        const { 
            status, 
            priority, 
            category, 
            assignedAgent, 
            customer,
            customerEmail,
            limit = 50,
            skip = 0,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;
        if (assignedAgent) filter.assignedAgent = assignedAgent;
        if (customer) filter.customer = customer;
        
        // If customerEmail is provided, find customer by email and filter by customer ID
        if (customerEmail) {
            const customerDoc = await Customer.findOne({ email: customerEmail });
            if (customerDoc) {
                filter.customer = customerDoc._id;
            } else {
                // If customer doesn't exist, return empty results
                return res.json({ 
                    tickets: [], 
                    total: 0,
                    message: 'No customer found with that email'
                });
            }
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const tickets = await Ticket.find(filter)
            .populate('customer', 'firstName lastName email company')
            .populate('assignedAgent', 'firstName lastName email department')
            .sort(sort)
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .lean();

        // Format tickets for frontend
        const formattedTickets = tickets.map(ticket => ({
            id: ticket._id,
            ticketId: ticket.ticketId,
            subject: ticket.subject,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
            customer: ticket.customer ? {
                name: `${ticket.customer.firstName} ${ticket.customer.lastName}`,
                email: ticket.customer.email,
                company: ticket.customer.company
            } : null,
            assignedAgent: ticket.assignedAgent ? {
                name: `${ticket.assignedAgent.firstName} ${ticket.assignedAgent.lastName}`,
                email: ticket.assignedAgent.email,
                department: ticket.assignedAgent.department
            } : null,
            createdAt: ticket.createdAt,
            lastUpdated: ticket.lastUpdated,
            ageInHours: Math.floor((new Date() - new Date(ticket.createdAt)) / (1000 * 60 * 60)),
            isOverdue: ticket.dueDate ? new Date() > new Date(ticket.dueDate) : false,
            interactionCount: ticket.interactions ? ticket.interactions.length : 0
        }));

        res.json({
            success: true,
            tickets: formattedTickets,
            total: await Ticket.countDocuments(filter)
        });

    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tickets',
            error: error.message
        });
    }
});

// GET /api/tickets/:id - Fetch single ticket
router.get('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('customer', 'firstName lastName email phone company')
            .populate('assignedAgent', 'firstName lastName email department rating')
            .populate('interactions.author');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        res.json({
            success: true,
            ticket
        });

    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching ticket',
            error: error.message
        });
    }
});

// POST /api/tickets - Create new ticket with optional file attachments
router.post('/', upload.array('attachments', 5), async (req, res) => {
    try {
        const {
            subject,
            description,
            customerId,
            customerEmail,
            priority = 'medium',
            category
        } = req.body;

        // Validate required fields
        if (!subject || !description || !category) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: subject, description, category'
            });
        }

        let customer;

        // If customerId is provided, use it
        if (customerId) {
            customer = await Customer.findById(customerId);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }
        } 
        // If customerEmail is provided, find or create customer
        else if (customerEmail) {
            customer = await Customer.findOne({ email: customerEmail });
            
            // If customer doesn't exist, create a basic customer record
            if (!customer) {
                const emailParts = customerEmail.split('@');
                const firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
                
                customer = new Customer({
                    firstName: firstName,
                    lastName: 'Customer', // Default last name
                    email: customerEmail,
                    customerType: 'individual'
                });
                
                await customer.save();
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either customerId or customerEmail is required'
            });
        }

        const ticket = new Ticket({
            subject,
            description,
            customer: customer._id,
            priority,
            category
        });

        // Handle file attachments
        if (req.files && req.files.length > 0) {
            const attachments = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: `/uploads/tickets/${file.filename}`,
                uploadedBy: customer._id,
                uploadedByType: 'Customer',
                uploadDate: new Date()
            }));
            ticket.attachments = attachments;
        }

        await ticket.save();

        // Populate customer data for response
        await ticket.populate('customer', 'firstName lastName email');

        // Send email notification to customer
        const customerName = `${ticket.customer.firstName} ${ticket.customer.lastName}`;
        await sendEmailNotification(
            ticket.customer.email,
            `Ticket Created: ${ticket.subject}`,
            `Dear ${customerName},

Your support ticket has been created successfully.

Subject: ${ticket.subject}
Priority: ${ticket.priority}
Status: ${ticket.status}

We will review your request and get back to you soon.

Thank you for contacting our support team.`,
            ticket.ticketId
        );

        res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            ticket: {
                id: ticket._id,
                ticketId: ticket.ticketId,
                subject: ticket.subject,
                description: ticket.description,
                status: ticket.status,
                priority: ticket.priority,
                category: ticket.category,
                customer: {
                    name: `${ticket.customer.firstName} ${ticket.customer.lastName}`,
                    email: ticket.customer.email
                },
                attachments: ticket.attachments,
                createdAt: ticket.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating ticket',
            error: error.message
        });
    }
});

// PUT /api/tickets/:id/assign - Assign ticket to agent
router.put('/:id/assign', async (req, res) => {
    try {
        const { agentId } = req.body;

        if (!agentId) {
            return res.status(400).json({
                success: false,
                message: 'Agent ID is required'
            });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        await ticket.assignToAgent(agentId);

        res.json({
            success: true,
            message: 'Ticket assigned successfully',
            ticket
        });

    } catch (error) {
        console.error('Error assigning ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning ticket',
            error: error.message
        });
    }
});

// POST /api/tickets/:id/assign - Enhanced assignment with actions
router.post('/:id/assign', async (req, res) => {
    try {
        const { action, agentId } = req.body;

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        let targetAgentId = agentId;

        // Handle assign-to-me action
        if (action === 'assign-to-me') {
            // Get current agent from session
            if (req.session && req.session.user && req.session.user.role === 'agent') {
                targetAgentId = req.session.user.id;
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Must be logged in as an agent to assign to yourself'
                });
            }
        }

        if (!targetAgentId) {
            return res.status(400).json({
                success: false,
                message: 'Agent ID is required'
            });
        }

        // Find agent (could be from User or Agent model depending on implementation)
        let agent = await User.findById(targetAgentId);
        if (!agent || agent.role !== 'agent') {
            agent = await Agent.findById(targetAgentId);
            if (!agent) {
                return res.status(404).json({
                    success: false,
                    message: 'Agent not found'
                });
            }
        }

        // Update ticket assignment
        ticket.assignedAgent = targetAgentId;
        if (ticket.status === 'open') {
            ticket.status = 'in-progress';
        }
        await ticket.save();

        // Populate the assigned agent for response
        await ticket.populate('assignedAgent', 'firstName lastName email role');

        res.json({
            success: true,
            message: 'Ticket assigned successfully',
            ticket
        });

    } catch (error) {
        console.error('Error assigning ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning ticket',
            error: error.message
        });
    }
});

// POST /api/tickets/:id/status - Update ticket status
router.post('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.status = status;
        await ticket.save();

        await ticket.populate(['customer', 'assignedAgent', 'category']);

        res.json({
            success: true,
            message: 'Ticket status updated successfully',
            ticket
        });

    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating ticket status',
            error: error.message
        });
    }
});

// GET /api/tickets/stats/dashboard - Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
    try {
        const stats = await Promise.all([
            Ticket.countDocuments({ status: { $in: ['open', 'in-progress'] } }),
            Ticket.countDocuments({ status: 'in-progress' }),
            Ticket.countDocuments({ 
                status: 'resolved',
                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }),
            Ticket.aggregate([
                { $match: { status: 'resolved', resolutionTime: { $exists: true } } },
                { $group: { _id: null, avgTime: { $avg: '$resolutionTime' } } }
            ])
        ]);

        const avgResolutionTime = stats[3][0]?.avgTime || 0;

        res.json({
            success: true,
            stats: {
                pendingTickets: stats[0],
                inProgressTickets: stats[1],
                resolvedToday: stats[2],
                avgResponseTime: `${(avgResolutionTime / 60).toFixed(1)}h`
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
});

// GET /api/tickets/stats/team - Get team status statistics
router.get('/stats/team', async (req, res) => {
    try {
        // Get agent counts by status
        const [onlineCount, awayCount, busyCount, offlineCount, totalAgents] = await Promise.all([
            Agent.countDocuments({ status: 'online' }),
            Agent.countDocuments({ status: 'away' }),
            Agent.countDocuments({ status: 'busy' }),
            Agent.countDocuments({ status: 'offline' }),
            Agent.countDocuments({})
        ]);

        // Get detailed agent information
        const agents = await Agent.find({}, 'firstName lastName status department lastActivity')
            .sort({ status: 1, lastName: 1 });

        // Group agents by status
        const agentsByStatus = {
            online: agents.filter(agent => agent.status === 'online'),
            away: agents.filter(agent => agent.status === 'away'),
            busy: agents.filter(agent => agent.status === 'busy'),
            offline: agents.filter(agent => agent.status === 'offline')
        };

        res.json({
            success: true,
            teamStatus: {
                online: onlineCount,
                away: awayCount,
                busy: busyCount,
                offline: offlineCount,
                total: totalAgents
            },
            agents: agentsByStatus
        });

    } catch (error) {
        console.error('Error fetching team status:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team status',
            error: error.message
        });
    }
});

// POST /api/tickets/:id/reply - Add reply to ticket and update status with optional attachments
router.post('/:id/reply', upload.array('attachments', 5), async (req, res) => {
    try {
        const { message, status } = req.body;
        const ticketId = req.params.id;

        console.log('Reply request received:', { ticketId, message: message?.substring(0, 50) + '...', status });

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ticket ID format'
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Reply message is required'
            });
        }

        // Find the ticket
        const ticket = await Ticket.findById(ticketId);
        console.log('Ticket found:', ticket ? `ID: ${ticket._id}, Subject: ${ticket.subject}` : 'Not found');
        
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Get agent info from session (assuming agent is logged in)
        console.log('Session data:', req.session);
        console.log('Session agent:', req.session.agent);
        
        const agentId = req.session.agent?.id;
        console.log('Agent ID from session:', agentId);
        
        if (!agentId) {
            return res.status(401).json({
                success: false,
                message: 'Agent not authenticated',
                debug: {
                    sessionExists: !!req.session,
                    agentExists: !!req.session.agent,
                    sessionData: req.session
                }
            });
        }

        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(401).json({
                success: false,
                message: 'Agent not found'
            });
        }

        // Add interaction to ticket
        const interaction = {
            type: 'email', // Using email as the reply type
            content: message.trim(),
            author: agentId,
            authorType: 'Agent',
            timestamp: new Date(),
            isInternal: false // This is a customer-facing reply
        };

        // Handle file attachments for the reply
        if (req.files && req.files.length > 0) {
            const attachments = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: `/uploads/tickets/${file.filename}`,
                uploadDate: new Date()
            }));
            interaction.attachments = attachments;
        }

        ticket.interactions.push(interaction);
        
        // Update ticket status if provided
        const oldStatus = ticket.status;
        if (status && ['open', 'in-progress', 'pending-customer', 'resolved', 'closed'].includes(status)) {
            ticket.status = status;
        }

        // Assign agent to ticket if not already assigned
        if (!ticket.assignedAgent) {
            ticket.assignedAgent = agentId;
        }

        // Update lastUpdated timestamp
        ticket.lastUpdated = new Date();

        // Save the ticket
        console.log('Saving ticket...');
        await ticket.save();
        console.log('Ticket saved successfully');

        // Send email notification if status changed
        if (oldStatus !== ticket.status) {
            await ticket.populate('customer', 'firstName lastName email');
            const customerName = `${ticket.customer.firstName} ${ticket.customer.lastName}`;
            
            await sendEmailNotification(
                ticket.customer.email,
                `Ticket Status Update: ${ticket.subject}`,
                `Dear ${customerName},

The status of your support ticket has been updated.

Ticket: ${ticket.subject}
Previous Status: ${oldStatus}
New Status: ${ticket.status}
Agent Reply: ${message}

You can view the full conversation and reply to this ticket by logging into your account.

Thank you for your patience.`,
                ticket.ticketId
            );
        }

        console.log('Sending response...');
        
        // Send a simplified response to avoid potential serialization issues
        return res.json({
            success: true,
            message: 'Reply sent successfully',
            ticketId: ticketId,
            newStatus: ticket.status,
            agentAssigned: !!ticket.assignedAgent
        });

    } catch (error) {
        console.error('Error sending reply:', error);
        
        // Check if response was already sent
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error sending reply',
                error: error.message
            });
        }
    }
});

// POST /api/tickets/:id/customer-reply - Add customer reply to ticket with optional attachments
router.post('/:id/customer-reply', upload.array('attachments', 5), async (req, res) => {
    try {
        const { message } = req.body;
        const ticketId = req.params.id;

        console.log('Customer reply request received:', { ticketId, message: message?.substring(0, 50) + '...' });

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ticket ID format'
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Reply message is required'
            });
        }

        // Find the ticket
        const ticket = await Ticket.findById(ticketId);
        console.log('Ticket found:', ticket ? `ID: ${ticket._id}, Subject: ${ticket.subject}` : 'Not found');
        
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Get customer info from session
        console.log('Session data:', req.session);
        console.log('Session customer:', req.session.customer);
        
        const customerId = req.session.customer?.id;
        console.log('Customer ID from session:', customerId);
        
        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Customer not authenticated',
                debug: {
                    sessionExists: !!req.session,
                    customerExists: !!req.session.customer,
                    sessionData: req.session
                }
            });
        }

        // Verify the customer owns this ticket
        if (ticket.customer.toString() !== customerId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You can only reply to your own tickets'
            });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(401).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Add interaction to ticket
        const interaction = {
            type: 'email', // Using email as the reply type
            content: message.trim(),
            author: customerId,
            authorType: 'Customer',
            timestamp: new Date(),
            isInternal: false
        };

        // Handle file attachments for the reply
        if (req.files && req.files.length > 0) {
            const attachments = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: `/uploads/tickets/${file.filename}`,
                uploadDate: new Date()
            }));
            interaction.attachments = attachments;
        }

        ticket.interactions.push(interaction);
        
        // Update ticket status to 'open' if customer replies (indicating they need further assistance)
        if (ticket.status === 'pending-customer' || ticket.status === 'resolved') {
            ticket.status = 'open';
        }

        // Update lastUpdated timestamp
        ticket.lastUpdated = new Date();

        // Save the ticket
        console.log('Saving ticket...');
        await ticket.save();
        console.log('Ticket saved successfully');

        console.log('Sending response...');
        
        // Send a simplified response
        return res.json({
            success: true,
            message: 'Reply sent successfully',
            ticketId: ticketId,
            newStatus: ticket.status,
            interactionCount: ticket.interactions.length
        });

    } catch (error) {
        console.error('Error sending customer reply:', error);
        
        // Check if response was already sent
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error sending reply',
                error: error.message
            });
        }
    }
});

// Agent create ticket endpoint
router.post('/agent/create', upload.array('attachments', 5), async (req, res) => {
    try {        
        const { customerEmail, subject, description, priority, category, assignToMe } = req.body;
        
        if (!customerEmail || !subject || !description) {
            return res.status(400).json({ error: 'Customer email, subject, and description are required' });
        }

        // Check if customer exists, create if not
        let customer = await User.findOne({ email: customerEmail });
        if (!customer) {
            // Create a basic customer account
            customer = new User({
                name: customerEmail.split('@')[0], // Use email prefix as default name
                email: customerEmail,
                role: 'customer'
            });
            await customer.save();
        }

        // Prepare attachments array
        const attachments = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                attachments.push({
                    filename: file.filename,
                    originalName: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadDate: new Date()
                });
            });
        }

        // Create the ticket
        const ticket = new Ticket({
            subject,
            description,
            priority: priority || 'medium',
            category: category || 'general',
            customer: customer._id,
            attachments,
            status: 'open',
            assignedAgent: assignToMe === 'on' ? req.session.user.id : null
        });

        await ticket.save();
        
        // Populate customer info for response
        await ticket.populate('customer', 'name email');
        if (ticket.assignedAgent) {
            await ticket.populate('assignedAgent', 'name email');
        }

        res.json({ 
            success: true, 
            message: 'Ticket created successfully',
            ticket 
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// Vote on ticket endpoint
router.post('/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        
        if (!req.session.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({ error: 'Valid vote type (upvote/downvote) required' });
        }
        
        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        const userId = req.session.user.id;
        
        // Check if user has already voted
        const existingVoteIndex = ticket.votes.findIndex(vote => vote.user.toString() === userId);
        
        if (existingVoteIndex !== -1) {
            const existingVote = ticket.votes[existingVoteIndex];
            
            if (existingVote.voteType === voteType) {
                // User is trying to vote the same way again - remove the vote
                ticket.votes.splice(existingVoteIndex, 1);
                
                if (voteType === 'upvote') {
                    ticket.upvotes = Math.max(0, ticket.upvotes - 1);
                } else {
                    ticket.downvotes = Math.max(0, ticket.downvotes - 1);
                }
            } else {
                // User is changing their vote
                ticket.votes[existingVoteIndex].voteType = voteType;
                ticket.votes[existingVoteIndex].timestamp = new Date();
                
                if (voteType === 'upvote') {
                    ticket.upvotes += 1;
                    ticket.downvotes = Math.max(0, ticket.downvotes - 1);
                } else {
                    ticket.downvotes += 1;
                    ticket.upvotes = Math.max(0, ticket.upvotes - 1);
                }
            }
        } else {
            // New vote
            ticket.votes.push({
                user: userId,
                voteType: voteType,
                timestamp: new Date()
            });
            
            if (voteType === 'upvote') {
                ticket.upvotes += 1;
            } else {
                ticket.downvotes += 1;
            }
        }
        
        await ticket.save();
        
        // Prepare response with user vote info
        const userVote = ticket.votes.find(vote => vote.user.toString() === userId);
        const responseTicket = {
            _id: ticket._id,
            upvotes: ticket.upvotes,
            downvotes: ticket.downvotes,
            userVote: userVote ? userVote.voteType : null
        };
        
        res.json({ 
            success: true, 
            message: 'Vote recorded successfully',
            ticket: responseTicket
        });
        
    } catch (error) {
        console.error('Error voting on ticket:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

// Email notification service using Web3Forms
async function sendEmailNotification(to, subject, message, ticketId) {
    try {
        const emailData = {
            access_key: 'b75155a8-aea9-4ebf-96de-5cf0475952b3',
            to: to,
            subject: subject,
            message: `
                ${message}
                
                Ticket ID: ${ticketId}
                
                You can view this ticket at: ${process.env.BASE_URL || 'http://localhost:3000'}
                
                ---
                Support Ticket System
            `
        };
        
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('Email notification sent successfully to:', to);
        } else {
            console.error('Failed to send email notification:', result);
        }
    } catch (error) {
        console.error('Error sending email notification:', error);
    }
}

module.exports = router;
