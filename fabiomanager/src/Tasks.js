import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./materialTable.css";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [orders, setOrders] = useState([]);         // чтобы выбрать orderid
  const [taskStatuses, setTaskStatuses] = useState([]); // чтобы выбрать statusid
  const [employees, setEmployees] = useState([]);   // чтобы выбрать responsibleid

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Поля для новой/редактируемой задачи:
  const [newTask, setNewTask] = useState({
    taskname: "",
    orderid: "",
    responsibleid: "",
    // orderdaterange = {lower:'2024-01-01', upper:'2024-01-05'}
    orderdaterange: { lower: "", upper: "" },
    statusid: ""
  });

  const navigate = useNavigate();

  // Проверка роли
  const userData = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  const currentRole = userData?.rolename?.toLowerCase() || "";
  const canEdit = currentRole === "администратор" || currentRole === "менеджер";

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchTasks(token);
      fetchTaskStatuses(token);  // список статусов задач
      fetchEmployees(token);     // список сотрудников
      fetchOrders(token);        // список заказов
    }
  }, []);

  const goToProfile = () => {
    window.location.replace('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };


  const fetchTasks = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        // row = { id, taskname, ordernumber, responsibleid, orderdaterange, statusname, statusid, orderid }
        setTasks(response.data);
      } else {
        console.error("Некорректные данные при загрузке tasks:", response.data);
        setTasks([]);
      }
    } catch (error) {
      console.error("Ошибка загрузки tasks:", error.response?.data || error.message);
      setError("Ошибка загрузки данных.");
    } finally {
      setLoading(false);
    }
  };

  // Загрузка заказов
  const fetchOrders = async (token) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data); // [{id, ordernumber}, ...]
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  // Загрузка статусов задач
  const fetchTaskStatuses = async (token) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/task_statuses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTaskStatuses(response.data); // [{id, statusname}, ...]
    } catch (error) {
      console.error('Ошибка загрузки статусов задач:', error);
    }
  };

  // Загрузка списка сотрудников
  const fetchEmployees = async (token) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/users/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data); // [{id, firstname, name}, ...]
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
    }
  };

  


  const openModal = (task = null) => {
    if (task) {
      // Редактирование
      setEditingId(task.id);
      setNewTask({
        taskname: task.taskname || "",
        orderid: task.orderid || "",
        responsibleid: task.responsibleid || "",
        orderdaterange: task.orderdaterange || { lower: "", upper: "" },
        statusid: task.statusid || ""
      });
    } else {
      // Добавление
      setEditingId(null);
      setNewTask({
        taskname: "",
        orderid: "",
        responsibleid: "",
        orderdaterange: { lower: "", upper: "" },
        statusid: ""
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  // Для дат используем отдельные поля
  const handleDateRangeChange = (field, value) => {
    setNewTask((prev) => ({
      ...prev,
      orderdaterange: {
        ...prev.orderdaterange,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    // Проверяем заполненность
    if (!newTask.taskname || !newTask.orderid || !newTask.responsibleid || !newTask.statusid) {
      alert("Заполните обязательные поля!");
      return;
    }

    // Пример: newTask.orderdaterange = { lower: '2024-01-01', upper: '2024-01-05' }

    try {
      if (editingId) {
        // PUT /api/tasks/{task_id}
        const response = await axios.put(`http://127.0.0.1:8000/api/tasks/${editingId}`, newTask, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 200) {
          closeModal();
          fetchTasks(token);
        }
      } else {
        // POST /api/tasks
        const response = await axios.post("http://127.0.0.1:8000/api/tasks", newTask, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 201) {
          closeModal();
          fetchTasks(token);
        }
      }
    } catch (error) {
      console.error("Ошибка при сохранении задачи:", error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (window.confirm("Вы уверены, что хотите удалить задачу?")) {
      try {
        const response = await axios.delete(`http://127.0.0.1:8000/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 200) {
          fetchTasks(token);
        }
      } catch (error) {
        console.error("Ошибка при удалении задачи:", error);
      }
    }
  };

  const [sortAscending, setSortAscending] = useState(false);
  const [sortDescending, setSortDescending] = useState(false);


  // Поиск (пример: по названию задачи)
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Сортировка (допустим по дате range.lower)
  // Для упрощения возьмем startDate = orderdaterange.lower
  const sortTasks = () => {
    let sorted = [...tasks];
    if (sortAscending) {
      sorted.sort((a, b) => {
        const aLower = a.orderdaterange?.lower || "";
        const bLower = b.orderdaterange?.lower || "";
        return new Date(aLower) - new Date(bLower);
      });
    } else if (sortDescending) {
      sorted.sort((a, b) => {
        const aLower = a.orderdaterange?.lower || "";
        const bLower = b.orderdaterange?.lower || "";
        return new Date(bLower) - new Date(aLower);
      });
    }
    return sorted;
  };

  const filteredTasks = sortTasks().filter((task) =>
    task.taskname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.ordernumber.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleSortChange = (e) => {
    const { name, checked } = e.target;
    if (name === "ascending") {
      setSortAscending(checked);
      setSortDescending(false);
    } else if (name === "descending") {
      setSortDescending(checked);
      setSortAscending(false);
    }
  };

  // Функция для красивого отображения daterange
  const formatDateRange = (dateRange) => {
    if (!dateRange || !dateRange.lower || !dateRange.upper) {
      return "Не указано";
    }
    return `${dateRange.lower} - ${dateRange.upper}`;
  };

  return (
    <div className="dashboard-container">
      <Sidebar goToProfile={goToProfile} handleLogout={handleLogout} />
      <div className="content">
        <h1>Задачи</h1>
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
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && filteredTasks.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Задача</th>
                <th>Заказ</th>
                <th>Ответственный</th>
                <th>Диапазон дат</th>
                <th>Статус</th>
                {canEdit && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.taskname}</td>
                  <td>{task.ordernumber}</td>
                  <td>{`${task.firstname} ${task.name}`}</td>
                  <td>{formatDateRange(task.orderdaterange)}</td>
                  <td>{task.statusname}</td>
                  {canEdit && (
                    <td>
                      <button className="editOrDeleteButtom" onClick={() => openModal(task)}>Редактировать</button>
                      <button className="editOrDeleteButtom" onClick={() => handleDelete(task.id)}>Удалить</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && filteredTasks.length === 0 && (
          <p>Нет данных для отображения</p>
        )}

        {isModalOpen && canEdit && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeModal}>&times;</span>
              <form onSubmit={handleSubmit}>
                <label>
                  Название задачи:
                  <input
                    type="text"
                    name="taskname"
                    value={newTask.taskname}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Заказ:
                  <select
                    name="orderid"
                    value={newTask.orderid}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите заказ</option>
                    {orders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        {ord.ordernumber}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Ответственный:
                  <select
                    name="responsibleid"
                    value={newTask.responsibleid}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите сотрудника</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstname} {emp.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Дата начала:
                  <input
                    type="date"
                    name="daterange_lower"
                    value={newTask.orderdaterange.lower}
                    onChange={(e) => handleDateRangeChange("lower", e.target.value)}
                  />
                </label>
                <label>
                  Дата окончания:
                  <input
                    type="date"
                    name="daterange_upper"
                    value={newTask.orderdaterange.upper}
                    onChange={(e) => handleDateRangeChange("upper", e.target.value)}
                  />
                </label>
                <label>
                  Статус:
                  <select
                    name="statusid"
                    value={newTask.statusid}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите статус</option>
                    {taskStatuses.map((sts) => (
                      <option key={sts.id} value={sts.id}>
                        {sts.statusname}
                      </option>
                    ))}
                  </select>
                </label>

                <button type="submit" className="modalbtn">
                  {editingId ? "Обновить" : "Добавить"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
