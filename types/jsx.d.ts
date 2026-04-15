/**
 * Global JSX type declarations
 * This file provides basic JSX type support as a fallback
 */

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Allow any HTML element with any props
      [elemName: string]: any;
    }
  }
}

export {};