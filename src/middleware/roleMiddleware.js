import { HttpError } from '../utils/httpError.js';

export function allowRoles(...roles) {
  return function roleGuard(req, _res, next) {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication is required.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have access to this action.'));
    }

    return next();
  };
}
