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

export async function initKafka() {
  console.log('[Kafka Service] Kafka disabled. Using in-memory event stream.');
  return { connected: false };
}

export async function sendMessage(topic, key, value) {
  const serializedValue = JSON.stringify(value);
  await mockBroker.send(topic, [
    { key, value: serializedValue }
  ]);
}

export async function subscribeToTopic(topic, groupId, onMessageCallback) {
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
