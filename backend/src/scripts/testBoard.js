const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const fetch = global.fetch; // Node 18+ built-in

const Project = require('../models/Projects');

async function main() {
  try {
    // 1) Login to get token
    const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'Alice1234!' })
    });

    const loginJson = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed', loginJson);
      process.exit(1);
    }

    const token = loginJson.token || (loginJson.data && loginJson.data.token) || loginJson.accessToken;
    if (!token) {
      console.error('No token returned from login:', loginJson);
      process.exit(1);
    }

    console.log('Got token, now fetching project id from DB...');

    // 2) Connect to DB and find the project id
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI, {});
    const project = await Project.findOne({ name: 'Website Redesign' });
    if (!project) {
      console.error('Project not found in DB');
      process.exit(1);
    }

    const projectId = project._id.toString();
    console.log('Project id:', projectId);

    // 3) Call board endpoint
    const boardRes = await fetch(`http://localhost:8080/api/v1/projects/${projectId}/board`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const boardJson = await boardRes.json();
    console.log('Board response status:', boardRes.status);
    console.log(JSON.stringify(boardJson, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error testing board:', err);
    process.exit(1);
  }
}

main();
