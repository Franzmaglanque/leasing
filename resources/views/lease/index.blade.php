
@extends('includes.layout')
@section('content')

<div class="page-container" id="app">
    <div class="page-content">
        <div class="content-wrapper">
            <div class="row">
                <div class="col-lg-12">
                    <div id="panelHeader" class="panel">
                        <div class="panel-heading">
                            <!-- <legend class="text-bold text-success-800">Manage Users</legend>
                            <h2 class="panel-title"></h2>
                            <div class="heading-btn"> -->
                            <legend class="text-bold text-success-800">Manage Lease Type</legend>
                            <h2 class="panel-title"></h2>
                            <div class="heading-btn">
                                <!-- <label class="text-right"><i class="icon-store2"></i>&nbsp;<b>
                                        Receive From:</b></label> -->
                                <div class="row">
                                    <div class="col-lg-8">
                                        <button  @click="showAddNewModal()" class="btn bg-success-700"><b><i class="fa fa-user-plus"></i></b> Add Lessor</button>
                                        
                                        <!-- <button type="button" class="btn btn-primary" @click="showSelected">
                                            <b><i class="icon-pen-plus"></i></b>Edit Lessor
                                        </button> -->

                                        <button disabled id="editBtn" @click="showEditModal()" class="btn bg-primary-700"><b><i class="icon-pen-plus"></i></b>Edit Lessor</button>
                                        <!-- <a href="#" class="btn btn-primary" @click="showAddNewModal()">
                                            <i class="icon-pen-plus">Add New</i>
                                        </a> -->
                                        
                                    </div>
                                </div>         
                            </div>
                        </div>
                        <div class="panel-body">
                            <div class="row">
                                <div class="col-lg-12">
                                    <div class="table-responsive">
                                        <table id="lessorTbl" name="lessorTbl" class="table table-hover table-xxs">

                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Create Lessor Modal -->
  <div class="modal fade " id="createModal" tabindex="-1" role="dialog" aria-labelledby="createModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
        <div class="modal-header bg-slate-600">
            <h5 class="modal-title" id="createModalLabel">Add Lease</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body">
            <form action="">
                <div class="form-group">
                    <label class="col-lg-2 control-label">Lease Type:</label>
                    <div class="col-lg-6">

                         <!-- <select v-model="lease.name"  data-placeholder="Select Lease Type" class="form-control select">
                            <option v-for="lease in leasetype" :value="lease.id">@{{lease.leaseType}} </option>>
                        </select>  -->


                    </div>
                </div>
            </form>
            <br><br>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            <button @click="createLessor()" type="button" class="btn btn-primary">Create Lease Type</button>
        </div>
        </div>
    </div>
    </div>

      <!-- Update Lessor Modal -->
  <div class="modal fade " id="updateModal" tabindex="-1" role="dialog" aria-labelledby="updateModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
        <div class="modal-header bg-slate-600">
            <h5 class="modal-title" id="updateModalLabel">Edit Lessor</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body">
            <form action="">
                <div class="form-group">
                    <label class="col-lg-2 control-label">Lease Type:</label>
                    <div class="col-lg-10">
                        <input  v-model="lease.name" type="text" class="form-control" >
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-lg-2 control-label">Lease Type Status:</label>
                    <div class="col-lg-10">
                        <!-- <input  v-model="lessor.name" type="text" class="form-control" > -->
                        <!-- <input  v-model="lessor.name" type="text" class="form-control"> -->
                        <select v-model="lease.status" class="select form-control">
                            <option value="A">Active</option>
                            <option value="I">Inactive</option>
                        </select>

                    </div>
                </div>
            </form>
            <br><br>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            <button @click="updateLessor()" type="button" class="btn btn-primary">Update Lease Type</button>
        </div>
        </div>
        </div>
    </div>
  
