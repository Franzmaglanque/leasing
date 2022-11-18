//Custom Start
function slideUpIn(element) {
    $(element).velocity('transition.slideUpIn', {
        stagger: 10
    })
}

function slideDownIn(element) {
    $(element).velocity('transition.slideDownIn', {
        stagger: 10
    })
}

function slideRightIn(element) {
    $(element).velocity('transition.slideRightIn', {
        stagger: 10
    })
}

function slideLeftIn(element) {
    $(element).velocity('transition.slideLeftIn', {
        stagger: 10
    })
}

function slideUpOut(element) {
    $(element).velocity('transition.slideUpOut', {
        stagger: 10
    })
}

function slideDownOut(element) {
    $(element).velocity('transition.slideDownOut', {
        stagger: 10
    })
}

function load(element) {
    $(element).block({
        message: '<i class="icon-spinner2 spinner spinner-dark-2"></i>',
        overlayCSS: {
            opacity: 0.5,
            cursor: 'wait',
            'box-shadow': '0 0 0 0px '
        },
        css: {
            border: 0,
            padding: 0,
            backgroundColor: 'none'
        }
    });
}

function unload(element) {
    window.setTimeout(function () {
        $(element).unblock();
    }, 200);
}

function loadLoading(element) {
    var block = $('#'+element).parent().parent();
    $(block).block({ 
        message: "<span class='text-semibold'><img width='100px' height='100px' src='"+varloadingImagePath+"'></span>",
        overlayCSS: {
            backgroundColor: '#fff',
            opacity: 1,
            cursor: 'wait',
            height: '100%'
        },
        css: {
            border: 0,
            padding: 0,
            backgroundColor: 'transparent'
        }
    });

    window.oldScrollPos = $(window).scrollTop();

    $(window).on('scroll.scrolldisabler', function (event) {
       $(window).scrollTop(window.oldScrollPos);
       event.preventDefault();
    });
}

function unloadLoading(element) { 
    setTimeout(function () { 
        var block = $('#'+element).parent().parent();
        $(block).unblock({ 
            timeout: 100
        });
         
        $(window).off('scroll.scrolldisabler');
        $("#ccms").fadeIn(1000);
    }, 100);
}

function basicSweetAlert(text) {
    swal({
        title: text,
        confirmButtonColor: "#2196F3"
    });
}

function infoSweetAlert(title, text, callFunction) {
    swal({
        title: title,
        text: text,
        confirmButtonColor: "#2196F3",
        type: "info"
    },
    function (isConfirm) {
        if (callFunction !== '') {
            if (isConfirm) {
                callFunction();
            }
        }
    });
}

function successSweetAlert(title, text) {
    swal({
        title: title,
        text: text,
        confirmButtonColor: "#66BB6A",
        type: "success"
    });
}

function errorSweetAlert(title, text) {
    swal({
        title: title,
        text: text,
        confirmButtonColor: "#EF5350",
        type: "error"
    });
}

function combineSweetAlert(title, text, subCancelText, callFunction, btnConfirmText, btnCancelText) {
    swal({
        title: title,
        text: text,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF5350",
        confirmButtonText: btnConfirmText,
        cancelButtonText: btnCancelText,
        closeOnConfirm: true,
        closeOnCancel: false
    },
    function (isConfirm) {
        if (isConfirm) {
            setTimeout(function () {
                callFunction()
            }, 400);
        } else {
            swal({
                title: subCancelText,
                confirmButtonColor: "#2196F3",
                type: "error"
            });
        }
    });
}

function combineSweetAlert_BACKUP(title, text, subConfirmText, subCancelText, callFunction, btnConfirmText, btnCancelText) {
    swal({
        title: title,
        text: text,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF5350",
        confirmButtonText: btnConfirmText,
        cancelButtonText: btnCancelText,
        closeOnConfirm: false,
        closeOnCancel: false
    },
    function (isConfirm) {
        if (isConfirm) {
            $.when(callFunction()).promise().done().then(function () {
                swal({
                    title: subConfirmText,
                    confirmButtonColor: "#66BB6A",
                    type: "success"
                });
            });
        } else {
            swal({
                title: subCancelText,
                confirmButtonColor: "#2196F3",
                type: "error"
            });
        }
    });
}

