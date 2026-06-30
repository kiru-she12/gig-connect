<?php
$content = file_get_contents('c:/xampp/htdocs/gigconnect/frontend/src/pages/dashboards/StudentDashboard.jsx');
$lines = explode("\n", $content);
foreach ($lines as $i => $line) {
    if (stripos($line, 'skills') !== false || stripos($line, 'search') !== false || stripos($line, 'filter') !== false) {
        echo "Line " . ($i + 1) . ": " . trim($line) . "\n";
    }
}
?>
