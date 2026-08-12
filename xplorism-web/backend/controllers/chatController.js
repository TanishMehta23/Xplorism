import { query } from '../config/db.js';
import { callGeminiChat, sendToolResponse } from '../services/ai/geminiService.js';
import { searchKnowledge } from '../services/rag/ragService.js';
import * as tools from '../services/tools/toolService.js';

const executeTool = async (name, args, userId) => {
  console.log(`[Chatbot Controller] Executing tool: ${name} with args:`, args);
  switch (name) {
    case 'getUserPreferences':
      return await tools.getUserPreferences(userId);
    case 'getUserTrips':
      return await tools.getUserTrips(userId);
    case 'saveTrip':
      return await tools.saveTrip(userId, args);
    case 'searchDestinations':
      return await tools.searchDestinations(args.query || '');
    case 'getWeather':
      return await tools.getWeather(args.city || '');
    case 'searchHotels':
      return await tools.searchHotels(args.city || '');
    default:
      throw new Error(`Tool "${name}" not found.`);
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT id, title, created_at as "createdAt"
       FROM chatbot_conversations
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Chat Controller] getConversations error:', error);
    res.status(500).json({ message: 'Server error retrieving conversations.' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Verify ownership of conversation first
    const convoCheck = await query(
      `SELECT id FROM chatbot_conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (convoCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or conversation not found.' });
    }

    const result = await query(
      `SELECT role, content, sources, tool_calls as "toolCalls", created_at as "createdAt"
       FROM chatbot_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[Chat Controller] getMessages error:', error);
    res.status(500).json({ message: 'Server error retrieving messages.' });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const deleteResult = await query(
      `DELETE FROM chatbot_conversations WHERE id = $1 AND user_id = $2 RETURNING id`,
      [conversationId, userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found or unauthorized.' });
    }

    res.json({ message: 'Conversation deleted successfully.' });
  } catch (error) {
    console.error('[Chat Controller] deleteConversation error:', error);
    res.status(500).json({ message: 'Server error deleting conversation.' });
  }
};

export const postChatMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, conversationId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    let activeConvoId = conversationId;

    // 1. Resolve or create conversation
    if (!activeConvoId) {
      // Determine a short title from the message
      const title = message.length > 30 ? message.substring(0, 27) + '...' : message;
      const convoResult = await query(
        `INSERT INTO chatbot_conversations (user_id, title)
         VALUES ($1, $2)
         RETURNING id`,
        [userId, title]
      );
      activeConvoId = convoResult.rows[0].id;
    } else {
      // Verify ownership
      const ownership = await query(
        `SELECT id FROM chatbot_conversations WHERE id = $1 AND user_id = $2`,
        [activeConvoId, userId]
      );
      if (ownership.rows.length === 0) {
        return res.status(403).json({ message: 'Unauthorized conversation access.' });
      }
    }

    // 2. Fetch past conversation history
    const historyResult = await query(
      `SELECT role, content
       FROM chatbot_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [activeConvoId]
    );

    const history = historyResult.rows.map(row => ({
      role: row.role,
      content: row.content
    }));

    // 3. Search RAG context
    const ragMatches = await searchKnowledge(message, 3);
    const ragContext = ragMatches.length > 0 
      ? ragMatches.map(m => `Source: ${m.title} (${m.category}) - ${m.content}`).join('\n\n')
      : '';

    // 4. Call Gemini AI
    let geminiResponse = await callGeminiChat(history, message, ragContext);
    let finalMessage = geminiResponse.message;
    let toolCalls = [];
    let toolResults = [];

    // 5. Handle function/tool calling if requested
    if (geminiResponse.functionCalls) {
      for (const call of geminiResponse.functionCalls) {
        const { name, args } = call;
        toolCalls.push({ name, args });
        
        try {
          const result = await executeTool(name, args, userId);
          toolResults.push({ name, result });
          
          // Send tool output back to Gemini to finalize the message response
          const finalGen = await sendToolResponse(history, message, geminiResponse.rawContent, name, result);
          finalMessage = finalGen.message;
        } catch (toolError) {
          console.error(`[Chat Controller] Tool execution failed for ${name}:`, toolError);
          toolResults.push({ name, error: toolError.message });
        }
      }
    }

    // 6. Save message exchange to database
    await query(
      `INSERT INTO chatbot_messages (conversation_id, role, content)
       VALUES ($1, $2, $3)`,
      [activeConvoId, 'user', message]
    );

    await query(
      `INSERT INTO chatbot_messages (conversation_id, role, content, sources, tool_calls)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        activeConvoId, 
        'model', 
        finalMessage, 
        JSON.stringify(ragMatches.map(m => ({ title: m.title, category: m.category }))),
        JSON.stringify(toolCalls)
      ]
    );

    res.json({
      message: finalMessage,
      conversationId: activeConvoId,
      sources: ragMatches.map(m => ({ title: m.title, category: m.category })),
      toolCalls
    });

  } catch (error) {
    console.error('[Chat Controller] postChatMessage error:', error);
    res.status(500).json({ message: 'Server error processing your chat request.' });
  }
};
