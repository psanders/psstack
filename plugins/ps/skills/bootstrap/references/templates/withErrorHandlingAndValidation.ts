/**
 * Copyright (C) {{YEAR}} by {{ORG}}. {{LICENSE}}.
 */
import { z } from "zod/v4";
import { ValidationError } from "../errors/ValidationError.js";

export function withErrorHandlingAndValidation<TSchema extends z.ZodType, TResult>(
  fn: (params: z.infer<TSchema>) => Promise<TResult>,
  schema: TSchema
): (params: unknown) => Promise<TResult> {
  return async (params: unknown) => {
    const result = schema.safeParse(params);

    if (!result.success) {
      throw new ValidationError(result.error);
    }

    return fn(result.data);
  };
}
