import connectDB from "../../lib/connectDB";

export default async function handler(req, res) {
    await connectDB();

    res.status(200).json({message: 'Database connected and ready!'})
}