from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from database import (
    get_materials, authenticate_user, get_orders, get_tasks, get_users,
    get_user_role, insert_user, update_user, delete_user, get_roles,
    get_suppliers, get_units, insert_materials, update_material, delete_material,
    update_last_entry, insert_unit, insert_supplier, get_employees, get_order_statuses, 
    insert_order, delete_order, update_order, insert_task, delete_task, update_task, get_orders_for_select,
    get_task_statuses, get_completed_orders, get_materials_stats, get_orders_by_month, get_total_orders,
    get_orders_by_user_id, get_tasks_by_user_orders, connect_db
)
import jwt
import datetime
import logging
import psycopg2

app = FastAPI()

# CORS configuration
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SECRET_KEY = 'dada4bb6262a7fdb2678836a212d14b0d3a00893b7d908e29520a64899d90013'
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

@app.get("/")
def welcome():
    return "Welcome to the FabioManager API!"


#User Autorization
@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password
    user = authenticate_user(username, password)
    if user:
        update_last_entry(user['id'])
        role = get_user_role(user['roleid'])
        
        # Здесь user['username'] - из базы, 
        # или form_data.username - из формы, главное убрать ['username'] из строки
        token = jwt.encode({
            'user_id': user['id'],
            'user': user['username'],  # или username, если хотите прокинуть введённый логин
            'role': role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        }, SECRET_KEY, algorithm='HS256')

        return JSONResponse(content={
            'token': token,
            'user': {
                'firstname': user['firstname'],
                'name': user['name'],
                'surname': user['surname'],
                'rolename': role,
                'username': user['username']
            }
        }, status_code=200)
    raise HTTPException(status_code=401, detail='Invalid credentials')


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload 
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token has expired!')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Token is invalid!')
    
    
    
#Materials
@app.get("/api/materials")
def get_materials_route(current_user: dict = Depends(get_current_user)):
    materials = get_materials()
    if not materials:
        raise HTTPException(status_code=404, detail='No materials found!')
    return materials

