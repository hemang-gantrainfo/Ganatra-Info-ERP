<?php

use App\Http\Controllers\ClearDatabaseController;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');



Schedule::call(function () {
    app(ClearDatabaseController::class)->clearData();
})->dailyAt('6:00')->timezone('UTC');
// ->everyMinute();
