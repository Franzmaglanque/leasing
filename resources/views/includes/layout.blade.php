<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Leasing</title>
        
        <!-- Global stylesheets -->
 
        <!-- <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vue@2.7.13/dist/vue.js">
        import Vue from 'vue'
        </script> -->
        <!-- <script src="{{ mix('/js/app.js') }}"></script> -->
        <script src="{{ asset('js/app.js') }}" defer></script>
        
        <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.1.3/axios.min.js"></script> -->
        <script src="{{asset('assets/axios/axios.min.js')}}"></script>

      
        <link href="{{asset('assets/images/logo.png')}}" rel="shortcut icon" type="image/x-icon" sizes="196x196">
        <link href=" {{asset('assets/css/icons/icomoon/styles.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/css/bootstrap.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/css/core.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/css/components.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/css/minified/colors.min.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/css/icons/fontawesome/styles.min.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/sweetalert2/dist/sweetalert2.min.css')}}" rel="stylesheet" type="text/css">
        


        <script type="text/javascript" src=" {{asset('assets/js/plugins/loaders/pace.min.js')}}"></script>
        <!-- <script type="text/javascript" src="{{asset('assets/js/core/libraries/jquery.min.js')}}"></script> -->
        <!-- <script type="text/javascript" src="{{asset('assets/js/core/libraries/jquery_ui/jquery-ui.js')}}"></script> -->

        <script type="text/javascript" src="{{asset('assets/jquery/jquery.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/core/libraries/bootstrap.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/loaders/blockui.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/sweetalert2/dist/sweetalert2.all.min.js')}}"></script>
        <!-- <script type="text/javascript" src="{{asset('assets/sweetalert2/dist/sweetalert2.min.css')}}"></script> -->


        <!-- /core JS files -->

        <!-- Theme CSS files -->
        <script type="text/javascript" src=" {{asset('assets/js/core/app.js')}}"></script>
        <!-- <script type="text/javascript" src=" {{asset('assets/js/plugins/forms/styling/uniform.min.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/velocity/velocity.min.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/velocity/velocity.min.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/pages/form_inputs.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/ui/moment/moment.min.js')}}"></script> -->
        <!-- <script type="text/javascript" src="{{asset('assets/js/plugins/forms/selects/select2.min.js')}}"></script> -->
        <!-- <script type="text/javascript" src="{{asset('assets/js/plugins/forms/selects/select2_updated.min.js')}}"></script>

        <script type="text/javascript" src="{{asset('assets/js/plugins/forms/styling/switchery.min.js')}}"></script>
        
         <script type="text/javascript" src=" {{asset('assets/js/pages/form_layouts.js')}}"></script> 
        <script type="text/javascript" src="  {{asset('assets/js/core/libraries/jquery_ui/datepicker.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/pickers/daterangepicker.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/pickers/anytime.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/pickers/pickadate/picker.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/pickers/pickadate/picker.date.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/pickers/pickadate/picker.time.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/pickers/pickadate/legacy.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/pages/picker_date.js')}}"></script> -->
        
   
        <!-- <script type="text/javascript" src="{{asset(' assets/js/pages/form_select2.js')}}>"></script> -->
       
       
        
<!-- <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script> -->

 
       
        
<!--         
        <link href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.min.css" rel="stylesheet" type="text/css">
        <script type="text/javascript" src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.min.js"></script>
       -->
          <style>
/*            .footer {
                position: fixed;
                bottom: 0;
                width: 100%;
                text-align: center;
                padding-top: 5px;
                margin: 0;
                height: 30px;
            }*/
        </style>
    </head>


    <!-- <div id="content">
    <div id="ccms" style="display:none;">  -->
    

   <body>

       
   <body class="navbar-top">
        <div class="navbar navbar-inverse navbar-fixed-top">
            <div class="navbar-boxed">
                <div class="navbar-header">
                    <ul class="nav navbar-nav visible-xs-block">
                        <li><a data-toggle="collapse" data-target="#navbar-mobile"><i class="icon-tree5"></i></a></li>
                    </ul>
                </div>

                <div class="navbar-collapse collapse" id="navbar-mobile">
                    <a href="{{URL::to('/dashboard')}}" class="navbar-brand"><img src="{{asset('assets/images/logo_light.png')}}" alt=""></a>
                    <ul class="nav navbar-nav">

                        
                           

                    </ul>
                    <ul class="nav navbar-nav navbar-right">
                        <li class="dropdown dropdown-user">
                        
                            <a class="dropdown-toggle" data-toggle="dropdown" data-hover="dropdown">
                                <img src="{{asset('assets/images/placeholder_.jpg')}}" alt="">
                                <span>Welcome </span><span class="">{{session('fullname')}}</span>
                                <i class="caret"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-right">
                                <li><a id="logoutBtn" name="logoutBtn" href="#" onclick=""><i class="icon-exit3"></i> Logout</a></li>   
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="page-header">
            <div class="breadcrumb-line breadcrumb-line-wide">
                <ul class="breadcrumb-elements" style="font-family: Trebuchet MS, Arial, Helvetica, sans-serif">
                    <li><a href="#"></i> <u><b>
                   
                   <?php
                //    var_dump($sessionCcmsLoggedIn)   
                // if($sessionCcmsLoggedIn['arcr-userLevel'] == 1){
                //     echo "VALUE CREATION";
                // }elseif($sessionCcmsLoggedIn['arcr-userLevel'] == 2){
                //     echo "ACCOUNTS PAYABLE";
                // }else{
                //     echo "ADMINISTRATOR";
                // }
                //    echo $sessionCcmsLoggedIn['arcr-userLevel'];
                   ?>

                    </b></u></a></li>
                </ul>
            </div>


















        <!-- <div class="container">    -->
        <div class="app">   

            @yield('content')
        </div>
  </body>

 <!--    </div>
    </div> -->

        <!-- <div class="footer bg-slate-800" style="font-family: Trebuchet MS, Arial, Helvetica, sans-serif">
             &copy; 2022. <u onclick="window.open('https://www.puregold.com.ph', '_blank');" style="cursor: pointer;">Puregold Price Club, Inc.</u> - <b>CHEQUE COLLECTION MONITORING SYSTEM</b> by <u onclick="window.location.href='mailto:iapolea@puregold.com.ph';" style="cursor: pointer;">PUREGOLD Apps & Innovation Team </u>
        </div>  -->

       <!-- <div class="footer bg-danger-800" style="font-family: Trebuchet MS, Arial, Helvetica, sans-serif">
          <b>TESTING ENVIRONMENT - CHEQUE COLLECTION MONITORING SYSTEM</b>
       </div>  -->
      
        
      
</html>
