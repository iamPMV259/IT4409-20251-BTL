const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import the central router file to mount all application routes
const apiRoutes = require('./routes/CenterAPIRoutes');

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        if (!process.env.MONGO_URI) {
            console.error("FATAL ERROR: MONGO_URI is not defined.");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log(' MongoDB Connected: ' + mongoose.connection.host);

        const app = express();

        // Security Middleware: Set security HTTP headers
        app.use(helmet());

        // Body Parser: Allows Express to read JSON data from the request body
        app.use(express.json());
        app.use(cors());

        // All routes will be prefixed with /api/v1
        app.use('/api/v1', apiRoutes);

        // Simple Health Check Route
        app.get('/', (req, res) => {
            res.send('Kanban API is running!');
        });

        // Fallback for 404 Not Found (must be the last route)
        app.use((req, res, next) => {
            res.status(404).json({ success: false, message: 'Resource Not Found' });
        });

        // Start the server
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

    } catch (err) {
        console.error('Error starting server:', err.message);
        process.exit(1);
    }
};

// Start the application
startServer();