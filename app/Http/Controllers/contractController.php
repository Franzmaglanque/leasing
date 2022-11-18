<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class contractController extends Controller
{
    public function index(){
        return view('contract/index');
        // return view('welcome');
        // return 'test';
    }
}
