// Test API Response Structure
// Chạy file này trong browser console để test API responses

console.log('=== Testing API Structure ===');

// Test 1: Workspaces API
fetch('/api/v1/workspaces', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Workspaces API Response:', data);
  console.log('Is Array?', Array.isArray(data));
  console.log('Has .data property?', data.hasOwnProperty('data'));
})
.catch(e => console.error('❌ Workspaces API Error:', e));

// Test 2: Joined Projects API
fetch('/api/v1/workspaces/joined_projects', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Joined Projects API Response:', data);
  console.log('Is Array?', Array.isArray(data));
  console.log('Has .data property?', data.hasOwnProperty('data'));
})
.catch(e => console.error('❌ Joined Projects API Error:', e));
