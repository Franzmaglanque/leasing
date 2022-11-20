
@extends('login.layout')
@section('content')



 <!-- {{ URL::to('/')}} -->
<div class="page-container login-container" style="min-height:615px">
    <div class="page-content">
        <div class="content-wrapper">
         
            <form id="loginFrm" name="loginFrm" class="form-horizontal">
                {{csrf_field()}}
            <div class="panel panel-body border-top-success-800 border-lg border-bottom-success-800 login-form">
                <div class="text-center">
                    <!-- <div class="icdon-object border-slate-300 text-slate-300"><img src="{{asset('assets/images/pg-logo.png')}}" style="height:100px; width:100px;" /></div> -->
                     <div class="icdon-object border-slate-300 text-slate-300"><img src="{{asset('assets/images/pg-logo.png')}}" style="height:100px; width:100px;" /></div>
                    <h5 class="content-group"><b style="font-size: 20px; color: #2E7D32;">L</b>easing </small></h5>
                </div>

                <div class="form-group has-feedback has-feedback-left">
                    <input class="form-control" type="text" name="usernameTxt" placeholder="Employee No." id="usernameTxt">
                    <div class="form-control-feedback">
                        <i class="icon-user text-muted"></i>
                    </div>
                </div>

                <div class="form-group has-feedback has-feedback-left">
                    <input class="form-control" type="password" name="passwordTxt" placeholder="Password" id="passwordTxt">
                    <div class="form-control-feedback">
                        <i class="icon-lock2 text-muted"></i>
                    </div>
                </div>
                <div class="form-group">
                    <!-- <input type="submit" value="Login" class="btn btn-primary btn-block" content=""> -->
                    <button  id="loginBtn" class="btn btn-primary btn-block"><b>LOGINs</b><i class="icon-arrow-right14 position-right"></i></button>
                </div>
            </div>
        </form>
            
        </div>
    </div>


<script type="text/javascript">
    // $(function () {
    //     // callCustomClass();
    //     // addRequire('#usernameTxt, #passwordTxt');
    //     // addValidate('#loginFrm');
    // });
 $("#loginFrm").submit(function(e){
        e.preventDefault();
});

$("#loginBtn").on('click',function(){
    proc.login();
})
    var proc = {
        'login': function () {
            // if ($('#loginFrm').valid()) {
                console.log($('#loginFrm').serialize());
                $.ajax({
                    type: 'POST',
                    data: $('#loginFrm').serialize(),
                    url: '/login',
                    beforeSend: function () {
                        // loadLoading('content');
                    },
                    error: function (xhr) {
                        // errorSweetAlert(xhr.status, xhr.statusText);
                    },
                    success: function (data) {
                        eval(data);
                    },
                    complete: function () {
                        // unloadLoading('content');
                    }
                });
            // } 
            // else {
            //     errorSweetAlert('', 'Please fill all required fields.');
            // }
        }
    }
</script>
@endsection