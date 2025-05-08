// Enable or disable debug logging
const DEBUG_ENABLED = true

/**
 * Log debug messages to the console
 */
export function logDebug(message: string, ...args: any[]) {
  if (DEBUG_ENABLED) {
    console.log(`[DEBUG] ${message}`, ...args)
  }
}

/**
 * Log error messages to the console
 */
export function logError(message: string, ...args: any[]) {
  console.error(`[ERROR] ${message}`, ...args)
}
