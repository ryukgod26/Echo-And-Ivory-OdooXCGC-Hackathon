const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Ticket = require('../../models/Ticket');
const Customer = require('../../models/Customer');
const Agent = require('../../models/Agent');
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

// POST /api/tickets/:id/reply - Add reply to ticket and update status
router.post('/:id/reply', async (req, res) => {
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

        ticket.interactions.push(interaction);
        
        // Update ticket status if provided
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

module.exports = router;
