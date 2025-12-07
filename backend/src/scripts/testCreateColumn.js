const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const fetch = global.fetch;
const Project = require('../models/Projects');

async function main() {
  try {
    // 1) Login
    const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'Alice1234!' })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginJson);
      process.exit(1);
    }
    const token = loginJson.token || (loginJson.data && loginJson.data.token) || loginJson.accessToken;
    if (!token) {
      console.error('No token returned from login:', loginJson);
      process.exit(1);
    }

    // 2) Connect DB and get project id
    const MONGO_URI = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI, {});
    const project = await Project.findOne({ name: 'Website Redesign' });
    if (!project) {
      console.error('Project not found');
      process.exit(1);
    }
    const projectId = project._id.toString();

    // 3) POST create column
    const payload = { title: 'Scripted Column ' + Date.now() };
    const res = await fetch(`http://localhost:8080/api/v1/projects/${projectId}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    console.log('Status:', res.status);
    console.log(JSON.stringify(body, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error running create-column test:', err.stack || err);
    process.exit(1);
  }
}

main();
