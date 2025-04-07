



import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./profile.css";

const Profile = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [orders, setOrders] = useState([]);
    const [taskStatuses, setTaskStatuses] = useState([]);
    const [orderStatuses, setOrderStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null); // Для модального окна
    const [isModalOpen, setIsModalOpen] = useState(false); // Состояние модального окна

    const userData = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    const firstname = userData?.firstname || "—";
    const name = userData?.name || "—";
    const surname = userData?.surname || "—";
    const username = userData?.username || "—";
    const fullName = `${firstname} ${name} ${surname}`;
    const role = userData?.rolename || '—';


    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // Проверяем роль перед выполнением запросов
            if (role !== 'сотрудник') {
                fetchOrdersAndTasks(token);
                fetchTaskStatuses(token);
                fetchOrderStatuses(token);
            }
        }
    }, [role]);


    const fetchOrdersAndTasks = async (token) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user_orders_tasks", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data) {
                const formattedOrders = response.data.orders.map(order => ({
                    id: order[0],
                    ordernumber: order[1],
                    statusid: order[2],
                    responsibleid: order[3]
                }));

                const formattedTasks = response.data.tasks.map(task => ({
                    id: task[0],
                    taskname: task[1],
                    statusid: task[2],
                    statusname: task[3],
                    orderid: task[4],
                    ordernumber: task[5]
                }));

                setOrders(formattedOrders);
                setTasks(formattedTasks);
            } else {
                setOrders([]);
                setTasks([]);
            }
        } catch (err) {
            if (role === 'сотрудник') {
                console.error("Ошибка загрузки заказов и задач:", err);
                setError("Ошибка загрузки данных."); // Устанавливаем сообщение об ошибке только для сотрудников
            }
        
        } finally {
            setLoading(false);
        }
    };

    const fetchTaskStatuses = async (token) => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/task_statuses", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTaskStatuses(response.data);
        } catch (err) {
            if (role === 'сотрудник') {
                console.error("Ошибка загрузки статусов задач:", err);
            }
            
        }
    };

    const fetchOrderStatuses = async (token) => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/order_statuses", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOrderStatuses(response.data);
        } catch (err) {
            if (role === 'сотрудник') {
                console.error("Ошибка загрузки статусов заказов:", err);
            }
        }
    };

    const openModal = (orderId) => {
        setActiveOrder(orderId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setActiveOrder(null);
        setIsModalOpen(false);
    };

    const updateOrderStatus = async (orderId, newStatusId) => {
        const token = localStorage.getItem("token");
        try {
            await axios.put(`http://127.0.0.1:8000/api/orders/${orderId}/status`,
                { status_id: newStatusId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            fetchOrdersAndTasks(token);
        } catch (error) {
            if (role === 'сотрудник') {
                console.error("Ошибка обновления статуса заказа:", error);
            }
        }
    };

    const updateTaskStatus = async (taskId, newStatusId) => {
        const token = localStorage.getItem("token");
        try {
            const data = { status_id: Number(newStatusId) };
            console.log("Отправка данных:", data);
            await axios.put(`http://127.0.0.1:8000/api/tasks/${taskId}/status`,
                data,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            fetchOrdersAndTasks(token);
        } catch (error) {
            if (role === 'сотрудник') {
                console.error("Ошибка обновления статуса задачи:", error);
            }
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };
    const currentRole = userData?.rolename?.toLowerCase() || '';
    const isEmployee = currentRole === 'сотрудник'; 


    return (
        <div className="profile-container">
            <Sidebar handleLogout={handleLogout} />
            <div className="content profile-page">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <img
                            src={require("./res/ProfileIconBig.png")}
                            alt="Avatar"
                            className="avatar-image"
                        />
                    </div>
                    <div className="profile-header-info">
                        <h2 className="profile-big-name">{firstname} {name}</h2>
                        <div className="profile-line"></div>
                        <div className="profile-subheader">
                            <div className="profile-sub-block">
                                <p className="profile-sub-label">ФИО</p>
                                <p className="profile-sub-value">{fullName}</p>
                            </div>
                            <div className="profile-sub-block">
                                <p className="profile-sub-label">Логин</p>
                                <p className="profile-sub-value">{username}</p>
                            </div>
                            <div className="profile-sub-block">
                                <p className="profile-sub-label">Роль</p>
                                <p className="profile-sub-value">{role}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="profile-body">
                    {isEmployee && ( // Условие для отображения блоков
                        <div className="profile-left-column">
                            <div className="profile-box">
                                <div className="tasks-box">
                                    <h3>Ваши заказы и задачи</h3>
                                    {loading ? (
                                        <p>Загрузка...</p>
                                    ) : error ? (
                                        <p>{error}</p>
                                    ) : (
                                        orders.filter(order => orderStatuses.find(status => status.id === order.statusid)?.statusname !== "Выполнен").length > 0 ? (
                                            orders
                                                .filter(order => orderStatuses.find(status => status.id === order.statusid)?.statusname !== "Выполнен")
                                                .map(order => (
                                                    <div key={order.id} className="order-block" onClick={() => openModal(order.id)}>
                                                        <span className="data-dot"></span>
                                                        <h4>Заказ: {order.ordernumber}</h4>
                                                    </div>
                                                ))
                                        ) : (
                                            <p>У вас нет незавершенных заказов.</p>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="profile-box notification-box">
                                <h3>Уведомления</h3>
                                {orders.filter(order => orderStatuses.find(status => status.id === order.statusid)?.statusname !== "Выполнен").length > 0 ? (
                                    orders
                                        .filter(order => orderStatuses.find(status => status.id === order.statusid)?.statusname !== "Выполнен")
                                        .map(order => (
                                            <div key={order.id} className="order-block">
                                                <span className="data-dot"></span>
                                                <span className="notification-text">У вас новый заказ: {order.ordernumber}</span>
                                            </div>
                                        ))
                                ) : (
                                    <p>У вас нет незавершенных заказов.</p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="profile-right-column">
                        {isEmployee && ( // Условие для отображения завершенных заказов
                            <div className="profile-box history-box">
                                <h3>Завершенные заказы</h3>
                                {orders.filter(order => orderStatuses.find(status => status.id === order.statusid)?.statusname === "Выполнен").length > 0 ? (
                                    orders
                                        .filter(order => orderStatuses.find(status => status.id === order.statusid)?.statusname === "Выполнен")
                                        .map(order => (
                                            <div key={order.id} className="order-block" onClick={() => openModal(order.id)}>
                                                <h4>Заказ: {order.ordernumber}</h4>
                                            </div>
                                        ))
                                ) : (
                                    <p>У вас нет завершенных заказов.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {isModalOpen && (
                    <Modal
                        order={orders.find(order => order.id === activeOrder)}
                        tasks={tasks.filter(task => task.orderid === activeOrder)}
                        taskStatuses={taskStatuses}
                        orderStatuses={orderStatuses}
                        closeModal={closeModal}
                        updateOrderStatus={updateOrderStatus}
                        updateTaskStatus={updateTaskStatus}
                    />
                )}
            </div>
        </div>
    );
};

const Modal = ({ order, tasks, taskStatuses, orderStatuses, closeModal, updateOrderStatus, updateTaskStatus }) => (
    <div className="modal">
        <div className="modal-content">
            <span onClick={closeModal} className="close">Закрыть</span>
            <h3>Заказ: {order.ordernumber}</h3>
            <p>
                <strong>Статус:</strong>
                <select
                    value={order.statusid}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                >
                    {orderStatuses.map(status => (
                        <option key={status.id} value={status.id}>
                            {status.statusname}
                        </option>
                    ))}
                </select>
            </p>
            <div>
                <h4>Связанные задачи</h4>
                {tasks.length === 0 ? (
                    <p>Нет задач для этого заказа.</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id}>
                            <p>{task.taskname}</p>
                            <p>
                                <strong>Статус:</strong>
                                <select
                                    value={task.statusid}
                                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                >
                                    {taskStatuses.map(status => (
                                        <option key={status.id} value={status.id}>
                                            {status.statusname}
                                        </option>
                                    ))}
                                </select>
                            </p>
                        </div>
                    ))
                )}
            </div>
            <button className="modalbtn" onClick={closeModal}>Сохранить</button>
        </div>
    </div>
);

export default Profile;
