<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Route::get('/',function(){
// return 'test';
// });

Route::get('/','loginController@index');
Route::post('/login','loginController@loginProcess');
Route::get('/dashboard','dashboardController@index');
Route::get('/contract','contractController@index');

// Lessor index
Route::get('/lessor','lessorController@index');

// Lease index
Route::get('/lease','leaseController@index');

// Provision Index
Route::get('/provision','provisionController@index');



Route::get('/cheque','lessorController@getCheque');



Route::get('/test','App\Http\Controllers\loginController@callTest');

Route::get('/test',function(){

    $start    = new DateTime('2022-03-01');
    $end      = new DateTime('2023-02-25');
    $interval = DateInterval::createFromDateString('1 month');
    $period   = new DatePeriod($start, $interval, $end);
    
    foreach ($period as $dt) {
        // var_dump($dt);


        echo $dt->format("Y-m-d") . ' - ' . $dt->format("Y-m-t") . "<br>\n";

        // echo $dt->getStartDate()->format("Y-m-d") . "<br>\n";
        // echo $dt->getEndDate()->format("Y-m-d") . "<br>\n";

    }



});
