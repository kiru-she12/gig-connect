<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include '../../config/db.php';
include '../../middleware/auth.php';

$user = authenticate();

$data = json_decode(file_get_contents("php://input"), true);

$delivery_ID = $data['delivery_ID'];
$action = $data['action']; // 'assign', 'pickup', 'deliver'

// check if delivery exists
$stmt = $pdo->prepare("SELECT * FROM delivery WHERE delivery_ID = ?");
$stmt->execute([$delivery_ID]);
$delivery = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$delivery) {
    echo json_encode(["error" => "Delivery not found!"]);
    exit();
}

if($action === 'assign') {
    // only admin can assign delivery staff
    if($user->role !== 'admin' && $user->role !== 'manager') {
        echo json_encode(["error" => "Unauthorized!"]);
        exit();
    }

    $delivery_person_ID = $data['delivery_person_ID'];

    $stmt = $pdo->prepare("UPDATE delivery SET delivery_person_ID = ?, status = 'assigned' WHERE delivery_ID = ?");
    $stmt->execute([$delivery_person_ID, $delivery_ID]);

    echo json_encode(["success" => "Delivery staff assigned successfully!"]);

} else if($action === 'pickup') {
    // only delivery staff can pickup
    if($user->role !== 'delivery_staff') {
        echo json_encode(["error" => "Unauthorized!"]);
        exit();
    }

    $stmt = $pdo->prepare("UPDATE delivery SET status = 'picked_up' WHERE delivery_ID = ?");
    $stmt->execute([$delivery_ID]);

    echo json_encode(["success" => "Product picked up successfully!"]);

} else if($action === 'deliver') {
    // only delivery staff can deliver
    if($user->role !== 'delivery_staff') {
        echo json_encode(["error" => "Unauthorized!"]);
        exit();
    }

    $stmt = $pdo->prepare("UPDATE delivery SET status = 'delivered' WHERE delivery_ID = ?");
    $stmt->execute([$delivery_ID]);

    // update job status to completed
    $stmt = $pdo->prepare("UPDATE job SET status = 'completed', completed_time = NOW() WHERE job_ID = ?");
    $stmt->execute([$delivery['job_ID']]);

    echo json_encode(["success" => "Product delivered successfully!"]);

} else {
    echo json_encode(["error" => "Invalid action!"]);
}
?>