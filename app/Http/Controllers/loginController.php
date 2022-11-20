<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\testController;
use App\Http\Controllers\ssoController;
use App\User;
use Illuminate\Support\Facades\DB;
// use vendor\laravel\framework\src\Illuminate\Foundation\Auth\AuthenticatesUsers;

class LoginController extends Controller
{
    public function index(){
		// return 'test12344';
        return view('Login/login');
    }

     function loginProcess() {
        // $clientIP = request()->ip();
        // $clientIP = \Request::ip();
        // $clientIP = \Request::getClientIp(true);
        // if(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        //     $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'];
        // } else {
        //     $ip_address = $_SERVER['REMOTE_ADDR'];
        // }
        // echo $ip_address;

        // $sso = new ssoController($_POST['usernameTxt'], $_POST['passwordTxt'], 'Leasing', $_SERVER['REMOTE_ADDR'], '1');
        $sso = new ssoController($_POST['usernameTxt'], $_POST['passwordTxt'], 'Leasing', '192.168.110.148', '1');

         $chk = $sso->validateEmployee();
        
        //  var_dump($chk);
        
        if ($chk['status'] == 1) {
            $empInfo = $sso->getEmployeeInfo($chk['api_key'],$_POST['usernameTxt']);
        //     $empInfo = $this->clientsso->getEmployeeInfo($chk['api_key'], $_POST['usernameTxt']);

            $getUser = DB::table('tbl_user')
                    ->where('employee_number',$_POST['usernameTxt'])->get();
            // var_dump($getUser->first());

        if (count($getUser) == 1) {

        $fullname = $getUser->first()->firstname .' ' . $getUser->first()->middlename . ' ' . $getUser->first()->lastname;
        session(['employee_number' => $_POST['usernameTxt']]);
        session(['id' => $getUser->first()->id]);
        session(['firstname' => $getUser->first()->firstname]);
        session(['middlename' => $getUser->first()->middlename]);
        session(['lastname' => $getUser->first()->lastname]);
        session(['fullname' => $fullname]);
        session(['apiKey' => $chk['api_key']]);
        session(['user_level' =>  $getUser->first()->user_level]);
        session(['role_level' =>  $getUser->first()->role_level]);        
        // echo session('employee_number');
                echo "window.location.href = '\dashboard';\n";
                // return redirect('/dashboard');
            }else {
               echo " Swal.fire(
                    'Login Failed',
                    'Account does not exist!',
                    'error'
               );\n";
            }
        }elseif($chk['status'] == 2){
            echo " Swal.fire(
                'Login Failed',
                'Account is Disabled in Myportal',
                'error'
           );\n";
        } 
        else {
            echo " Swal.fire(
                'Login Failed',
                'We didn\'t recognise your employee no. or password',
                'error'
           );\n";

           
        }
    }
}
