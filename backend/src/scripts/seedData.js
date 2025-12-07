const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Projects');
const Column = require('../models/Columns');
const Task = require('../models/Task');
const Label = require('../models/Lables');
const Comment = require('../models/Comments');
const Activity = require('../models/Activities');

const MONGO_URI = process.env.MONGO_URI;

async function seedDatabase() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, {});
    console.log('✅ Connected to MongoDB');

    // 1. Create Users
    console.log('\n📝 Creating users...');
    const users = [];

    // User 1 - Admin/Owner
    let user1 = await User.findOne({ email: 'alice@example.com' });
    if (!user1) {
      const salt1 = await bcrypt.genSalt(10);
      const passwordHash1 = await bcrypt.hash('Alice1234!', salt1);
      user1 = await User.create({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        passwordHash: passwordHash1,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      });
      console.log('  ✓ Created user: Alice Johnson');
    } else {
      console.log('  ℹ User Alice already exists');
    }
    users.push(user1);

    // User 2 - Team member
    let user2 = await User.findOne({ email: 'bob@example.com' });
    if (!user2) {
      const salt2 = await bcrypt.genSalt(10);
      const passwordHash2 = await bcrypt.hash('Bob1234!', salt2);
      user2 = await User.create({
        name: 'Bob Smith',
        email: 'bob@example.com',
        passwordHash: passwordHash2,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      });
      console.log('  ✓ Created user: Bob Smith');
    } else {
      console.log('  ℹ User Bob already exists');
    }
    users.push(user2);

    // 2. Create Workspace
    console.log('\n📝 Creating workspace...');
    let workspace = await Workspace.findOne({ name: 'Development Team Workspace' });
    if (!workspace) {
      workspace = await Workspace.create({
        name: 'Development Team Workspace',
        ownerId: user1._id,
        members: [user1._id, user2._id],
      });
      console.log('  ✓ Created workspace: Development Team Workspace');
    } else {
      console.log('  ℹ Workspace already exists');
    }

    // 3. Create Project
    console.log('\n📝 Creating project...');
    let project = await Project.findOne({ name: 'Website Redesign' });
    if (!project) {
      project = await Project.create({
        name: 'Website Redesign',
        description: 'Complete redesign of company website with modern UI/UX',
        workspaceId: workspace._id,
        ownerId: user1._id,
        members: [user1._id, user2._id],
        status: 'active',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        taskStats: { open: 1, closed: 0 },
      });
      console.log('  ✓ Created project: Website Redesign');
    } else {
      console.log('  ℹ Project already exists');
    }

    // 4. Create Columns
    console.log('\n📝 Creating columns...');
    const columns = [];
    const columnTitles = ['To Do', 'In Progress', 'Done'];

    for (const title of columnTitles) {
      let column = await Column.findOne({ projectId: project._id, title });
      if (!column) {
        column = await Column.create({
          title,
          projectId: project._id,
          taskOrder: [],
        });
        console.log(`  ✓ Created column: ${title}`);
        columns.push(column);
      } else {
        console.log(`  ℹ Column ${title} already exists`);
        columns.push(column);
      }
    }

    // Update project with column order
    if (project.columnOrder.length === 0) {
      project.columnOrder = columns.map(c => c._id);
      await project.save();
      console.log('  ✓ Updated project column order');
    }

    // 5. Create Label
    console.log('\n📝 Creating label...');
    let label = await Label.findOne({ projectId: project._id, text: 'High Priority' });
    if (!label) {
      label = await Label.create({
        projectId: project._id,
        text: 'High Priority',
        color: '#FF0000',
      });
      console.log('  ✓ Created label: High Priority');
    } else {
      console.log('  ℹ Label already exists');
    }

    // 6. Create Task
    console.log('\n📝 Creating task...');
    let task = await Task.findOne({ projectId: project._id, title: 'Design homepage mockup' });
    if (!task) {
      task = await Task.create({
        title: 'Design homepage mockup',
        description: 'Create a modern homepage mockup using Figma with responsive design',
        projectId: project._id,
        columnId: columns[0]._id, // To Do column
        creatorId: user1._id,
        assignees: [user1._id, user2._id],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        labels: [label._id],
        checklists: [
          {
            text: 'Research competitor designs',
            isCompleted: true,
          },
          {
            text: 'Create wireframes',
            isCompleted: false,
          },
          {
            text: 'Design high-fidelity mockup',
            isCompleted: false,
          },
        ],
      });
      console.log('  ✓ Created task: Design homepage mockup');

      // Update column taskOrder
      columns[0].taskOrder.push(task._id);
      await columns[0].save();
      console.log('  ✓ Updated column task order');
    } else {
      console.log('  ℹ Task already exists');
    }

    // 7. Create Comment
    console.log('\n📝 Creating comment...');
    let comment = await Comment.findOne({ taskId: task._id, userId: user2._id });
    if (!comment) {
      comment = await Comment.create({
        taskId: task._id,
        userId: user2._id,
        content: 'Great task! I can help with the wireframes. Let me know when you have the research done.',
      });
      console.log('  ✓ Created comment by Bob on the task');
    } else {
      console.log('  ℹ Comment already exists');
    }

    // 8. Create Activity
    console.log('\n📝 Creating activity...');
    let activity = await Activity.findOne({ taskId: task._id, action: 'CREATED_TASK' });
    if (!activity) {
      activity = await Activity.create({
        projectId: project._id,
        taskId: task._id,
        userId: user1._id,
        action: 'CREATED_TASK',
        details: {
          taskTitle: task.title,
          columnTitle: columns[0].title,
        },
      });
      console.log('  ✓ Created activity: Task created');
    } else {
      console.log('  ℹ Activity already exists');
    }

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  Users: 2 (Alice, Bob)`);
    console.log(`  Workspace: 1 (Development Team Workspace)`);
    console.log(`  Project: 1 (Website Redesign)`);
    console.log(`  Columns: ${columns.length} (To Do, In Progress, Done)`);
    console.log(`  Labels: 1 (High Priority)`);
    console.log(`  Tasks: 1 (Design homepage mockup)`);
    console.log(`  Comments: 1`);
    console.log(`  Activities: 1`);
    console.log('\n🔐 Test Credentials:');
    console.log(`  Email: alice@example.com`);
    console.log(`  Password: Alice1234!`);
    console.log(`  OR`);
    console.log(`  Email: bob@example.com`);
    console.log(`  Password: Bob1234!`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err.message || err);
    process.exit(1);
  }
}

seedDatabase();
