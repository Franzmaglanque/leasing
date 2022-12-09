<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use DateTime;
use DatePeriod;
use DateInterval;
use Illuminate\Support\Facades\DB;


class Pvcomp extends Model
{
    public function save_pvcomp_contract($contract_header,$data,$i){
        
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

        $count = count($output)-1;
        for($o=0;$o <= $count;$o++){
            $pvcompContract = DB::table('tbl_sched_pvcomp')->insert([
                'headerID' => $contract_header,
                'yearID' => $data['data'][$i]['yearNum'],
                'rent' => $data['data'][$i]['monthlyRent'],
                'vat' => $data['data'][$i]['vatAmount'],
                'ewt' => $data['data'][$i]['ewtAmount'],
                'netDue' => floatval($data['data'][$i]['netDueAmount']),
                'monthStart' => $output[$o]['start'],
                'monthEnd' => $output[$o]['end'],
            ]);
        }
       return true;
        // return $pvcompContract;
    }
}
