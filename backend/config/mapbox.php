<?php
if (!class_exists('Database')) {
    require_once __DIR__ . '/db.php';
}

class MapboxConfig {
    public static function getToken() {
        return $_ENV['MAPBOX_TOKEN'] ?? '';
    }
}

$mapbox_token = MapboxConfig::getToken();
?>