export function handleApiError(res, error, defaultMessage) {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    // ... other relevant details for debugging
  });

  const isDev = process.env.NODE_ENV === 'development';
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    error: error.type || 'UNKNOWN_ERROR',
    message: error.message || defaultMessage,
    details: isDev ? error.stack : undefined,
    code: error.code, // Optional, if your errors have specific codes
  });
} 