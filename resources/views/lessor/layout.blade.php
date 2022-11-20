<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Leasing</title>
        
        <!-- Global stylesheets -->
        {{-- <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script> --}}
        {{-- <script type="importmap">
            { 
                "imports": {
              "vue":               "https://cdn.jsdelivr.net/npm/vue@2.7.13/dist/vue.js",
            }
            }

            </script> --}}
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vue@2.7.13/dist/vue.js">
        import Vue from 'vue'
        </script>
        {{-- <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/vue@2.7.13/dist/vue.js"></script> --}}
        
        <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.1.3/axios.min.js"></script>
      
        <link href="{{asset('assets/images/logo.png')}}" rel="shortcut icon" type="image/x-icon" sizes="196x196">
        <link href=" {{asset('assets/css/icons/icomoon/styles.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/css/bootstrap.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/css/core.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/css/components.css')}}" rel="stylesheet" type="text/css">
        <link href="{{asset('assets/css/minified/colors.min.css')}}" rel="stylesheet" type="text/css">



        <!-- /global stylesheets -->


        <!-- Core JS files -->
        <script type="text/javascript" src=" {{asset('assets/js/plugins/loaders/pace.min.js')}}"></script>
        <!-- <script type="text/javascript" src="{{asset('assets/js/core/libraries/jquery.min.js')}}"></script> -->
        <!-- <script type="text/javascript" src="{{asset('assets/js/core/libraries/jquery_ui/jquery-ui.js')}}"></script> -->

        <script type="text/javascript" src="{{asset('assets/jquery/jquery.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/core/libraries/bootstrap.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/loaders/blockui.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/sweetalert2/dist/sweetalert2.all.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/sweetalert2/dist/sweetalert2.min.css')}}"></script>


        <!-- /core JS files -->


        {{-- {{asset('assets/js/pages/picker_date.js')}} --}}
        <!-- Theme CSS files -->
        <script type="text/javascript" src=" {{asset('assets/js/core/app.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/forms/styling/uniform.min.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/velocity/velocity.min.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/velocity/velocity.min.js')}}"></script>
        <!-- <script type="text/javascript" src=" {{asset('assets/js/pages/form_inputs.js')}}"></script> -->
        <script type="text/javascript" src=" {{asset('assets/js/plugins/ui/moment/moment.min.js')}}"></script>
        {{-- <script type="text/javascript" src=" {{asset('assets/js/pages/form_layouts.js')}}"></script> --}}
        <script type="text/javascript" src="  {{asset('assets/js/core/libraries/jquery_ui/datepicker.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/pickers/daterangepicker.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/pickers/anytime.min.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/pickers/pickadate/picker.js')}}"></script>
        <script type="text/javascript" src="{{asset('assets/js/plugins/pickers/pickadate/picker.date.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/pickers/pickadate/picker.time.js')}}"></script>
        <script type="text/javascript" src=" {{asset('assets/js/plugins/pickers/pickadate/legacy.js')}}"></script>
        <!-- <script type="text/javascript" src=" {{asset('assets/js/pages/picker_date.js')}}"></script> -->
 

        
        
        <link href="https://cdn.datatables.net/1.13.1/css/jquery.dataTables.min.css" rel="stylesheet" type="text/css">
        <script type="text/javascript" src="https://cdn.datatables.net/1.13.1/js/jquery.dataTables.min.js"></script>


        <!-- /theme CSS files -->

        <!-- Theme JS files -->

        

      
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

       
 













        <div class="container">   
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
