// helpers/wsClient.js
export class WSClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.subscribers = new Map();
    this.reconnectInterval = 3000;
    this.shouldReconnect = true;
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.resubscribeAll();
    };

    this.socket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      this.notifySubscribers(type, data);
    };

    this.socket.onclose = () => {
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };
  }

  subscribe(type, callback) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type).add(callback);
    return () => this.unsubscribe(type, callback);
  }

  unsubscribe(type, callback) {
    if (this.subscribers.has(type)) {
      this.subscribers.get(type).delete(callback);
    }
  }

  notifySubscribers(type, data) {
    const callbacks = this.subscribers.get(type);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  send(type, data) {
    if (this.socket.readyState === WebSocket.READY_STATE_OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }

  close() {
    this.shouldReconnect = false;
    this.socket.close();
  }
}
