<?php
require_once __DIR__ . '/../../config/cors.php';
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? "*"));
header("Content-Type: application/json");
include '../../config/db.php';
include '../../middleware/auth.php';
include '../../config/mapbox.php';

class Geocode {
    private $pdo;
    private $mapbox_token;

    public function __construct($pdo, $mapbox_token) {
        $this->pdo = $pdo;
        $this->mapbox_token = $mapbox_token;
    }

    private function geocodeAddress($address) {
        $url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" . urlencode($address) . ".json?access_token=" . $this->mapbox_token . "&limit=1";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $data = json_decode($response, true);
        if (isset($data['features']) && count($data['features']) > 0) {
            $coords = $data['features'][0]['center']; // [longitude, latitude]
            return [
                "longitude" => $coords[0],
                "latitude" => $coords[1],
                "formatted_address" => $data['features'][0]['place_name']
            ];
        }
        return null;
    }

    private function getDistance($lat1, $lon1, $lat2, $lon2) {
        $earth_radius = 6371; // Kilometers
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return $earth_radius * $c;
    }

    public function process($data, $user) {
        // If single address geocoding requested
        if (isset($data['address']) && !empty($data['address'])) {
            $result = $this->geocodeAddress($data['address']);
            if (!$result) {
                return ["error" => "Could not geocode the address."];
            }
            return [
                "success" => true,
                "coordinates" => [
                    "latitude" => $result['latitude'],
                    "longitude" => $result['longitude']
                ],
                "formatted_address" => $result['formatted_address']
            ];
        }

        // If distance/delivery fee calculation requested
        if (isset($data['pickup_address']) && isset($data['delivery_address'])) {
            $pickup = $this->geocodeAddress($data['pickup_address']);
            $delivery = $this->geocodeAddress($data['delivery_address']);

            if (!$pickup || !$delivery) {
                return ["error" => "Could not geocode one or both addresses."];
            }

            $distance = $this->getDistance($pickup['latitude'], $pickup['longitude'], $delivery['latitude'], $delivery['longitude']);
            
            // Calculate delivery fee: base fee + (distance x rate per km)
            $base_fee = 150.00; // LKR
            $rate_per_km = 50.00; // LKR
            $delivery_fee = $base_fee + ($distance * $rate_per_km);

            return [
                "success" => true,
                "pickup" => [
                    "latitude" => $pickup['latitude'],
                    "longitude" => $pickup['longitude'],
                    "formatted_address" => $pickup['formatted_address']
                ],
                "delivery" => [
                    "latitude" => $delivery['latitude'],
                    "longitude" => $delivery['longitude'],
                    "formatted_address" => $delivery['formatted_address']
                ],
                "distance" => round($distance, 2), // in km
                "delivery_fee" => round($delivery_fee, 2) // in LKR
            ];
        }

        return ["error" => "Invalid request parameters. Please supply 'address' or both 'pickup_address' and 'delivery_address'."];
    }
}

$user = authenticate();
$data = json_decode(file_get_contents("php://input"), true);
$obj = new Geocode($pdo, $mapbox_token);
$result = $obj->process($data, $user);
echo json_encode($result);
?>
