import { Kafka } from 'kafkajs';
import { EventEmitter } from 'events';

// In-Memory Fallback Broker
class InMemoryBroker extends EventEmitter {
  constructor() {
    super();
    // Allow infinite listeners to prevent memory leak warning for many subscribers
    this.setMaxListeners(0);
  }

  async send(topic, messages) {
    for (const msg of messages) {
      this.emit(topic, {
        topic,
        partition: 0,
        message: {
          key: msg.key,
          value: msg.value,
          timestamp: Date.now().toString(),
        }
      });
    }
  }
}

const mockBroker = new InMemoryBroker();

let kafkaInstance = null;
let producer = null;
let consumer = null;
let isKafkaConnected = false;

export async function initKafka() {
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    console.warn('[Kafka Service] No KAFKA_BROKERS env variable defined. Falling back to in-memory event stream.');
    return { connected: false };
  }

  try {
    console.log(`[Kafka Service] Attempting to connect to Kafka brokers: ${brokers}`);
    kafkaInstance = new Kafka({
      clientId: 'xplorism-trip-planner',
      brokers: brokers.split(','),
      retry: {
        retries: 2, // Low retry for dev, fail fast and fallback
        initialRetryTime: 300,
      }
    });

    producer = kafkaInstance.producer();
    await producer.connect();

    console.log('[Kafka Service] Kafka Producer connected successfully.');
    isKafkaConnected = true;
    return { connected: true };
  } catch (error) {
    console.warn(`[Kafka Service] Failed to initialize Kafka client: ${error.message}. Falling back to in-memory event stream.`);
    isKafkaConnected = false;
    producer = null;
    return { connected: false };
  }
}

/**
 * Sends a message to a Kafka topic or falls back to in-memory queue
 * @param {string} topic 
 * @param {string} key 
 * @param {object} value 
 */
export async function sendMessage(topic, key, value) {
  const serializedValue = JSON.stringify(value);

  if (isKafkaConnected && producer) {
    try {
      await producer.send({
        topic,
        messages: [
          { key, value: serializedValue }
        ],
      });
      return;
    } catch (err) {
      console.error(`[Kafka Service] Failed to send message to Kafka. Retrying via mock broker. Error: ${err.message}`);
    }
  }

  // Fallback to Mock Broker
  await mockBroker.send(topic, [
    { key, value: serializedValue }
  ]);
}

/**
 * Subscribes to a topic. Connects dynamically to Kafka consumer, or mock event emitter
 * @param {string} topic 
 * @param {string} groupId 
 * @param {function} onMessageCallback - receives ({ key, value })
 */
export async function subscribeToTopic(topic, groupId, onMessageCallback) {
  if (isKafkaConnected && kafkaInstance) {
    try {
      const activeConsumer = kafkaInstance.consumer({ groupId });
      await activeConsumer.connect();
      await activeConsumer.subscribe({ topic, fromBeginning: false });

      await activeConsumer.run({
        eachMessage: async ({ message }) => {
          try {
            const key = message.key ? message.key.toString() : null;
            const value = message.value ? JSON.parse(message.value.toString()) : null;
            onMessageCallback({ key, value });
          } catch (e) {
            console.error('[Kafka Service] Error parsing consumed message:', e);
          }
        },
      });
      console.log(`[Kafka Service] Subscribed to Kafka topic: ${topic} with group: ${groupId}`);
      return;
    } catch (err) {
      console.error(`[Kafka Service] Consumer subscription failed, using mock broker fallback. Error: ${err.message}`);
    }
  }

  // Fallback to Mock Broker subscription
  mockBroker.on(topic, ({ message }) => {
    try {
      const key = message.key ? message.key.toString() : null;
      const value = message.value ? JSON.parse(message.value.toString()) : null;
      onMessageCallback({ key, value });
    } catch (e) {
      console.error('[Kafka Service] Error parsing mock message:', e);
    }
  });
  console.log(`[Kafka Service] Subscribed to in-memory fallback topic: ${topic}`);
}
