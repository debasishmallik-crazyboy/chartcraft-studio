<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Session-Id, X-Frame-Index');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'sample_csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="sample_chart_data.csv"');
    echo "Category,Value_1,Value_2\nJan,120,80\nFeb,195,140\nMar,310,210\nApr,250,190\nMay,420,330\nJun,580,450\n";
    exit;
}

if ($action === 'sample_bengali_csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="sample_bengali_chart_data.csv"');
    echo "\xEF\xBB\xBF" . "মাস,আয়_২০২৫,আয়_২০২৬\nজানুয়ারি,১২০,৮৫\nফেব্রুয়ারি,১৯৫,১৩০\nমার্চ,৩১০,২১০\nএপ্রিল,২৫০,১৭৫\nমে,৪২০,৩১০\nজুন,৫৮০,৪৪০\n";
    exit;
}

echo json_encode([
    'success' => true,
    'status' => 'online',
    'version' => '1.2.0',
    'app' => 'ChartCraft Studio',
    'host' => isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'unknown',
    'php_version' => PHP_VERSION,
    'capabilities' => [
        'in_browser_mov' => true,
        'alpha_webm' => true,
        'png_sequence_zip' => true,
        'bengali_google_fonts' => true,
        'utf8_csv_bengali' => true
    ],
    'projects' => []
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
