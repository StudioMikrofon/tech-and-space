/**
 * Global request queue for all foto-review operations.
 * Ensures sequential processing of generate, publish, and review operations
 * to prevent system overload when user clicks multiple actions in rapid succession.
 */

interface QueuedJob {
  id: string;
  operation: string;
  timestamp: number;
  execute: () => Promise<any>;
}

class FotoReviewQueue {
  private queue: QueuedJob[] = [];
  private processing = false;
  private jobCounter = 0;

  async enqueue(operation: string, fn: () => Promise<any>): Promise<any> {
    const jobId = `job-${++this.jobCounter}-${Date.now()}`;

    return new Promise((resolve, reject) => {
      const job: QueuedJob = {
        id: jobId,
        operation,
        timestamp: Date.now(),
        execute: async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      };

      this.queue.push(job);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      try {
        const waitTime = Date.now() - job.timestamp;
        console.log(`[foto-review-queue] Executing: ${job.operation} (${job.id}, waited ${waitTime}ms)`);
        await job.execute();
        console.log(`[foto-review-queue] Completed: ${job.operation} (${job.id})`);
      } catch (error) {
        console.error(`[foto-review-queue] Error in ${job.operation} (${job.id}):`, error);
      }
    }

    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueueInfo() {
    return {
      length: this.queue.length,
      processing: this.processing,
      operations: this.queue.map(j => ({ op: j.operation, waitMs: Date.now() - j.timestamp }))
    };
  }
}

export const fotoReviewQueue = new FotoReviewQueue();
