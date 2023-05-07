const mongoose = require("mongoose");

const userDetailSchema = new mongoose.Schema(
    {
    name: {type:String},
    email: {type:String, unique:true},
    phone: {type:Number, unique:true}, 
    password: {type:String},
    balance: {type:Number, min:0, default:0}
    },
    { collection: "UserInfo" }
);

module.exports = mongoose.model("UserInfo", userDetailSchema);