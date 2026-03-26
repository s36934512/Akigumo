/**
 * @file Entry point for file extension registry module
 *
 * Exporting through a single barrel keeps integration points stable and
 * avoids coupling callers to internal folder structure.
 */

export * from './api/handler';
