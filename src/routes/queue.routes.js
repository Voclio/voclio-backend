import express from 'express';
import queueManager, { QUEUE_NAMES } from '../config/queue.js';
import { successResponse } from '../utils/responses.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/queue/stats:
 *   get:
 *     summary: Get queue statistics
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue statistics
 */
router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const stats = await Promise.all(
      Object.values(QUEUE_NAMES).map(queueName => queueManager.getQueueStats(queueName))
    );

    return successResponse(res, { queues: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/queue/job/{jobId}:
 *   get:
 *     summary: Get job status
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: queue
 *         schema:
 *           type: string
 *           enum: [transcription, extraction, email, notification]
 *     responses:
 *       200:
 *         description: Job status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobStatus'
 */
router.get('/job/:jobId', authMiddleware, async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { queue = QUEUE_NAMES.TRANSCRIPTION } = req.query;

    const jobState = await queueManager.getJobState(queue, jobId);

    if (!jobState) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Job not found'
        }
      });
    }

    return successResponse(res, { job: jobState });
  } catch (error) {
    next(error);
  }
});

export default router;
