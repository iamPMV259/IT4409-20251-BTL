const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Load environment variables from .env file
// Try to load from multiple possible locations
const envPath = path.resolve(__dirname, '../../.env'); // Try parent's parent (project root)
const envPathBackend = path.resolve(__dirname, '../.env'); // Try parent (backend folder)
const envPathCurrent = path.resolve(__dirname, '.env'); // Try current (src folder)

if (require('fs').existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('📝 Loading .env from project root');
} else if (require('fs').existsSync(envPathBackend)) {
    dotenv.config({ path: envPathBackend });
    console.log('📝 Loading .env from backend folder');
} else if (require('fs').existsSync(envPathCurrent)) {
    dotenv.config({ path: envPathCurrent });
    console.log('📝 Loading .env from src folder');
} else {
    dotenv.config(); // Try default location
    console.log('📝 Loading .env from default location');
}

// Import the central router file to mount all application routes
const apiRoutes = require('./routes/CenterAPIRoutes');

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kanban Project Management API',
            version: '1.0.0',
            description: 'API documentation for Kanban Project Management system',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 8346}/api/v1`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer <token>',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/controller/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        if (!process.env.MONGO_URI) {
            console.error("FATAL ERROR: MONGO_URI is not defined.");
            process.exit(1);
        }

        const dbName = process.env.MONGO_DB_NAME || 'project_management';
        const mongoUri = `${process.env.MONGO_URI}/${dbName}`;
        
        console.log('🔄 Connecting to MongoDB...');
        console.log(`📍 URI: ${process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}/${dbName}`);
        
        await mongoose.connect(mongoUri, {
            authSource: 'admin', // Important for Docker MongoDB
        });
        
        console.log('✅ MongoDB Connected: ' + mongoose.connection.host);
        console.log('✅ Database: ' + mongoose.connection.name);

        const app = express();

        // Security Middleware: Set security HTTP headers
        app.use(helmet({
            contentSecurityPolicy: false, // Disable for Swagger UI
        }));

        // Body Parser: Allows Express to read JSON data from the request body
        app.use(express.json());
        app.use(cors());

        // Swagger UI Route
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Kanban API Documentation',
        }));

        // All routes will be prefixed with /api/v1
        app.use('/api/v1', apiRoutes);

        // Simple Health Check Route
        app.get('/', (req, res) => {
            res.json({
                message: 'Kanban API is running!',
                documentation: `http://localhost:${process.env.PORT || 8346}/api-docs`,
                version: '1.0.0',
            });
        });

        // Fallback for 404 Not Found (must be the last route)
        app.use((req, res, next) => {
            res.status(404).json({ success: false, message: 'Resource Not Found' });
        });

        // Start the server
        const PORT = process.env.PORT || 8346;
        app.listen(PORT, () => {
            console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`📚 API Documentation available at: http://localhost:${PORT}/api-docs`);
        });

    } catch (err) {
        console.error('❌ Error starting server:', err.message);
        process.exit(1);
    }
};

// Start the application
startServer();