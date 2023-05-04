const mongoose = require("mongoose");

const userDetailSchema = new mongoose.Schema(
    {
    name: String,
    email: {type:String, unique:true},
    phone: {type:Number, unique:true}, 
    password: String
    },
    { collection: "UserInfo" }
);

module.exports = mongoose.model("UserInfo", userDetailSchema);