# Echo and Ivory - Customer Support Platform

A comprehensive multi-portal customer support system built for the OdooXCGC Hackathon. This platform provides separate interfaces for customers, support agents, and administrators to manage support tickets efficiently.

## 🌟 Features

### 🎫 Multi-Portal System
- **Customer Portal**: Create tickets, track progress, upload attachments, communicate with agents
- **Agent Portal**: Manage assigned tickets, respond to customers, update ticket status
- **Admin Portal**: Full system management, user administration, analytics dashboard

### 🔐 Authentication & Authorization
- Role-based access control (Customer, Agent, Admin)
- Secure session management with MongoDB store
- Protected routes with middleware authentication
- User registration and login for all portal types

### 📋 Ticket Management
- **Ticket Creation**: Rich form with priority levels, categories, and file attachments
- **File Upload Support**: Images, PDFs, Word docs, Excel files, text files, and ZIP archives
- **Real-time Status Updates**: Open, In Progress, Pending, Resolved, Closed
- **Priority System**: Low, Medium, High, Urgent with visual indicators
- **Category Management**: Dynamic categories with color coding

### 💬 Communication System
- **Threaded conversations** between customers and agents
- **File attachments** in replies and responses
- **Real-time updates** on ticket status changes
- **Email notifications** for ticket updates

### 🔍 Advanced Search & Filtering
- **Multi-criteria filtering**: Status, category, priority, date range
- **Full-text search** across ticket subjects and descriptions
- **Sorting options**: Date, priority, status, interaction count
- **Statistics dashboard** with ticket counts and metrics

### 👥 User Management
- **Customer self-registration** with email verification
- **Agent account management** by administrators
- **User profile management** with contact information
- **Role-based permissions** system

### ⭐ Interactive Features  
- **Ticket voting system** for customer feedback
- **Attachment preview** and download functionality
- **Responsive design** for mobile and desktop
- **Modern UI** with gradient themes and animations

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Express Session** with MongoDB store
- **Multer** for file upload handling
- **bcrypt** for password hashing

### Frontend
- **HTML5** with modern CSS3
- **Vanilla JavaScript** with ES6+ features
- **Responsive design** with CSS Grid and Flexbox
- **Font Awesome** icons

### Security
- **Password hashing** with bcrypt
- **Session-based authentication**
- **File upload validation**
- **XSS protection** with input sanitization

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (Local installation or MongoDB Atlas account)
- **Git** (for cloning the repository)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ryukgod26/Echo-And-Ivory-OdooXCGC-Hackathon.git
cd Echo-And-Ivory-OdooXCGC-Hackathon
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add your configuration:

```env
# MongoDB Configuration
MONGO_URI_KEY=your_mongodb_connection_string

# Session Secret (Change this to a secure random string)
SESSION_SECRET=your_super_secure_session_secret_key_here

# Server Configuration (Optional)
PORT=3000
NODE_ENV=development
```

**MongoDB Setup Options:**

**Option A: MongoDB Atlas (Cloud - Recommended)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace `your_mongodb_connection_string` with your Atlas connection string

**Option B: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/echo-ivory-support`

### 4. Create Upload Directory
```bash
mkdir uploads
```

### 5. Initialize Database (Optional)
Create test users and sample data:
```bash
npm run seed
```

Or create specific test users:
```bash
node scripts/create-test-users.js
```

## 🏃‍♂️ Running the Application

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at:
- **Main Application**: http://localhost:3000
- **Customer Portal**: http://localhost:3000/customer
- **Agent Portal**: http://localhost:3000/support_agent  
- **Admin Portal**: http://localhost:3000/admin

## 👤 Default Test Users

After running the seed script, you can use these test accounts:

### Admin Users
- **Email**: admin@echoivory.com | **Password**: Admin123!
- **Email**: manager@echoivory.com | **Password**: Manager123!
- **Email**: owner@echoivory.com | **Password**: Owner123!

### Agent Users  
- **Email**: agent1@echoivory.com | **Password**: Agent123!
- **Email**: agent2@echoivory.com | **Password**: Agent123!

### Customer Users
- **Email**: customer1@example.com | **Password**: Customer123!
- **Email**: customer2@example.com | **Password**: Customer123!

## 📁 Project Structure

```
Echo-And-Ivory-OdooXCGC-Hackathon/
├── app.js                 # Main application entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment configuration
├── seed.js               # Database seeding script
├── models/               # Mongoose data models
│   ├── User.js           # Unified user model
│   ├── Customer.js       # Customer-specific model
│   ├── Agent.js          # Agent-specific model
│   ├── Ticket.js         # Support ticket model
│   └── Category.js       # Ticket category model
├── routes/               # Express route handlers
│   ├── homeRouter.js     # Homepage routes
│   ├── customerRouter.js # Customer portal routes
│   ├── agentRouter.js    # Agent portal routes
│   ├── authRouter.js     # Authentication routes
│   └── api/              # API endpoints
│       ├── tickets.js    # Ticket management API
│       ├── session.js    # Session management API
│       └── admin.js      # Admin management API
├── middleware/           # Custom middleware
├── views/                # HTML templates
│   ├── index.html        # Homepage
│   ├── customer.html     # Customer portal
│   ├── agent.html        # Agent portal
│   ├── admin.html        # Admin portal
│   └── auth/             # Authentication pages
├── public/               # Static assets
│   ├── stylesheets/      # CSS files
│   └── javascripts/      # Client-side JS
├── uploads/              # File upload storage
└── scripts/              # Utility scripts
    └── create-test-users.js
