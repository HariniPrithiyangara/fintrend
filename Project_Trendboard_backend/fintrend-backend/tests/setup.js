// ============================================
// TEST SETUP - Global Configuration
// ============================================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001'; // Different port for testing
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock Firebase Admin (to avoid real Firebase calls during tests)
jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn()
    },
    firestore: jest.fn(() => ({
        collection: jest.fn(() => ({
            doc: jest.fn(() => ({
                get: jest.fn(),
                set: jest.fn(),
                update: jest.fn(),
                delete: jest.fn()
            })),
            where: jest.fn(() => ({
                get: jest.fn(),
                limit: jest.fn(() => ({
                    get: jest.fn()
                }))
            })),
            orderBy: jest.fn(() => ({
                limit: jest.fn(() => ({
                    get: jest.fn()
                }))
            })),
            limit: jest.fn(() => ({
                get: jest.fn()
            })),
            get: jest.fn()
        }))
    }))
}));

// Increase test timeout for API calls
jest.setTimeout(10000);

console.log('✅ Test environment configured');
