import jwt from 'jsonwebtoken';

export const auth = (role)=> (req,res,next)=>{
// authentication
const {token} = req.headers
if(!token) return res.status(499).json({message:'plz signin'})

jwt.verify(token, 'secret', (err,decoded)=>{
     if(err) return res.status(498).json({message:'Invalid token'})
     if(decoded.role != role) return res.status(403).json({message:"not enough privileges"})
     req.user = decoded
     next()
})
}