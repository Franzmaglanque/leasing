<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ssoController extends Controller
{
     /**
     *  API Location
     */
    private $server = "http://192.168.200.243/sso_api/";

    /**
     *  ERROR container if API throws error
     */
    private $error = null;

    /**
     *  cURL configuration
     */
    private $conf = array();

    /**
     *  ClientSSO variables
     *  @param [username] - EmployeeID
     *  @param [password] - EmployeePassword
     *  @param [appName] - Name of the application
     *  @param [ipAddress] - Requestor's IP
     *  @param [flag] - (0) if used for overriding, (1) if used for login
     */
    private $username;
    private $password;
    private $appName;
    private $ipAdd;
    private $flag;

    function __construct($username = '', $password = '', $appName = '', $ipAddress = '', $flag = '') {
        $this->username = $username;
        $this->password = $password;
        $this->appName = $appName;
        $this->ipAdd = $ipAddress;
        $this->flag = $flag;
    }

    /**
     *  Method that sends API requests thru cURL
     *  @property Array [$arr=array()] - added array of cURL configurations
     */
    private function sendRequest($conf = array()) {

        $curl = curl_init();
      
        curl_setopt_array($curl, $conf);

        $result = curl_exec($curl);
        // var_dump($result);
        // exit();
        $this->error = curl_error($curl);

        curl_close($curl);

        if ($this->error) {
            $obj = new stdClass;
            $obj->error = $this->error;
            return $obj;
        } else {

            $result = (array) json_decode($result);

            if (isset($result['response'][0]))
                return (array) $result['response'][0];
            else
                return (array) $result;
        }
    }

    /**
     *  Validate employee credentials. 
     *  Returns EmployeeStatus AND APIKEY
     */
    public function validateEmployee() {

        $params = array(
            'empNo' => $this->username,
            'password' => sha1($this->password),
            'source_app' => $this->appName,
            'ip_address' => $this->ipAdd,
            'login_flag' => $this->flag
        );
        // echo $params;

      
        $arr = array(
            CURLOPT_URL => $this->server . "validate_user/validate_acct",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 400,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => $params,
            CURLOPT_HTTPHEADER => array(
                "cache-control: no-cache",
                "content-type: multipart/form-data",
            )
        );
        // var_dump($arr);
        // exit();
        // var_dump($arr);

        return $this->sendRequest($arr);
    }

    /**
     *  Returns Employee Info (e.g. EmployeeName, DeptCode, Store etc.)
     *  @param [key] - APIKEY
     *  @param [username] - EmployeeID
     */
    public function getEmployeeInfo($key, $username) {

        $curl = curl_init();

        $arr = array(
            CURLOPT_URL => $this->server . "validate_user/getEmployeeInfo/{$username}",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 400,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTPHEADER => array(
                "cache-control: no-cache",
                "X-API-KEY: {$key}",
            )
        );

        return $this->sendRequest($arr);
    }

    /**
     *  Validates APIKEY and USER if still valid
     *  @param [key] - APIKEY
     *  @param [username] - EmployeeID
     */
    public function validateAPIKEY($key, $username) {

        $curl = curl_init();

        $arr = array(
            CURLOPT_URL => $this->server . "validate_user/validatekey/{$username}",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 400,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTPHEADER => array(
                "cache-control: no-cache",
                "X-API-KEY: {$key}",
            )
        );

        return $this->sendRequest($arr);
    }

    /**
     *  Disables APIKEY of the corresponding USER
     *  @param [key] - APIKEY
     *  @param [username] - EmployeeID
     */
    public function disableAPIKEY($key, $username) {

        $curl = curl_init();

        $arr = array(
            CURLOPT_URL => $this->server . "validate_user/disablekey/{$username}",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 400,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTPHEADER => array(
                "cache-control: no-cache",
                "X-API-KEY: {$key}",
            )
        );

        return $this->sendRequest($arr);
    }


    public function testValidate(){
        return $this->username;
    }
}
