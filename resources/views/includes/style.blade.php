<script type="text/javascript">
    $(function () {
        callCustomClass();
    });

	$('#chequeTbl').dataTable({
        "aLengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "iDisplayLength": -1
    });

    $(".styled, .multiselect-container input").uniform({
        radioClass: 'choice'
    });

    // $('#chequeTbl tbody').on('click', 'tr', function () {
    //     console.log('testing123');
    // }); 
    // $("input[type='checkbox']").is(":checked",function(){
    //     $('#isSelected'+id).closest('tr').addClass('row_selected');
    //     // console.log()
    //     var table = $('#chequeTbl').DataTable();
    //     // if(table.rows('.row_selected').data().length > 0){
    //     //     removeDisable('#removeBtn');
    //     // }else{
    //     //     addDisable('#removeBtn');
    //     // }
        
    //     // console.log(table.rows('.row_selected').data().length);

    //     var table = $('#chequeTbl').DataTable();
    //     console.log(table.rows('.row_selected').data().length);
    // });


    // $("input[type='checkbox']").change(function(){
    //     if(this.checked) {
    //         $('#isSelected'+id).closest('tr').addClass('row_selected');
    //     }else{
    //         $('#isSelected'+id).closest('tr').removeClass('row_selected');
    //     }
        
    //     // console.log()
    //     var table = $('#chequeTbl').DataTable();
    //     // if(table.rows('.row_selected').data().length > 0){
    //     //     removeDisable('#removeBtn');
    //     // }else{
    //     //     addDisable('#removeBtn');
    //     // }
        
    //     // console.log(table.rows('.row_selected').data().length);

    //     var table = $('#chequeTbl').DataTable();
    //     console.log(table.rows('.row_selected').data().length);
    // });
   
    // $('#chequeTbl tbody tr  ').on('click',function(){
    //     // Check if rows selected id greater than 0
    //     // If Greater than 0 enable VOID button else Disable VOID Button
    //     if(table.rows('.row_selected').data().length > 0){
    //         removeDisable('#voidBtn');
    //     }else{
    //         addDisable('#voidBtn');
    //     }
    // })
</script>