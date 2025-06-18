import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios
      .get('http://localhost:3000/mensajes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setMessages(res.data))
      .catch(err => console.error(err));

    const newSocket = io('http://localhost:3000', {
      auth: { token }
    });
    setSocket(newSocket);

    newSocket.on('chat message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => newSocket.disconnect();
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit('chat message', message);
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <ul>
        {messages.map((m, i) => (
          <li key={i}><b>{m.user}:</b> {m.mensaje}</li>
        ))}
      </ul>
      <form onSubmit={sendMessage}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje"
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default Chat;
