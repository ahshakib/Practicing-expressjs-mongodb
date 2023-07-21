const mongoose = require("mongoose");
const uri = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true })
        console.log("Connected!")
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = connectDB