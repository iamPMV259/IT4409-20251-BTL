// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const http = require('http'); 
const SocketService = require('./services/SocketService'); 

const envPath = path.resolve(__dirname, '../../.env');
const envPathBackend = path.resolve(__dirname, '../.env');
const envPathCurrent = path.resolve(__dirname, '.env');

if (require('fs').existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Loading .env from project root');
} else if (require('fs').existsSync(envPathBackend)) {
    dotenv.config({ path: envPathBackend });
    console.log('Loading .env from backend folder');
} else if (require('fs').existsSync(envPathCurrent)) {
    dotenv.config({ path: envPathCurrent });
    console.log('Loading .env from src folder');
} else {
    dotenv.config();
    console.log('Loading .env from default location');
}

const apiRoutes = require('./routes/CenterAPIRoutes');
const os = require('os');

function getServerIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

console.log("Server IP:", getServerIp());

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kanban Project Management API',
            version: '1.0.0',
            description: 'API documentation for Kanban Project Management system',
            contact: { name: 'API Support' },
        },
        servers: [
            {
                url: `http://${getServerIp()}:${process.env.PORT || 8346}/api/v1`,
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
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js', './src/controller/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Start server
const startServer = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("FATAL ERROR: MONGO_URI is not defined.");
            process.exit(1);
        }

        const dbName = process.env.MONGO_DB_NAME || 'project_management';
        const mongoUri = `${process.env.MONGO_URI}/${dbName}`;
        
        console.log('Connecting to MongoDB...');
        // Hide password log
        console.log(`📍 URI: ${process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}/${dbName}`);
        
        await mongoose.connect(mongoUri, {
            authSource: 'admin',
        });
        
        console.log('MongoDB Connected: ' + mongoose.connection.host);
        console.log('Database: ' + mongoose.connection.name);

        const app = express();

        app.use(helmet({
            contentSecurityPolicy: false,
        }));

        app.use(express.json());
        app.use(cors());

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Kanban API Documentation',
        }));

        app.use('/api/v1', apiRoutes);

        app.get('/', (req, res) => {
            res.json({
                message: 'Kanban API is running!',
                documentation: `http://localhost:${process.env.PORT || 8346}/api-docs`,
                version: '1.0.0',
            });
        });

        app.use((req, res, next) => {
            res.status(404).json({ success: false, message: 'Resource Not Found' });
        });

        // --- SETUP SERVER WITH SOCKET.IO ---
        const httpServer = http.createServer(app);
        
        // Initialize Socket
        SocketService.init(httpServer);

        const PORT = process.env.PORT || 8346;
        
        // Use httpServer.listen instead of app.listen
        httpServer.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`Socket.io is ready`);
            console.log(`API Documentation available at: http://localhost:${PORT}/api-docs`);
        });

    } catch (err) {
        console.error('Error starting server:', err.message);
        process.exit(1);
    }
};

startServer();