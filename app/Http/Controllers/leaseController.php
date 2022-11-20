<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class leaseController extends Controller
{


    public function index(){
        return view('lease/index');
    }
    
    public function getLeaseType(){
        $lease = DB::table('tbl_lease_type')->get();
       //  print_r($lessors);
       $lease =  json_decode(json_encode($lease), true);
       foreach($lease as $lease){
           $output['data'][] = [
           // $output[] = [

               'id' => $lease['leaseTypeCode'],
               // 'lessorCode' => $lessor['lessorCode'],
               'leaseType' => $lease['leaseType'],
               'leaseStatus' => $lease['leaseStatus'],
               'userAdded' => $lease['userAdded'],
               'dateAdded' => $lease['dateAdded'],
               'userUpdated' => $lease['dateAdded'],
               'dateUpdated' => $lease['dateUpdated'],
           ];
       }

     

       return json_encode($output);
      

   }
}
