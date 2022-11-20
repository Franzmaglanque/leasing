<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Subjectlease;
use App\Lease_Header;
// use App\Facade\DB;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\ContractResource;
use App\Http\Resources\SubjectLeaseResource;



class contractController extends Controller
{
    public function index(){
        // $subject_lease =  Subjectlease::all();
        $subject_lease = DB::table('tbl_lease_type')
        ->where('leaseStatus','A')
        ->get();
        return view('contract/index')->with('subject_lease',$subject_lease);
    }

 

        // Save Contract Details
    public function store(){
        // $input = $request->all();
        // return $data['lessor'];
        // Customer::create($input);
        // $contract = Lease_Header::create($data);
        $data = request()->all();
        $contract = DB::table('tbl_lease_header')->insert([
            'lessorCode' => $data['lessor'],
            'storeCode' => $data['store'],
            'vendorCode' => $data['vendor'],
            'leaseTypeCode' => $data['subjectLease'],
            'Address1' => $data['address'],

            
        ]);
        return $contract;
        // return new ContractResource($contract);
       //  return $subject_lease;
    //    return ContractResource::collection($subject_lease);
   }


    public function getsubjectlease(){
        //  $subject_lease =  Subjectlease::all();
        $subject_lease = DB::table('tbl_lease_type')
        ->where('leaseStatus','A')
        ->get(['leaseTypeCode as id','leaseType as text']);

         return $subject_lease;
        // return ContractResource::collection($subject_lease);
        // return SubjectLeaseResource::collection($subject_lease);  
    }

        // Get list of Stores
   public function getstore(){
    $stores = DB::table('tbl_str')
                ->get(['STRNUM as id','STRNAM as text']);
    return $stores;
   }

        // Get list of Vendors
   public function getVendor(){
    $vendors = DB::table('tbl_vendor')->get(['ASNUM as id','ASNAME as text']);
    return $vendors;
   }

   public function getProvince(){
    $provinces = DB::table('tbl_province')->get(['provCode as id','provDesc as text']);
    return $provinces;
   }

   public function getMunicipality(){
    $provinceCode = request()->get('province');
    $municipalities = DB::table('tbl_city')
                    ->where('provCode',$provinceCode)
                    ->get(['id','citymunDesc as text']);

    return $municipalities;
   }

}
