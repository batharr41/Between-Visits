import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'CareOps Signal AI',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      checkIns: '/api/check-ins',
      dashboard: '/api/agencies/:agencyId/dashboard',
      triageQueue: '/api/agencies/:agencyId/triage-queue',
      patients: '/api/agencies/:agencyId/patients',
      trends: '/api/patients/:patientId/trends',
      reports: '/api/agencies/:agencyId/reports/weekly'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        🏥 CareOps Signal AI Server Running           ║
║                                                       ║
║        Port: ${PORT}                                    ║
║        Environment: ${process.env.NODE_ENV || 'development'}                       ║
║        Time: ${new Date().toLocaleString()}      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📡 API Endpoints:
   • http://localhost:${PORT}/api/health
   • http://localhost:${PORT}/api/check-ins
   • http://localhost:${PORT}/api/agencies/:id/dashboard
   • http://localhost:${PORT}/api/agencies/:id/triage-queue

🔄 Background Jobs:
   • LLM Summary Generation
   • Risk Explanation Generation  
   • Triage Guidance Generation

⚠️  Make sure Redis is running for queue processing
⚠️  Make sure PostgreSQL is set up (run: npm run setup-db)
  `);
});

export default app;
