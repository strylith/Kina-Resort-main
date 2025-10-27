// Test setup file
process.env.USE_MOCK_DB = 'true';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-tests';

// Import mock client
import { mockClient } from '../db/databaseClient.js';

// Reset database before each test
beforeEach(() => {
  mockClient.reset();
  console.log('🧹 Test database reset');
});

// Setup default test data
beforeAll(() => {
  // You can seed default data here if needed
  console.log('✅ Test environment initialized');
});

