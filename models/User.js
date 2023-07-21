const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    age: {
        type: Number
    }

},
{
    timestamps: true
})

module.exports = User = mongoose.model("User", UserSchema)