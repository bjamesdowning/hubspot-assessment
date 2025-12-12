require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory (for easy frontend development)
app.use(express.static(path.join(__dirname, 'public')));

// HubSpot API configuration
const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Validate token on startup
if (!HUBSPOT_TOKEN) {
  console.error('❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in .env file');
  console.error('Please create a .env file and add your HubSpot Private App token');
  process.exit(1);
}

const { GoogleGenerativeAI } = require("@google/generative-ai");
const GEMINI_TOKEN = process.env.GEMINI_TOKEN;

if (!GEMINI_TOKEN) {
  console.error('❌ ERROR: GEMINI_TOKEN not found in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });





// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// GET endpoint - Fetch contacts from HubSpot
app.get('/api/contacts', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50,
          properties: 'firstname,lastname,email,phone,address,jobtitle,company'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// POST endpoint - Create new contact in HubSpot
app.post('/api/contacts', async (req, res, next) => {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        properties: req.body.properties
      },
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// GET endpoint - Fetch all deals from HubSpot
app.get('/api/deals', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50,
          properties: 'dealname,amount,dealstage,closedate,pipeline'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// POST endpoint - Create new deal and associate to contact
app.post('/api/deals', async (req, res, next) => {
  try {
    const { dealProperties, contactId } = req.body;

    // Create the deal with association to contact
    const dealResponse = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        properties: dealProperties,
        associations: contactId ? [{
          to: { id: contactId },
          types: [{
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 3 // Deal to Contact association
          }]
        }] : []
      },
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(dealResponse.data);
  } catch (error) {
    next(error);
  }
});

// GET endpoint - Fetch deals associated with a specific contact
app.get('/api/contacts/:contactId/deals', async (req, res, next) => {
  try {
    const { contactId } = req.params;

    // First, get the deal associations for this contact
    const associationsResponse = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // If there are associated deals, fetch their full details
    if (associationsResponse.data.results && associationsResponse.data.results.length > 0) {
      const dealIds = associationsResponse.data.results.map(r => r.id);

      const dealsResponse = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals/batch/read`,
        {
          inputs: dealIds.map(id => ({ id })),
          properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline']
        },
        {
          headers: {
            'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      res.json(dealsResponse.data);
    } else {
      res.json({ results: [] });
    }
  } catch (error) {
    next(error);
  }
});

// POST endpoint - AI Insight
app.post('/api/ai-insight', async (req, res, next) => {
  try {
    const { contactData } = req.body;

    if (!contactData) {
      return res.status(400).json({ error: 'Missing contactData' });
    }

    const prompt = `Act as a Sales Intelligence AI. Analyze this lead: ${JSON.stringify(contactData)}. Return a JSON object with two fields: leadScore (0-100) and insight (a 1-sentence sales tip based on their job title). Ensure the response is valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Attempt to parse JSON from the text
    // Handles markdown code blocks if present
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from AI response");
    }

    const jsonResponse = JSON.parse(jsonMatch[0]);

    res.json(jsonResponse);

  } catch (error) {
    next(error);
  }
});

// GET endpoint - Get deal stages from HubSpot pipeline
app.get('/api/deal-stages', async (req, res, next) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/pipelines/deals`,
      {
        headers: {
          'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Get the first pipeline (usually 'default')
    const pipeline = response.data.results[0];
    if (!pipeline) {
      return res.status(404).json({ error: 'No deal pipelines found' });
    }

    // Map stages to simple format
    const stages = pipeline.stages.map(stage => ({
      label: stage.label,
      id: stage.id
    }));

    res.json(stages);
  } catch (error) {
    next(error);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err.response) {
    console.error('DETAILS:', err.response.data);
  }

  const statusCode = err.response?.status || err.statusCode || 500;
  const message = err.response?.data?.message || err.message || 'Internal Server Error';
  const details = err.response?.data || err.details || null;

  res.status(statusCode).json({
    error: message,
    details: details
  });
});


// Start server
const server = app.listen(PORT, () => {
  console.log('\n✅ Server running successfully!');
  console.log(`🌐 API available at: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Static files served from: /public`);
  console.log('\n💡 Using hot-reload? Run: npm run dev');
  console.log('🛑 To stop server: Press Ctrl+C\n');
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  Received ${signal}, closing server gracefully...`);

  server.close(() => {
    console.log('✅ Server closed successfully');
    console.log('👋 Goodbye!\n');
    process.exit(0);
  });

  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});
