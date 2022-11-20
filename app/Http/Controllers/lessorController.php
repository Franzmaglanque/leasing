<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\LessorResource;
use App\Http\Resources\LessorSelectResource;
use App\Http\Resources\ChequeResource;
use Illuminate\Support\Facades\DB;
use App\Lessor;

class lessorController extends Controller
{
    public $Lessor; 

    public function __construct(){
        $this->Lessor = new Lessor;
    }


    public function index(){
        return view('lessor/index');
    }

    public function getlessors(){
         $lessors = DB::table('tbl_lessor')->get();
        //  print_r($lessors);
        $lessors =  json_decode(json_encode($lessors), true);
        foreach($lessors as $lessor){
            $output['data'][] = [
            // $output[] = [

                'id' => $lessor['lessorCode'],
                // 'lessorCode' => $lessor['lessorCode'],
                'lessorName' => $lessor['lessorName'],
                'lessorStatus' => $lessor['lessorStatus'],
                'userAdded' => $lessor['userAdded'],
                'dateAdded' => $lessor['dateAdded'],
                'userUpdated' => $lessor['dateAdded'],
                'dateUpdated' => $lessor['dateUpdated'],
            ];
        }

        for($i=0;$i < count($output['data']);$i++){
            if($output['data'][$i]['lessorStatus'] == 'A'){
                $output['data'][$i]['lessorStatusChanged'] = 'Active';
            }else if($output['data'][$i]['lessorStatus'] == 'I'){
                $output['data'][$i]['lessorStatusChanged'] = 'Inactive';
            }
        }

        // for($i=0;$i < count($output);$i++){
        //     if($output[$i]['lessorStatus'] == 'A'){
        //         $output[$i]['lessorStatusChanged'] = 'Active';
        //     }else if($output[$i]['lessorStatus'] == 'I'){
        //         $output[$i]['lessorStatusChanged'] = 'Inactive';
        //     }
        // }


// return $output;
        // return $output;
        return json_encode($output);
        //  return $encoded = json_encode($output);
        // return $encoded;
        // return LessorResource::collection($lessors);
        // return LessorResource::collection($output);  

    }

    public function createLessor(){
        // dd(session('fullname'));
        // dd(session()->all());
        // dd(session('fullname'));
        // return session();
        // return session('fullname');
        // return Session::get('fullname');
        $data = request()->all();
        $newLessor = $this->Lessor->createLessor($data);
        return $newLessor;
    }

    public function updateLessor(){
        $data = request()->all();
        $updatedLessor = $this->Lessor->updateLessor($data);
        return $updatedLessor;
    }

    public function getCheque(){
        $cheque = DB::table('tbl_temp_checks')
        ->get();
        return ChequeResource::collection($cheque);
    }


    public function getselectLessors(){
        $lessors = DB::table('tbl_lessor')->get(['lessorCode','lessorName']);
        return LessorSelectResource::collection($lessors);
    }
    

}
