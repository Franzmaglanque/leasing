<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

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

}
