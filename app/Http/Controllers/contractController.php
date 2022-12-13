<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Subjectlease;
use App\Lease_Header;
use App\Lease_Detail;
use App\Pvcomp;
use App\Provision;


use Illuminate\Support\Facades\DB;
use App\Http\Resources\ContractResource;
use App\Http\Resources\SubjectLeaseResource;
use Illuminate\Support\Facades\Validator;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

use DateTime;
use DatePeriod;
use DateInterval;




class contractController extends Controller
{

    public $Lease_Header; 
    public $Lease_Detail;
    public $pvcomp;
    public $provision;


    public function __construct(){
        $this->Lease_Header = new Lease_Header;
        $this->Lease_Detail = new Lease_Detail;
        $this->pvcomp = new Pvcomp;
        $this->Provision = new Provision;

        
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

        // $validator = Validator::make($data, [
        //     // 'LieferNr' => ['required', 'min:5', 'max:5'],
        //      'lessor' => 'required',
        //      'address' => 'required',

        // ]);
        // if($validator->fails()){
        //     $messages = $validator->messages();
        //     return $messages;
        // }

        $data = request()->all();
                    // Save to tbl_lease_header then get ID
        $contract_header = $this->Lease_Header->save_header_contract($data);
        if(!is_null($data['provisions'])){
            $lease_provision = $this->Provision->save_lease_provision($contract_header,$data);
        }

        $output = array();
        $year =  date('Y-m-d', strtotime($data['contractPeriodFrom']));
        $year_only =  date('Y', strtotime($data['contractPeriodFrom']));
        $counter = 0;
        $rent = $data['monthlyRent'];
        $provision_count = count($data['provisions']) -1;
        // var_dump( $data['provisions']);
        // exit();
        for($p = 0; $p <= $provision_count; $p++){
            echo $p;
            for ($i = 0; $i < $data['numYears']; $i++) {
                if($i == 0){
                    $new_year = date("Y-m-d", strtotime("$year +1 year", time()));
                    $new_year_updated = date("Y-m-d", strtotime("$new_year -1 day", time()));

                    $vat = $data['monthlyRent'] * 0.12;
                    $ewt = ($data['monthlyRent'] * -1) * 0.05 ;
                    $net = $data['monthlyRent'] + $ewt + $vat;
                    $yearlyRent = $data['monthlyRent'] * 12;
                    $output['data'][] = [
                        'headerID' => $contract_header,
                        'yearFrom' => $year,
                        'yearTo' => $new_year_updated,
                        'yearNum' => $i +1,
                        'escalationPercent' => 5,
                        'rentAmount' => $data['monthlyRent'] * 12,
                        'vatAmount' => $vat,
                        'ewtAmount' => $ewt,
                        'netDueAmount' => $net,
                        'yearlyRent' => $yearlyRent,
                        'escalationPercent' => $data['escalationPercent'],
                        'monthlyRent' => floatval($data['monthlyRent']),
                    ];
                
                }else{
                    $new_yearFrom = $new_year;
                    $vat = $data['monthlyRent'] * 0.12;
                    $ewt = ($data['monthlyRent'] * -1) * 0.05 ;
                    $net = $data['monthlyRent'] + $ewt + $vat;
                    $new_year = date("Y-m-d", strtotime("$new_yearFrom +1 year", time()));
                    $new_year_updated = date("Y-m-d", strtotime("$new_year -1 day", time()));
                    $output['data'][] = [
                        'headerID' => $contract_header,
                        'yearFrom' => $new_yearFrom,
                        'yearTo' => $new_year_updated,
                        'yearNum' => $i +1,
                        'escalationPercent' => $data['escalationPercent'],
                        'rentAmount' => floatval($data['monthlyRent'] * 12),
                        'vatAmount' => $vat,
                        'ewtAmount' => $ewt,
                        'netDueAmount' => $net,
                        'yearlyRent' => $yearlyRent,
                        'escalationPercent' => $data['escalationPercent'],
                        'monthlyRent' => floatval($data['monthlyRent']),
                    ];
                }
                        // Save Contract Years to DB
                $contract_detail = $this->Lease_Detail->save_detail_contract($output,$i);
                        // Save Contract Months to DB
                $pvcomp = $this->pvcomp->save_pvcomp_contract($contract_header,$output,$i);

                        // Save Contract Provisions to DB
        
               
                // $provision = $this->Provision->save_lease_provision_sched($contract_header,$output,$i,$data,$data['provisions'][$p]);
                if(!is_null($data['provisions'])){
                    $provision = $this->Provision->save_lease_provision_sched($contract_header,$output,$i,$data,$data['provisions'][$p]);
                }

            }
          
            // return $provision;
        }
        // return json_encode($output);
    // $days_result = $days_to - $days_from;
    // $day1 = $days_result/86400;//days 
    // $decimal = $day1/365;
    // var_dump($day1);
    // return $contract;
   }


   public function getContractArray(){

            $data = request()->all();
        
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

    }





