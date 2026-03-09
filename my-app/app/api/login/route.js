import connectDB from '@/lib/connectDB';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(req) {
  await connectDB();
  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password); // compares plain vs hashed
  if (!valid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await new SignJWT({ id: user._id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d') // token expires in 7 days
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

  const response = Response.json({ message: 'Logged in' });
  response.headers.set('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800`);
  return response;
}