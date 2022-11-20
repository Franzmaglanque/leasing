<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware(['cors'])->group(function () {

    // Contract
    Route::get('/contract','contractController@getsubjectlease');
    Route::get('/store','contractController@getstore');
    Route::get('/vendor','contractController@getVendor');
    Route::get('/province','contractController@getProvince');
    Route::get('/municipality','contractController@getMunicipality');
    Route::post('/contract','contractController@store');

    // Lessor
    Route::get('/lessor','lessorController@getLessors');
    Route::get('/selectlessor','lessorController@getselectLessors');
    Route::post('/lessor','lessorController@createLessor');
    Route::patch('/lessor','lessorController@updateLessor');


    // Lease
    Route::get('/lease','leaseController@getLeaseType');




    Route::get('/cheque','lessorController@getCheque');


});