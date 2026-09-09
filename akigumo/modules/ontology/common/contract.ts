/**
 * Ontology aggregate identifier
 *
 * This value acts as a routing key for processors and event consumers.
 * If it changes unexpectedly, pending tasks can no longer be resolved.
 */
export const ONTOLOGY_AGGREGATE = "ONTOLOGY" as const;
