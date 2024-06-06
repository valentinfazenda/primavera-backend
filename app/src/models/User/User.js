import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    APIKey: { type: String, required: false },
    profilePicture: { type: String, required: false },
    company: { type: String, required: false },
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

export default User;