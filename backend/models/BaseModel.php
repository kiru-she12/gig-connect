<?php
// backend/models/BaseModel.php

class BaseModel {
    protected $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
}
?>
