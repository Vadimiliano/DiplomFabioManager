import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import './materialTable.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [currentRole, setCurrentRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstname: '',
    name: '',
    surname: '',
    roleid: '',
    username: '',
    password: ''
  });
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);

  const navigate = useNavigate();

  const goToProfile = () => {
    window.location.replace('/profile');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    if (!token || !userData) {
      handleLogout();
      return;
    }
    // Получаем роль напрямую из userData
    const roleFromUser = userData.rolename ? userData.rolename.toLowerCase() : 'user';
    setCurrentRole(roleFromUser);
    fetchUsers(token, roleFromUser);
    if (roleFromUser === 'администратор') {
      fetchRoles(token);
    }
  }, []);

  const fetchUsers = async (token, roleParam) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formattedUsers = response.data.map((item) => {
        if (roleParam === 'администратор') {
          return {
            id: item.id,
            firstname: item.firstname,
            name: item.name,
            surname: item.surname,
            roleid: item.roleid,
            rolename: item.rolename,
            lastentry: item.lastentry,
            username: item.username,
            password: item.password
          };
        } else {
          return {
            id: item.id,
            firstname: item.firstname,
            name: item.name,
            surname: item.surname,
            lastentry: item.lastentry
          };
        }
      });
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Ошибка запроса:', error.response?.data || error.message);
      setError('Ошибка загрузки данных.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async (token) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data);
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setNewUser({
      firstname: '',
      name: '',
      surname: '',
      roleid: '',
      username: '',
      password: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingUser) {
      setEditingUser({ ...editingUser, [name]: value });
    } else {
      setNewUser({ ...newUser, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/users', newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 201) {
        closeModal();
        // Передаем currentRole, который уже обновлён
        fetchUsers(token, currentRole);
      }
    } catch (error) {
      console.error('Ошибка при добавлении пользователя:', error.response?.data || error.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`http://127.0.0.1:8000/api/users/${editingUser.id}`, editingUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        closeModal();
        fetchUsers(token, currentRole);
      }
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        const response = await axios.delete(`http://127.0.0.1:8000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) {
          fetchUsers(token, currentRole);
        }
      } catch (error) {
        console.error('Ошибка при удалении пользователя:', error.response?.data || error.message);
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter((user) =>
    (user.firstname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.surname || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    
    const dateObj = new Date(dateTimeString);
    
    if (isNaN(dateObj.getTime())) return dateTimeString; // Если дата некорректная, возвращаем как есть

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Месяцы в JS начинаются с 0
    const year = dateObj.getFullYear();

    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds} ${day}.${month}.${year}`;
};


  return (
    <div className="dashboard-container">
      <Sidebar goToProfile={goToProfile} handleLogout={handleLogout} />
      <div className="content">
        <h1>Пользователи</h1>
        <div className="search-container">
          <div className="input-wrapper">
            <img src={require('./res/searchImg.png')} alt="Поиск" className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          {currentRole === 'администратор' && (
            <button className="addButtom" style={{ marginLeft: '10%', width: '20%' }} onClick={openModal}>
              Добавить пользователя
            </button>
          )}
        </div>
        {loading && <p>Загрузка данных...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>Фамилия</th>
                <th>Имя</th>
                <th>Отчество</th>
                {currentRole === 'администратор' && (
                  <>
                    <th>Логин</th>
                    <th>Пароль</th>
                    <th>Роль</th>
                  </>
                )}
                <th>Последний вход</th>
                {currentRole === 'администратор' && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.firstname}</td>
                    <td>{user.name}</td>
                    <td>{user.surname}</td>
                    {currentRole === 'администратор' && (
                      <>
                        <td>{user.username}</td>
                        <td>{user.password}</td>
                        <td>{user.rolename}</td>
                      </>
                    )}
                    <td>{formatDateTime(user.lastentry)}</td>
                    {currentRole === 'администратор' && (
                      <td>
                        <button className="editOrDeleteButtom" onClick={() => handleEdit(user)}>
                          Редактировать
                        </button>
                        <button className="editOrDeleteButtom" onClick={() => handleDelete(user.id)}>
                          Удалить
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={currentRole === 'администратор' ? 7 : 4} style={{ textAlign: 'center' }}>
                    Нет данных для отображения
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {isModalOpen && currentRole === 'администратор' && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeModal}>
                &times;
              </span>
              <h2>{editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}</h2>
              <form onSubmit={editingUser ? handleUpdate : handleSubmit}>
                <label>
                  Фамилия:
                  <input
                    type="text"
                    name="firstname"
                    value={editingUser ? editingUser.firstname : newUser.firstname}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Имя:
                  <input
                    type="text"
                    name="name"
                    value={editingUser ? editingUser.name : newUser.name}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Отчество:
                  <input
                    type="text"
                    name="surname"
                    value={editingUser ? editingUser.surname : newUser.surname}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                {currentRole === 'администратор' && (
                  <>
                    <label>
                      Логин:
                      <input
                        type="text"
                        name="username"
                        value={editingUser ? editingUser.username : newUser.username}
                        onChange={handleInputChange}
                        required
                      />
                    </label>
                    <label>
                      Пароль:
                      <input
                        type="text"
                        name="password"
                        value={editingUser ? editingUser.password : newUser.password}
                        onChange={handleInputChange}
                        required
                      />
                    </label>
                    <label>
                      Роль:
                      <select
                        name="roleid"
                        value={editingUser ? editingUser.roleid : newUser.roleid}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Выберите роль</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.rolename}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <button className="modalbtn" type="submit">
                  {editingUser ? 'Обновить' : 'Добавить'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
