<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Provision;



class provisionController extends Controller
{
    public $provision; 

    public function __construct(){
        $this->provision = new Provision;
    }

    public function index(){
        return view('provision/index');
    }

    public function getprovisions(){
        $provisions = DB::table('tbl_provisions')->get();
        $provisions =  json_decode(json_encode($provisions), true);

        // var_dump($provisions);

        foreach($provisions as $provision){
            $output['data'][] = [
            // $output[] = [
                'id' => $provision['provisionCode'],
                'provisionDescription' => $provision['provisionDescription'],
                'provisionStatus' => $provision['provisionStatus'],
                'userAdded' => $provision['userAdded'],
                'dateAdded' => $provision['dateAdded'],
                'userUpdated' => $provision['userUpdated'],
                'dateUpdated' => $provision['dateUpdated'],
            ];
        }

        for($i=0;$i < count($output['data']);$i++){
            if($output['data'][$i]['provisionStatus'] == 'A'){
                $output['data'][$i]['provisionStatusChanged'] = 'Active';
            }else if($output['data'][$i]['provisionStatus'] == 'I'){
                $output['data'][$i]['provisionStatusChanged'] = 'Inactive';
            }
        }
        return json_encode($output);
    }

    public function createProvision(){
        $data = request()->all();
        $newProvision = $this->provision->createProvision($data);
        return $newProvision;
    }

    public function updateProvision(){
        $data = request()->all();
        $updatedProvision = $this->provision->updateProvision($data);
        return $updatedProvision;
    }

    public function getSelectProvisions(){
        $provisions = DB::table('tbl_provisions')
                    ->where('provisionStatus','A')
                    ->get(['provisionCode as id','provisionDescription as text']);
        return $provisions;
    }
}
