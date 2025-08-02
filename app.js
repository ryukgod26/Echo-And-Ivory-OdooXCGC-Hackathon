require('dotenv').config();
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import routers
const homeRouter = require('./routes/homeRouter');
const customerRouter = require('./routes/customerRouter');
const agentRouter = require('./routes/agentRouter');
const authRouter = require('./routes/authRouter');
const ticketsAPI = require('./routes/api/tickets');
const sessionAPI = require('./routes/api/session');

dotenv.config();

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'echo-and-ivory-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI_KEY,
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        secure: false, // set to true in production with HTTPS
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
}));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname,"public")));

// Authentication routes
app.use('/auth', authRouter);

// Use routers with authentication middleware
app.use('/', homeRouter);
app.use('/customer', authRouter.requireCustomerAuth, customerRouter);
app.use('/support_agent', authRouter.requireAgentAuth, agentRouter);

// API routes
app.use('/api/tickets', ticketsAPI);
app.use('/api/session', sessionAPI);

 mongoose.connect(process.env.MONGO_URI_KEY,{

 }).then(console.log("CONNECTED"))
 .catch((err)=>console.log(`\n NOT CONNECTED\n ${err}`))
  const port = 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Available routes:`);
    console.log(`- Home: http://localhost:${port}/`);
    console.log(`- Home: http://localhost:${port}/home`);
    console.log(`- Customer: http://localhost:${port}/customer`);
    console.log(`- Support Agent: http://localhost:${port}/support_agent`);
});