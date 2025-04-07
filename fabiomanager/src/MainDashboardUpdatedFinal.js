import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainDashboard.css';
import './materialTable.css';
import Sidebar from './Sidebar';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const MainDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Стейты для данных
    const [totalOrders, setTotalOrders] = useState(0);
    const [completedOrders, setCompletedOrders] = useState(0);
    const [ordersByMonth, setOrdersByMonth] = useState([]);
    const [materials, setMaterials] = useState([]);

    // Массив, который будем показывать в диаграмме поэтапно
    const [displayedMaterials, setDisplayedMaterials] = useState([]);

    // Цвета для круговой диаграммы
    const COLORS = ['#FFBB28', '#FF8042', '#0088FE', '#00C49F', '#FFBB28'];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }
        fetchDashboardData(token);
    }, [navigate]);

    const fetchDashboardData = async (token) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;

            setTotalOrders(data.totalOrders);
            setCompletedOrders(data.completedOrders);
            setOrdersByMonth(data.ordersByMonth);
            setMaterials(data.materials);

        } catch (err) {
            console.error('Ошибка при загрузке дашборда:', err.response?.data || err.message);
            setError('Ошибка при загрузке данных.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const goToProfile = () => {
        navigate('/profile');
    };

    // Поочерёдное добавление секторов в displayedMaterials
    useEffect(() => {
        if (!loading && !error && materials.length > 0) {
            let index = 0;
            let tempArr = [];

            // 1) Сначала сразу добавляем первый сектор:
            tempArr.push(materials[index]);
            setDisplayedMaterials([...tempArr]);
            index++;

            // 2) Теперь запускаем интервал для оставшихся секторов (если есть)
            const intervalId = setInterval(() => {
                if (index < materials.length) {
                    tempArr.push(materials[index]);
                    setDisplayedMaterials([...tempArr]);
                    index++;
                } else {
                    clearInterval(intervalId);
                }
            }, 1200);   

            // Чистим, если размонтируется
            return () => clearInterval(intervalId);
        }
    }, [loading, error, materials]);


    return (
        <div className="dashboard-container">
            <Sidebar goToProfile={goToProfile} handleLogout={handleLogout} />
            <div className="content">
                <h1>Главная</h1>

                {loading && <p>Загрузка...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                {!loading && !error && (
                    <>
                        {/* 1) Блок info-area, в котором .order-info-container и .chart-wrapper-container в строку */}
                        <div className="info-area">
                            <div className="order-info-container">
                                <div className="info-card">
                                    <h2>Количество заказов</h2>
                                    <div className="info-number">{totalOrders}</div>
                                </div>
                                <div className="info-card">
                                    <h2>Количество завершенных</h2>
                                    <div className="info-number">{completedOrders}</div>
                                </div>
                            </div>

                            <div className="chart-wrapper-container">
                                <h2>Материалы</h2>
                                <ResponsiveContainer width="100%" height={310}>
                                    <PieChart>
                                        <Pie
                                            data={displayedMaterials}
                                            dataKey="value"
                                            nameKey="name"
                                            outerRadius={120}
                                            innerRadius={50}
                                            label
                                            isAnimationActive={true}
                                            animationDuration={400}
                                            animationEasing="ease-out"
                                        >
                                            {displayedMaterials.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2) Отдельный блок для столбчатой диаграммы на всю ширину */}
                        <div className="chart-wrapper-wide">
                            <h2>График заказов (по месяцам)</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={ordersByMonth}>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="new" fill="#FFBB28" name="Новые" />
                                    <Bar dataKey="completed" fill="#FF8042" name="Завершенные" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MainDashboard;
