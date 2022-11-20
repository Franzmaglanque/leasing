<template>
    <div class="container">
        <!-- <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">Example Component test</div>

                    <div class="card-body">
                        I'm an example component.

                        <button class="btn btn-success">
                            test
                        </button>
                    </div>
                </div>
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
                                <legend class="text-semibold"><i class="icon-reading position-left"></i><b>Contract Detail</b></legend>
                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Lessor:</label>
                                    <div class="col-lg-9">
                                        <Select2
                                         v-model="contract.lessor" 
                                         :options="lessors"  />
                                         <!-- <vue-select class="vue-select1" name="select1" :options="lessors" :model.sync="contract.lessor"></vue-select> -->
                                          <!-- <Select2 v-model="myValue" :options="lessors" :settings="{ settingOption: value, settingOption: value }" @change="myChangeEvent($event)" @select="mySelectEvent($event)" /> -->
                                        <!-- <select  v-model="contract.lessor" data-placeholder="Select Lessor" class="form-control js-example-basic-single">
                                            <option v-for="lessor in lessors" value="lessor.id">{{lessor.text}}</option>
                                        </select> -->
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Payee:</label>
                                    <div class="col-lg-9">
                                        <Select2
                                         v-model="contract.payee" 
                                         :options="vendors"  />
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Address:</label>
                                    <div class="col-lg-9">
                                        <input v-model="contract.address" type="text" class="form-control" >
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
                                    <label class="col-lg-3 control-label">Contract Period:</label>
                                    <div class="col-lg-3 control-label">
                                    <label >From:</label>
                                        <input type="date" id="dateRangePicker" v-model="contract.contractPeriodFrom" class="form-control">
                                    
                                    </div>
                                    <div class="col-lg-3 control-label">
                                    <label >To:</label>
                                        <input type="date" @change="calculateYear" id="dateRangePicker" v-model="contract.contractPeriodTo" class="form-control">
                                    </div>
                                    <div class="col-lg-3 control-label">
                                        <label >Number of Years</label>
                                        <input disabled v-model="contract.numYears" @change="shownumYears($event)" type="text" class="form-control" >
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Rent Free Period:</label>
                                    <div class="col-lg-3 control-label">
                                    <label >From:</label>
                                        <input type="date" id="dateRangePicker" v-model="contract.rentFreePeriodFrom" class="form-control">
                                    
                                    </div>
                                    <div class="col-lg-3 control-label">
                                    <label >To:</label>
                                        <input type="date" id="dateRangePicker" v-model="contract.rentFreePeriodTo" class="form-control">
                                    
                                    </div>

                                    <div class="col-lg-3 control-label">
                                        <label >Number Months and days</label>
                                        <input disabled v-model="contract.numRentFree" type="text" class="form-control" >
                                    </div>
                                </div>

                                <div class="form-group">
                                <label class="col-lg-2 control-label">Monthly Rent</label>
                                    <div class="col-lg-4">
                                        <input @input="setAmount()" v-model="contract.monthlyRent" type="text" class="form-control">
                                    </div>
                                    <label class="col-lg-2 control-label">Area(sqm):</label>
                                    <div class="col-lg-4">
                                        <input v-model="contract.area" type="text" class="form-control">
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
                                    <label class="col-lg-2 control-label">Security Deposit(# of Months)</label>
                                    <div class="col-lg-4">
                                        <input @input="calcAdvanceSecurityAmout()" v-model="contract.securityDeposit" type="text" class="form-control">
                                    </div>
                                    <label class="col-lg-2 control-label">Amount</label>
                                    <div class="col-lg-4">
                                        <input disabled v-model="contract.advanceSecurityAmount" type="text" class="form-control">
                                    </div>
                                </div>   
                            </fieldset>
                        </div>          
                    </div>
                    <div class="text-right">
                        <!-- <button  @click="saveContract()" class="btn btn-primary">Submit form <i class="icon-arrow-right14 position-right"></i></button> -->
                        <button  @click="checkContract()" class="btn btn-primary">Create Contract <i class="icon-arrow-right14 position-right"></i></button>

                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<script>
import Select2 from 'v-select2-component';
    export default {
        components: {Select2},
        // "vue-select": require("vue-select"),
        data: function() {
            return {
                lessors:[],
                subjectLease:[],
                stores:[],
                vendors:[],
                provinces:[],
                municipalities:[],
                contract:{
                    id:null,
                    lessor: '',
                    vendor: '',
                    address: '',
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
                    numRentFree:'',
                    province:'',
                    municipality:'',
                },
                product:{
                    id:null,
                    name:'',
                    category_id:'',
                    price:'',
                },
                errors:{}
            };
        },
    
       mounted(){
            this.fetchLessor();
            this.fetchVendor();
            this.fetchProvince();
            this.fetchStore();
            this.fetchLeaseType();
       },
    
       computed:{
       },
       methods:{
        checkContract(){
            console.log(this.contract.province);
        },
        setAmount(){
            if(this.contract.advanceRent != ''){
                this.contract.advanceRentAmount  = this.contract.monthlyRent * this.contract.advanceRent;
            }
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
                this.contract.advanceRentAmount  = this.contract.monthlyRent * this.contract.advanceRent;
            }
        },

        calculateYear(){
            // console.log(new Date(this.contract.contractPeriodFrom).getTime());
            // console.log(new Date('1999-09-24'));
            // var from = new Date('2022-01-17');
            // var to =  new Date('2021-09-24');
            // console.log(new Date(this.contract.contractPeriodFrom).getTime());
            // console.log(new Date(from.contractPeriodFrom).getTime());
            const foo = new Date(this.contract.contractPeriodTo).getTime() - new Date(this.contract.contractPeriodFrom).getTime();
            // const ms = from.getTime() - to.getTime();
            // console.log(ms);
            // console.log(foo);
            // const date = new Date(ms);
            const petsa = new Date(foo);
            // console.log(date);
            // console.log(petsa);
            this.contract.numYears = Math.abs(petsa.getUTCFullYear() - 1970);
            // console.log(Math.abs(petsa.getUTCFullYear() - 1970));
        },

        shownumYears(event){
            console.log(event.target.value);
        },

        onChange(event){
            // console.log(event.target.value);
            console.log(this.contract.subjectLease);
        },

        ipakita(){
            console.log(JSON.stringify(this.contract));
        },
        saveContract(){
            axios.post('/api/contract',this.contract)
               .then(res =>{
                  Swal.fire({
                    title:'Good job!',
                    text: 'You clicked the button!',
                    icon:'success'
                  });
               })
               .catch(err =>{
                  console.log(err.response)
               });
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
                this.vendors = res.data;
             });
        },

        setProvCode(event){
            // console.log(event);
            this.fetchMunicipalities()
        },
    }
    }
</script>
