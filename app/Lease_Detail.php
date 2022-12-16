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

    public function save_rent_free_contract($data,$contract_header,$i){
        $contract_rentfree = DB::table('tbl_lease_detail')->insert([
            'headerID' => $contract_header,
            'periodFrom' => $data['rentFreePeriodFrom'],
            'periodTo' => $data['rentFreePeriodTo'],
            'durationCount' => $i,
            // 'escalationPercent' => '',
            // 'rentAmount' => '',
            // 'vatAmount' => '',
            // 'ewtAmount' => '',
            // 'netDueAmount' => '',
            'yearID' => $i,
            'isRentFree' => 1,
            'rentFreeYear' => $data['rentFreeYear'],
            'rentFreeMonth' => $data['rentFreeMonth'],
            'rentFreeDay' => $data['rentFreeDay'],

        ]);
        return $contract_rentfree;   
    }


    public function checkLeapYear($data){
        $leap_year = DB::table('tbl_leap_year')
                    ->where('leap_year',$data)
                    ->get();
        return $leap_year;
    }

    public function getContractDetails($data){
        $contract_details = DB::table('tbl_lease_detail')
                    ->where('headerID',$data)
                    ->get();
        return $contract_details;
    }

    // public function getRentFreeDetails(){
    //     $rentFreeDetails = DB::table('tbl_lease_detail')
    //                         ->where('headerID',1)
    //                         ->where('isRentFree',1)            
    //                         ->get();
    //     return $rentFreeDetails;
    // }
}
