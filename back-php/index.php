<?php

// ===== CORS =====
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ===== DB холболт =====
$db = new PDO(
    'pgsql:host=postgres;port=5432;dbname=airline',
    'airline',
    'airline123'
);

$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// ===== Хүснэгт үүсгэх (байхгүй бол) =====
$db->exec("CREATE TABLE IF NOT EXISTS orders (
    id          SERIAL PRIMARY KEY,
    flight_number  VARCHAR(20)  NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    passport       VARCHAR(50)  NOT NULL,
    seat_class     VARCHAR(20)  NOT NULL,
    price          FLOAT        NOT NULL,
    status         VARCHAR(20)  DEFAULT 'confirmed',
    created_at     TIMESTAMP    DEFAULT NOW()
)");

// ===== URL parse =====
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts  = explode('/', trim($uri, '/'));

// /api/orders
// /api/orders/1

// ===== ROUTER =====

// GET /api/orders
if ($method === 'GET' && $uri === '/api/orders') {
    $stmt = $db->query("SELECT * FROM orders ORDER BY created_at DESC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit();
}

// GET /api/orders/{id}
if ($method === 'GET' && isset($parts[2]) && is_numeric($parts[2])) {
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$parts[2]]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        http_response_code(404);
        echo json_encode(['message' => 'Захиалга олдсонгүй']);
        exit();
    }
    echo json_encode($order);
    exit();
}

// POST /api/orders
if ($method === 'POST' && $uri === '/api/orders') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Талбар шалгах
    $required = ['flightNumber', 'passengerName', 'passport', 'seatClass', 'price'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['message' => $field . ' талбар хоосон байна']);
            exit();
        }
    }

    $stmt = $db->prepare("INSERT INTO orders 
        (flight_number, passenger_name, passport, seat_class, price)
        VALUES (?, ?, ?, ?, ?)
        RETURNING *");

    $stmt->execute([
        $data['flightNumber'],
        $data['passengerName'],
        $data['passport'],
        $data['seatClass'],
        $data['price']
    ]);

    http_response_code(201);
    echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    exit();
}

// DELETE /api/orders/{id}
if ($method === 'DELETE' && isset($parts[2]) && is_numeric($parts[2])) {
    $stmt = $db->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
    $stmt->execute([$parts[2]]);
    echo json_encode(['message' => 'Захиалга цуцлагдлаа']);
    exit();
}

// 404
http_response_code(404);
echo json_encode(['message' => 'Route олдсонгүй']);