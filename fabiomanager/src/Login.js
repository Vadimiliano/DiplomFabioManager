import React, { useState } from 'react';
import './Login.css'; // Ваши стили остаются без изменений
import laptopImage from './res/computerImage.png'; 
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await axios.post('http://127.0.0.1:8000/api/login', formData);
           
            const { token, user } = response.data; // Извлекаем данные о пользователе
            if (!token) {
                console.error('Ошибка: токен отсутствует в ответе сервера.');
                return;
            }
            localStorage.setItem('token', token);
            
            // Сохранение данных о пользователе в localStorage
            localStorage.setItem('user', JSON.stringify(user));
    
            // Вывод токена в консоль
            console.log('Токен после авторизации:', token);
    
            // Перенаправление на /dashboard после вывода токена
            window.location.href = '/dashboard';
    
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Не удалось подключиться к серверу.';
            setError(`Ошибка: ${errorMessage}`);
            console.error('Не верные данные пользователя:', error);
        }
    };
    

    return (
        <div className="login-container">
            <div className="auth-container">
                <div className="circle-background"></div>
                <div className="image-container">
                    <img src={laptopImage} alt="Laptop" />
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Вход</h2>
                    <div>
                        <div style={{ position: 'relative' }}>
                            <img
                                src={require('./res/loginIcon.png')}
                                alt="Иконка"
                                style={{
                                    position: 'absolute',
                                    left: '10px',
                                    top: '30%',
                                    transform: 'translateY(-50%)',
                                    width: '15px',
                                    height: '15px',
                                    marginTop: '5px',
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Логин"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                style={{ paddingLeft: '30px' }}
                            />
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={require('./res/passwordIcon.png')}
                            alt="Иконка"
                            style={{
                                position: 'absolute',
                                left: '10px',
                                top: '30%',
                                transform: 'translateY(-50%)',
                                width: '15px',
                                height: '15px',
                                marginTop: '5px',
                            }}
                        />
                        <input
                            type="password"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ paddingLeft: '30px' }}
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="submit">Войти</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
