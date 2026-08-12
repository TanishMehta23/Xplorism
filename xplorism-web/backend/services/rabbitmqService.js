import amqp from 'amqplib';
import { EventEmitter } from 'events';

class InMemoryBroker extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
  }

  async send(topic, messages) {
    for (const msg of messages) {
      this.emit(topic, {
        topic,
        message: {
          key: msg.key,
          value: msg.value,
        }
      });
    }
  }
}

const mockBroker = new InMemoryBroker();
let connection = null;
let channel = null;
let useFallback = true;

export async function initRabbitMQ() {
  const rabbitmqUrl = process.env.RABBITMQ_URL;
  if (!rabbitmqUrl) {
    console.log('[RabbitMQ Service] RabbitMQ disabled. Using in-memory event stream.');
    useFallback = true;
    return { connected: false };
  }

  try {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    useFallback = false;
    console.log('[RabbitMQ Service] Connected to RabbitMQ successfully.');
    return { connected: true };
  } catch (error) {
    console.warn('[RabbitMQ Service] Failed to connect to RabbitMQ. Falling back to in-memory event stream:', error.message);
    useFallback = true;
    return { connected: false };
  }
}

export async function sendMessage(topic, key, value) {
  if (useFallback) {
    const serializedValue = JSON.stringify(value);
    await mockBroker.send(topic, [
      { key, value: serializedValue }
    ]);
    return;
  }

  try {
    await channel.assertQueue(topic, { durable: true });
    const payload = JSON.stringify({ key, value });
    channel.sendToQueue(topic, Buffer.from(payload), { persistent: true });
  } catch (error) {
    console.error(`[RabbitMQ Service] Error sending message to topic ${topic}:`, error);
  }
}

export async function subscribeToTopic(topic, groupId, onMessageCallback) {
  if (useFallback) {
    mockBroker.on(topic, ({ message }) => {
      try {
        const key = message.key ? message.key.toString() : null;
        const value = message.value ? JSON.parse(message.value.toString()) : null;
        onMessageCallback({ key, value });
      } catch (e) {
        console.error('[RabbitMQ Service] Error parsing mock message:', e);
      }
    });
    console.log(`[RabbitMQ Service] Subscribed to in-memory fallback topic: ${topic}`);
    return;
  }

  try {
    await channel.assertQueue(topic, { durable: true });
    channel.consume(topic, (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          onMessageCallback({ key: content.key, value: content.value });
          channel.ack(msg);
        } catch (error) {
          console.error('[RabbitMQ Service] Error processing message:', error);
          channel.nack(msg, false, false);
        }
      }
    });
    console.log(`[RabbitMQ Service] Subscribed to RabbitMQ queue: ${topic}`);
  } catch (error) {
    console.error(`[RabbitMQ Service] Error subscribing to topic ${topic}:`, error);
  }
}
