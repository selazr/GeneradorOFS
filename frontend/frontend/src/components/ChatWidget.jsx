import React, { useEffect, useState, useRef } from 'react';
import { MessageCircle, SendHorizonal, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/ChatWidget.css';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [unread, setUnread] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    setMyId(payload.id);

    axios
      .get(`${API_URL}/usuarios/list`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));

    axios
      .get(`${API_URL}/conversaciones/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        const counts = {};
        res.data.forEach(r => {
          if (r.total > 0) counts[r.usuario_id] = true;
        });
        setUnread(counts);
      })
      .catch(err => console.error(err));

    const newSocket = io(API_URL, { auth: { token } });
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handler = msg => {
      if (msg.remitente_id === myId) {
        if (msg.conversacion_id === conversationId) {
          setMessages(prev => [...prev, msg]);
        }
        return;
      }
      if (msg.conversacion_id === conversationId) {
        setMessages(prev => [...prev, msg]);
      } else {
        setUnread(prev => ({ ...prev, [msg.remitente_id]: true }));
      }
    };

    socket.on('private message', handler);
    return () => socket.off('private message', handler);
  }, [socket, conversationId, myId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const openConversation = async (user) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        `${API_URL}/conversaciones`,
        { usuarioId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversationId(res.data.id);
      setSelectedUser(user);
      setUnread(prev => ({ ...prev, [user.id]: false }));
      const resMsgs = await axios.get(
        `${API_URL}/conversaciones/${res.data.id}/mensajes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(resMsgs.data);
      await axios.put(
        `${API_URL}/conversaciones/${res.data.id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = () => {
    if (!socket || !message.trim() || !conversationId || !selectedUser) return;
    socket.emit('private message', {
      to: selectedUser.id,
      conversacionId: conversationId,
      mensaje: message,
    });
    // The server will emit the message back to this user
    setMessage('');
  };

  return (
    <>
      <button
        className="btn btn-primary rounded-circle position-fixed bottom-0 end-0 m-4 shadow position-relative"
        onClick={() => {
          if (selectedUser) {
            setSelectedUser(null);
            setConversationId(null);
            setMessages([]);
          } else {
            setOpen(prev => !prev);
          }
        }}
      >
        <MessageCircle />
        {Object.values(unread).some(Boolean) && (
          <span className="notification-dot"></span>
        )}
      </button>

      {open && !selectedUser && (
        <div className="card position-fixed bottom-0 end-0 mb-5 me-4" style={{ width: '18rem', maxHeight: '400px', overflowY: 'auto' }}>
          <div className="card-header bg-light fw-bold">Usuarios</div>
          <ul className="list-group list-group-flush">
            {users.map(user => (
              <li
                key={user.id}
                className="list-group-item d-flex align-items-center hover-bg-light cursor-pointer position-relative"
                onClick={() => openConversation(user)}
              >
                <div className="me-2 rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center" style={{ width: 32, height: 32 }}>
                  {user.avatar ? (
                    <img src={`${API_URL}${user.avatar}`} alt={user.nombre} className="rounded-circle w-100 h-100" />
                  ) : (
                    <span>{user.nombre.charAt(0)}</span>
                  )}
                </div>
                <span>{user.nombre}</span>
                {unread[user.id] && <span className="notification-dot ms-2"></span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedUser && (
        <div className="card position-fixed bottom-0 end-0 mb-5 me-4" style={{ width: '22rem', height: '32rem' }}>
          <div className="card-header d-flex align-items-center">
            <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => {
              setSelectedUser(null);
              setConversationId(null);
              setMessages([]);
            }}>
              <ArrowLeft size={18} />
            </button>
            <div className="me-2 rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center" style={{ width: 32, height: 32 }}>
              {selectedUser.avatar ? (
                <img src={`${API_URL}${selectedUser.avatar}`} alt={selectedUser.nombre} className="rounded-circle w-100 h-100" />
              ) : (
                <span>{selectedUser.nombre.charAt(0)}</span>
              )}
            </div>
            <span className="fw-bold">{selectedUser.nombre}</span>
          </div>
          <div className="card-body overflow-auto">
            {messages.map((m, i) => (
              <div key={i} className={`d-flex ${m.remitente_id === myId ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
                <div className={`chat-message ${m.remitente_id === myId ? 'me' : 'other'}`}>{m.mensaje}</div>
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>
          <div className="card-footer">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <button type="submit" className="btn btn-primary">
                <SendHorizonal size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
