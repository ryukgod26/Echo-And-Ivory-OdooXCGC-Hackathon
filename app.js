require('dotenv').config();
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Import routers
const homeRouter = require('./routes/homeRouter');
const customerRouter = require('./routes/customerRouter');
const agentRouter = require('./routes/agentRouter');
const ticketsAPI = require('./routes/api/tickets');

dotenv.config();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname,"public")));

// Use routers
app.use('/', homeRouter);
app.use('/', customerRouter);
app.use('/', agentRouter);

// API routes
app.use('/api/tickets', ticketsAPI);

 mongoose.connect(process.env.MONGO_URI_KEY,{

 }).then(console.log("CONNECTED"))
 .catch((err)=>console.log(`\n NOT CONNECTED\n ${err}`))
  const port = 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Available routes:`);
    console.log(`- Home: http://localhost:${port}/`);
    console.log(`- Home: http://localhost:${port}/home`);
    console.log(`- Customer: http://localhost:${port}/customer`);
    console.log(`- Support Agent: http://localhost:${port}/support_agent`);
});