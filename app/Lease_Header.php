<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Lease_Header extends Model
{
    protected $table = 'tbl_lease_header';
    protected $fillable = [
        'lessorCode',
        'storeCode',
        'vendorCode',
        'leaseTypeCode',
        'address1',
        'municipalityCode',
        'provinceCode',
        'area',
        'monthlyRent',
        'contractDateFrom',
        'contractDateTo',
        'rentFreeFrom',
        'rentFreeTo',
        'securityDepositDuration',
        'securityDepositAmount',
        'advanceRentDuration',
        'advanceRentAmount',
        'dateAdded',
        'userAdded',
        'dateUpdated',
        'userUpdated',
        'leaseStatus',
    ];


    public function save_header_contract($data){

        // $header_contract = DB::table('tbl_lease_header')->insert([
        $header_contract = DB::table('tbl_lease_header')->insertGetId([
            'lessorCode' => $data['lessor'],
            'storeCode' => $data['store'],
            'vendorCode' => $data['vendor'],
            'leaseTypeCode' => $data['subjectLease'],
            'Address1' => $data['address'],
            'municipalityCode' => $data['municipality'],
            'provinceCode' => $data['province'],
            'area' => $data['area'],
            'monthlyRent' => $data['monthlyRent'],
            'contractDateFrom' => $data['contractPeriodFrom'],
            'contractDateTo' => $data['contractPeriodTo'],
            'rentFreeFrom' => $data['rentFreePeriodFrom'],
            'rentFreeTo' => $data['rentFreePeriodTo'],
            'securityDepositDuration' => $data['securityDeposit'],
            'securityDepositAmount' => $data['advanceSecurityAmount'],
            'advanceRentDuration' => $data['advanceRent'],       
            'advanceRentAmount' => $data['advanceRentAmount'],       
            'dateAdded' => now(),       
            'userAdded' => session('employee_number'),       
            'leaseStatus' =>'H', 
        ]);

        return $header_contract;
                
    }
}
