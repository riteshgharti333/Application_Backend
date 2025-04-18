// sockets/clientManager.js
const clients = new Set();

export const addClient = (ws) => clients.add(ws);

export const removeClient = (ws) => clients.delete(ws);

export const broadcast = (data) => {
  const payload = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
};
