<?php
$logFile = 'C:/Users/ASUS/.gemini/antigravity/brain/8008987c-58fe-499d-ae22-1e175f3aeb12/.system_generated/logs/overview.txt';
if (file_exists($logFile)) {
    $content = file_get_contents($logFile);
    $lines = explode("\n", $content);
    foreach ($lines as $i => $line) {
        if (strpos($line, 'passwords =') !== false || strpos($line, 'mpk.select@gmail.com') !== false || strpos($line, 'ruwan@') !== false) {
            echo "Line " . ($i + 1) . ":\n";
            echo $line . "\n";
            echo "========================================\n";
        }
    }
} else {
    echo "Log file not found.\n";
}
?>
