import React from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css'; // Импорт стилей для нового компонента

const Sidebar = ({ goToProfile, handleLogout }) => {
  // Извлекаем информацию о пользователе из localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="sidebar">
      <div className="profile-container" style={{ display: 'flex', alignItems: 'center' }} onClick={goToProfile}>
        <img
          src={require('./res/ProfileIcon.png')}
          alt="Иконка"
          style={{ width: '50px', height: '50px' }}
        />
        <div className="user-info" style={{  opacity: 1, position: 'relative', width: '10px' }}>
          <p className='User  Name' style={{ display: 'inline-block', margin: '0', textWrap:'nowrap' }}>
            {user ? `${user.firstname} ${user.name}` : 'Профиль'}
          </p>
          <p className='User  Name' style={{ margin: '0', marginTop: '5px', display: 'inline-block' }}>
            {user ? `${user.surname}` : ''}
          </p>
        </div>
      </div>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ height: '50px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src={require('./res/dashboardIcon.png')}
              alt="Иконка"
              style={{ width: '30px', height: '30px', flexShrink: 0 }}
            />
            <p style={{ margin: '0 0 0 10px', display: 'inline-block' }}>Главная</p>
          </Link>
        </li>
        <li style={{ height: '50px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <Link to="/materials" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src={require('./res/matirialIcon.png')}
              alt="Иконка"
              style={{ width: '30px', height: '30px', flexShrink: 0 }}
            />
            <p style={{ margin: '0 0 0 10px', display: 'inline-block', textWrap: 'nowrap' }}>Учет материалов</p>
          </Link>
        </li>
        <li style={{ height: '50px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <Link to="/orders" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src={require('./res/orderIcon.png')}
              alt="Иконка"
              style={{ width: '30px', height: '30px', flexShrink: 0 }}
            />
            <p style={{ margin: '0 0 0 10px', display: 'inline-block' }}>Заказы</p>
          </Link>
        </li>
        <li style={{ height: '50px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <Link to="/users" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src={require('./res/usersIcon.png')}
              alt="Иконка"
              style={{ width: '30px', height: '30px', flexShrink: 0 }}
            />
            <p style={{ margin: '0 0 0 10px', display: 'inline-block' }}>Пользователи</p>
          </Link>
        </li>
        <li style={{ height: '50px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <Link to="/tasks" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src={require('./res/tasksIcon.png')}
              alt="Иконка"
              style={{ width: '30px', height: '30px', flexShrink: 0 }}
            />
            <p style={{ margin: '0 0 0 10px', display: 'inline-block' }}>Задачи</p>
          </Link>
        </li>
      </ul>
      <li className='logoutButoon' style={{ height: '50px', display: 'flex', alignItems: 'center', overflow: 'hidden', position: 'relative', marginTop: 'auto' }} onClick={handleLogout}>
        <img
          src={require('./res/logoutIcon.png')}
          alt="Иконка"
          style={{ width: '30px', height: '30px', flexShrink: 0 }}
        />
        <p style={{ margin: '0 0 0 10px', display: 'inline-block' }}>Выход</p>
      </li>
    </div>
  );
};

export default Sidebar;