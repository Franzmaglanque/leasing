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

        if($data['rentFreeIncluded'] == false){
            $withRentFree = 'YES';
        }else{
            $withRentFree = 'NO';
        }

     
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
            'escalationPercent' => $data['escalationPercent'],
            'totalYear' => $data['numYears'],
            'rentFreeYear' => $data['rentFreeYear'],
            'rentFreeMonth' => $data['rentFreeMonth'],
            'rentFreeDay' => $data['rentFreeDay'],
            'withRentFree' => $withRentFree,
        ]);
        return $header_contract;       
    }

    public function getExcelHeaderContract($data){
            $contract = DB::select("SELECT
            a.headerID,
            a.lessorCode,
            a.area,
            a.storeCode,
            a.vendorCode,
            a.leaseTypeCode,
            a.Address1,
            a.monthlyRent,
            a.contractDateFrom,
            a.contractDateTo,
            a.escalationPercent,
            a.totalYear,
            a.securityDepositDuration,
            a.securityDepositAmount,
            a.advanceRentDuration,
            a.withRentFree,
            a.advanceRentAmount,
            b.lessorName,
            c.leaseType
        FROM
            tbl_lease_header a
            INNER JOIN tbl_lessor b ON a.lessorCode = b.lessorCode 
            INNER JOIN tbl_lease_type c ON a.leaseTypeCode = c.leaseTypeCode
            where a.headerID = $data
        ")[0];

        return $contract;
    }
}
