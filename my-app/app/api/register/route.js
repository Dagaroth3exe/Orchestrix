import connectDB from '@/lib/connectDB';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export async function POST(req){
    await connectDB();
    const {name, email, password} = await req.json();
    const existing = await User.findOne({email});
    
    if(existing){
        return Response.json({error: 'Email already in use'}, {status : 400});
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({name, email, password: hashed});

    return Response.json({message:'Account created'},{status: 201});
}