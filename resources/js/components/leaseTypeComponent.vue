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
                            <li><a data-action="collapse"></a></li>
                            <li><a data-action="reload"></a></li>
                            <li><a data-action="close"></a></li>
                        </ul>
                    </div>
                </div>

                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-8">
                            <fieldset>
                                <legend class="text-semibold"><i class="icon-reading position-left"></i><b>Contract Details</b></legend>
                                <div class="form-group">
                                    <label class="col-lg-3 control-label">Lessor:</label>
                                    <div class="col-lg-9">
                                        <!-- <input v-model="contract.lessor" type="text" class="form-control" > -->
                                       
                                    </div>
                                </div>
                                
                            </fieldset>
                        </div>          
                    </div>

                    <div class="text-right">
                        <button  @click="saveContract()" class="btn btn-primary">Submit form <i class="icon-arrow-right14 position-right"></i></button>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<script>
    export default {
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
            // this.fetchLessor();
            // this.fetchLeaseType();
            // this.fetchStore();
            // this.fetchVendor();
            // this.fetchProvince();
            // this.fetchMunicipalities();
       },
    
       computed:{
       },
       methods:{
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
            console.log('test');
            // axios.get("/api/municipality")
            //  .then(res => {
            //     this.municipalities = res.data;
            //     // console.log(JSON.stringify(this.subjectLease));
            //  });
        },

        fetchLessor(){
            axios.get("/api/lessor")
             .then(res => {
                this.lessors = res.data.data;
                // console.log(JSON.stringify(this.subjectLease));
             });
        },

        fetchLeaseType(){
            axios.get("/api/contract")
             .then(res => {
                this.subjectLease = res.data.data;
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

        showAddNewModal(){
             this.clearModal();
             $('#exampleModal').modal('show');
        },
       }
    }
</script>
