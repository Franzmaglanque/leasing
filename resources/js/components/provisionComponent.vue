<template>
    <div class="container">
        <div class="page-container" >
    <div class="page-content">
        <div class="content-wrapper">
            <div class="row">
                <div class="col-lg-12">
                    <div id="panelHeader" class="panel">
                        <div class="panel-heading">
                            <!-- <legend class="text-bold text-success-800">Manage Users</legend>
                            <h2 class="panel-title"></h2>
                            <div class="heading-btn"> -->
                            <legend class="text-bold text-success-800">Manage Provisions</legend>
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
                                       
                                        <table id="provisionTbl" name="provisionTbl" class="table table-hover table-xxs">

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
  <div class="modal fade" id="createModal" tabindex="-1" role="dialog" aria-labelledby="createModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
            <div class="modal-header bg-slate-600">
                <h5 class="modal-title" id="createModalLabel">Add Provision</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="closeCreateModal()">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form action="">
                    <div class="form-group">
                        <label class="col-lg-2 control-label">Provision Name:</label>
                        <div class="col-lg-6">
                            <input  v-model="provision.name" type="text" class="form-control">
                        </div>
                    </div>
                </form>
                <br><br>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal" @click="closeCreateModal()">Close</button>
                <button @click="createProvision()" type="button" class="btn btn-primary">Create Provision</button>
            </div>
            </div>
        </div>
    </div>

      <!-- Update Lessor Modal -->
<div class="modal fade "  id="updateModal" tabindex="-1" role="dialog" aria-labelledby="updateModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-header bg-slate-600">
                <h5 class="modal-title" id="updateModalLabel">Edit Provision</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="closeEditModal()">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form action="">
                    <div class="form-group">
                        <label class="col-control-label">Provision Name:</label>
              
                            <input  v-model="provision.name" type="text" class="form-control" >
                
                    </div>
                    <div class="form-group">
                        <label class="col-form-label">Provision Status:</label>
                        
                            <select v-model="provision.status" class="select form-control">
                                <option value="A">Active</option>
                                <option value="I">Inactive</option>
                            </select>
                
                    </div>
                </form>
                <br><br>
            </div>
            <div class="modal-footer ">
                <button type="button" class="btn btn-secondary" @click="closeEditModal()" data-dismiss="modal">Close</button>
                <button @click="updateProvision()" type="button" class="btn btn-primary">Update Provision</button>
            </div>

            <!-- <div class="modal-body">
                <form>
                <div class="form-group">
                        <label for="recipient-name" class="col-form-label">Recipient:</label>
                        <input  v-model="provision.name" type="text" class="form-control">
                </div>
                <div class="form-group">
                        <label for="message-text" class="col-form-label">Provision Status:</label>
                        <select v-model="provision.status" class="select form-control">
                            <option value="A">Active</option>
                            <option value="I">Inactive</option>
                        </select>
                </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeEditModal()" data-dismiss="modal">Close</button>
                <button @click="updateProvision()" type="button" class="btn btn-primary">Update Provision</button>
            </div> -->
        </div>
    </div>
</div>
</div>
    </div>
</template>

