import handler from '../../../pages/api/generate-plan';

// Mock the imports
jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: jest.fn((url, key, options) => ({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-id' }
            }
          }
        })
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {},
        error: null
      }),
      storage: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn()
      }
    }))
  };
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn()
}));

jest.mock('../../../utils/flexiblePlanValidator', () => ({
  validatePlanStructure: jest.fn()
}));

describe('POST /api/generate-plan', () => {
  let req, res;
  let mockSupabaseClient;
  let mockGoogleAI;

  beforeAll(() => {
    // Setup default mock implementations
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-id' }
            }
          }
        })
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {},
        error: null
      })
    };

    mockGoogleAI = {
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue(`
              # Test Plan
              ## Introduction
              [ ] Task 1
              [ ] Task 2
              ## Timeline
              1 week
            `)
          }
        })
      })
    };

    // Set up the mock implementations
    require('@supabase/auth-helpers-nextjs').createPagesServerClient.mockReturnValue(mockSupabaseClient);
    require('@google/generative-ai').GoogleGenerativeAI.mockImplementation(() => mockGoogleAI);
    require('../../../utils/flexiblePlanValidator').validatePlanStructure.mockReturnValue({
      isValid: true,
      errors: [],
      stats: {}
    });
  });

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {
        topic: 'Test Topic',
        experience: 'beginner',
        timeline: '1 week'
      },
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };

    // Reset mock implementations for each test
    jest.clearAllMocks();
  });

  it('should return 405 for non-POST methods', async () => {
    req.method = 'GET';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  });

  it('should return 400 if topic is missing', async () => {
    req.body.topic = '';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing required field',
      message: 'Please provide a topic'
    });
  });

  it('should successfully generate a plan', async () => {
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      plan: expect.objectContaining({
        user_id: 'test-user-id',
        topic: 'Test Topic',
        content: expect.any(String),
        progress: 0
      })
    });
  });

  it('should handle AI generation timeout', async () => {
    mockGoogleAI.getGenerativeModel.mockReturnValue({
      generateContent: jest.fn().mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 40000))
      )
    });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'AI_GENERATION_ERROR',
      message: expect.any(String),
      details: null
    });
  });

  it('should handle validation failure', async () => {
    require('../../../utils/flexiblePlanValidator').validatePlanStructure.mockReturnValue({
      isValid: false,
      errors: ['Missing required sections'],
      stats: {}
    });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'INVALID_CONTENT',
      message: expect.any(String),
      details: expect.any(Object)
    });
  });

  it('should handle database insertion error', async () => {
    mockSupabaseClient.single.mockRejectedValue(new Error('DB error'));

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'DB_ERROR',
      message: 'DB error',
      details: null
    });
  });

  it('should handle duplicate plan error', async () => {
    const dbError = new Error('Duplicate plan');
    dbError.code = '23505';
    mockSupabaseClient.single.mockRejectedValue(dbError);

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Duplicate plan',
      message: 'A plan with this topic already exists'
    });
  });
});
