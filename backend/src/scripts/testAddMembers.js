// const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
// require('dotenv').config({ path: './src/.env' });

// const User = require('../models/User');
// const Project = require('../models/Projects');
// const Workspace = require('../models/Workspace');

// async function testAddMembers() {
//     try {
//         // Connect to DB
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log('✓ MongoDB Connected');

//         // 1. Get or create users
//         let alice = await User.findOne({ email: 'alice@example.com' });
//         let bob = await User.findOne({ email: 'bob@example.com' });
//         let charlie = await User.findOne({ email: 'test@example.com' });

//         if (!alice || !bob || !charlie) {
//             console.log('✗ Missing users. Run seedData.js first');
//             process.exit(1);
//         }

//         console.log('✓ Users found:', { alice: alice.email, bob: bob.email, charlie: charlie.email });

//         // 2. Get workspace and project
//         const workspace = await Workspace.findOne();
//         if (!workspace) {
//             console.log('✗ No workspace found');
//             process.exit(1);
//         }

//         const project = await Project.findOne({ workspaceId: workspace._id });
//         if (!project) {
//             console.log('✗ No project found');
//             process.exit(1);
//         }

//         console.log('✓ Project found:', { projectId: project._id, name: project.name });
//         console.log('  Current members:', project.members);

//         // 3. Generate JWT token for alice
//         const token = jwt.sign(
//             { id: alice._id },
//             process.env.JWT_SECRET,
//             { expiresIn: process.env.JWT_EXPIRE || '7d' }
//         );

//         console.log('✓ Token generated for alice:', token.substring(0, 20) + '...');

//         // 4. Test endpoint add members
//         console.log('\n--- Testing Add Members Endpoint ---');
//         console.log('POST /api/v1/projects/:projectId/members');

//         const testCases = [
//             {
//                 name: 'Add test@example.com',
//                 emails: ['test@example.com'],
//                 expected: 'success'
//             },
//             {
//                 name: 'Add non-existent email',
//                 emails: ['nonexistent@example.com'],
//                 expected: 'error'
//             },
//             {
//                 name: 'Add already member',
//                 emails: ['alice@example.com'],
//                 expected: 'already_member'
//             }
//         ];

//         for (const testCase of testCases) {
//             console.log(`\n  Testing: ${testCase.name}`);
//             console.log(`  Emails: ${testCase.emails.join(', ')}`);

//             const body = JSON.stringify({
//                 newMemberEmails: testCase.emails
//             });

//             const response = await fetch(
//                 `http://localhost:8080/api/v1/projects/${project._id}/members`,
//                 {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`
//                     },
//                     body: body
//                 }
//             );

//             const data = await response.json();

//             console.log(`  Status: ${response.status}`);
//             if (!response.ok) {
//                 console.log(`  ERROR:`, data.error || data.message);
//             }
//             console.log(`  Response:`, JSON.stringify(data, null, 2));
//         }

//         console.log('\n✓ Tests completed');
//         await mongoose.connection.close();
//         process.exit(0);

//     } catch (error) {
//         console.error('✗ Error:', error.message);
//         process.exit(1);
//     }
// }

// testAddMembers();
