<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Lease_Detail extends Model
{
    public function save_detail_contract($data,$i){
        // var_dump($data);
        
        $header_contract = DB::table('tbl_lease_detail')->insert([
            'headerID' => $data['data'][$i]['headerID'],
            'periodFrom' => $data['data'][$i]['yearFrom'],
            'periodTo' => $data['data'][$i]['yearTo'],
            'durationCount' => $data['data'][$i]['yearNum'],
            'escalationPercent' => $data['data'][$i]['escalationPercent'],
            'rentAmount' => floatval($data['data'][$i]['rentAmount']),
            'vatAmount' => $data['data'][$i]['vatAmount'],
            'ewtAmount' => $data['data'][$i]['ewtAmount'],
            'netDueAmount' => $data['data'][$i]['netDueAmount'],
            'yearID' => $data['data'][$i]['yearNum'],
        ]);
        return $header_contract;         
    }


    public function checkLeapYear($data){
        $leap_year = DB::table('tbl_leap_year')
                    ->where('leap_year',$data)
                    ->get();
        return $leap_year;
        


    }
}
