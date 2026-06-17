<?php
class MapboxConfig {
    public static function getToken() {
        return $_ENV['MAPBOX_TOKEN'] ?? '';
    }
}

$mapbox_token = MapboxConfig::getToken();
?>