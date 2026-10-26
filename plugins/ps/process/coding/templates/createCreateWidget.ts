/**
 * Copyright (C) {{YEAR}} by {{ORG}}. {{LICENSE}}.
 *
 * Reference template for THE validated-function pattern.
 *
 * Rules this file demonstrates:
 *   - One function per file. File name = `create<FunctionName>.ts`.
 *   - A FACTORY that takes injected dependencies (the db client, services, …)
 *     and returns a validated function. No module-level singletons — inject
 *     everything so the function is trivial to test.
 *   - An inner `fn` with fully typed params (the Zod-inferred input type) and
 *     an explicit Promise return type.
 *   - Verbose logging at the boundaries (entry + exit).
 *   - The function is returned wrapped by `withErrorHandlingAndValidation`,
 *     which validates input against the schema before `fn` ever runs.
 */
import {
  withErrorHandlingAndValidation,
  createWidgetSchema,
  type CreateWidgetInput,
  type DbClient,
  type Widget
} from "@{{SCOPE}}/common";
import { logger } from "../../logger.js";

/**
 * Creates a function to create a new widget.
 *
 * @param client - The database client (injected)
 * @returns A validated function that creates a widget
 */
export function createCreateWidget(client: DbClient) {
  const fn = async (params: CreateWidgetInput): Promise<Widget> => {
    logger.verbose("creating widget", { name: params.name });
    const widget = await client.widget.create({ data: params });
    logger.verbose("widget created", { id: widget.id });
    return widget;
  };

  return withErrorHandlingAndValidation(fn, createWidgetSchema);
}
