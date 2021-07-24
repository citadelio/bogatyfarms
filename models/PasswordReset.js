const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PasswordResetSchema = new Schema({
    userid:String,
    email:String,
    code:String,
    expiry:Date,
    created:{
        type:Date,
        default: Date.now
    }
})

module.exports = Reset = mongoose.model('passwordreset', PasswordResetSchema)