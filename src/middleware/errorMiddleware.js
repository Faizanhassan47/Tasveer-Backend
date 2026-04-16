export function notFound(_req, res) {
  res.status(404).json({
    error: 'Route not found.'
  });
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong.';

  res.status(statusCode).json({
    error: message,
    details: error.details || null
  });
}
