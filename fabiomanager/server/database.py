import psycopg2
import psycopg2.extras
from psycopg2.extras import DictCursor
import random
import string

def connect_db():
    conn = psycopg2.connect(
        dbname='fabiodatabase',
        user='vadimmac',
        password='1700',
        host='localhost',
        port='5432'
    )
    return conn

def get_users():
    conn = connect_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("""
        SELECT 
            u.id AS id,
            u.firstname AS firstname,
            u.name AS name,
            u.surname AS surname,
            u.roleid AS roleid,
            r.rolename AS rolename,
            to_char(u.lastentry, 'YYYY-MM-DD HH24:MI:SS') AS lastentry,
            u.username AS username,
            u.password AS password
        FROM users u
        JOIN roles r ON u.roleid = r.id;
    """)
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return users

def get_user_role(roleid):
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT rolename FROM roles WHERE id = %s", (roleid,))
    role = cursor.fetchone()
    cursor.close()
    conn.close()
    return role[0] if role else None

def get_roles():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, rolename FROM roles")
    roles = cursor.fetchall()
    cursor.close()
    conn.close()
    return roles

def insert_user(firstname, name, surname, roleid, username, password):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (firstname, name, surname, roleid, username, password) VALUES (%s, %s, %s, %s, %s, %s)",
            (firstname, name, surname, roleid, username, password)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def update_user(user_id, user):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT username, password FROM users WHERE id = %s", (user_id,))
        current = cursor.fetchone()
        if not current:
            raise Exception("Пользователь не найден")
        username = user.get('username') if user.get('username') is not None else current[0]
        password = user.get('password') if user.get('password') is not None else current[1]
        
        cursor.execute(
            "UPDATE users SET firstname = %s, name = %s, surname = %s, roleid = %s, username = %s, password = %s WHERE id = %s",
            (user['firstname'], user['name'], user['surname'], user['roleid'], username, password, user_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def delete_user(user_id):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def update_last_entry(user_id):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET lastentry = NOW() WHERE id = %s", (user_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

# Обновлённая функция get_materials – возвращает 10 полей в виде словаря
def get_materials():
    conn = connect_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("""
        SELECT 
            m.id,
            m.materialname,
            m.description,
            m.unitid,
            u.unitname,
            m.quantity,
            m.price,
            m.supplierid,
            s.suppliername,
            m.dateofreceipt
        FROM materials m
        JOIN units u ON m.unitid = u.id
        JOIN suppliers s ON m.supplierid = s.id
    """)
    materials = cursor.fetchall()
    cursor.close()
    conn.close()
    return materials

def insert_materials(materials):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        for material in materials:
            cursor.execute("""
                INSERT INTO materials (materialname, description, unitid, quantity, price, supplierid, dateofreceipt)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, material)
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def update_material(material_id, material):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE materials
            SET materialname = %s, description = %s, unitid = %s, quantity = %s, price = %s, supplierid = %s, dateofreceipt = %s
            WHERE id = %s
        """, (
            material['materialname'],
            material['description'],
            material['unitid'],
            material['quantity'],
            material['price'],
            material['supplierid'],
            material['dateofreceipt'],
            material_id
        ))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def delete_material(material_id):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM materials WHERE id = %s", (material_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def insert_unit(unitname):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO units (unitname) VALUES (%s) RETURNING id", (unitname,))
        new_id = cursor.fetchone()[0]
        conn.commit()
        return new_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def insert_supplier(suppliername):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO suppliers (suppliername) VALUES (%s) RETURNING id", (suppliername,))
        new_id = cursor.fetchone()[0]
        conn.commit()
        return new_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def get_suppliers():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, suppliername FROM suppliers")
    suppliers = cursor.fetchall()
    cursor.close()
    conn.close()
    return suppliers

def get_units():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, unitname FROM units")
    units = cursor.fetchall()
    cursor.close()
    conn.close()
    return units

#Orders
def get_orders():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
    o.id, 
    o.ordernumber, 
    o.client, 
    TO_CHAR(o.dateofcreation, 'YYYY-MM-DD') AS dateofcreation, 
    os.statusname, 
    u.firstname, 
    u.name, 
    o.description,
    o.client_phone,
    o.client_email
    FROM orders o
    JOIN order_statuses os ON o.statusid = os.id
    JOIN users u ON o.responsibleid = u.id;

    """)
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return orders

    
    
def insert_order(client, dateofcreation, statusid, responsibleid, description, client_phone, client_email):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        ordernumber = generate_unique_order_number()  
        cursor.execute("""
            INSERT INTO orders (ordernumber, client, dateofcreation, statusid, responsibleid, description, client_phone, client_email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, ordernumber;
        """, (ordernumber, client, dateofcreation, statusid, responsibleid, description, client_phone, client_email))
        new_order = cursor.fetchone()
        conn.commit()
        return new_order
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()



def update_order(order_id, client, dateofcreation, statusid, responsibleid, description, client_phone, client_email):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        # 1. Достаём старый ordernumber
        cursor.execute("SELECT ordernumber FROM orders WHERE id = %s", (order_id,))
        row = cursor.fetchone()
        if not row:
            raise Exception("Order not found")
        old_ordernumber = row[0]

        # 2. Обновляем, сохраняя прежний номер
        cursor.execute("""
            UPDATE orders
            SET ordernumber = %s,
                client = %s,
                dateofcreation = %s,
                statusid = %s,
                responsibleid = %s,
                description = %s,
                client_phone = %s,
                client_email = %s
            WHERE id = %s
        """, (old_ordernumber, client, dateofcreation, statusid, responsibleid, description, client_phone, client_email, order_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()




def delete_order(order_id):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM orders WHERE id = %s", (order_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def get_order_statuses():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, statusname FROM order_statuses")
    statuses = cursor.fetchall()
    cursor.close()
    conn.close()
    return statuses

def get_employees():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, firstname, name FROM users
        WHERE roleid = (SELECT id FROM roles WHERE rolename = 'Сотрудник')
    """)
    employees = cursor.fetchall()
    cursor.close()
    conn.close()
    return employees

def generate_unique_order_number():
    """Генерирует уникальный номер заказа (буквы + цифры)."""
    conn = connect_db()
    cursor = conn.cursor()
    
    while True:
        ordernumber = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        cursor.execute("SELECT COUNT(*) FROM orders WHERE ordernumber = %s", (ordernumber,))
        exists = cursor.fetchone()[0]
        if exists == 0:
            break  # Если номера нет в БД, выходим из цикла

    cursor.close()
    conn.close()
    return ordernumber



#Tasks
def get_tasks():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            t.id, 
            t.taskname, 
            o.ordernumber,        -- например, из orders, если нужно
            t.responsibleid,
            t.orderdaterange, 
            ts.statusname, 
            t.statusid,
            t.orderid,
            u.firstname,          -- берём из таблицы users
            u.name
        FROM tasks t
        JOIN orders o ON t.orderid = o.id
        JOIN task_statuses ts ON t.statusid = ts.id
        JOIN users u ON t.responsibleid = u.id
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def insert_task(taskname, orderid, responsibleid, orderdaterange, statusid):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO tasks (taskname, orderid, responsibleid, orderdaterange, statusid)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
        """, (taskname, orderid, responsibleid, orderdaterange, statusid))
        new_id = cursor.fetchone()[0]
        conn.commit()
        return new_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def update_task(task_id, taskname, orderid, responsibleid, orderdaterange, statusid):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE tasks
               SET taskname = %s,
                   orderid = %s,
                   responsibleid = %s,
                   orderdaterange = %s,
                   statusid = %s
             WHERE id = %s
        """, (taskname, orderid, responsibleid, orderdaterange, statusid, task_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def delete_task(task_id):
    conn = connect_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def get_orders_for_select():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, ordernumber FROM orders")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def get_task_statuses():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, statusname FROM task_statuses")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows




#MainDashboard

def get_total_orders():
    """
    Возвращает общее количество заказов.
    """
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM orders")
    (count,) = cursor.fetchone()
    cursor.close()
    conn.close()
    return count

def get_completed_orders():
    """
    Возвращает количество завершённых заказов (предположим, statusid=2 значит 'Завершён').
    """
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM orders WHERE statusid = 2")
    (count,) = cursor.fetchone()
    cursor.close()
    conn.close()
    return count

def get_orders_by_month():
    """
    Возвращает статистику заказов по месяцам.
    Допустим, хотим посчитать за текущий год:
    new (statusid=1), completed (statusid=2).
    """
    conn = connect_db()
    cursor = conn.cursor()

    # Пример: сгруппировать по месяцу (EXTRACT(MONTH FROM dateofcreation))
    # и посчитать кол-во новых/завершённых
    # monthnum -> 1..12
    # Можно дополнительно мапить 1->"Янв", 2->"Фев" и т.д. на Python-е
    sql = """
    SELECT
      EXTRACT(MONTH FROM dateofcreation)::int as monthnum,
      SUM(CASE WHEN statusid = 1 THEN 1 ELSE 0 END) as new_count,
      SUM(CASE WHEN statusid = 2 THEN 1 ELSE 0 END) as completed_count
    FROM orders
    WHERE dateofcreation >= DATE_TRUNC('year', CURRENT_DATE)  -- только за этот год, например
    GROUP BY monthnum
    ORDER BY monthnum
    """
    cursor.execute(sql)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # rows = [(1, 5, 2), (2, 2, 1), (3, 7, 5), ...]
    # monthnum, new_count, completed_count

    # Превратим в [{'month':'Янв','new':5,'completed':2}, ...]
    MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн",
              "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
    result = []
    for (monthnum, new_count, completed_count) in rows:
        # monthnum это 1..12, индекс массива 0..11
        monthname = MONTHS[monthnum - 1]
        result.append({
            "month": monthname,
            "new": int(new_count),
            "completed": int(completed_count)
        })
    return result

def get_materials_stats():
    """
    Возвращает данные по материалам: [{"name":"Материал 1","value":число},...]
    например, берем поле quantity, предполагая, что это остаток
    """
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
      SELECT materialname, quantity 
      FROM materials
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    result = []
    for (mat_name, qty) in rows:
        result.append({"name": mat_name, "value": qty})
    return result


#Profile
def get_orders_by_user_id(user_id):
    conn = connect_db()
    cursor = conn.cursor(cursor_factory=DictCursor)
    cursor.execute("""
        SELECT id, ordernumber, statusid, responsibleid
        FROM orders
        WHERE responsibleid = %s
    """, (user_id,))
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return orders  # Теперь каждый элемент будет словарем


def get_tasks_by_user_orders(user_orders):
    conn = connect_db()
    cursor = conn.cursor()
    order_ids = tuple(order['id'] for order in user_orders)
    query = """
        SELECT 
            t.id, 
            t.taskname, 
            t.statusid, 
            ts.statusname, 
            t.orderid, 
            o.ordernumber
        FROM tasks t
        JOIN orders o ON t.orderid = o.id
        JOIN task_statuses ts ON t.statusid = ts.id
        WHERE t.orderid IN %s
    """
    cursor.execute(query, (order_ids,))
    tasks = cursor.fetchall()
    cursor.close()
    conn.close()
    return tasks









def authenticate_user(username, password):
    conn = connect_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user
