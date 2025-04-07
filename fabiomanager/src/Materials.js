import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import './materialTable.css';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAscending, setSortAscending] = useState(false);
  const [sortDescending, setSortDescending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Используем единый state для формы (как при добавлении, так и при редактировании)
  const [newMaterial, setNewMaterial] = useState({
    materialname: '',
    description: '',
    unitid: '',
    quantity: '',
    price: '',
    supplierid: '',
    dateofreceipt: '',
    newUnit: '',
    newSupplier: '',
  });
  // Если редактируем, то хранится id редактируемой записи
  const [editingId, setEditingId] = useState(null);
  const [showNewUnitField, setShowNewUnitField] = useState(false);
  const [showNewSupplierField, setShowNewSupplierField] = useState(false);

  const navigate = useNavigate();
  const userData = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))
    : null;
  const currentRole = userData?.rolename?.toLowerCase() || '';
  const canEdit = currentRole === 'администратор' || currentRole === 'менеджер' || currentRole === 'сотрудник';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSuppliers(token);
      fetchUnits(token);
      fetchMaterials(token);
    }
  }, []);

  const fetchSuppliers = async (token) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/suppliers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки поставщиков:', error);
    }
  };

  const fetchUnits = async (token) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/units', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnits(response.data);
    } catch (error) {
      console.error('Ошибка загрузки единиц измерения:', error);
    }
  };

  // Ожидаем, что сервер возвращает массив объектов с полями:
  // id, materialname, description, unitid, unitname, quantity, price, supplierid, suppliername, dateofreceipt
  const fetchMaterials = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/materials', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterials(response.data);
    } catch (error) {
      console.error('Ошибка запроса:', error.response?.data || error.message);
      setError('Ошибка загрузки данных.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewMaterial({
      materialname: '',
      description: '',
      unitid: '',
      quantity: '',
      price: '',
      supplierid: '',
      dateofreceipt: '',
      newUnit: '',
      newSupplier: '',
    });
    setShowNewUnitField(false);
    setShowNewSupplierField(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial({ ...newMaterial, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (
      !newMaterial.materialname ||
      !newMaterial.description ||
      !newMaterial.unitid ||
      !newMaterial.quantity ||
      !newMaterial.price ||
      !newMaterial.supplierid ||
      !newMaterial.dateofreceipt
    ) {
      alert("Пожалуйста, заполните все обязательные поля.");
      return;
    }

    let finalUnit = newMaterial.unitid;
    let finalSupplier = newMaterial.supplierid;

    try {
      if (newMaterial.newUnit) {
        const unitRes = await axios.post(
          'http://127.0.0.1:8000/api/units/add',
          { unitname: newMaterial.newUnit },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        finalUnit = unitRes.data.id;
      }
      if (newMaterial.newSupplier) {
        const supplierRes = await axios.post(
          'http://127.0.0.1:8000/api/suppliers/add',
          { suppliername: newMaterial.newSupplier },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        finalSupplier = supplierRes.data.id;
      }

      const payload = {
        materialname: newMaterial.materialname,
        description: newMaterial.description,
        unitid: parseInt(finalUnit, 10),
        quantity: parseInt(newMaterial.quantity, 10),
        price: parseFloat(newMaterial.price),
        supplierid: parseInt(finalSupplier, 10),
        dateofreceipt: newMaterial.dateofreceipt,
      };

      console.log("Payload being sent:", payload);

      const response = await axios.post('http://127.0.0.1:8000/api/materials', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 201) {
        closeModal();
        fetchMaterials(token);
      }
    } catch (error) {
      console.error('Ошибка при добавлении материала:', error.response?.data || error.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    let finalUnit = newMaterial.unitid;
    let finalSupplier = newMaterial.supplierid;

    try {
      if (newMaterial.newUnit) {
        const unitRes = await axios.post(
          'http://127.0.0.1:8000/api/units/add',
          { unitname: newMaterial.newUnit },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        finalUnit = unitRes.data.id;
      }
      if (newMaterial.newSupplier) {
        const supplierRes = await axios.post(
          'http://127.0.0.1:8000/api/suppliers/add',
          { suppliername: newMaterial.newSupplier },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        finalSupplier = supplierRes.data.id;
      }

      const payload = {
        materialname: newMaterial.materialname,
        description: newMaterial.description,
        unitid: parseInt(finalUnit, 10),
        quantity: parseInt(newMaterial.quantity, 10),
        price: parseFloat(newMaterial.price),
        supplierid: parseInt(finalSupplier, 10),
        dateofreceipt: newMaterial.dateofreceipt,
      };

      const response = await axios.put(
        `http://127.0.0.1:8000/api/materials/${editingId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        closeModal();
        fetchMaterials(token);
      }
    } catch (error) {
      console.error('Ошибка при обновлении материала:', error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (window.confirm('Вы уверены, что хотите удалить этот материал?')) {
      try {
        const response = await axios.delete(`http://127.0.0.1:8000/api/materials/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) {
          fetchMaterials(token);
        }
      } catch (error) {
        console.error('Ошибка при удалении материала:', error.response?.data || error.message);
      }
    }
  };

  const handleEdit = (material) => {
    setEditingId(material.id);
    setNewMaterial({
      materialname: material.materialname,
      description: material.description,
      unitid: material.unitid,
      quantity: material.quantity,
      price: material.price,
      supplierid: material.supplierid,
      dateofreceipt: material.dateofreceipt,
      newUnit: '',
      newSupplier: '',
    });
    setIsModalOpen(true);
  };

  const handleSortChange = (event) => {
    const { name, checked } = event.target;
    if (name === 'ascending') {
      setSortAscending(checked);
      setSortDescending(false);
    } else if (name === 'descending') {
      setSortDescending(checked);
      setSortAscending(false);
    }
  };

  const sortedMaterials = () => {
    let sorted = [...materials];
    if (sortAscending) {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortDescending) {
      sorted.sort((a, b) => b.price - a.price);
    }
    return sorted;
  };

  const filteredMaterials = sortedMaterials().filter((material) =>
    (material.materialname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateToProfile = () => {
    window.location.replace('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Функция для форматирования даты из "YYYY-MM-DD" в "DD.MM.YYYY"
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  return (
    <div className="dashboard-container">
      <Sidebar goToProfile={navigateToProfile} handleLogout={handleLogout} />
      <div className="content">
        <h1>Материалы</h1>
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
          {canEdit && (
            <button className="addButtom" onClick={openModal}>Добавить материал</button>
          )}
        </div>
        {loading && <p>Загрузка данных...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Ед. измерения</th>
                <th>Количество</th>
                <th>Цена</th>
                <th>Поставщик</th>
                <th>Дата поступления</th>
                {canEdit && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((material) => (
                <tr key={material.id}>
                  <td>{material.materialname}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textWrap: 'wrap' }}>
                    {material.description}
                  </td>
                  <td>{material.unitname}</td>
                  <td>{material.quantity}</td>
                  <td>{material.price}</td>
                  <td>{material.suppliername}</td>
                  <td>{formatDate(material.dateofreceipt)}</td>
                  {canEdit && (
                    <td>
                      <button className="editOrDeleteButtom" onClick={() => handleEdit(material)}>
                        Редактировать
                      </button>
                      <button className="editOrDeleteButtom" onClick={() => handleDelete(material.id)}>
                        Удалить
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          )}
          {!loading && !error && filteredMaterials.length === 0 && (
              <p>Нет данных для отображения</p>
          )}
        
        {isModalOpen && canEdit && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeModal}>&times;</span>
              <h2>{editingId ? 'Редактировать материал' : 'Добавить материал'}</h2>
              <form onSubmit={editingId ? handleUpdate : handleSubmit}>
                <label>
                  Название:
                  <input
                    type="text"
                    name="materialname"
                    value={newMaterial.materialname}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Описание:
                  <textarea
                    name="description"
                    value={newMaterial.description}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', height: '100px' }}
                  />
                </label>
                <label>
                  Ед. измерения:
                  <select
                    name="unitid"
                    value={newMaterial.unitid}
                    onChange={handleInputChange}
                  >
                    <option value="">Выберите единицу измерения</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>{unit.unitname}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowNewUnitField(!showNewUnitField)}>...</button>
                  {showNewUnitField && (
                    <input
                      type="text"
                      name="newUnit"
                      placeholder="Или введите новую"
                      value={newMaterial.newUnit}
                      onChange={handleInputChange}
                    />
                  )}
                </label>
                <label>
                  Поставщик:
                  <select
                    name="supplierid"
                    value={newMaterial.supplierid}
                    onChange={handleInputChange}
                  >
                    <option value="">Выберите поставщика</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.suppliername}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowNewSupplierField(!showNewSupplierField)}>...</button>
                  {showNewSupplierField && (
                    <input
                      type="text"
                      name="newSupplier"
                      placeholder="Или введите нового"
                      value={newMaterial.newSupplier}
                      onChange={handleInputChange}
                    />
                  )}
                </label>
                <label>
                  Количество:
                  <input
                    type="number"
                    name="quantity"
                    value={newMaterial.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Цена:
                  <input
                    type="number"
                    name="price"
                    value={newMaterial.price}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Дата поступления:
                  <input
                    type="date"
                    name="dateofreceipt"
                    value={newMaterial.dateofreceipt}
                    onChange={handleInputChange}
                    required
                  />
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

export default Materials;
