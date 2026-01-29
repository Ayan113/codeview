import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const data = req[source];
            const validated = await schema.parseAsync(data);
            req[source] = validated;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};

                for (const issue of error.issues) {
                    const path = issue.path.join('.');
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path].push(issue.message);
                }

                next(new ValidationError(errors));
            } else {
                next(error);
            }
        }
    };
}
