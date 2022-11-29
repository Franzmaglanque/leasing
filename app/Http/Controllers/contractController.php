<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Subjectlease;
use App\Lease_Header;
use App\Lease_Detail;
// use App\Facade\DB;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\ContractResource;
use App\Http\Resources\SubjectLeaseResource;
use Illuminate\Support\Facades\Validator;



class contractController extends Controller
{

    public $Lease_Header; 
    public $Lease_Detail;

    public function __construct(){
        $this->Lease_Header = new Lease_Header;
        $this->Lease_Detail = new Lease_Detail;
    }


    public function index(){
        // $subject_lease =  Subjectlease::all();
        // $subject_lease = DB::table('tbl_lease_type')
        // ->where('leaseStatus','A')
        // ->get();
    $vendors = DB::table('tbl_vendor')->get(['ASNUM as id','ASNAME as text']);

        return view('contract/index')->with('vendors',$vendors);
    }

 

        // Save Contract Details
    public function store(){

        $data = request()->all();
        $validator = Validator::make($data, [
            // 'LieferNr' => ['required', 'min:5', 'max:5'],
             'lessor' => 'required',
             'address' => 'required',

        ]);
      
        if($validator->fails()){
            $messages = $validator->messages();
            return $messages;
        }

$contract_header = $this->Lease_Header->save_header_contract($data);
// return $contract_header;
$output = array();
$year =  date('Y-m-d', strtotime($data['contractPeriodFrom']));
$year_only =  date('Y', strtotime($data['contractPeriodFrom']));
$counter = 0;
$rent = $data['monthlyRent'];
for ($i = 0; $i < $data['numYears']; $i++) {
    if($i == 0){
        $new_year = date("Y-m-d", strtotime("$year +1 year", time()));
        $vat = $data['monthlyRent'] * 0.12;
        $ewt = ($data['monthlyRent'] * -1) * 0.05 ;
        $net = $data['monthlyRent'] + $ewt + $vat;
        $yearlyRent = $data['monthlyRent'] * 12;
        $output['data'][] = [
            'headerID' => $contract_header,
            'yearFrom' => $year,
            'yearTo' => $new_year,
            'yearNum' => $i +1,
            'escalationPercent' => 5,
            'rentAmount' => $data['monthlyRent'],
            'vatAmount' => $vat,
            'ewtAmount' => $ewt,
            'netDueAmount' => $net,
            'yearlyRent' => $yearlyRent,
            'escalationPercent' => $data['escalationPercent'],
        ];
       
    }else{
        $new_yearFrom = $new_year;
        $vat = $data['monthlyRent'] * 0.12;
        $ewt = ($data['monthlyRent'] * -1) * 0.05 ;
        $net = $data['monthlyRent'] + $ewt + $vat;
        $new_year = date("Y-m-d", strtotime("$new_yearFrom +1 year", time()));
        $output['data'][] = [
            'headerID' => $contract_header,
            'yearFrom' => $new_yearFrom,
            'yearTo' => $new_year,
            'yearNum' => $i +1,
            'escalationPercent' => 5,
            'rentAmount' => $data['monthlyRent'],
            'vatAmount' => $vat,
            'ewtAmount' => $ewt,
            'netDueAmount' => $net,
            'yearlyRent' => $yearlyRent,
            'escalationPercent' => $data['escalationPercent'],
        ];
    }
        $contract_detail = $this->Lease_Detail->save_detail_contract($output);
       
  }
     return json_encode($output);
    // $days_result = $days_to - $days_from;
    // $day1 = $days_result/86400;//days 
    // $decimal = $day1/365;
    // var_dump($day1);
    // return $contract;
   }


   public function getContractArray(){

    $data = request()->all();
    // $validator = Validator::make($data, [
    //     // 'LieferNr' => ['required', 'min:5', 'max:5'],
    //      'lessor' => 'required',
    //      'address' => 'required',

    // ]);
  
    // if($validator->fails()){
    //     $messages = $validator->messages();
    //     return $messages;
    // }

// $contract_header = $this->Lease_Header->save_header_contract($data);
// return $contract_header;
// echo $data['numYears'];
// var_dump($data['escalationInterval']);
$output = array();
$year =  date('Y-m-d', strtotime($data['contractPeriodFrom']));
$year_only =  date('Y', strtotime($data['contractPeriodFrom']));
$counter = 0;
$rent = $data['monthlyRent'];
for ($i = 0; $i < $data['numYears']; $i++) {
    //       $vat = $data['monthlyRent'] * 0.12;
    //       $ewt = ($data['monthlyRent'] * -1) * 0.05 ;
    //       $net = $data['monthlyRent'] + $ewt + $vat;
    //     if($counter == $data['escalationInterval']){
    //             $escalation = $data['escalationPercent'] / 100;
    //             $escalation_result =  $data['monthlyRent'] * $escalation;
    //             $newYearlyRent = $data['monthlyRent'] + $escalation_result;
    //             $rent = $newYearlyRent;
    //              $output['data'][] = [
    //             'yearNum' => $i,
    //             'escalationPercent' => $data['escalationPercent'],
    //             'rentAmount' => $newYearlyRent,
    //             'vatAmount' => $vat,
    //             'ewtAmount' => $ewt,
    //             'netDueAmount' => $net,
    //         ];
    //         // echo $counter . ' is now 2 ';
    //         $counter = 0;
    //     }else{
    //         $output['data'][] = [
    //             'yearNum' => $i,
    //             'escalationPercent' => 0,
    //             'rentAmount' => $rent,
    //             'vatAmount' => $vat,
    //             'ewtAmount' => $ewt,
    //             'netDueAmount' => $net,
    //         ];
    //     }
    // $counter++;
if($i == 0){
    $new_year = date("Y-m-d", strtotime("$year +1 year", time()));
    $vat = $data['monthlyRent'] * 0.12;
    $ewt = ($data['monthlyRent'] * -1) * 0.05 ;
    $net = $data['monthlyRent'] + $ewt + $vat;
    $output['data'][] = [
        
        'yearFrom' => $year,
        'yearTo' => $new_year,
        'yearNum' => $i,
        'escalationPercent' => 5,
        'rentAmount' => $data['monthlyRent'],
        'vatAmount' => $vat,
        'ewtAmount' => $ewt,
        'netDueAmount' => $net,
    ];
}else{
    $new_yearFrom = $new_year;
    $vat = $data['monthlyRent'] * 0.12;
    $ewt = ($data['monthlyRent'] * -1) * 0.05 ;
    $net = $data['monthlyRent'] + $ewt + $vat;
    $new_year = date("Y-m-d", strtotime("$new_yearFrom +1 year", time()));
    $output['data'][] = [
        'yearFrom' => $new_yearFrom,
        'yearTo' => $new_year,
        'yearNum' => $i,
        'escalationPercent' => 5,
        'rentAmount' => $data['monthlyRent'],
        'vatAmount' => $vat,
        'ewtAmount' => $ewt,
        'netDueAmount' => $net,
    ];
    }
    $contract_detail = $this->Lease_Detail->save_detail_contract($output);
   
}
return $output;

// $count = count($output['data'])-1;
// $days_from =  strtotime($output['data'][$count][0]);
// $days_to = strtotime($data['contractPeriodTo']);

// $days_result = $days_to - $days_from;
// $day1 = $days_result/86400;//days 
// $decimal = $day1/365;
// var_dump($day1);
// return $contract;
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
    $vendors = DB::table('APSUPP')->get(['ASNUM as id','ASNAME as text']);
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


   public function getContractDetails(){
        $contractDetails = DB::table('tbl_lease_detail')->get();
        return $contractDetails;
   }

}
