<?php
class MapboxConfig {
    public static function getToken() {
        global $pdo;
        try {
            $stmt = $pdo->prepare("SELECT `value` FROM `settings` WHERE `key` = 'MAPBOX_TOKEN' LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ? $row['value'] : '';
        } catch (Exception $e) {
            return '';
        }
    }
}

$mapbox_token = MapboxConfig::getToken();
?>