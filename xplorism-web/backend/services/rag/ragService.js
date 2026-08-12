import { query } from '../../config/db.js';
import { generateTextEmbedding } from '../ai/geminiService.js';

export async function addKnowledge(title, content, category = 'General') {
  try {
    const embedding = await generateTextEmbedding(content);
    // Convert array embedding to pgvector format e.g. '[0.1, 0.2, ...]'
    const vectorString = JSON.stringify(embedding);

    const result = await query(
      `INSERT INTO travel_knowledge (title, content, category, embedding)
       VALUES ($1, $2, $3, $4::vector)
       RETURNING id, title, category`,
      [title, content, category, vectorString]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[RAG Service] Error adding knowledge item:', error);
    throw error;
  }
}

export async function searchKnowledge(queryText, limit = 3) {
  try {
    const queryEmbedding = await generateTextEmbedding(queryText);
    const vectorString = JSON.stringify(queryEmbedding);

    // Cosine distance similarity search (<=> is pgvector operator)
    const dbResult = await query(
      `SELECT title, content, category, (1 - (embedding <=> $1::vector)) as similarity
       FROM travel_knowledge
       ORDER BY embedding <=> $1::vector ASC
       LIMIT $2`,
      [vectorString, limit]
    );

    return dbResult.rows.map(row => ({
      title: row.title,
      content: row.content,
      category: row.category,
      similarity: parseFloat(row.similarity)
    }));
  } catch (error) {
    console.warn('[RAG Service] Similarity search failed (falling back to empty context):', error.message);
    return [];
  }
}
