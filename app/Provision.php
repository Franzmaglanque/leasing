<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use DateTime;
use DatePeriod;
use DateInterval;

class Provision extends Model
{
    public function createProvision($data){
        $provision = DB::table('tbl_provisions')->insert([
            'provisionDescription' => $data['name'],
            'provisionStatus' => 'A',
            'userAdded' => session('employee_number'),
            'dateAdded' => now(),
        ]);
        return $provision;    
    }

    public function updateProvision($data){
        $affected = DB::table('tbl_provisions')
              ->where('provisionCode', $data['id'])
              ->update([
                'provisionDescription' => $data['name'],
                'provisionStatus' => $data['status'],
                'userUpdated' => session('employee_number'),
                'dateUpdated' => now(),
            ]);
        return $affected;    
    }

    public function save_lease_provision($contract_header,$data){
         $count = count($data['provisions'])-1;
        for($i=0;$i <= $count; $i++){
            $provision = DB::table('tbl_lease_provisions')->insert([
                'headerID' => $contract_header,
                'provisionCode' => $data['provisions'][$i],
            ]);
        }
        return $provision;    
    }


    public function save_lease_provision_sched($contract_header,$data,$i,$provisions,$data_whole){

        $startDateFromDatabase = $data['data'][$i]['yearFrom'];
        $endDateFromDatabase = $data['data'][$i]['yearTo'];
        $bar = date("d",strtotime("$startDateFromDatabase"));
        if($bar == 01) {
            $start    = new DateTime($startDateFromDatabase);
            $end      = new DateTime($endDateFromDatabase);
            $interval = DateInterval::createFromDateString('1 month');
            $period   = new DatePeriod($start, $interval, $end);
            
            $output = array();
                foreach ($period as $dt) {
                    array_push($output,['start'=>$dt->format("Y-m-d"),'end'=>$dt->format("Y-m-t") ]);
                }
         }
        
         else{
            $output = array();
            $modifiedDateFromDatabase = new DateTime($startDateFromDatabase);
            $output = array(['start'=>$modifiedDateFromDatabase->format("Y-m-d"),
            'end'=>$modifiedDateFromDatabase->format("Y-m-t")]);
            $newStartDate = $modifiedDateFromDatabase->modify('first day of next month');
           
            $start    = $newStartDate;
            $end      = new DateTime($endDateFromDatabase);
            $interval = DateInterval::createFromDateString('1 month');
            $period   = new DatePeriod($start, $interval, $end);
      
            foreach ($period as $dt) {
                array_push($output,['start'=>$dt->format("Y-m-d"),'end'=>$dt->format("Y-m-t") ]);
            }
            // $bar = $startDateFromDatabase->format("Y-m-d");
            // echo $startDateFromDatabase->format("Y-m-d");
            $petsa = date("Y-m-d", strtotime("$startDateFromDatabase -1 day", time()));
            $count =  count($output)-1;
            $output[$count]['end'] = $petsa;
            // var_dump($output);
         }

        $provisionAmount = $this->calculateProvision($provisions,$data);

        $count = count($output)-1;
 
            for($o=0;$o <= $count;$o++){
                    $pvcompContract = DB::table('tbl_lease_provisions_schedule')->insert([
                    'headerID' => $contract_header,
                    'periodFrom' => $output[$o]['start'],
                    'periodTo' => $output[$o]['end'],
                    'durationCount' => $data['data'][$i]['yearNum'],
                    'escalationPercent' => $data['data'][$i]['escalationPercent'],
                    'rentAmount' => $data['data'][$i]['monthlyRent'],
                    'vatAmount' => $data['data'][$i]['vatAmount'],
                    'ewtAmount' => $data['data'][$i]['ewtAmount'],
                    'netDueAmount' => floatval($data['data'][$i]['netDueAmount']),
                    'provisionCode' => $provisions,
                    'yearID' => $data['data'][$i]['yearNum'],
                    'provisionAmount' => $provisionAmount,
                ]);
            }
       return true;
    }

    public function calculateProvision($provisions,$data){
        if($provisions == 1){
            $cusa = [];
            $cusa = $data['area'] * $data['cusa'];
            return $cusa;
        }
        if($provisions == 2){
            $marketing = $data['area'] * $data['marketingSupport'];
            return $marketing;
        }
        if($provision == 3){
            $aircon = $data['area'] * $data['aircon'];
            return $aircon;
        }
        if($provision == 4){
            $pest = $data['area'] * $data['pestControl'];
            return $pest;
        }
        if($provision == 5){
            $stp = $data['area'] * $data['stpMaintenance'];
            return $stp;
        }
        if($provision == 6){
            $donation = $data['area'] * $data['donation'];
            return $donation;
        }
    }
}
