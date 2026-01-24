import User from "../../db/models/user.model.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';


export const signup = async (req,res) => {
     // retreive data
     const {email,password,name} = req.body

     // check if student is enrolled in HTI, if not return error
     if (!email.trim().toLowerCase().endsWith('@hti.edu.eg')) {
     return res.status(400).json({ message: 'You are not allowed to sign up' });
     }

     // check for user existence
     const user = await User.findOne({email})
     if (user) return res.status(400).json({message:'Email already exists'})
     
     // hash pass 
     const hashed = bcrypt.hashSync(password, 5 )

     // create user
     await User.create({email, name,password:hashed}) 
     // send adequate res
     res.status(201).json({message:'Signed up successfully'})
}

export const signin = async (req,res)=>{
     // extract data
     const {email,password} = req.body 

     // check user exists
     const user = await User.findOne({email})
     // compare passwords
     const isMatch = bcrypt.compareSync(password,user.password)
     
     if (!user ||!isMatch ) return res.status(400).json({message:'Invalid Credentials'})
     
     // assign token
     const token = jwt.sign({ id: user._id, name:user.name, email, role:user.role},'secret')

     res.json({token})
     

}