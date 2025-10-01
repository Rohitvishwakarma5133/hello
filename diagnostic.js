// Diagnostic script to test the humanize API
console.log('🔍 Starting diagnostic tests...');

async function testAPI() {
  const testData = {
    text: 'Due to the fact that we need to make a decision in regard to the implementation of the system, it is important to note that we cannot proceed. We do not want to take into consideration all factors.'
  };

  console.log('📤 Testing fetch to localhost:3000/api/humanize');
  
  try {
    const response = await fetch('http://localhost:3000/api/humanize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Success!');
      console.log('Original:', data.originalText.substring(0, 50) + '...');
      console.log('Humanized:', data.humanizedText.substring(0, 50) + '...');
      console.log('Improvements:', data.improvements.length, 'improvements made');
      console.log('📊 Full response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.error('Full error:', error);
  }
}

// Test different scenarios
async function runDiagnostics() {
  console.log('\n=== DIAGNOSTIC TESTS ===\n');

  // Test 1: Simple API call
  console.log('Test 1: Basic API functionality');
  await testAPI();

  // Test 2: Empty text
  console.log('\nTest 2: Empty text handling');
  try {
    const response = await fetch('http://localhost:3000/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Empty text handled correctly:', data);
    } else {
      console.log('✅ Empty text rejected as expected:', response.status);
    }
  } catch (error) {
    console.error('❌ Error with empty text:', error.message);
  }

  // Test 3: Server availability
  console.log('\nTest 3: Server status');
  try {
    const response = await fetch('http://localhost:3000/');
    console.log(`✅ Server is accessible: ${response.status}`);
  } catch (error) {
    console.error('❌ Server not accessible:', error.message);
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

// Run if we're in Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment - need to install fetch
  console.log('Running in Node.js environment');
  runDiagnostics().catch(console.error);
} else {
  // Browser environment
  console.log('Running in browser environment');
  runDiagnostics();
}