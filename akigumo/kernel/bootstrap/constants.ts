/**
 * BullMQ dispatch queue name used by Kernel dispatcher/worker.
 *
 * Keep this stable to ensure dispatcher and worker are bound to the same queue.
 */
export const DISPATCH_QUEUE_NAME = 'sys_kernel_dispatch_bus';

/**
 * Maximum number of jobs processed concurrently by the kernel worker.
 *
 * Increase for higher throughput, decrease to reduce DB/IO pressure.
 */
export const KERNEL_WORKER_CONCURRENCY = 5;