<script>
// import $ from "jquery";
import DataTable from "datatables.net";
import { Modal } from "bootstrap";
let lessorTable;
    export default {
        data: function() {
            return {
                provision:{
                    id:null,
                    name:'',
                    status:'',
                },
                showCreateModal: false,
            };
        },
        mounted(){
            this.fetchProvisionTable();
       },
       computed:{

       },
       methods:{
      fetchProvisionTable(){
            lessorTable = $('#provisionTbl').dataTable({
                destroy: true,
                'ajax': {
                    type: 'GET',
                    // dataType: 'json',
                    contentType: 'application/json: charset=utf-8',
                    url: '/api/provisions',
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
                    // {title: 'ID', name: 'id', index: 'id', align: 'center', sortable: true, search: true, data: 'id'},
                    {title: 'Provision Name', name: 'provisionName', index: 'provisionName', align: 'center', sortable: true, search: true, data: 'provisionDescription'},
                    {title: 'Provision Status', name: 'provisionStatus', index: 'provisionStatus', align: 'center', sortable: true, search: true, data: 'provisionStatusChanged'},
                    {title: 'User Added', name: 'userAdded', index: 'userAdded', align: 'center', sortable: true, search: true, data: 'userAdded'},
                    {title: 'Date Added', name: 'dateAdded', index: 'dateAdded', align: 'center', sortable: true, search: true, data: 'dateAdded'},
                    {title: 'User Updated', name: 'userUpdated', index: 'userUpdated', align: 'center', sortable: true, search: true, data: 'userUpdated'},
                    {title: 'Date Updated', name: 'dateUpdated', index: 'dateUpdated', align: 'center', sortable: true, search: true, data: 'dateUpdated'},
                ],
                rowId: 'id',
            });   
        $('#provisionTbl tbody').off('click', 'tr');
            $('#provisionTbl tbody').on('click', 'tr', function () {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                    $("#editBtn").attr('disabled', true);
                }else{
                    $('#provisionTbl tbody tr.selected').removeClass('selected');
                    $(this).toggleClass('selected');
                    $("#editBtn").attr('disabled', false);
                }
            }); 
        },
        
        createProvision(){
            axios.post('/api/provisions',this.provision)
               .then(res =>{
                  // console.log(res)
                //   $('#createModal').modal('hide');
                $('#createModal').removeClass("in show");
                  Swal.fire({
                    title:'Good job!',
                    text: 'You clicked the button!',
                    icon:'success'
                  });
                  this.fetchProvisionTable();
                  this.clearProvision();
               })
               .catch(err =>{
                  console.log(err.response)
               });
        },

        updateProvision(){
            axios.patch('/api/provisions',this.provision)
               .then(res =>{
                  // console.log(res)
                //   $('#updateModal').modal('hide');
                $('#updateModal').removeClass("in show");
                  Swal.fire({
                    title:'Good job!',
                    text: 'You clicked the button!',
                    icon:'success'
                  });
                  this.fetchProvisionTable();
                  $("#editBtn").attr('disabled', true);
               })
               .catch(err =>{
                  console.log(err.response)
               });
        },

        showSelected(){
            // console.log('test');
            // console.log(JSON.stringify(this.lessor))
            var table = $('#provisionTbl').DataTable();
            this.provision.id = table.row('.selected').data().id;
            this.provision.name = table.row('.selected').data().lessorName;
            this.provision.status = table.row('.selected').data().lessorStatus;
        },

        // Show Create Lessor Modal 
        showAddNewModal(){
            // console.log($('#createModal').modal());
            // var table = $('#lessorTbl').DataTable();
            // var count = table.rows('.selected').data().length;
            // console.log(table.rows('.selected').data()[0].id);
            this.clearProvision();
             $('#createModal').addClass("in show");
            // let thisModal= ref('createModal');
            // thisModal.value.show();
        },
       
        // Show Edit Lessor Modal
        showEditModal(){
            var table = $('#provisionTbl').DataTable();
            console.log(table.row('.selected').data());
            this.provision.id = table.row('.selected').data().id;
            this.provision.name = table.row('.selected').data().provisionDescription;
            this.provision.status = table.row('.selected').data().provisionStatus;
            // console.log(this.provision);
            // $('#updateModal').modal('show');
            $('#updateModal').addClass("in show");

        },
       
        closeEditModal(){
            // console.log('test');
            $('#updateModal').removeClass("in show");
       },
       closeCreateModal(){
            // console.log('test');
            $('#createModal').removeClass("in show");
       },
       
        // Clear Lessor Details
        clearProvision(){
            this.provision.name='';
            this.provision.status='';
            this.provision.id = null;
          }
       },


      
       
    }
</script>

<style>
/* #lessorTable tbody tr.selected {
    color: rgb(51, 33, 33);
    background-color: #201c1c;
} */

.selected, .table-hover > tbody > th, .table-hover > tbody >  tr.selected {
  background-color: yellow;
}

table.dataTable thead tr {
  background-color: slategrey;
}

/* .selected, .selected:hover{
    color: rgb(51, 33, 33);
    background-color: red;
} */

/* .selected:hover {
    background-color: yellow;
} */
</style>