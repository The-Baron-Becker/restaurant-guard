import { Request, Response, NextFunction } from 'express';

interface FieldRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date';
  maxLength?: number;
  min?: number;
  max?: number;
  oneOf?: string[];
}

type Schema = Record<string, FieldRule>;

/**
 * Express middleware factory for request body validation.
 * Returns 400 with descriptive error messages on validation failure.
 */
export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip optional fields that are not provided
      if (value === undefined || value === null || value === '') continue;

      // Type checks
      if (rules.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a number`);
          continue;
        }
        if (rules.min !== undefined && num < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && num > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }
      }

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
        continue;
      }

      if (rules.type === 'date') {
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          errors.push(`${field} must be a valid date`);
        }
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }

      if (rules.oneOf && !rules.oneOf.includes(value)) {
        errors.push(`${field} must be one of: ${rules.oneOf.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
}
