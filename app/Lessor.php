<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class Lessor extends Model
{
    public function createLessor($data){
        $lessor = DB::table('tbl_lessor')->insert([
            'lessorName' => $data['name'],
            'lessorStatus' => 'A',
            'userAdded' => session('employee_number'),
            'dateAdded' => now(),
        ]);
        return $lessor;    
    }

    public function updateLessor($data){

        $affected = DB::table('tbl_lessor')
              ->where('lessorCode', $data['id'])
              ->update([
                'lessorName' => $data['name'],
                'lessorStatus' => $data['status'],
                'userUpdated' => session('employee_number'),
                'dateUpdated' => now(),
            ]);
        return $affected;    
    }
}
