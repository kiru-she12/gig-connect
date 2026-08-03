<?php
// backend/models/MapModel.php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/../config/mapbox.php';

class MapModel extends BaseModel {
    private $mapbox_token;

    public function __construct($pdo) {
        parent::__construct($pdo);
        global $mapbox_token;
        $this->mapbox_token = $mapbox_token;
    }

    private function shouldVerifySSL() {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $serverAddr = $_SERVER['SERVER_ADDR'] ?? '';
        $isLocal = in_array($host, ['localhost', '127.0.0.1', '::1']) 
            || in_array($serverAddr, ['127.0.0.1', '::1'])
            || preg_match('/^localhost:\d+$/', $host)
            || php_sapi_name() === 'cli';
        return !$isLocal;
    }

    private function geocodeAddress($address) {
        if (!empty($this->mapbox_token)) {
            $url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" . urlencode($address) . ".json?access_token=" . $this->mapbox_token . "&limit=1&country=LK";
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->shouldVerifySSL());
            
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
        }
        
        // OpenStreetMap Nominatim Fallback (Requires no API key)
        try {
            $nomUrl = "https://nominatim.openstreetmap.org/search?q=" . urlencode($address) . "&format=json&countrycodes=lk&limit=1";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $nomUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, "GigConnect/1.0 (UWU Student Marketplace)");
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->shouldVerifySSL());
            $nomRes = curl_exec($ch);
            curl_close($ch);
            $nomData = json_decode($nomRes, true);
            if (is_array($nomData) && count($nomData) > 0 && isset($nomData[0]['lat']) && isset($nomData[0]['lon'])) {
                return [
                    "longitude" => (float)$nomData[0]['lon'],
                    "latitude" => (float)$nomData[0]['lat'],
                    "formatted_address" => $nomData[0]['display_name']
                ];
            }
        } catch (\Throwable $e) {}

        // Fallback coordinates (Uva Wellassa University, Badulla) for local addresses not indexed
        $fallback_lat = 6.9819;
        $fallback_lon = 81.0763;
        $offset_lat = (rand(-150, 150) / 10000); // ±1.5 km random offset
        $offset_lon = (rand(-150, 150) / 10000);
        
        return [
            "longitude" => $fallback_lon + $offset_lon,
            "latitude" => $fallback_lat + $offset_lat,
            "formatted_address" => $address
        ];
    }

    private function reverseGeocode($latitude, $longitude) {
        if (!empty($this->mapbox_token)) {
            $url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" . urlencode($longitude . "," . $latitude) . ".json?access_token=" . $this->mapbox_token . "&limit=1";
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->shouldVerifySSL());
            
            $response = curl_exec($ch);
            curl_close($ch);
            
            $data = json_decode($response, true);
            if (isset($data['features']) && count($data['features']) > 0) {
                return [
                    "formatted_address" => $data['features'][0]['place_name']
                ];
            }
        }

        // OpenStreetMap Nominatim Reverse Geocode Fallback
        try {
            $nomUrl = "https://nominatim.openstreetmap.org/reverse?lat={$latitude}&lon={$longitude}&format=json";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $nomUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, "GigConnect/1.0 (UWU Student Marketplace)");
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->shouldVerifySSL());
            $nomRes = curl_exec($ch);
            curl_close($ch);
            $nomData = json_decode($nomRes, true);
            if (isset($nomData['display_name'])) {
                return [
                    "formatted_address" => $nomData['display_name']
                ];
            }
        } catch (\Throwable $e) {}

        return [
            "formatted_address" => "Location near " . round($latitude, 4) . ", " . round($longitude, 4)
        ];
    }

    private function autocompleteAddress($query) {
        $suggestions = [];
        if (!empty($this->mapbox_token)) {
            $url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" . urlencode($query) . ".json?access_token=" . $this->mapbox_token . "&autocomplete=true&limit=5&country=LK";
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->shouldVerifySSL());
            
            $response = curl_exec($ch);
            curl_close($ch);
            
            $data = json_decode($response, true);
            if (isset($data['features'])) {
                foreach ($data['features'] as $feature) {
                    $suggestions[] = $feature['place_name'];
                }
            }
        }

        // OpenStreetMap Nominatim Autocomplete / Search Fallback
        if (empty($suggestions)) {
            try {
                $nomUrl = "https://nominatim.openstreetmap.org/search?q=" . urlencode($query) . "&format=json&countrycodes=lk&limit=5";
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $nomUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_USERAGENT, "GigConnect/1.0 (UWU Student Marketplace)");
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $this->shouldVerifySSL());
                $nomRes = curl_exec($ch);
                curl_close($ch);
                $nomData = json_decode($nomRes, true);
                if (is_array($nomData)) {
                    foreach ($nomData as $item) {
                        if (isset($item['display_name'])) {
                            $suggestions[] = $item['display_name'];
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        return $suggestions;
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
        // If autocomplete requested
        if (isset($data['query']) && !empty($data['query'])) {
            $suggestions = $this->autocompleteAddress($data['query']);
            return [
                "success" => true,
                "suggestions" => $suggestions
            ];
        }

        // If reverse geocoding requested
        if (isset($data['latitude']) && isset($data['longitude']) && !isset($data['pickup_address'])) {
            $result = $this->reverseGeocode($data['latitude'], $data['longitude']);
            if (!$result) {
                return ["error" => "Could not reverse geocode the coordinates."];
            }
            return [
                "success" => true,
                "formatted_address" => $result['formatted_address']
            ];
        }

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
?>