    public function getsubjectlease(){
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

   public function getContracts(){
        // $contracts = DB::table('tbl_lease_header')
        //              ->join('')
        $contracts = DB::select("SELECT
            a.headerID,
            a.lessorCode,
            a.storeCode,
            a.vendorCode,
            a.leaseTypeCode,
            a.Address1,
            a.monthlyRent,
            a.contractDateFrom,
            a.contractDateTo,
            a.escalationPercent,
            b.lessorName,
            c.leaseType
        FROM
            tbl_lease_header a
            INNER JOIN tbl_lessor b ON a.lessorCode = b.lessorCode 
            INNER JOIN tbl_lease_type c ON a.leaseTypeCode = c.leaseTypeCode
        ");


        return $contracts;
   }

   public function generateContractExcel(){
    
        header('Content-Type: application/vnd.ms-excel');
        header('Content-Disposition: attachment;filename="Contract Report.xlsx"');
        header('Cache-Control: max-age=0');
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $header2 = array(
                'font' => [
                    'bold' => true,
                    'size' => 13
                ],
                'alignment' => [
                    'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                ], 
            );
        $styleArray = array(
            'font'  => array(
                    'bold'  => true,
                    // 'color' => array('rgb' => 'FF0000'),
                    'size'  => 12,
                    'name'  => 'Times New Roman'
                ));
                
        $styleArray2 = array(
            'font'  => array(
                    'size'  => 12,
                    'name'  => 'Times New Roman'
                )); 

        $borderArray = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THICK,
                    // 'color' => ['argb' => 'FFFF0000'],

                ],
            ],
        ];

            // GET CONTRACT HEADER DETAILS
        $contract = $this->Lease_Header->getExcelHeaderContract();
        $contractDetails = $this->Lease_Detail->getContractDetails();
        // var_dump($contractDetails);
        // dd($contractDetails);

        // $contractyear = $this->Lease_Detail->

            // TRANSFORM DATE FROM DATABASE 
        $newDateFrom = new DateTime($contract->contractDateFrom);
        $newDateFrom = $newDateFrom->format('F j, Y');
        $newDateTo = new DateTime($contract->contractDateTo);
        $newDateTo = $newDateTo->format('F j, Y');

            // COMPUTE AREA PER SQM
        $perSquareMeter = $contract->monthlyRent / $contract->area;

            // 
        $sheet->getStyle('A1:A7')->applyFromArray($styleArray);
        $sheet->getStyle('D1:D7')->applyFromArray($styleArray);
        $sheet->getStyle('E1:E7')->applyFromArray($styleArray2);
        $sheet->getStyle('F1:F7')->applyFromArray($styleArray2);
        $sheet->getStyle('G5')->applyFromArray($styleArray2);
        $sheet->mergeCells('A11:B11');
        $sheet->mergeCells('C11:D11');
        $sheet->getStyle('A11:H11')->applyFromArray($borderArray);
        $sheet->getStyle('A11:H11')->applyFromArray($styleArray);



        $sheet->getColumnDimension('A')->setWidth(12);
        $sheet->getColumnDimension('B')->setWidth(12);
        $sheet->getColumnDimension('C')->setWidth(12);
        $sheet->getColumnDimension('D')->setWidth(12);
        $sheet->getColumnDimension('E')->setWidth(12);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(12);
        $sheet->getRowDimension('11')->setRowHeight(50);



        
            // HARDCODE CONTRACT HEADER 
        $sheet->setCellValue('A1', 'LESSOR');
        $sheet->setCellValue('A2', 'SUBJECT LEASE');
        $sheet->setCellValue('A3', 'AREA (sqm)');
        $sheet->setCellValue('A4', 'MONTHLY RENT (VAT exclusive)');
        $sheet->setCellValue('A5', 'CONTRACT PERIOD');
        $sheet->setCellValue('A6', 'SECURITY DEPOSIT');
        $sheet->setCellValue('A7', 'ADVANCE RENT ');
        $sheet->setCellValue('A11', 'PERIOD');
        $sheet->setCellValue('C11', 'YEAR');
        $sheet->setCellValue('E11', 'RENT');
        $sheet->setCellValue('F11', 'VAT');
        $sheet->setCellValue('G11', '5% EWT');
        $sheet->setCellValue('H11', 'NET DUE');



                // CONTRACT HEADER DETAILS
        $sheet->setCellValue('D1', $contract->lessorName);
        $sheet->setCellValue('D2', $contract->leaseType);
        $sheet->setCellValue('D3', $contract->area);
        $sheet->setCellValue('D4', $contract->monthlyRent);
        $sheet->setCellValue('E4', $perSquareMeter);
        $sheet->setCellValue('E4', '/sqm');
        $sheet->setCellValue('D5', $contract->totalYear);
        $sheet->setCellValue('E5', 'Years');
        $sheet->setCellValue('F5', $newDateFrom);
        $sheet->setCellValue('G5', $newDateTo);
        $sheet->setCellValue('D6', $contract->securityDepositDuration);
        $sheet->setCellValue('E6', 'Months');
        $sheet->setCellValue('F6', $contract->securityDepositAmount);
        $sheet->setCellValue('D7', $contract->advanceRentDuration);
        $sheet->setCellValue('E7', 'Months');
        $sheet->setCellValue('F7', $contract->advanceRentAmount);


                // CONTRACT YEAR DETAILS
        $cnt = 12;
        foreach($contractDetails as $row){
            $newDateFrom = new DateTime($row->periodFrom);
            $newDateFrom = $newDateFrom->format('m-d-Y');
            $sheet->setCellValue('A'.$cnt, $newDateFrom);
            $newDateTo = new DateTime($row->periodTo);
            $newDateTo = $newDateTo->format('m-d-Y');
            $sheet->setCellValue('B'.$cnt, $newDateTo);
            $sheet->setCellValue('C'.$cnt, $row->yearID);
            $sheet->setCellValue('D'.$cnt, $row->escalationPercent . '%');
            $sheet->setCellValue('E'.$cnt, number_format($row->rentAmount,2));
            $sheet->setCellValue('F'.$cnt, number_format($row->vatAmount,2));
            $sheet->setCellValue('G'.$cnt, number_format($row->ewtAmount,2));
            $sheet->setCellValue('H'.$cnt, number_format($row->netDueAmount,2));






            // echo $row->periodFrom;
            // echo "<br>";
            $cnt++;
        }
        


        $writer = new Xlsx($spreadsheet);
        $writer->save('php://output');
    }

}
