import handler from '../../../pages/api/generate-plan';

// Mock the imports
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createPagesServerClient: jest.fn(() => ({
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
  }))
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
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
  }))
}));

jest.mock('../../../utils/flexiblePlanValidator', () => ({
  validatePlanStructure: jest.fn().mockReturnValue({
    isValid: true,
    errors: [],
    stats: {}
  })
}));

describe('POST /api/generate-plan', () => {
  let req, res;

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
    const mockModel = {
      generateContent: jest.fn().mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 40000))
      )
    };
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'AI_GENERATION_ERROR',
      message: expect.any(String),
      details: null
    });
  });

  it('should handle validation failure', async () => {
    validatePlanStructure.mockReturnValue({
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
    createPagesServerClient.mockReturnValue({
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
      single: jest.fn().mockRejectedValue(new Error('DB error'))
    });

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

    createPagesServerClient.mockReturnValue({
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
      single: jest.fn().mockRejectedValue(dbError)
    });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Duplicate plan',
      message: 'A plan with this topic already exists'
    });
  });
});
import handler from '../../../pages/api/generate-plan';

// Mock the imports
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createPagesServerClient: jest.fn(() => ({
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
  }))
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
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
  }))
}));

jest.mock('../../../utils/flexiblePlanValidator', () => ({
  validatePlanStructure: jest.fn().mockReturnValue({
    isValid: true,
    errors: [],
    stats: {}
  })
}));

describe('POST /api/generate-plan', () => {
  let req, res;

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
    const mockModel = {
      generateContent: jest.fn().mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 40000))
      )
    };
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'AI_GENERATION_ERROR',
      message: expect.any(String),
      details: null
    });
  });

  it('should handle validation failure', async () => {
    validatePlanStructure.mockReturnValue({
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
    createPagesServerClient.mockReturnValue({
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
      single: jest.fn().mockRejectedValue(new Error('DB error'))
    });

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

    createPagesServerClient.mockReturnValue({
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
      single: jest.fn().mockRejectedValue(dbError)
    });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Duplicate plan',
      message: 'A plan with this topic already exists'
    });
  });
});
import handler from '../../../pages/api/generate-plan';

// Mock the imports
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createPagesServerClient: jest.fn(() => ({
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
  }))
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
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
  }))
}));

jest.mock('../../../utils/flexiblePlanValidator', () => ({
  validatePlanStructure: jest.fn().mockReturnValue({
    isValid: true,
    errors: [],
    stats: {}
  })
}));

// Mock the imports
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createPagesServerClient: jest.fn(() => ({
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
  }))
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
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
  }))
}));

jest.mock('../../../utils/flexiblePlanValidator', () => ({
  validatePlanStructure: jest.fn().mockReturnValue({
    isValid: true,
    errors: [],
    stats: {}
  })
}));
import handler from '../../../pages/api/generate-plan';

// Manual mocks
const mockSupabase = {
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

const mockGoogleAI = {
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

const mockValidator = {
  validatePlanStructure: jest.fn().mockReturnValue({
    isValid: true,
    errors: [],
    stats: {}
  })
};

// Mock the imports
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createPagesServerClient: jest.fn(() => mockSupabase)
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => mockGoogleAI)
}));

jest.mock('../../../utils/flexiblePlanValidator', () => mockValidator);

describe('POST /api/generate-plan', () => {
  let req, res;

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

    // Mock Supabase auth
    createPagesServerClient.mockReturnValue({
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
    });

    // Mock Google AI
    const mockModel = {
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
    };
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    // Mock validator
    validatePlanStructure.mockReturnValue({
      isValid: true,
      errors: [],
      stats: {}
    });
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
    const mockModel = {
      generateContent: jest.fn().mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 40000))
      )
    };
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'AI_GENERATION_ERROR',
      message: expect.any(String),
      details: null
    });
  });

  it('should handle validation failure', async () => {
    validatePlanStructure.mockReturnValue({
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
    createPagesServerClient.mockReturnValue({
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
      single: jest.fn().mockRejectedValue(new Error('DB error'))
    });

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

    createPagesServerClient.mockReturnValue({
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
      single: jest.fn().mockRejectedValue(dbError)
    });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Duplicate plan',
      message: 'A plan with this topic already exists'
    });
  });
});
