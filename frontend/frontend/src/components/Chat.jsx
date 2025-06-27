import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '../api';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const payload = JSON.parse(atob(token.split('.')[1]));
    setMyId(payload.id);

    axios
      .get(`${API_URL}/usuarios/list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));

    const newSocket = io(API_URL, { auth: { token } });
    setSocket(newSocket);

    newSocket.on('private message', (msg) => {
      if (msg.conversacion_id === conversationId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => newSocket.disconnect();
  }, [conversationId]);

  const openConversation = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_URL}/conversaciones`, { usuarioId: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversationId(res.data.id);
      setSelectedUser(userId);
      const resMsgs = await axios.get(`${API_URL}/conversaciones/${res.data.id}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(resMsgs.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!socket || !message.trim() || !conversationId || !selectedUser) return;
    socket.emit('private message', { to: selectedUser, conversacionId: conversationId, mensaje: message });
    setMessage('');
  };

  const nombreUsuario = users.find(u => u.id === selectedUser)?.nombre;

  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: 200, marginRight: '1rem' }}>
        <h4>Usuarios</h4>
        <ul>
          {users.map(u => (
            <li key={u.id}>
              <button onClick={() => openConversation(u.id)}>{u.nombre}</button>
            </li>
          ))}
        </ul>
      </aside>
      <main style={{ flex: 1 }}>
        {conversationId ? (
          <>
            <h4>Chat con {nombreUsuario}</h4>
            <ul>
              {messages.map((m, i) => (
                <li key={i}><b>{m.remitente_id === myId ? 'Tú' : nombreUsuario}:</b> {m.mensaje}</li>
              ))}
            </ul>
            <form onSubmit={sendMessage}>
              <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Escribe un mensaje" />
              <button type="submit">Enviar</button>
            </form>
          </>
        ) : (
          <p>Selecciona un usuario para comenzar a chatear</p>
        )}
      </main>
    </div>
  );
};

export default Chat;
