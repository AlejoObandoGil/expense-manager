/**
 * Standard result type for server actions.
 * Used for consistent error handling across all server-side operations.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
