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




Route::get('/cheque','lessorController@getCheque');



Route::get('/test','App\Http\Controllers\loginController@callTest');
