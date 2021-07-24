const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstname : {
        type : String,
        required : true
    },
    lastname : {
        type : String,
        required : true
    },
    email : String,
    username:String,
    password : String,
    phone : String,
    activated: {
        type: Boolean,
        default: false
      },
    avatar:{
        type:Object,
        default: {path:"uploads/avatar/bogatyfarms.com-defaultavatar-23022020.png"}
    },
    avatarhost:{
        type:String,
        default: "local"
    },
    created : {
        type : Date,
        default : Date.now
    }

})

module.exports = User = mongoose.model('user', UserSchema);