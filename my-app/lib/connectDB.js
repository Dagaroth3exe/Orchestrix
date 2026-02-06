import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI

if(!MONGODB_URI){
    throw new Error(
        "please define the MONGODB_URI environment variable inside .env.local"
    );
}

//cache the connection to avoid reconnecting on every API call in development
let cached = global.mongoose;

if(!cached){
    cached = global.mongoose  = {conn:null, promise:null};
}

async function connectDB(){
    if(cached.conn){
        return cached.conn;
    }

    if(!cached.promise){
        const opts ={
            useNewUrlParser : true,
            useUnifiedTopology : true,
            dbName : "Cluster0",
        };

        cached.promise = (await mongoose.connect(MONGODB_URI, opts)).then((mongoose)=>{
            return mongoose;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;