function combineSuccessSweetAlert(title, text, callFunction, btnConfirmText) {
    swal({
        title: title,
        text: text,
        type: "success",
        showCancelButton: false,
        confirmButtonColor: "#66BB6A",
        confirmButtonText: btnConfirmText,
        closeOnConfirm: false
    },
    function (isConfirm) {
        if (isConfirm) {
            callFunction();
        }
    });
}

function addValidate(form) {
    $(".readonly").keydown(function (e) {
        e.preventDefault();
    });
    // Switchery toggles


    // Bootstrap switch

    // Bootstrap multiselect
    $('.multiselect').multiselect({
        checkboxName: 'vali'
    });

    // Touchspin
    $(".touchspin-postfix").TouchSpin({
        min: 0,
        max: 100,
        step: 0.1,
        decimals: 2,
        postfix: '%'
    });

    // Select2 select
    $('.select').select2({
        minimumResultsForSearch: "-1"
    });

    // Styled checkboxes, radios
    $(".styled, .multiselect-container input").uniform({radioClass: 'choice'});

    // Styled file input
    $(".file-styled").uniform({
        wrapperClass: 'bg-sky',
        fileButtonHtml: '<i class="icon-googleplus5"></i>'
    });

    $(form).validate({
        ignore: 'input[type=hidden], .select2-input', // ignore hidden fields
        errorClass: 'validation-error-label',
        successClass: 'validation-valid-label',
        highlight: function (element, errorClass) {
            $(element).removeClass(errorClass);
        },
        unhighlight: function (element, errorClass) {
            $(element).removeClass(errorClass);
        },
        // Different components require proper error label placement
        errorPlacement: function (error, element) {
            // Styled checkboxes, radios, bootstrap switch
            if (element.parents('div').hasClass("checker") || element.parents('div').hasClass("choice") || element.parent().hasClass('bootstrap-switch-container')) {
                if (element.parents('label').hasClass('checkbox-inline') || element.parents('label').hasClass('radio-inline')) {
                    error.appendTo(element.parent().parent().parent().parent());
                } else {
                    error.appendTo(element.parent().parent().parent().parent().parent());
                }
            }
            // Unstyled checkboxes, radios
            else if (element.parents('div').hasClass('checkbox') || element.parents('div').hasClass('radio')) {
                error.appendTo(element.parent().parent());
            }
            // Inline checkboxes, radios
            else if (element.parents('label').hasClass('checkbox-inline') || element.parents('label').hasClass('radio-inline')) {
                error.appendTo(element.parent().parent());
            }
            // Input group, styled file input
            else if (element.parent().hasClass('uploader') || element.parents().hasClass('input-group')) {
                error.appendTo(element.parent().parent());
            } 
            else if (element.parent().hasClass('has-feedback')) {
                error.appendTo(element.parent());
            } 
            // Input file type
            else if (element.hasClass('file-input')) {
                error.appendTo(element.parent().parent());
            } 
            else if (element.hasClass('select2-offscreen')) {
                error.appendTo(element.parent());
            } 
            else if (element.parent().hasClass('tokenfield')) {
                error.appendTo(element.parent().parent());
            } 
            else {
                error.insertAfter(element);
            }
        },
        validClass: "validation-valid-label",
        //        success: function (label) {
        //            label.addClass("validation-valid-label")
        //        },
        messages: {
            custom: {
                required: "This field is required.",
            }
        }

    });
}

function removeValidate(form) {
    $(form).validate().resetForm();
}

function addRequire(element) {
    $(element).attr("required", true)
}

function removeRequire(element) {
    $(element).removeAttr("required");
}

function addDisable(element) {
    if ($(element).hasClass("switchery")) {
        $(element).parent().addClass("disabled");
    } else {
        $(element).addClass("disabled");
        //$(element).removeClass("border-slate-300");
    }
}

function removeDisable(element) {
    if ($(element).hasClass("switchery")) {
        $(element).parent().removeClass("disabled");
    } else {
        $(element).removeClass("disabled");
        $(element).removeAttr("disabled");
        $(element).addClass("border-slate-300");
    }
}

function addHidden(element) {
    $(element).addClass("hidden");
}

function removeHidden(element) {
    $(element).removeClass("hidden");
}