@app.post("/api/materials")
def add_material(material: dict = Body(...), current_user: dict = Depends(get_current_user)):
    # Проверка обязательных полей
    if not material.get('materialname') or not material.get('quantity') or not material.get('price'):
        raise HTTPException(status_code=400, detail="Missing required fields")

    try:
        insert_materials([(
            material['materialname'],
            material['description'],
            material['unitid'],
            material['quantity'],
            material['price'],
            material['supplierid'],
            material['dateofreceipt']
        )])
        return JSONResponse(content={"message": "Material added successfully"}, status_code=201)
    except Exception as e:
        logger.error(f"Error adding material: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.put("/api/materials/{material_id}")
def update_material_route(material_id: int, material: dict = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        update_material(material_id, material)
        return JSONResponse(content={"message": "Material updated successfully"}, status_code=200)
    except Exception as e:
        logger.error(f"Error updating material: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.delete("/api/materials/{material_id}")
def delete_material_route(material_id: int, current_user: dict = Depends(get_current_user)):
    try:
        delete_material(material_id)
        return JSONResponse(content={"message": "Material deleted successfully"}, status_code=200)
    except Exception as e:
        logger.error(f"Error deleting material: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/api/units/add")
def add_unit(unit: dict = Body(...), current_user: dict = Depends(get_current_user)):
    if current_user.get('role', '').lower() not in ['администратор', 'менеджер']:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        new_id = insert_unit(unit['unitname'])
        return {"id": new_id, "unitname": unit['unitname']}
    except Exception as e:
        logger.error(f"Error adding unit: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/api/suppliers/add")
def add_supplier(supplier: dict = Body(...), current_user: dict = Depends(get_current_user)):
    if current_user.get('role', '').lower() not in ['администратор', 'менеджер']:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        new_id = insert_supplier(supplier['suppliername'])
        return {"id": new_id, "suppliername": supplier['suppliername']}
    except Exception as e:
        logger.error(f"Error adding supplier: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/suppliers")
def get_suppliers_route(current_user: dict = Depends(get_current_user)):
    suppliers = get_suppliers()
    if not suppliers:
        raise HTTPException(status_code=404, detail='No suppliers found!')
    return [{"id": supplier[0], "suppliername": supplier[1]} for supplier in suppliers]

@app.get("/api/units")
def get_units_route(current_user: dict = Depends(get_current_user)):
    units = get_units()
    if not units:
        raise HTTPException(status_code=404, detail='No units found!')
    return [{"id": unit[0], "unitname": unit[1]} for unit in units]






#Orders
@app.get("/api/orders")
def get_orders_route(current_user: dict = Depends(get_current_user)):
    try:
        orders = get_orders()
        return orders if orders else []
    except Exception as e:
        logger.error(f"Ошибка при получении заказов: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")

@app.post("/api/orders")
def add_order(order: dict = Body(...), current_user: dict = Depends(get_current_user)):
    if current_user.get('role', '').lower() not in ['администратор', 'менеджер']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        new_order = insert_order(
            order['client'],
            order['dateofcreation'],
            order['statusid'],
            order['responsibleid'],
            order.get('description', ''),
            order['client_phone'],
            order['client_email']
        )
        return JSONResponse(content={"message": "Order added successfully", "order": new_order}, status_code=201)
    except Exception as e:
        logger.error(f"Error adding order: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.put("/api/orders/{order_id}")
def update_order_route(
    order_id: int,
    data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get('role', '').lower() not in ['администратор', 'менеджер']:
        raise HTTPException(status_code=403, detail="Access denied")

    # Мы игнорируем data.get('ordernumber') и достаем старый ordernumber из базы
    try:
        update_order(
            order_id,
            # Берём старый номер из базы
            data['client'],
            data['dateofcreation'],
            data['statusid'],
            data['responsibleid'],
            data.get('description', ''),
            data['client_phone'],
            data['client_email']
        )
        return JSONResponse(content={"message": "Order updated successfully"}, status_code=200)
    except Exception as e:
        logger.error(f"Error updating order: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.delete("/api/orders/{order_id}")
def delete_order_route(order_id: int, current_user: dict = Depends(get_current_user)):
    if current_user.get('role', '').lower() not in ['администратор', 'менеджер']:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        delete_order(order_id)
        return JSONResponse(content={"message": "Order deleted successfully"}, status_code=200)
    except Exception as e:
        logger.error(f"Error deleting order: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/order_statuses")
def get_order_statuses_route(current_user: dict = Depends(get_current_user)):
    statuses = get_order_statuses()
    if not statuses:
        raise HTTPException(status_code=404, detail='No order statuses found!')
    return [{"id": status[0], "statusname": status[1]} for status in statuses]

@app.get("/api/users/employees")
def get_employees_route(current_user: dict = Depends(get_current_user)):
    employees = get_employees()
    if not employees:
        raise HTTPException(status_code=404, detail='No employees found!')
    return [{"id": emp[0], "firstname": emp[1], "name": emp[2]} for emp in employees]





#Tasks
@app.get("/api/tasks")
def get_tasks_route(current_user: dict = Depends(get_current_user)):
    try:
        rows = get_tasks()
        if not rows:
            return []
        
        formatted_tasks = []
        for row in rows:
            # row = (id, taskname, ordernumber, responsibleid, date_range, statusname, statusid, orderid, firstname, name)
            (
                task_id,
                taskname,
                ordernumber,
                responsibleid,
                date_range,
                statusname_value,
                statusid_value,
                orderid_value,
                user_firstname,
                user_name
            ) = row

            # Обрабатываем daterange, если нужно
            if date_range:
                # date_range.lower / date_range.upper – это объекты datetime.date
                orderdaterange = {
                    "lower": date_range.lower.strftime("%Y-%m-%d"),
                    "upper": date_range.upper.strftime("%Y-%m-%d")
                }
            else:
                orderdaterange = None
            
            # Формируем объект задачи
            formatted_tasks.append({
                "id": task_id,
                "taskname": taskname,
                "ordernumber": ordernumber,       # строка из orders.ordernumber
                "responsibleid": responsibleid,   # numeric ID из tasks
                "firstname": user_firstname,      # строка из users
                "name": user_name,                # строка из users
                "orderdaterange": orderdaterange,
                "statusname": statusname_value,
                "statusid": statusid_value, 
                "orderid": orderid_value
            })

        return formatted_tasks

    except Exception as e:
        logger.error(f"Ошибка при получении задач: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")

@app.post("/api/tasks")
def add_task_route(task_data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    # Проверяем роль, если нужно
    if current_user.get('role', '').lower() not in ['администратор', 'менеджер']:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # Собираем поля
        taskname = task_data['taskname']
        orderid = task_data['orderid']
        responsibleid = task_data['responsibleid']
        # Для daterange можно сделать "[start_date, end_date]" строку
        # или psycopg2.extras.DateRange(...)
        if 'orderdaterange' in task_data and task_data['orderdaterange']:
            # Предположим, приходит: {"lower":"2024-01-01","upper":"2024-01-05"}
            start = task_data['orderdaterange']['lower']
            end = task_data['orderdaterange']['upper']
            date_range_str = f"[{start},{end}]"
        else:
            date_range_str = None
        statusid = task_data['statusid']

        new_id = insert_task(taskname, orderid, responsibleid, date_range_str, statusid)
        return JSONResponse(content={"message": "Task added", "id": new_id}, status_code=201)
    except Exception as e:
        logger.error(f"Error adding task: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.put("/api/tasks/{task_id}")
def update_task_route(task_id: int, task_data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    if current_user.get('role', '').lower() not in ['администратор', 'менеджер']:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        taskname = task_data['taskname']
        orderid = task_data['orderid']
        responsibleid = task_data['responsibleid']
        if 'orderdaterange' in task_data and task_data['orderdaterange']:
            start = task_data['orderdaterange']['lower']
            end = task_data['orderdaterange']['upper']
            date_range_str = f"[{start},{end}]"
        else:
            date_range_str = None
        statusid = task_data['statusid']

        update_task(task_id, taskname, orderid, responsibleid, date_range_str, statusid)
        return JSONResponse(content={"message": "Task updated"}, status_code=200)
    except Exception as e:
        logger.error(f"Error updating task: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.delete("/api/tasks/{task_id}")
def delete_task_route(task_id: int, current_user: dict = Depends(get_current_user)):
    if current_user.get('role', '').lower() not in ['администратор', 'менеджер']:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        delete_task(task_id)
        return JSONResponse(content={"message": "Task deleted"}, status_code=200)
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/orders/all")
def get_all_orders(current_user: dict = Depends(get_current_user)):
    # Проверяем роль, если нужно
    orders = get_orders_for_select()  # Допустим, вернет [(id, ordernumber), ...]
    return [{"id": row[0], "ordernumber": row[1]} for row in orders]

@app.get("/api/task_statuses")
def get_task_statuses_route(current_user: dict = Depends(get_current_user)):
    statuses = get_task_statuses()  # [(id, statusname), ...]
    return [{"id": s[0], "statusname": s[1]} for s in statuses]

    
    
    
#Users
@app.get("/api/users")
def get_users_route(current_user: dict = Depends(get_current_user)):
    current_role = current_user.get('role', '').lower()
    is_admin = (current_role == 'администратор')
    
    users = get_users()
    logger.info("Данные пользователей из БД: %s", users)
    if not users:
        raise HTTPException(status_code=404, detail='No users found!')
    
    if is_admin:
        formatted_users = [
            {
                'id': user['id'],
                'firstname': user['firstname'],
                'name': user['name'],
                'surname': user['surname'],
                'roleid': user['roleid'],
                'rolename': user['rolename'],
                'lastentry': user['lastentry'],
                'username': user['username'],
                'password': user['password']
            }
            for user in users
        ]
    else:
        formatted_users = [
            {
                'id': user['id'],
                'firstname': user['firstname'],
                'name': user['name'],
                'surname': user['surname'],
                'lastentry': user['lastentry']
            }
            for user in users
        ]
    return formatted_users

@app.post("/api/users")
def add_user(user: dict = Body(...), current_user: dict = Depends(get_current_user)):
    if current_user.get('role', '').lower() != 'администратор':
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        insert_user(
            user['firstname'],
            user['name'],
            user['surname'],
            user['roleid'],
            user['username'],
            user['password']
        )
        return JSONResponse(content={"message": "User added successfully"}, status_code=201)
    except Exception as e:
        logger.error(f"Error adding user: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.put("/api/users/{user_id}")
def update_user_route(user_id: int, user: dict = Body(...), current_user: dict = Depends(get_current_user)):
    if current_user.get('role', '').lower() != 'администратор':
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        update_user(user_id, user)
        return JSONResponse(content={"message": "User updated successfully"}, status_code=200)
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.delete("/api/users/{user_id}")
def delete_user_route(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user.get('role', '').lower() != 'администратор':
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        delete_user(user_id)
        return JSONResponse(content={"message": "User deleted successfully"}, status_code=200)
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/api/roles")
def get_roles_route(current_user: dict = Depends(get_current_user)):
    roles = get_roles()
    if not roles:
        raise HTTPException(status_code=404, detail='No roles found!')
    return [{"id": role[0], "rolename": role[1]} for role in roles]



#MainDashboard info
@app.get("/api/dashboard")
def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    """
    Эндпойнт, который возвращает сводную информацию для дашборда:
    - Общее количество заказов
    - Количество завершенных заказов
    - Заказы по месяцам
    - Статистика по материалам
    """
    try:
        total_orders = get_total_orders()
        completed_orders = get_completed_orders()
        orders_by_month = get_orders_by_month()
        materials = get_materials_stats()

        return {
            "totalOrders": total_orders,
            "completedOrders": completed_orders,
            "ordersByMonth": orders_by_month,
            "materials": materials
        }
    except Exception as e:
        logger.error(f"Ошибка при формировании дашборда: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")



#Profile
@app.get("/api/user_orders_tasks")
def get_user_orders_tasks(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get("user_id")
        logger.info(f"Получение заказов для пользователя с ID: {user_id}")
        orders = get_orders_by_user_id(user_id)
        logger.info(f"Полученные заказы: {orders}")
        tasks = get_tasks_by_user_orders(orders)
        logger.info(f"Полученные задачи: {tasks}")
        return {
            "orders": orders,
            "tasks": tasks
        }
    except Exception as e:
        logger.error(f"Ошибка при обработке запроса: {e}")
        raise HTTPException(status_code=500, detail="Ошибка сервера")





@app.put("/api/orders/{order_id}/status")
def update_order_status(order_id: int, payload: dict = Body(...)):
    try:
        status_id = payload.get("status_id")
        if not status_id:
            raise HTTPException(status_code=422, detail="Field 'status_id' is required")

        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE orders
            SET statusid = %s
            WHERE id = %s
        """, (status_id, order_id))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Status updated successfully"}
    except Exception as e:
        logger.error(f"Error updating order status: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")



@app.put("/api/tasks/{task_id}/status")
def update_task_status(task_id: int, payload: dict = Body(...), current_user: dict = Depends(get_current_user)):
    logger.info(f"Маршрут вызван для задачи ID: {task_id}")
    logger.info(f"Полученное тело запроса: {payload}")

    try:
        status_id = payload.get("status_id")
        if not status_id:
            logger.error("Ошибка: отсутствует ключ 'status_id' или его значение пустое")
            raise HTTPException(status_code=422, detail="Field 'status_id' is required")

        if not isinstance(status_id, int):
            logger.error(f"Ошибка: значение 'status_id' должно быть целым числом, получено: {type(status_id).__name__}")
            raise HTTPException(status_code=422, detail="Field 'status_id' must be an integer")

        # Выполняем запрос в базу данных
        conn = connect_db()
        cursor = conn.cursor()
        logger.info(f"Обновляем задачу ID {task_id} на статус ID {status_id}")
        cursor.execute("""
            UPDATE tasks
            SET statusid = %s
            WHERE id = %s
        """, (status_id, task_id))
        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Статус задачи ID {task_id} успешно обновлён на {status_id}")
        return {"message": "Task status updated successfully"}
    except Exception as e:
        logger.error(f"Ошибка при обновлении статуса задачи: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
















if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000, log_level="info")
