/**
 * User aggregate identifier
 *
 * We keep aggregate identifiers stable because outbox routing and workflow
 * event correlation depend on this exact value across deployments.
 */
export const USER_AGGREGATE = 'USER' as const;

