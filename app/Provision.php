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


    public function save_lease_provision_sched($contract_header,$data,$i,$input_data,$provisions){

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

        

        $provisionCount = count($input_data['provisions'])-1;
        $amount = [];
        $amount['cusa'] = 0;
        $amount['marketingSupport'] = 0;
        $amount['aircon'] = 0;
        $amount['pestControl'] = 0;
        $amount['stpMaintenance'] = 0;
        $amount['donation'] = 0;
        $amount['provisionsTotal']  = 0;
        $amount['cusaVat'] = 0;

        for($p=0;$p <= $provisionCount; $p++){
            if($input_data['provisions'][$p] == 1){
                $amount['cusa'] = $input_data['area'] * $input_data['cusa'];
                // $amount['provisionsTotal'] = $amount['provisionsTotal'] +$amount['cusa'];
                // $amount['cusaVat'] = ($amount['cusaVat'] +$amount['cusa']) * 0.12;
                // $amount['cusaEwt'] = (($amount['cusaEwt'] + $amount['cusa']) * -1) * 0.02;
                // $amount['cusaNetDue'] = $amount['cusa'] +  $amount['cusaVat'] + $amount['cusaEwt'];
            }
            elseif($input_data['provisions'][$p] == 2){
                $amount['marketingSupport'] = $input_data['area'] * $input_data['marketingSupport'];
                // $amount['provisionsTotal'] = $amount['provisionsTotal'] +$amount['marketingSupport'];
                // $amount['marketVat'] =($amount['marketVat'] +$amount['marketingSupport']) * 0.12;
                // $amount['marketEwt'] = (($amount['marketEwt'] + $amount['marketingSupport']) * -1) * 0.02;
                // $amount['marketNetDue'] = $amount['marketingSupport'] +  $amount['marketVat'] + $amount['marketEwt'];
            }
          
            elseif($input_data['provisions'][$p] == 3){
                $amount['aircon'] = $input_data['area'] * $input_data['aircon'];
                // $amount['provisionsTotal'] = $amount['provisionsTotal'] +$amount['aircon'];
                // $amount['airconVat'] =($amount['airconVat'] +$amount['aircon']) * 0.12;
                // $amount['airconEwt'] =(($amount['airconEwt'] + $amount['aircon']) * -1) * 0.02;
                // $amount['airconNetDue'] = $amount['aircon'] + $amount['airconVat'] + $amount['airconEwt'];
            }

            elseif($input_data['provisions'][$p] == 4){
                $amount['pestControl'] = $input_data['area'] * $input_data['pestControl'];
                // $amount['provisionsTotal'] = $amount['provisionsTotal'] +$amount['pestControl'];
                // $amount['pestControlVat'] = ($amount['pestControlVat'] +$amount['pestControl']) * 0.12;
                // $amount['pestControlEwt'] =(($amount['pestControlEwt'] + $amount['pestControl']) * -1) * 0.02;
                // $amount['pestNetDue'] = $amount['pestControl'] + $amount['pestControlVat'] + $amount['pestControlEwt'];
            }
            elseif($input_data['provisions'][$p] == 5){
                $amount['stpMaintenance']= $input_data['area'] * $input_data['stpMaintenance'];
                // $amount['provisionsTotal'] = $amount['provisionsTotal'] +$amount['stpMaintenance'];
                // $amount['stpVat'] = ($amount['stpVat'] +$amount['stpMaintenance']) * 0.12;
                // $amount['stpEwt'] = (($amount['stpEwt'] + $amount['stpMaintenance']) * -1) * 0.02;
                // $amount['stpNetDue'] = $amount['stpMaintenance'] + $amount['stpVat'] +  $amount['stpEwt'];
            }
            elseif($input_data['provisions'][$p] == 6){
                $amount['donation'] = $input_data['area'] * $input_data['donation'];
                // $amount['provisionsTotal'] = $amount['provisionsTotal'] +$amount['donation'];
                // $amount['donationVat'] = 0;
                // $amount['donationEwt'] = 0;
                // $amount['donationNetDue'] = $amount['donation'];
            }else{
                $amount['cusa'] = 0;
                $amount['marketingSupport'] = 0;
                $amount['aircon'] = 0;
                $amount['pestControl'] = 0;
                $amount['stpMaintenance'] = 0;
                $amount['donation'] = 0;
            }
        }
        // $amount['vat'] = $amount['provisionsTotal'] * 0.12;
        // $amount['ewt'] = ($amount['provisionsTotal'] * -1) * 0.02;
        // $amount['netDue'] = $amount['vat'] + $amount['ewt'] + $amount['provisionsTotal'] + $amount['donation'];

        // var_dump($amount);
        // exit();
        $provisionAmount = $this->calculateProvision($provisions,$input_data);
        // var_dump( $provisionAmount);
        // exit();

        $count = count($output)-1;
            for($o=0;$o <= $count;$o++){
                    $pvcompContract = DB::table('tbl_lease_provisions_schedule')->insert(
                    [
                        'headerID' => $contract_header,
                        'periodFrom' => $output[$o]['start'],
                        'periodTo' => $output[$o]['end'],
                        'durationCount' => $data['data'][$i]['yearNum'],
                        'escalationPercent' => $data['data'][$i]['escalationPercent'],
                        'rentAmount' => $data['data'][$i]['monthlyRent'],
                        'vatAmount' => $provisionAmount['vatAmount'],
                        'ewtAmount' => $provisionAmount['ewtAmount'],
                        // 'netDueAmount' => floatval($provisionAmount['netDueAmount']),
                        'netDueAmount' => $provisionAmount['netDueAmount'],

                        'provisionCode' => $provisions,
                        'yearID' => $data['data'][$i]['yearNum'],
                        'provisionAmount' => $provisionAmount['amount'],

                    ]);
            }

       return true;

    }

    public function calculateProvision($provisions,$data){
        if($provisions == 1){
            $cusa = [];
            $cusa['amount'] = $data['area'] * $data['cusa'];
            $cusa['vatAmount'] = $cusa['amount'] * 0.12;
            $cusa['ewtAmount'] = ($cusa['amount'] * -1) * 0.02;
            $cusa['netDueAmount'] = $cusa['amount'] + $cusa['vatAmount'] + $cusa['ewtAmount'];
            return $cusa;
        }
        if($provisions == 2){
            $marketing = [];
            $marketing['amount'] = $data['area'] * $data['marketingSupport'];
            $marketing['vatAmount'] = $marketing['amount'] * 0.12;
            $marketing['ewtAmount'] = ($marketing['amount'] * -1) * 0.02;
            $marketing['netDueAmount'] = $marketing['amount'] + $marketing['vatAmount'] + $marketing['ewtAmount'];
            return $marketing;
        }
        if($provisions == 3){
            $aircon = [];
            $aircon['amount'] = $data['area'] * $data['aircon'];
            $aircon['vatAmount'] = $aircon['amount'] * 0.12;
            $aircon['ewtAmount'] = ($aircon['amount'] * -1) * 0.02;
            $aircon['netDueAmount'] = $aircon['amount'] + $aircon['vatAmount'] + $aircon['ewtAmount'];
            return $aircon;
        }
        if($provisions == 4){
            $pest = [];
            $pest['amount'] = $data['area'] * $data['pestControl'];
            $pest['vatAmount'] = $pest['amount'] * 0.12;
            $pest['ewtAmount'] = ($pest['amount'] * -1) * 0.02;
            $pest['netDueAmount'] = $pest['amount'] + $pest['vatAmount'] + $pest['ewtAmount'];
            return $pest;
        }
        if($provisions == 5){
            $stp = [];
            $stp['amount'] = $data['area'] * $data['stpMaintenance'];
            $stp['vatAmount'] = $stp['amount'] * 0.12;
            $stp['ewtAmount'] = ($stp['amount'] * -1) * 0.02;
            $stp['netDueAmount'] = $stp['amount'] + $stp['vatAmount'] + $stp['ewtAmount'];
            return $stp;
        }
        if($provisions == 6){
            $donation = [];
            $donation['amount'] = $data['area'] * $data['donation'];
            $donation['vatAmount'] = $donation['amount'] * 0.12;
            $donation['ewtAmount'] = ($donation['amount'] * -1) * 0.02;
            $donation['netDueAmount'] = $donation['amount'] + $donation['vatAmount'] + $donation['ewtAmount'];
            return $donation;
        }
    }
}