```

## 🔧 Available Scripts

- **`npm start`** - Start the production server
- **`npm run dev`** - Start development server with nodemon
- **`npm run seed`** - Initialize database with sample data
- **`npm test`** - Run tests (placeholder)

## 🌐 API Endpoints

### Authentication
- `POST /auth/customer/login` - Customer login
- `POST /auth/customer/register` - Customer registration
- `POST /auth/agent/login` - Agent login  
- `POST /auth/admin/login` - Admin login
- `POST /auth/*/logout` - Logout (all types)

### Tickets API
- `GET /api/tickets` - Get user's tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/:id/customer-reply` - Add customer reply
- `POST /api/tickets/:id/agent-reply` - Add agent reply
- `POST /api/tickets/:id/vote` - Vote on ticket
- `PUT /api/tickets/:id/status` - Update ticket status

### Admin API
- `GET /api/admin/categories` - Get ticket categories
- `POST /api/admin/categories` - Create category
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Get all users

### Session API
- `GET /api/session/me` - Get current user info

## 🎨 Features in Detail

### Customer Portal Features
- ✅ Secure registration and login
- ✅ Create support tickets with attachments
- ✅ View all submitted tickets
- ✅ Filter and search tickets
- ✅ Real-time ticket status updates
- ✅ Reply to agent responses
- ✅ Vote on tickets for feedback
- ✅ Download attachments
- ✅ Mobile-responsive interface

### Agent Portal Features  
- ✅ Agent authentication system
- ✅ View assigned tickets
- ✅ Respond to customer queries
- ✅ Update ticket status and priority
- ✅ File attachment support in replies
- ✅ Ticket filtering and sorting
- ✅ Customer communication history
- ✅ Performance metrics dashboard

### Admin Portal Features
- ✅ Complete system administration
- ✅ User management (customers and agents)
- ✅ Ticket category management
- ✅ System analytics and reporting
- ✅ Ticket assignment and routing
- ✅ Platform configuration settings
- ✅ Advanced reporting tools
- ✅ User role management

## 🔒 Security Features

- **Password Hashing**: All passwords are encrypted using bcrypt
- **Session Management**: Secure sessions with MongoDB store
- **File Upload Security**: File type and size validation
- **Route Protection**: Authentication middleware on all protected routes
- **Input Sanitization**: XSS protection on user inputs
- **CORS Configuration**: Proper cross-origin request handling

## 🚀 Deployment

### Local Development
The application is configured to run locally on port 3000 with hot-reloading via nodemon.

### Production Deployment
1. Set `NODE_ENV=production` in your environment
2. Use a production MongoDB instance
3. Configure proper session secrets
4. Set up reverse proxy (nginx) if needed
5. Enable HTTPS and set `cookie.secure=true`

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI_KEY=your_production_mongodb_uri
SESSION_SECRET=your_super_secure_production_secret
PORT=3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the package.json file for details.

## 👨‍💻 Authors

- **Echo and Ivory Team** - *OdooXCGC Hackathon 2025*

## 🆘 Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify your MongoDB connection string
3. Ensure all dependencies are installed correctly
4. Create an issue in the GitHub repository

## 🔄 Recent Updates

- ✅ Multi-portal authentication system
- ✅ File upload and attachment system  
- ✅ Real-time ticket management
- ✅ Advanced filtering and search
- ✅ Responsive UI design
- ✅ Voting system for customer feedback
- ✅ Admin dashboard with analytics
- ✅ Test user creation scripts

---

**Built with ❤️ for the OdooXCGC Hackathon 2025**