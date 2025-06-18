import React, { useEffect, useState } from 'react';
import { MessageCircle, SendHorizonal, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    setMyId(payload.id);

    axios
      .get('http://localhost:3000/usuarios/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));

    const newSocket = io('http://localhost:3000', { auth: { token } });
    setSocket(newSocket);

    newSocket.on('private message', msg => {
      if (msg.conversacion_id === conversationId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => newSocket.disconnect();
  }, [conversationId]);

  const openConversation = async (user) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        'http://localhost:3000/conversaciones',
        { usuarioId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversationId(res.data.id);
      setSelectedUser(user);
      const resMsgs = await axios.get(
        `http://localhost:3000/conversaciones/${res.data.id}/mensajes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(resMsgs.data);
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
    setMessages(prev => [
      ...prev,
      { remitente_id: myId, mensaje: message },
    ]);
    setMessage('');
  };

  return (
    <>
      <button
        className="btn btn-primary rounded-circle position-fixed bottom-0 end-0 m-4 shadow"
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
      </button>

      {open && !selectedUser && (
        <div className="card position-fixed bottom-0 end-0 mb-5 me-4" style={{ width: '18rem', maxHeight: '400px', overflowY: 'auto' }}>
          <div className="card-header bg-light fw-bold">Usuarios</div>
          <ul className="list-group list-group-flush">
            {users.map(user => (
              <li
                key={user.id}
                className="list-group-item d-flex align-items-center hover-bg-light cursor-pointer"
                onClick={() => openConversation(user)}
              >
                <div className="me-2 rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center" style={{ width: 32, height: 32 }}>
                  {user.avatar ? (
                    <img src={`http://localhost:3000${user.avatar}`} alt={user.nombre} className="rounded-circle w-100 h-100" />
                  ) : (
                    <span>{user.nombre.charAt(0)}</span>
                  )}
                </div>
                <span>{user.nombre}</span>
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
                <img src={`http://localhost:3000${selectedUser.avatar}`} alt={selectedUser.nombre} className="rounded-circle w-100 h-100" />
              ) : (
                <span>{selectedUser.nombre.charAt(0)}</span>
              )}
            </div>
            <span className="fw-bold">{selectedUser.nombre}</span>
          </div>
          <div className="card-body overflow-auto">
            {messages.map((m, i) => (
              <div key={i} className={`d-flex ${m.remitente_id === myId ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
                <div className={`p-2 rounded-pill ${m.remitente_id === myId ? 'bg-primary text-white' : 'bg-light text-dark'}`}>{m.mensaje}</div>
              </div>
            ))}
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
