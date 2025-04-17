// utils/clientManager.js
export const clientSubscriptions = new Map(); // Map<WebSocketClient, [symbol]>

export const addClient = (client) => {
  clientSubscriptions.set(client, []);
};

export const removeClient = (client) => {
  clientSubscriptions.delete(client);
};

export const subscribeClient = (client, symbol) => {
  const current = clientSubscriptions.get(client) || [];
  clientSubscriptions.set(client, [...new Set([...current, symbol])]);
};

export const getSubscribedClients = (symbol) => {
  const clients = [];
  for (const [client, symbols] of clientSubscriptions.entries()) {
    if (client.readyState === 1 && symbols.includes(symbol)) {
      clients.push(client);
    }
  }
  return clients;
};
