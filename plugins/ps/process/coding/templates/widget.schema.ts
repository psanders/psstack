/**
 * Copyright (C) {{YEAR}} by {{ORG}}. {{LICENSE}}.
 *
 * Reference template for a schema module. Schemas live in the SHARED package
 * (e.g. `@{{SCOPE}}/common`) alongside their inferred types, so the transport
 * layer, the functions, and the tests all import the exact same source of truth.
 *
 * Rules this file demonstrates:
 *   - Zod from `zod/v4`.
 *   - Every field carries a human-readable message.
 *   - Use `.transform()` to NORMALIZE at the edge (trim, format, canonicalize).
 *   - Derive the TypeScript type from the schema with `z.infer` — never hand-write it.
 */
import { z } from "zod/v4";

/** Schema for creating a new widget. */
export const createWidgetSchema = z.object({
  name: z.string().min(1, "Name is required").transform((v) => v.trim()),
  description: z.string().optional(),
  quantity: z.number().int().nonnegative().default(0),
  ownerId: z.uuid({ error: "Invalid owner ID" }).optional(),
  isActive: z.boolean().default(true)
});

/** Schema for updating an existing widget (only mutable fields). */
export const updateWidgetSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).transform((v) => v.trim()).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;
export type UpdateWidgetInput = z.infer<typeof updateWidgetSchema>;
