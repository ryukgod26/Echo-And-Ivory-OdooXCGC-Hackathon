document.addEventListener('DOMContentLoaded', () => {
    const tickets = [
        {
            id: 'T001',
            title: 'Website performance issues',
            description: 'The main website is loading slowly since yesterday, affecting user experience.',
            status: 'Open',
            priority: 'High',
            created: '2 hours ago',
            customer: 'alice.johnson@email.com'
        },
        {
            id: 'T002',
            title: 'Cannot reset password',
            description: 'Customer is not receiving the password reset email after multiple attempts.',
            status: 'In Progress',
            priority: 'Medium',
            created: '5 hours ago',
            customer: 'bob.smith@email.com'
        },
        {
            id: 'T003',
            title: 'Feature request: Export functionality',
            description: 'Customer requesting the ability to export data to CSV format.',
            status: 'Open',
            priority: 'Low',
            created: '1 day ago',
            customer: 'carol.davis@email.com'
        },
        {
            id: 'T004',
            title: 'Billing inquiry resolved',
            description: 'Successfully resolved customer billing discrepancy and provided refund.',
            status: 'Closed',
            priority: 'Medium',
            created: '2 days ago',
            customer: 'david.wilson@email.com'
        }
    ];

    const ticketList = document.getElementById('ticket-list');

    if (ticketList) {
        tickets.forEach(ticket => {
            const ticketElement = document.createElement('div');
            ticketElement.classList.add('ticket');

            const statusClass = ticket.status.toLowerCase().replace(' ', '-');
            const priorityColor = getPriorityColor(ticket.priority);

            ticketElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <h3 style="margin: 0 0 5px 0; color: #333;">${ticket.title}</h3>
                        <small style="color: #666;">Ticket #${ticket.id} • ${ticket.customer}</small>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="priority" style="background: ${priorityColor.bg}; color: ${priorityColor.text}; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">${ticket.priority}</span>
                        <span class="status ${statusClass}">${ticket.status}</span>
                    </div>
                </div>
                <p style="margin: 10px 0; color: #555; line-height: 1.5;">${ticket.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <small style="color: #888;">Created: ${ticket.created}</small>
                    <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="viewTicket('${ticket.id}')">View Details</button>
                </div>
            `;

            ticketList.appendChild(ticketElement);
        });
    }

    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="/"]').forEach(link => {
        link.addEventListener('click', function(e) {
            // Add a subtle loading effect
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 200);
        });
    });

    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

function getPriorityColor(priority) {
    const colors = {
        'Low': { bg: '#e3f2fd', text: '#1565c0' },
        'Medium': { bg: '#e8f5e8', text: '#2e7d32' },
        'High': { bg: '#fff3e0', text: '#ef6c00' },
        'Urgent': { bg: '#ffebee', text: '#c62828' }
    };
    return colors[priority] || colors['Medium'];
}

function viewTicket(ticketId) {
    // Simulate opening ticket details
    alert(`Opening ticket ${ticketId} details...\n\nThis would typically navigate to a detailed ticket view or open a modal with complete ticket information.`);
}

// Add some interactive elements
function animateOnScroll() {
    const elements = document.querySelectorAll('.feature-card, .ticket');
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Initialize animations when page loads
window.addEventListener('load', () => {
    // Add initial animation styles
    document.querySelectorAll('.feature-card, .ticket').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.6s ease';
    });
    
    // Trigger animations
    setTimeout(animateOnScroll, 300);
});