function addDatepicker(element, min, max, func) {
    $(element).datepicker("destroy");
    $(element).datepicker({
        minDate: min,
        maxDate: max,
        onSelect: func,
        dateFormat: "DD MM d, yy",
        changeMonth: true,
        changeYear: true,
    });
}

function addFileInput(element, ext) {
    $(element).fileinput({
        browseLabel: '',
        browseClass: 'btn btn-primary btn-icon',
        removeLabel: '',
        uploadLabel: '',
        uploadClass: 'btn btn-default btn-icon',
        browseIcon: '<i class="icon-plus22"></i> ',
        uploadIcon: '<i class="icon-file-upload"></i> ',
        removeClass: 'btn btn-danger btn-icon',
        removeIcon: '<i class="icon-cancel-square"></i> ',
        layoutTemplates: {
            caption: '<div tabindex="-1" class="form-control file-caption {class}">\n' + '<span class="icon-file-plus kv-caption-icon"></span><div class="file-caption-name"></div>\n' + '</div>'
        },
        initialCaption: "No file selected",
        allowedFileExtensions: ext
    });
}

function addEditor(element) {
    CKEDITOR.replace(element, {
        height: '400px',
        extraPlugins: 'forms'
    });
}

function removeEditor(element) {
    CKEDITOR.instances[element].destroy(true);
}

function addTokenfield(element) {
    $(element).tokenfield();
}
// Custom End

function callCustomClass() {
    $('.panel').addClass('panel-flat');
    $('input[type="text"], input[type="password"], input[type="email"], textarea').addClass('form-control input-xs');
    $('.select2-cmb').select2().removeClass('form-control');
    $('.dualListBoxMultiple-cmb').bootstrapDualListbox({
        moveOnSelect: false,
        nonSelectedListLabel: 'Non-selected',
        selectedListLabel: 'Selected'
    });
    $('table').css('width', '100%');
    $('.btn').addClass('btn-xs');
    $('.switchery-default').remove();
    var elems = Array.prototype.slice.call(document.querySelectorAll('.switchery'));
    elems.forEach(function (html) {
        var switchery = new Switchery(html);
    });
    $('.switch').bootstrapSwitch();
}

function cleanForm(element) {
    $(element)[0].reset();
    $(element).validate().resetForm();
    $('select').select2('val', '')
}

$(function () {
    // Datatable Start
    $.extend($.fn.dataTable.defaults, {
        language: {
            search: '<span>Filter:</span> _INPUT_',
            lengthMenu: '<span>Show:</span> _MENU_',
            paginate: {'first': 'First', 'last': 'Last', 'next': '&rarr;', 'previous': '&larr;'}
        },
        preDrawCallback: function () {
            $(".dataTables_filter input[type=search]").attr("placeholder", "Type to filter...").addClass("input-xs input-block border-slate-300");
            $(".dataTables_length select").select2({
                minimumResultsForSearch: "-1"
            });
            $("select").addClass("select2-choice input-xs input-block border-slate-300");
            $("th").addClass("bg-slate-600");
            $(this).css("width", "100%");
            $(".dataTables_filter").css("margin-left", "0px");
        }
    });
    // Datatable End
})

function validateSession() {
    $.ajax({
        url: varValidateSession,
        type: "POST",
        success: function (data) {
            eval(data);
        }
    });
}

$(document).ready(function() {
    $(document).mousemove(function(){
        reset_interval() 
    });

    $(document).click(function(){
        reset_interval() 
    });

    $(document).keypress(function(){
        reset_interval() 
    });

    $(document).scroll(function(){
        reset_interval() 
    });
});

// set timer in 10 mins
var myVar = setInterval (function() { sessionExpired() }, 7200000);

function reset_interval() {
    if (myVar != 0) {
        clearInterval(myVar);
        myVar = 0;
        myVar =  setInterval(function() {  sessionExpired() }, 7200000);
    }
}

function sessionExpired() {
    $.ajax({
        url: varEndSession,
        type: "POST",
        success: function (data) {
        }
    });
    swal({
        title: "Oops...",
        text: "Session expired. Please re-login to your account!",
        confirmButtonColor: "#1565c0",
        type: "error",
        closeOnConfirm: true,
        },
        function(isConfirm){
            if (isConfirm) {
                logout();
            }
        }
    );
}

function logout() {
    $.ajax({
        url: varLogout,
        type: "POST",
        success: function (data) {
            eval(data)
        }
    });
}