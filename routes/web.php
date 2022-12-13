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


// Login
Route::get('/','loginController@index');
Route::post('/login','loginController@loginProcess');

// Dashboard 
Route::get('/dashboard','dashboardController@index');

// Contract 
Route::get('/contract','contractController@index');

// Lessor 
Route::get('/lessor','lessorController@index');

// Lease 
Route::get('/lease','leaseController@index');

// Provision 
Route::get('/provision','provisionController@index');

// generate Excel
Route::get('/generateContractExcel','contractController@generateContractExcel');






Route::get('/cheque','lessorController@getCheque');
Route::get('/test','App\Http\Controllers\loginController@callTest');



?>
