/**
 * Copyright (C) {{YEAR}} by {{ORG}}. {{LICENSE}}.
 */
import type { z } from "zod/v4";

export interface FieldError {
  field: string;
  message: string;
  code: string;
}

/**
 * Custom error class that wraps Zod validation errors with structured details.
 * Provides field-level errors suitable for API responses.
 */
export class ValidationError extends Error {
  public readonly code = "VALIDATION_ERROR";
  public readonly fieldErrors: FieldError[];
  public readonly zodError: z.ZodError;

  constructor(zodError: z.ZodError) {
    const fieldErrors = ValidationError.extractFieldErrors(zodError);
    const message = ValidationError.formatMessage(fieldErrors);

    super(message);
    this.name = "ValidationError";
    this.zodError = zodError;
    this.fieldErrors = fieldErrors;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Extracts field-level errors from a ZodError for API responses.
   */
  private static extractFieldErrors(zodError: z.ZodError): FieldError[] {
    return zodError.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code
    }));
  }

  /**
   * Builds a single human-readable message from the field errors.
   */
  private static formatMessage(fieldErrors: FieldError[]): string {
    if (fieldErrors.length === 0) return "Validation failed";
    return fieldErrors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join("; ");
  }
}
