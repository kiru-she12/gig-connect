<?php
$content = file_get_contents('c:/xampp/htdocs/gigconnect/frontend/src/pages/dashboards/ClientDashboard.jsx');
$lines = explode("\n", $content);
foreach ($lines as $i => $line) {
    if (stripos($line, 'edit') !== false || stripos($line, 'applicant') !== false) {
        echo "Line " . ($i + 1) . ": " . trim($line) . "\n";
    }
}
?>
