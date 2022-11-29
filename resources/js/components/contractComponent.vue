<template>
    <div class="container">
   
        <!-- <div v-if="errors">
        <div v-for="(field, k) in errors" :key="k" class="bg-red-400 text-white rounded font-bold mb-4 shadow-lg py-2 px-4 pr-0">
            <p v-for="error in k" class="text-sm">
                {{ error }}
            </p>
        </div>
        </div> -->



         <!-- <div v-if="errors">
        <div class="bg-red-400 text-white rounded font-bold mb-4 shadow-lg py-2 px-4 pr-0">
            <p  v-for= "(error,k) in errors" class="text-sm">
                {{k}}
            </p>
            <p>{{errors}}</p>
        </div>
        </div> -->



        <form class="form-horizontal" action="#" >

            <div class="panel panel-flat">
                <div class="panel-heading">
                    <h5 class="panel-title">Create New Contract</h5>
                    <div class="heading-elements">
                        <ul class="icons-list">
                            <!-- <li><a data-action="collapse"></a></li>
                            <li><a data-action="reload"></a></li>
                            <li><a data-action="close"></a></li> -->
                        </ul>
                    </div>
                </div>

                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-8">
                            <fieldset>
                                <legend class="text-semibold"><i class="icon-reading position-left"></i><b>Contract Detailss</b></legend>
                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Lessor:</label>
                                    <div class="col-lg-9" id="sample">
                                        
                                        <Select2 id="lessor"
                                         v-model="contract.lessor" 
                                         :options="lessors"/>
                                         <!-- <vue-select class="vue-select1" name="select1" :options="lessors" :model.sync="contract.lessor"></vue-select> -->
                                          <!-- <Select2 v-model="myValue" :options="lessors" :settings="{ settingOption: value, settingOption: value }" @change="myChangeEvent($event)" @select="mySelectEvent($event)" /> -->
                                        <!-- <select  v-model="contract.lessor" data-placeholder="Select Lessor" class="form-control js-example-basic-single">
                                            <option v-for="lessor in lessors" value="lessor.id">{{lessor.text}}</option>
                                        </select> -->
                                        <!-- <p v-model="errors"></p> -->

                                        <!-- <input type="text" v-model="errors.lessor"> -->
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Payee:</label>
                                    <div class="col-lg-9">
                                        <!-- <Select2
                                         v-model="contract.payee" 
                                         :options="vendors"  /> -->
                                         <select v-model.lazy="contract.payee" data-placeholder="Select Province" class="form-control select" @change="setProvCode($event)">
                                            <option   v-for="vendor in vendors" :value="vendor.id">{{vendor.text}}</option>
                                        </select>
                                        </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Address:</label>
                                    <div class="col-lg-9">
                                        <input id="address" v-model.lazy="contract.address" type="text" class="form-control" >
                                        <!-- <input type="text" v-model="errors.address"> -->
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Province:</label>
                                    <div class="col-lg-9">
                                        <Select2
                                         v-model="contract.province" 
                                         :options="provinces"
                                         @change="fetchMunicipalities()"
                                       />
                                       
                                        <!-- <input v-model="contract.payee" type="text" class="form-control" > -->
                                        <!-- <select  v-model="contract.province" data-placeholder="Select Province" class="form-control select" @change="setProvCode($event)">
                                            <option   v-for="province in provinces" :value="province.id">{{province.text}}</option>
                                        </select> -->
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Municipality:</label>
                                    <div class="col-lg-9">
                                        <!-- <input v-model="contract.payee" type="text" class="form-control" > -->
                                        <Select2
                                         v-model="contract.municipality" 
                                         :options="municipalities"/>
                                        <!-- <select  v-model="contract.municipality" data-placeholder="Select Payee" class="form-control select">
                                            <option v-for="municipality in municipalities" value="municipality.citymunDesc">{{municipality.citymunDesc}}</option>
                                        </select> -->
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Stores</label>
                                    <div class="col-lg-9">
                                        <Select2
                                         v-model="contract.store" 
                                         :options="stores"/>
                                        <!-- <select  v-model="contract.store" data-placeholder="Select Store" class="form-control select">
                                            <option v-for="store in stores" value="store.STRNUM">@{{store.STRNUM}} - @{{store.STRNAM}}</option>
                                        </select> -->
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Subject of Lease</label>
                                    <div class="col-lg-9">
                                        <Select2
                                         v-model="contract.subjectLease" 
                                         :options="subjectLease"/>
                                        <!-- <select   v-model="contract.subjectLease" @change="onChange($event)"  data-placeholder="Select Lease type" class="select form-control">
                                            <option v-for="subject in subjectLease" :value="subject.id">@{{subject.text}}</option>
                                        </select> -->
                                    </div>
                                </div>
                                <div class="form-group">
                                <label class="col-lg-3 control-label">Rent Free included in contract?</label>
                                    <div class="col-lg-9">
                                 
                                        <!-- <input type="date" id="dateRangePicker" v-model="contract.contractPeriodFrom" class="form-control"> -->
                                        <select @change="rentFreeIncluded()" v-model="contract.rentFreeIncluded" data-placeholder="Select Lease type" class="select form-control">
                                            <!-- <option v-for="subject in subjectLease" :value="subject.id">@{{subject.text}}</option> -->
                                            <option  :value="true">Included</option>
                                            <option  :value="false">Not Included</option>
                                        </select>
                                    </div>
                                   
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-2 control-label">Rent Free Period:</label>
                                    <div class="col-lg-2 control-label">
                                        <label >Number Years</label>
                                        <input v-model.lazy="contract.rentFreeYear" type="text" class="form-control" >
                                    </div>
                                    <div class="col-lg-2 control-label">
                                        <label >Number Months</label>
                                        <input v-model.lazy="contract.rentFreeMonth" type="text" class="form-control" >
                                    </div>
                                    <div class="col-lg-2 control-label">
                                        <label >Number days</label>
                                        <input  v-model.lazy="contract.rentFreeDay" type="text" class="form-control" >
                                    </div>

                                    <div class="col-lg-2 control-label">   
                                    <label >From:</label>
                                        <input type="date" @input="computeRentFreeTo()" id="dateRangePicker" v-model="contract.rentFreePeriodFrom" class="form-control">
                                    
                                    </div>
                                    <div class="col-lg-2 control-label">
                                    <label >To:</label>
                                        <input disabled type="date" id="dateRangePicker" v-model.lazy="contract.rentFreePeriodTo" class="form-control">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-2 control-label">Contract Period:</label>
                                 
                                    <div class="col-lg-3 control-label">
                                        <label >Number of Years</label>
                                        <input @input="computeContractEnd()" v-model="contract.numYears" type="text" class="form-control" >
                                    </div>
                                    <div class="col-lg-3 control-label">
                                    <label >From:</label>
                                        <!-- <input type="date" @change="computeContractEnd()" id="dateRangePicker" v-model="contract.contractPeriodFrom" class="form-control"> -->
                                        <input disabled type="date" id="dateRangePicker" v-model="contract.contractPeriodFrom" class="form-control">
                                    
                                    </div>
                                    <div class="col-lg-3 control-label">
                                    <label >To:</label>
                                        <input disabled type="date" id="dateRangePicker" v-model="contract.contractPeriodTo" class="form-control">
                                    </div>
                                </div>
                                
                              

                                <div class="form-group">
                                <label class="col-lg-2 control-label">Monthly Rent</label>
                                    <div class="col-lg-4">
                                        <input @input="setAmount()"  v-model="contract.monthlyRent" type="text" class="form-control">
                                    </div>
                                    <label class="col-lg-2 control-label">Area(sqm):</label>
                                    <div class="col-lg-4">
                                        <input v-model="contract.area" type="text" class="form-control">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-2 control-label">Security Deposit(# of Months)</label>
                                    <div class="col-lg-4">
                                        <input @input="calcAdvanceSecurityAmout()" v-model="contract.securityDeposit" type="text" class="form-control">
                                    </div>
                                    <label class="col-lg-2 control-label">Amount</label>
                                    <div class="col-lg-4">
                                        <input disabled v-model="contract.advanceSecurityAmount" type="text" class="form-control">
                                    </div>
                                </div> 
                                
                                <div class="form-group">
                                    <label class="col-lg-2 control-label">Advance Rent(# of Months)</label>
                                    <div class="col-lg-4">
                                        <input @input="calcAdvanceRentAmount()" v-model="contract.advanceRent" type="text" class="form-control">
                                    </div>
                                    <label class="col-lg-2 control-label">Amount</label>
                                    <div class="col-lg-4">
                                        <input disabled v-model="contract.advanceRentAmount" type="text" class="form-control">
                                    </div>
                                </div>


                                <div class="form-group">
                                    <label class="col-lg-2 control-label">Escalation Percent</label>
                                    <div class="col-lg-4">
                                        <input  v-model="contract.escalationPercent" type="text" class="form-control">
                                    </div>
                                   
                                </div>
                            </fieldset>
                        </div>          
                    </div>
                    <div class="text-right">
                        <button @click="checkContractDetail()">click</button>
                        <button  @click="populateContractTable()" class="btn btn-primary">Save Contract<i class="icon-arrow-right14 position-right"></i></button>
                        <!-- <button  @click="saveContract()" class="btn btn-primary">Generate<i class="icon-arrow-right14 position-right"></i></button> -->
                        
                        <!-- <button  @click="checkContract()" class="btn btn-primary">Create Contract <i class="icon-arrow-right14 position-right"></i></button> -->
                        
                    </div>
                </div>
            </div>
        </form>


        <div class="panel-body">
            <div class="row">
                <div class="col-lg-12">
                    <div class="table-responsive">
                        
                        <table  id="contractTbl" name="contractTbl" class="table table-hover table-xxs">
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Year Start</th>
                                    <th>Year End</th>
                                    <th>Escalation Percent</th>
                                    <th>Rent</th>
                                    <th>VAT To</th>
                                    <th>EWT</th>
                                    <th>NET</th>
                                    <th>Yearly Rent</th>
                                </tr>
                            </thead>

                            <tbody>
                                <!-- :id="index"  <tr v-for="(contractDetail,index) of contractDetails"> -->
                                <tr v-for="(contractDetail,index) of contractDetails">

                                    <td>{{contractDetail.yearNum}}</td>
                                    <td>{{contractDetail.yearFrom}}</td>
                                    <td>{{contractDetail.yearTo}}</td>
                                    <!-- <td><input @input="recompute(contractDetail,index)" :id="index" type="text" class="form-control"></td> -->
                                    <td>{{contractDetail.escalationPercent}}</td>
                                    <td>{{contractDetail.rentAmount}}</td>
                                    <td>{{contractDetail.vatAmount}}</td>
                                    <td>{{contractDetail.ewtAmount}}</td>
                                    <td>{{contractDetail.netDueAmount}}</td>
                                    <td>{{contractDetail.yearlyRent}}</td>     
                                </tr>
                            </tbody>
   
                        </table>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import Select2 from 'v-select2-component';


// import TypeaheadAutocomplete from "typeahead-autocomplete";
    export default {
        components: {
            Select2,
       
        },
        // "vue-select": require("vue-select"),

        props: ['vendors'],

        data: function() {
            return {
                contractTable:false,
                contractDetails:[],
                lessors:[],
                subjectLease:[],
                stores:[],
                vendors_list:[],
                provinces:[],
                municipalities:[],
                contractDetail:{
                    yearNum:'',
                    yearFrom:'',
                    yearTo:'',
                    escalationPercent:'',
                    rentAmount:'',
                    vatAmount:'',
                    ewtAmount:'',
                    netDueAmount:'',
                    yearlyRent:'',
                },
                contract:{
                    id:null,
                    lessor: '',
                    vendor: '',
                    address: null,
                    store: '',
                    subjectLease: '',
                    contractPeriodFrom:'',
                    contractPeriodTo:'',
                    numYears:'',
                    area: '',
                    monthlyRent: '',
                    advanceRent:'',
                    advanceRentAmount:'',
                    securityDeposit:'',
                    advanceSecurityAmount:'',
                    rentFreePeriodFrom:'',
                    rentFreePeriodTo:'',
                    rentFreeMonth:'',
                    rentFreeDay:'',
                    rentFreeYear:'',
                    province:'',
                    municipality:'',
                    rentFreeIncluded: false,
                    escalationPercent:'',
                },
                errors:{}
            };
        },
    
       mounted(){
        // $('#contractTbl').DataTable();
            this.fetchLessor();
            this.fetchVendor();
            this.fetchProvince();
            this.fetchStore();
            this.fetchLeaseType();
         
       },
    
       computed:{
       },
       methods:{
        checkContractDetail(){
            console.log(JSON.stringify(this.contractDetails));
        },
        //&& $("#address").val() != null && $("#address").val() != ""   
        populateContractTable(){
           
           if( $("#lessor").val() != null && $("#lessor").val() != "" ){
            console.log($("#lessor").val()+"asdasd");
            axios.post('/api/contract',this.contract)
               .then(res =>{
                // console.log(res.request.responseText);
                this.contractTable = true;
                this.contractDetails = res.data.data;
                // $('#contractTbl').DataTable();
                console.log(res.request);
                // if(res.request.responseText == 1){
                // if(typeof res.request.responseText != "undefined"){

                    
               // if(res.request.responseText.length==0){
                // if(typeof res.request.responseText == "undefined"){  
                //     Swal.fire({
                //         title:'Good job!',
                //         text: 'You clicked the button!',
                //         icon:'success'
                //     });
                // }else{
                //     this.errors = JSON.parse(res.request.responseText);
                // }

               })
               .catch(err =>{
                  console.log(err.response)
               });   
           }
           else
           {

            $("#lessor").addClass("border-danger");
            console.log(  $("#lessor").val());

           }





             
        },
        populateContractTable_old2(){
            var contractData;
            axios.post("/api/contract",this.contract)
             .then(res => {
                contractData = res.data.data;
                var tblbahalaka = $('#contractTbl').DataTable({
                destroy:true,
                aaData: contractData,
                aoColumns:[
                            
                    // {"data": null,
                    // render: function (data, type, row, meta) {
                    //     return "<input type='checkbox'>"}
                    // },
                    {mData : 'yearNum'},
                    {mData : 'yearFrom'},
                    {mData : 'yearTo'},  
                    {"data": null,
                    render: function (data, type, row, meta) {
                        return `<input type="text">
                        `}
                    },
                    {mData : 'rentAmount'},
                    {mData : 'vatAmount'},
                    {mData : 'ewtAmount'},
                    {mData : 'netDueAmount'},
                    {mData : 'yearlyRent'},

                
                ],
                columnDefs:[
                    {
                    "defaultContent": "-",
                    "targets": "_all"
                    
                    },
                    {
                        orderable :false,
                        targets : [0]
                    },
                    {
                        width : 500,
                        targets : 0
                    }
                ]
            });
             });
     
        },

        populateContractTable_old(){
            $('#contractTbl').dataTable({
                destroy: true,
                'ajax': {
                    type: 'GET',
                    // dataType: 'json',
                    contentType: 'application/json: charset=utf-8',
                    url: '/api/fetchContract',
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
                    {title: 'Lessor Name', name: 'lessorName', index: 'lessorName', align: 'center', sortable: true, search: true, data: 'lessorName'},
                    {title: 'Lessor Status', name: 'lessorStatus', index: 'lessorStatus', align: 'center', sortable: true, search: true, data: 'lessorStatus'},
                    // {title: 'Lessor Status', name: 'lessorStatus', index: 'lessorStatus', align: 'center', sortable: true, search: true, data: 'lessorStatusChanged'},
                    {title: 'User Added', name: 'userAdded', index: 'userAdded', align: 'center', sortable: true, search: true, data: 'userAdded'},
                    {title: 'Date Added', name: 'dateAdded', index: 'dateAdded', align: 'center', sortable: true, search: true, data: 'dateAdded'},
                    {title: 'User Updated', name: 'userUpdated', index: 'userUpdated', align: 'center', sortable: true, search: true, data: 'userUpdated'},
                    {title: 'Date Updated', name: 'dateUpdated', index: 'dateUpdated', align: 'center', sortable: true, search: true, data: 'dateUpdated'},
                ],
            }); 
        },

        recompute(contractDetail,index){
            // console.log(this.contractDetails);
            // console.log(JSON.stringify(contractDetail));
            // this.contractDetail = Object.assign({},contractDetail);
            var escalation = $("#"+index).val();

            //  console.log(this.contractDetails[index]);
            // var count =index;
         

            for(var count =index; count<= this.contractDetails.length-1;count++)
            {
                if(escalation != ''){
                    this.contractDetails[count]['rentAmount'] = parseFloat(this.contractDetails[count]['rentAmount']) + (parseFloat(this.contractDetails[count]['rentAmount']) * (parseFloat(escalation) *.01));
                    this.contractDetails[count]['vatAmount'] = parseFloat(this.contractDetails[count]['rentAmount']) * 0.12;
                    this.contractDetails[count]['ewtAmount'] = (parseFloat(this.contractDetails[count]['rentAmount']) * -1) * 0.05;
                    console.log(this.contractDetails[count]['rentAmount']);
                }else{
                    // this.contractDetails[count]['rentAmount'] = 
                }
            }
        },
        
        setAmount(){
            if(this.contract.advanceRent != ''){
                this.contract.advanceRentAmount  = this.contract.monthlyRent * this.contract.advanceRent;
            }
            // this.contract.monthlyRent = this.contract.monthlyRent.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")  
        },
        calcAdvanceSecurityAmout(){
            if(this.contract.monthlyRent == ''){
                this.contract.advanceSecurityAmount = '';
            }else{
                this.contract.advanceSecurityAmount  = this.contract.monthlyRent * this.contract.securityDeposit;
            }
        },

        calcAdvanceRentAmount(){
            if(this.contract.monthlyRent == ''){
                this.contract.advanceRentAmount = '';
            }else{
                var vat = this.contract.monthlyRent * 0.12;
                var ewt = (this.contract.monthlyRent * -1) * 0.05;
                var net = parseFloat(this.contract.monthlyRent) + parseFloat(vat) + parseFloat(ewt);
                var advanceRent = parseFloat(net) * this.contract.advanceRent;
                // this.contract.advanceRentAmount  = net * this.contract.advanceRent;
                this.contract.advanceRentAmount = advanceRent;
                // console.log(net);
            }
        },

        rentFreeIncluded(){
            if(this.contract.rentFreeIncluded){
                this.contract.contractPeriodFrom = this.contract.rentFreePeriodFrom;
                this.contract.rentFreePeriodTo = null;
            }
        },

        computeRentFreeTo(){
            var dateFrom = new Date(this.contract.rentFreePeriodFrom);

            if(this.contract.rentFreeDay){
                dateFrom.setDate(dateFrom.getDate() + parseInt(this.contract.rentFreeDay));
            }
            
            if(this.contract.rentFreeMonth){
                dateFrom.setMonth(dateFrom.getMonth() + parseInt(this.contract.rentFreeMonth));
            }

            if(this.contract.rentFreeYear){
                dateFrom.setFullYear(dateFrom.getFullYear() + parseInt(this.contract.rentFreeYear));
            }

            var year = dateFrom.toLocaleString("default", { year: "numeric" });
            var month = dateFrom.toLocaleString("default", { month: "2-digit" });
            var day = dateFrom.toLocaleString("default", { day: "2-digit" });
            var newRentFreePeriodFrom = year + '-' + month + '-' + day;
            // console.log(dateFrom);
  
            if(this.contract.rentFreeIncluded){
                this.contract.contractPeriodFrom = this.contract.rentFreePeriodFrom
                this.contract.rentFreePeriodTo = null;
            }else{
                this.contract.rentFreePeriodTo = newRentFreePeriodFrom
                dateFrom.setDate(dateFrom.getDate() + 1);
                var year = dateFrom.toLocaleString("default", { year: "numeric" });
                var month = dateFrom.toLocaleString("default", { month: "2-digit" });
                var day = dateFrom.toLocaleString("default", { day: "2-digit" });
                var newRentFreePeriodFrom = year + '-' + month + '-' + day;
                this.contract.contractPeriodFrom = newRentFreePeriodFrom;
            }

        },

        computeContractEnd(){
            var dateFrom = new Date(this.contract.contractPeriodFrom);
            if(this.contract.numYears){
                dateFrom.setFullYear(dateFrom.getFullYear() + parseInt(this.contract.numYears));
                // dateFrom.setDate(dateFrom.getDate() + 1);
            }

            var year = dateFrom.toLocaleString("default", { year: "numeric" });
            var month = dateFrom.toLocaleString("default", { month: "2-digit" });
            var day = dateFrom.toLocaleString("default", { day: "2-digit" });
            var newContractPeriodTo = year + '-' + month + '-' + day;

            this.contract.contractPeriodTo = newContractPeriodTo
            // console.log(newContractPeriodTrom);
        },

        // calculate number of year from contract start and end
        calculateYear(){
            // const foo = new Date(this.contract.contractPeriodTo).getTime() - new Date(this.contract.contractPeriodFrom).getTime();
            // const petsa = new Date(foo);
            // this.contract.numYears = Math.abs(petsa.getUTCFullYear() - 1970);

            // var yearFrom = new Date(this.contract.contractPeriodFrom).getFullYear();
            // var yearTo = new Date(this.contract.contractPeriodTo).getFullYear();
            // this.contract.numYears = yearTo - yearFrom;
            // console.log(this.contract.numYears);

            // console.log(yearTo.getFullYear());
        },

        saveContract(){
            axios.post('/api/contract',this.contract)
               .then(res =>{
                //   Swal.fire({
                //     title:'Good job!',
                //     text: 'You clicked the button!',
                //     icon:'success'
                //   });
                console.log(res.request.responseText);

                if(res.request.responseText == 1){
                  Swal.fire({
                    title:'Good job!',
                    text: 'You clicked the button!',
                    icon:'success'
                  });
                }else{
                    this.errors = JSON.parse(res.request.responseText);
                }
                // console.log(res.request.responseText);
                // this.clearContract();
                // console.log(this.errors);
                // console.log(this.errors['lessor']);
               })
               .catch(err =>{
                  console.log(err.response)
               });
        },

        clearContract(){
            this.contract.id = null;
            this.contract.lessor = '';
            this.contract.vendor = '';
            this.contract.address = '';
            this.contract.store = '';
            this.contract.subjectLease = '';
            this.contract.contractPeriodFrom = '';
            this.contract.contractPeriodTo = '';
            this.contract.monthlyRent = '';
            this.contract.advanceRent = '';
            this.contract.advanceRentAmount = '';
            this.contract.securityDeposit = '';
            this.contract.advanceSecurityAmount = '';
            this.contract.rentFreePeriodFrom = '';
            this.contract.rentFreePeriodTo = '';
            this.contract.province = '';
            this.contract.municipality = '';
            this.contract.area = '';
            this.contract.numYears = '';
        },

        fetchProvince(){
            axios.get("/api/province")
             .then(res => {
                this.provinces = res.data;
                // console.log(JSON.stringify(this.subjectLease));
             });
        },

        fetchMunicipalities(){
            // console.log(this.contract.province);
            console.log(this.contract.province);
            axios.get("/api/municipality", { params: { province: this.contract.province }} )
             .then(res => {
                this.municipalities = res.data;
                // console.log(JSON.stringify(this.subjectLease));
             });
        },

        fetchLessor(){
            axios.get("/api/selectlessor")
             .then(res => {
                // this.lessors = res.data.data;
                // console.log(res.data.data);
                this.lessors = res.data.data;
                // console.log(JSON.stringify(this.lessors));
                // console.log(JSON.stringify(this.subjectLease));
             });
        },

        fetchLeaseType(){
            axios.get("/api/contract")
             .then(res => {
                this.subjectLease = res.data;
                // console.log(JSON.stringify(this.subjectLease));
             });
        },

        fetchStore(){
            axios.get("/api/store")
             .then(res => {
                this.stores = res.data;
                // console.log(JSON.stringify(this.stores));
             });
        },

        fetchVendor(){
            axios.get("/api/vendor")
             .then(res => {
                this.vendors_list = res.data;
             });
            // this.vendor = this.vendors_list;
        },

        setProvCode(event){
            // console.log(event);
            this.fetchMunicipalities()
        },
    }
    }
</script>
