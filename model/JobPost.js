const mongoose = require("mongoose");
const schema= mongoose.Schema;
const provSkillSchema = new mongoose.Schema({
    id: String,
    price: Number,
  });
const jobPostSchema =new schema({
    fullname: {
        type: String,
        require: true
    },
    
    email: { //y
        type: String,
        require: true
    },
    pincode:{
        type: Number,
        require: true
    },
    address:{
        type: String,
        require: true
    },
    gender: { // gender of provider
        type: String,
        opt: ['Male', 'Female'],
        require: true
    },
    hometown: {        
        type: String,
        required: true,
    },
    detail: {        
        type: String,
        required: true,
    },
    skill: {
        type: String, 
        required: true,
    },
    date:{
        type: Date,
        default :Date.now()
    },
    start_date:{
        type: Date,
        default :Date.now()
    },
    end_date:{
        type: Date,
        
    },
    start_time:{
        type: String,
        default :""
    },
    end_time:{
        type: String,
        default :""
    },
    
    language:{
        type: String,
        required: true
    },
    status:{
        type: String,
        default: "Unassigned"
    },
    price:{
        type: Number,
        required: true
    },
    reply:[provSkillSchema],
        
    assignProv:{
        type:String,
        default:""
    },
    payment:{
        type:String,
        default:""
    }

    
    
})

module.exports = mongoose.model('JobPost', jobPostSchema);