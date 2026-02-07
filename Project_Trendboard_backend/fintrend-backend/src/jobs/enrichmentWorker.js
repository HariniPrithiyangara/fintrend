// ============================================
// ENRICHMENT WORKER - BACKGROUND AI PROCESSING
// NO HARDCODING
// ============================================

const logger = require('../utils/logger');
const { getFirestore } = require('../config/firebase');
const { FIRESTORE, WORKER } = require('../config/constants');
const aiClient = require('../config/aiClient');
const retry = require('../utils/retry');

async function processJob(db, jobDoc) {
  const job = jobDoc.data();
  const jobRef = jobDoc.ref;
  const articleRef = db.collection(FIRESTORE.COLLECTION).doc(job.articleId);

  logger.info(`Processing enrichment: ${job.articleId}`);

  await jobRef.update({ status: 'processing', startedAt: Date.now() });

  try {
    const articleSnap = await articleRef.get();
    
    if (!articleSnap.exists) {
      logger.warn('Article missing, deleting job');
      await jobRef.delete();
      return;
    }

    const article = articleSnap.data();
    const text = `${article.title}\n\n${article.summary || ''}`;

    const response = await retry(
      () => aiClient.post('', {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'Return ONLY valid JSON.' },
          { role: 'user', content: `Analyze: ${text.substring(0, 2000)}. Return JSON with summary, sentiment, impact, tags, category.` }
        ],
        temperature: 0.2,
        max_tokens: 350
      }),
      { retries: 2, minTimeout: 2000 }
    );

    const raw = response.data?.choices?.[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    let parsed = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      logger.warn('Invalid JSON from AI');
    }

    const update = {
      aiSummary: parsed?.summary || article.summary,
      sentiment: ['positive', 'neutral', 'negative'].includes(parsed?.sentiment) ? parsed.sentiment : 'neutral',
      impact: ['high', 'medium', 'low'].includes(parsed?.impact) ? parsed.impact : 'medium',
      tags: Array.isArray(parsed?.tags) ? parsed.tags.slice(0, 5) : [],
      category: parsed?.category || article.category,
      processedAt: Date.now(),
      status: 'enriched'
    };

    await articleRef.update(update);
    await jobRef.delete();
    
    logger.info(`✅ Enriched: ${job.articleId}`);
  } catch (error) {
    logger.error('Enrichment failed:', error.message);
    
    const attempts = (job.attempts || 0) + 1;
    await jobRef.update({
      attempts,
      lastError: error.message,
      status: attempts >= 3 ? 'failed' : 'pending',
      updatedAt: Date.now()
    });
  }
}

async function pollLoop() {
  const db = getFirestore();
  const queueRef = db.collection(FIRESTORE.ENRICHMENT_QUEUE);

  logger.info('🚀 Enrichment worker started');

  while (true) {
    try {
      const snapshot = await queueRef
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'asc')
        .limit(WORKER.BATCH_SIZE)
        .get();

      if (snapshot.empty) {
        await new Promise(resolve => setTimeout(resolve, WORKER.POLL_INTERVAL_MS));
        continue;
      }

      for (const doc of snapshot.docs) {
        await processJob(db, doc);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      logger.error('Worker poll error:', error);
      await new Promise(resolve => setTimeout(resolve, WORKER.POLL_INTERVAL_MS * 2));
    }
  }
}

if (require.main === module) {
  logger.info('Starting worker as standalone');
  pollLoop().catch(error => {
    logger.error('Worker crashed:', error);
    process.exit(1);
  });
}

module.exports = { pollLoop, processJob };