

@extends('includes.header')
@section('content')
<?php



// if (!is_null($sessionCcmsLoggedIn)) {
?>


    <body class="navbar-top">
        <div class="navbar navbar-inverse navbar-fixed-top">
            <div class="navbar-boxed">
                <div class="navbar-header">
                    <ul class="nav navbar-nav visible-xs-block">
                        <li><a data-toggle="collapse" data-target="#navbar-mobile"><i class="icon-tree5"></i></a></li>
                    </ul>
                </div>

                <div class="navbar-collapse collapse" id="navbar-mobile">
                    <a href="dsadasd" class="navbar-brand"><img src="{{asset('assets/images/logo_light.png')}}" alt=""></a>
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
    <?php
    // } else {
    ?>

        <!-- <div class="navbar navbar-inverse">
            <div class="navbar-header">
                <a href="<?php echo base_url('index.php/login'); ?>" class="navbar-brand"><img src="<?php echo base_url('assets/images/logo_light.png'); ?>" alt=""></a>
            </div>
            <div class="navbar-collapse collapse" id="navbar-mobile">
                <ul class="nav navbar-nav navbar-right">
                    <li class="dropdown dropdown-user">
                        <a class="dropdown-toggle" data-toggle="dropdown">
                            <span>Welcome</span><span class="">Guest</span>
                            <i class="caret"></i>
                        </a>
                    </li>
                </ul>
            </div>
        </div> -->

    <?php
    // }
    ?>

</body>


@endsection



