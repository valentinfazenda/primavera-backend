import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    status : { type: String, required: true, default:'user', enum: ['user', 'admin'] },
    password: { type: String, required: true },
    profilePicture: { type: String, required: false },
    companyId: { type: String, required: false },
    creationDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

export default User;