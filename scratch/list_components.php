<?php
$content = file_get_contents('c:/xampp/htdocs/gigconnect/frontend/src/pages/dashboards/ClientDashboard.jsx');
$lines = explode("\n", $content);
foreach ($lines as $i => $line) {
    if (preg_match('/(const|function)\s+[A-Z][A-Za-z0-9_]*/', $line, $matches)) {
        echo "Line " . ($i + 1) . ": " . trim($line) . "\n";
    }
}
?>
