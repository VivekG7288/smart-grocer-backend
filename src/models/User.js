import mongoose from "mongoose";
import bcrypt from "bcrypt";

export const UserRole = {
    CONSUMER: "CONSUMER",
    SHOPKEEPER: "SHOPKEEPER",
};

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: Number, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: Object.values(UserRole), required: true },
        address: { type: String },
        picture: { type: String },
        subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Shop" }],
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to compare password
userSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
