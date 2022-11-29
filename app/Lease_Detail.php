<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Lease_Detail extends Model
{
    public function save_detail_contract($data){
        // var_dump($data);
        // echo count($data);
        $header_contract = DB::table('tbl_lease_detail')->insert([
            'headerID' => $data['data'][0]['headerID'],
            'periodFrom' => $data['data'][0]['yearFrom'],
            'periodTo' => $data['data'][0]['yearTo'],
            'durationCount' => $data['data'][0]['yearNum'],
            'escalationPercent' => $data['data'][0]['escalationPercent'],
            'rentAmount' => $data['data'][0]['rentAmount'],
            'vatAmount' => $data['data'][0]['vatAmount'],
            'ewtAmount' => $data['data'][0]['ewtAmount'],
            'netDueAmount' => $data['data'][0]['netDueAmount'],
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