</div>
  


 <script type="text/javascript">
  
    window.onload = function () {
       new Vue({
        el: '#app',
        data: {
            leasetype:[],
            lease:{
                id:null,
                name:'',
                status:'',
            },
            errors:{}
       },
       mounted(){
            this.fetchLessorTable();
       },
       computed:{

       },
       methods:{
        fetchLessorTable(){
            $('#lessorTbl').dataTable({
                destroy: true,
                'ajax': {
                    type: 'GET',
                    // dataType: 'json',
                    contentType: 'application/json: charset=utf-8',
                    url: '/api/lease',
                    dataSrc: 'data'
                },
                drawCallback: function () {
                    // callCustomClass();
                },
                processing: false,
                // serverSide: true,
                searching: true,
                stateSave: false,
                columns: [
                    {title: 'ID', name: 'id', index: 'id', align: 'center', sortable: true, search: true, data: 'id'},
                    {title: 'Lease Type', name: 'leaseType', index: 'leaseType', align: 'center', sortable: true, search: true, data: 'leaseType'},
                    {title: 'Lease Status', name: 'leaseStatus', index: 'leaseStatus', align: 'center', sortable: true, search: true, data: 'leaseStatus'},
                    // {title: 'Lessor Status', name: 'lessorStatus', index: 'lessorStatus', align: 'center', sortable: true, search: true, data: 'lessorStatusChanged'},
                    {title: 'User Added', name: 'userAdded', index: 'userAdded', align: 'center', sortable: true, search: true, data: 'userAdded'},
                    {title: 'Date Added', name: 'dateAdded', index: 'dateAdded', align: 'center', sortable: true, search: true, data: 'dateAdded'},
                    {title: 'User Updated', name: 'userUpdated', index: 'userUpdated', align: 'center', sortable: true, search: true, data: 'userUpdated'},
                    {title: 'Date Updated', name: 'dateUpdated', index: 'dateUpdated', align: 'center', sortable: true, search: true, data: 'dateUpdated'},
                ],
            });   
        $('#lessorTbl tbody').off('click', 'tr');
            $('#lessorTbl tbody').on('click', 'tr', function () {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                    $("#editBtn").attr('disabled', true);
                }else{
                    $('#lessorTbl tbody tr.selected').removeClass('selected');
                    $(this).toggleClass('selected');
                    $("#editBtn").attr('disabled', false);
                }
            }); 
        },
        
        createLessor(){
            // console.log(JSON.stringify(this.contract));
            // console.log(JSON.stringify(this.lessor));
            axios.post('/api/lease',this.lease)
               .then(res =>{
                  // console.log(res)
                  $('#createModal').modal('hide');
                  Swal.fire({
                    title:'Good job!',
                    text: 'You clicked the button!',
                    icon:'success'
                  });
                  this.fetchLessorTable();
                  

               })
               .catch(err =>{
                  console.log(err.response)
               });
        },

        updateLessor(){
            axios.patch('/api/lessor',this.lease)
               .then(res =>{
                  // console.log(res)
                  $('#updateModal').modal('hide');
                  Swal.fire({
                    title:'Good job!',
                    text: 'You clicked the button!',
                    icon:'success'
                  });
                  this.fetchLessorTable();
                  $("#editBtn").attr('disabled', true);


               })
               .catch(err =>{
                  console.log(err.response)
               });
        },

        showSelected(){
            // console.log('test');
            // console.log(JSON.stringify(this.lessor))
            var table = $('#lessorTbl').DataTable();
            this.lease.id = table.row('.selected').data().id;
            this.lease.name = table.row('.selected').data().leaseType;
            this.lease.status = table.row('.selected').data().leaseStatus;
        },

        // Show Create Lessor Modal 
        showAddNewModal(){
            this.clearLessor();
            this.fetchLeaseType();
             $('#createModal').modal('show');
           
            
        },
        fetchLeaseType(){
            axios.get("/api/lease")
             .then(res => {
                this.leasetype = res.data.data;
                // console.log(JSON.stringify(this.subjectLease));
            //  console.log()
                // console.log(JSON.stringify(this.subjectLease));
                // console.log(this.leasetype);
             });
            
    
        },

        // Show Edit Lessor Modal
        showEditModal(){
    
            var table = $('#lessorTbl').DataTable();
            this.lease.id = table.row('.selected').data().id;
            this.lease.name = table.row('.selected').data().leaseType;
            this.lease.status = table.row('.selected').data().leaseStatus;
            $('#updateModal').modal('show');
        },

        // Clear Lessor Details
        clearLessor(){
            this.lease.name='';
            this.lease.status='';
            this.lease.id = null;
          }
       }
    })
    }
    </script>

@endsection