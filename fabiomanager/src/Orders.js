import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import './materialTable.css';


const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortAscending, setSortAscending] = useState(false);
    const [sortDescending, setSortDescending] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Поскольку ordernumber генерируется на сервере, здесь его не храним
    const [newOrder, setNewOrder] = useState({
        client: '',
        dateofcreation: '',
        statusid: '',
        responsibleid: '',
        description: '',
        client_phone: '',
        client_email: '',
    });

    const goToProfile = () => {
        window.location.replace('/profile');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const navigate = useNavigate();

    // Проверка роли пользователя
    const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    const currentRole = userData?.rolename?.toLowerCase() || '';
    const canEdit = currentRole === 'администратор' || currentRole === 'менеджер';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchOrders(token);
            fetchStatuses(token);
            fetchEmployees(token);
        }
    }, []);

    const fetchOrders = async (token) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/orders', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (Array.isArray(response.data)) {
                const formattedOrders = response.data.map(order => ({
                    id: order[0],
                    ordernumber: order[1],
                    client: order[2],
                    dateofcreation: order[3],
                    statusname: order[4],
                    firstname: order[5],
                    name: order[6],
                    description: order[7] ?? '',
                    client_phone: order[8] ?? '',
                    client_email: order[9] ?? '',
                }));

                setOrders(formattedOrders);
            } else {
                console.error('Некорректные данные от API:', response.data);
                setOrders([]);
            }
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error.response?.data || error.message);
            setError('Ошибка загрузки данных.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatuses = async (token) => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/order_statuses', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStatuses(response.data);
        } catch (error) {
            console.error('Ошибка загрузки статусов:', error);
        }
    };

    const fetchEmployees = async (token) => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/users/employees', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEmployees(response.data);
        } catch (error) {
            console.error('Ошибка загрузки сотрудников:', error);
        }
    };

    const openModal = (order = null) => {
        if (order) {
            setEditingId(order.id);
            // Предположим, order.statusid уже есть из сервера (число), order.responsibleid тоже
            const foundStatus = statuses.find(s => s.statusname === order.statusname);
            const foundEmployee = employees.find(e =>
                e.firstname === order.firstname && e.name === order.name
            );
            setNewOrder({
                ordernumber: order.ordernumber || '',
                client: order.client || '',
                dateofcreation: order.dateofcreation || '',
                statusid: foundStatus ? foundStatus.id : '',
                responsibleid: foundEmployee ? foundEmployee.id : '',
                description: order.description || '',
                client_phone: order.client_phone || '',
                client_email: order.client_email || ''
            });

        } else {
            // Добавление
            setEditingId(null);
            setNewOrder({
                client: '',
                dateofcreation: '',
                statusid: '',
                responsibleid: '',
                description: '',
                client_phone: '',
                client_email: ''
            });
        }
        setIsModalOpen(true);
    };



    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setNewOrder({
            client: '',
            dateofcreation: '',
            statusid: '',
            responsibleid: '',
            description: '',
            client_phone: '',
            client_email: '',
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewOrder({ ...newOrder, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');


        if (!newOrder.client || !newOrder.dateofcreation || !newOrder.statusid || !newOrder.responsibleid || !newOrder.description || !newOrder.client_phone || !newOrder.client_email) {
            alert('Заполните все поля!');
            return;
        }

        try {
            if (editingId) {
                // Редактирование
                const response = await axios.put(`http://127.0.0.1:8000/api/orders/${editingId}`, newOrder, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.status === 200) {
                    closeModal();
                    fetchOrders(token);
                }
            } else {
                // Добавление
                const response = await axios.post('http://127.0.0.1:8000/api/orders', newOrder, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.status === 201) {
                    closeModal();
                    fetchOrders(token);
                }
            }
        } catch (error) {
            console.error('Ошибка сохранения заказа:', error.response?.data || error.message);
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        if (window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
            try {
                await axios.delete(`http://127.0.0.1:8000/api/orders/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                fetchOrders(token);
            } catch (error) {
                console.error('Ошибка при удалении заказа:', error);
            }
        }
    };

    const handleEdit = (order) => {
        openModal(order);
    };

    // Поиск
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Сортировка
    const handleSortChange = (e) => {
        const { name, checked } = e.target;
        if (name === 'ascending') {
            setSortAscending(checked);
            setSortDescending(false);
        } else if (name === 'descending') {
            setSortDescending(checked);
            setSortAscending(false);
        }
    };

    const sortedOrders = () => {
        let sorted = [...orders];
        if (sortAscending) {
            sorted.sort((a, b) => new Date(a.dateofcreation) - new Date(b.dateofcreation));
        } else if (sortDescending) {
            sorted.sort((a, b) => new Date(b.dateofcreation) - new Date(a.dateofcreation));
        }
        return sorted;
    };

    const filteredOrders = sortedOrders().filter((order) =>
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const parts = dateString.split("-");
        if (parts.length !== 3) return dateString;
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    };

    // Форматирование для маски ввода номера телефона
    const formatPhoneDisplay = (phone) => {
        if (!phone) return '';
        const numbers = String(phone).replace(/\D/g, '');
        let formatted = '+7';
        if (numbers.length > 1) formatted += ` (${numbers.substring(1, 4)}`;
        if (numbers.length > 4) formatted += `) ${numbers.substring(4, 7)}`;
        if (numbers.length > 7) formatted += `-${numbers.substring(7, 9)}`;
        if (numbers.length > 9) formatted += `-${numbers.substring(9, 11)}`;
        return formatted;
    };

    // Обработчик изменений
    const handlePhoneChange = (e) => {
        const numbers = e.target.value.replace(/\D/g, '');
        let cleanValue = numbers;

        if (numbers.startsWith('7') || numbers.startsWith('8')) {
            cleanValue = '7' + numbers.slice(1, 11);
        } else if (numbers) {
            cleanValue = '7' + numbers.slice(0, 10);
        }

        setNewOrder({
            ...newOrder,
            client_phone: cleanValue
        });
    };

    
    return (
        <div className="dashboard-container">
            <Sidebar goToProfile={goToProfile} handleLogout={handleLogout} />
            <div className="content">
                <h1>Заказы</h1>
                <div className="search-container">
                    <div className="input-wrapper">
                        <img src={require('./res/searchImg.png')} alt="Поиск" className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Поиск..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="sort-container">
                        <label className="custom-checkbox">
                            <input
                                type="checkbox"
                                name="ascending"
                                checked={sortAscending}
                                onChange={handleSortChange}
                            />
                            <span>По возрастанию</span>
                        </label>
                        <label className="custom-checkbox">
                            <input
                                type="checkbox"
                                name="descending"
                                checked={sortDescending}
                                onChange={handleSortChange}
                            />
                            <span>По убыванию</span>
                        </label>
                    </div>
                    {canEdit && <button className="addButtom" onClick={() => openModal()}>Добавить заказ</button>}
                </div>

                {loading && <p>Загрузка данных...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && filteredOrders.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                <th>Номер</th>
                                <th>Клиент</th>
                                <th>Номер телефона</th>
                                <th>Почта</th>
                                <th>Дата</th>
                                <th>Статус</th>
                                <th>Ответственный</th>
                                <th>Описание</th>

                                {canEdit && <th>Действия</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.ordernumber}</td>
                                    <td>{order.client}</td>
                                    <td>{formatPhoneDisplay(order.client_phone)}</td>
                                    <td>{order.client_email}</td>
                                    <td>{formatDate(order.dateofcreation)}</td>
                                    <td>{order.statusname}</td>
                                    <td>{`${order.firstname} ${order.name}`}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {order.description}
                                    </td>
                                    {canEdit && (
                                        <td>
                                            <button className="editOrDeleteButtom" onClick={() => handleEdit(order)}>
                                                Редактировать
                                            </button>
                                            <button className="editOrDeleteButtom" onClick={() => handleDelete(order.id)}>
                                                Удалить
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && !error && filteredOrders.length === 0 && (
                    <p>Нет данных для отображения</p>
                )}

                {isModalOpen && canEdit && (
                    <div className="modal">
                        <div className="modal-content">
                            <span className="close" onClick={closeModal}>&times;</span>
                            <form onSubmit={handleSubmit}>
                                <label style={{ visibility: 'hidden' }}>
                                    Номер заказа:
                                    <input
                                        type="text"
                                        name="ordernumber"
                                        value={newOrder.ordernumber || ''}
                                        disabled
                                    />
                                </label>
                                <label>
                                    Клиент:
                                    <input
                                        type="text"
                                        name="client"
                                        value={newOrder.client}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Номер телефона:
                                    <input
                                        type="tel"
                                        name="client_phone"
                                        value={formatPhoneDisplay(newOrder.client_phone)}
                                        onChange={handlePhoneChange}
                                        placeholder="+7 (___) ___-__-__"
                                        maxLength={18}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </label>
                                <label>
                                    Почта:
                                    <input
                                        type="email"
                                        name="client_email"
                                        value={newOrder.client_email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Дата:
                                    <input
                                        type="date"
                                        name="dateofcreation"
                                        value={newOrder.dateofcreation}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Описание:
                                    <textarea
                                        name="description"
                                        value={newOrder.description}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', height: '80px' }}
                                    />
                                </label>
                                <label>
                                    Статус:
                                    <select
                                        name="statusid"
                                        value={newOrder.statusid}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Выберите статус</option>
                                        {statuses.map((status) => (
                                            <option key={status.id} value={status.id}>
                                                {status.statusname}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Ответственный:
                                    <select
                                        name="responsibleid"
                                        value={newOrder.responsibleid}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Выберите сотрудника</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>{`${emp.firstname} ${emp.name}`}</option>
                                        ))}
                                    </select>
                                </label>

                                <button className="modalbtn" type="submit">
                                    {editingId ? 'Обновить' : 'Добавить'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
